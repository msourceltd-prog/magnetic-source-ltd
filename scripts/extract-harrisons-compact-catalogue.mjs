import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceDirectory = "/home/ubuntu/harrisons-direct-source";
const rootReport = JSON.parse(await readFile(`${sourceDirectory}/magnetic-category-roots.json`, "utf8"));
const candidatePagesPerDepartment = 2;
const targetPerDepartment = 40;
const requestConcurrency = 1;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const decodeHtml = (value = "") => String(value)
  .replace(/&amp;/gi, "&")
  .replace(/&#8217;|&rsquo;/gi, "’")
  .replace(/&#8211;|&ndash;/gi, "–")
  .replace(/&#8220;|&ldquo;/gi, "“")
  .replace(/&#8221;|&rdquo;/gi, "”")
  .replace(/&#39;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/&nbsp;/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const unique = (values) => [...new Set(values)];
const slugify = (value) => decodeHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 190);
const firstMatch = (source, pattern) => source.match(pattern)?.[1]?.trim() || null;
const load = async (url) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": "MagneticSourceCatalogueAudit/1.0" } });
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 4) {
      await wait(2000 * attempt);
      continue;
    }
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
    return response.text();
  }
  throw new Error(`Request failed after retries: ${url}`);
};

const loadCategoryPage = async (url) => {
  try {
    return await load(url);
  } catch (error) {
    if (String(error).includes("404")) return "";
    throw error;
  }
};

const productLinksFromCategoryPage = (html) => unique(
  [...html.matchAll(/https:\/\/www\.harrisonsdirect\.co\.uk\/product\/([^"'/?#]+)\/?/gi)]
    .map((match) => `https://www.harrisonsdirect.co.uk/product/${match[1]}/`),
);

const parseProduct = (html, { department, sourceUrl }) => {
  const title = decodeHtml(firstMatch(html, /<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
    || firstMatch(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.replace(/\s+-\s+Harrisons Direct$/i, ""));
  const productCode = decodeHtml(firstMatch(html, /<li>\s*Product Code:\s*([^<]+)<\/li>/i));
  const packQuantity = decodeHtml(firstMatch(html, /<li>\s*Pack Quantity:\s*([^<]+)<\/li>/i));
  const image = decodeHtml(firstMatch(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i));
  if (!title || !productCode || !packQuantity || !image) return null;
  const pack = `Pack of ${packQuantity}`;
  return {
    sourceUrl,
    slug: slugify(`${title}-${productCode}`),
    name: title,
    category: department.slug,
    sku: productCode,
    pack,
    description: `${title} is supplied as ${pack}.`,
    descriptionSource: "factual-title-and-pack",
    image,
    tags: [department.magneticName, "Harrisons-authorized catalogue", "Price pending"],
    price: null,
    priceStatus: "pending-authorized-trade-price",
    stockCaptured: false,
  };
};

const mapWithConcurrency = async (items, handler, concurrency = requestConcurrency) => {
  const output = [];
  for (let index = 0; index < items.length; index += concurrency) {
    output.push(...await Promise.all(items.slice(index, index + concurrency).map(handler)));
  }
  return output;
};

const departmentOrder = [
  "clearance",
  "seasonal-christmas",
  "health-beauty",
  "stationery-party",
  "toys-gifts",
  "charging-electrical",
  "sweets-snacks",
  "household-pet",
];
const roots = [...rootReport.roots].sort((left, right) => departmentOrder.indexOf(left.slug) - departmentOrder.indexOf(right.slug));
const usedSkus = new Set();
const usedSlugs = new Set();
const allProducts = [];
const departmentReports = [];
const rejected = [];

for (const department of roots) {
  const rootUrl = department.sourceCategoryLink.replace(/\/$/, "");
  const categoryPages = Array.from({ length: candidatePagesPerDepartment }, (_, index) => index === 0 ? `${rootUrl}/` : `${rootUrl}/page/${index + 1}/`);
  const categoryHtml = (await mapWithConcurrency(categoryPages, loadCategoryPage, 3)).filter(Boolean);
  const candidateUrls = unique(categoryHtml.flatMap(productLinksFromCategoryPage));
  const productHtml = await mapWithConcurrency(candidateUrls.slice(0, targetPerDepartment + 20), async (sourceUrl) => {
    try {
      return { sourceUrl, html: await load(sourceUrl), error: null };
    } catch (error) {
      return { sourceUrl, html: null, error: error instanceof Error ? error.message : String(error) };
    }
  });
  const selected = [];

  for (const candidate of productHtml) {
    if (selected.length >= targetPerDepartment) break;
    if (!candidate.html) {
      rejected.push({ department: department.slug, sourceUrl: candidate.sourceUrl, reason: "public_product_page_unavailable", detail: candidate.error });
      continue;
    }
    const product = parseProduct(candidate.html, { department, sourceUrl: candidate.sourceUrl });
    if (!product) {
      rejected.push({ department: department.slug, sourceUrl: candidate.sourceUrl, reason: "missing_required_public_field" });
      continue;
    }
    if (usedSkus.has(product.sku) || usedSlugs.has(product.slug)) {
      rejected.push({ department: department.slug, sourceUrl: candidate.sourceUrl, sku: product.sku, reason: "duplicate_across_compact_dataset" });
      continue;
    }
    usedSkus.add(product.sku);
    usedSlugs.add(product.slug);
    selected.push(product);
  }
  allProducts.push(...selected);
  departmentReports.push({
    department: department.magneticName,
    slug: department.slug,
    requested: targetPerDepartment,
    selected: selected.length,
    candidateProductUrls: candidateUrls.length,
    sourceProductCount: department.sourceProductCount,
  });
}

const report = {
  retrievedAt: new Date().toISOString(),
  productCount: allProducts.length,
  requestedTarget: targetPerDepartment * roots.length,
  departmentReports,
  rejectedCount: rejected.length,
  pendingPriceCount: allProducts.filter((product) => product.price === null).length,
  stockPolicy: "Source stock and availability values were intentionally never extracted or stored.",
  pricePolicy: "Prices remain null until an owner-authorized Harrison’s trade price source is provided; no RRP or estimated price is substituted.",
};

await writeFile(`${sourceDirectory}/compact-public-products.json`, JSON.stringify(allProducts, null, 2));
await writeFile(`${sourceDirectory}/compact-public-products-rejected.json`, JSON.stringify(rejected, null, 2));
await writeFile(`${sourceDirectory}/compact-public-catalogue-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
