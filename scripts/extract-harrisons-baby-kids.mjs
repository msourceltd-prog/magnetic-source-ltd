import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceDirectory = "/home/ubuntu/harrisons-direct-source";
const outputDirectory = `${sourceDirectory}/baby-kids-replacement`;
const department = {
  magneticName: "Baby & Kids",
  slug: "baby-kids",
  sourceCategoryLink: "https://www.harrisonsdirect.co.uk/product-category/health-beauty/baby/",
  sourceCategoryId: 240,
};
const target = 40;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const decodeHtml = (value = "") => String(value)
  .replace(/&amp;/gi, "&")
  .replace(/&#8217;|&rsquo;/gi, "’")
  .replace(/&#8211;|&ndash;/gi, "–")
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
    const signal = AbortSignal.timeout(15000);
    let response;
    try {
      response = await fetch(url, { headers: { "user-agent": "MagneticSourceCatalogueAudit/1.0" }, signal });
    } catch (error) {
      if (attempt < 4) {
        await wait(1500 * attempt);
        continue;
      }
      throw error;
    }
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 4) {
      await wait(1500 * attempt);
      continue;
    }
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
    return response.text();
  }
  throw new Error(`Request failed after retries: ${url}`);
};

const productLinks = (html) => unique(
  [...html.matchAll(/https:\/\/www\.harrisonsdirect\.co\.uk\/product\/([^"'/?#]+)\/?/gi)]
    .map((match) => `https://www.harrisonsdirect.co.uk/product/${match[1]}/`),
);

const parseProduct = (html, sourceUrl) => {
  const name = decodeHtml(firstMatch(html, /<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
    || firstMatch(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.replace(/\s+-\s+Harrisons Direct$/i, ""));
  const sku = decodeHtml(firstMatch(html, /<li>\s*Product Code:\s*([^<]+)<\/li>/i));
  const packQuantity = decodeHtml(firstMatch(html, /<li>\s*Pack Quantity:\s*([^<]+)<\/li>/i));
  const image = decodeHtml(firstMatch(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i));
  if (!name || !sku || !packQuantity || !image) return null;
  const pack = `Pack of ${packQuantity}`;
  return {
    sourceUrl,
    slug: slugify(`${name}-${sku}`),
    name,
    category: department.slug,
    sku,
    pack,
    description: `${name} is supplied as ${pack}.`,
    descriptionSource: "factual-title-and-pack",
    image,
    tags: [department.magneticName, "Harrisons-authorized catalogue", "Price hidden"],
    price: 0,
    stockCaptured: false,
  };
};

const categoryPages = [department.sourceCategoryLink, `${department.sourceCategoryLink}page/2/`];
const listings = [];
for (const url of categoryPages) {
  try {
    listings.push(await load(url));
    await wait(200);
  } catch (error) {
    if (!String(error).includes("404")) throw error;
  }
}

const selected = [];
const rejected = [];
for (const sourceUrl of unique(listings.flatMap(productLinks))) {
  if (selected.length >= target) break;
  try {
    const product = parseProduct(await load(sourceUrl), sourceUrl);
    await wait(200);
    if (!product) {
      rejected.push({ sourceUrl, reason: "missing_required_public_field" });
      continue;
    }
    if (selected.some((item) => item.sku === product.sku || item.slug === product.slug || item.image === product.image)) {
      rejected.push({ sourceUrl, sku: product.sku, reason: "duplicate_product_or_image" });
      continue;
    }
    selected.push(product);
  } catch (error) {
    rejected.push({ sourceUrl, reason: "public_product_page_unavailable", detail: error instanceof Error ? error.message : String(error) });
  }
}

const report = {
  retrievedAt: new Date().toISOString(),
  department,
  requested: target,
  selected: selected.length,
  rejected: rejected.length,
  imageCount: selected.filter((product) => product.image).length,
  stockPolicy: "Supplier stock and availability fields were not collected.",
  pricePolicy: "Price is stored as 0 only for schema compatibility and is marked Price hidden for public display.",
};

if (selected.length !== target) throw new Error(`Expected ${target} valid Baby & Kids products; found ${selected.length}.`);
await mkdir(outputDirectory, { recursive: true });
await writeFile(`${outputDirectory}/baby-kids-products.json`, JSON.stringify(selected, null, 2));
await writeFile(`${outputDirectory}/baby-kids-rejected.json`, JSON.stringify(rejected, null, 2));
await writeFile(`${outputDirectory}/baby-kids-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
