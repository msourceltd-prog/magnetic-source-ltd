import { mkdir, writeFile } from "node:fs/promises";

const outputDirectory = "/home/ubuntu/magnetic-source-ecommerce-v2/data";
const outputPath = `${outputDirectory}/four-category-product-expansion-candidates.json`;
const reportPath = `${outputDirectory}/four-category-product-expansion-source-report.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const targetPerCategory = 15;
const listingPagesToReview = 6;
const productRequestBatchSize = 8;
const departments = [
  { slug: "household-pet", name: "Household & Pet", sourceUrl: "https://www.harrisonsdirect.co.uk/product-category/household/" },
  { slug: "sweets-snacks", name: "Sweets & Snacks", sourceUrl: "https://www.harrisonsdirect.co.uk/product-category/sweets-snacks/" },
  { slug: "toys-gifts", name: "Toys & Gifts", sourceUrl: "https://www.harrisonsdirect.co.uk/product-category/wholesale-toys-gifts/" },
  { slug: "stationery-party", name: "Stationery & Party", sourceUrl: "https://www.harrisonsdirect.co.uk/product-category/wholesale-stationery/" },
];

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
const slugify = (value) => decodeHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 190);
const firstMatch = (source, pattern) => source.match(pattern)?.[1]?.trim() || null;
const unique = (items) => [...new Set(items)];

const load = async (url) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { "user-agent": "MagneticSourceCatalogueUpdate/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 3) {
      await wait(1200 * attempt);
      continue;
    }
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.text();
  }
  throw new Error(`Unavailable source: ${url}`);
};

const productLinks = (html) => unique([...html.matchAll(/https:\/\/www\.harrisonsdirect\.co\.uk\/product\/([^"'/?#]+)\/?/gi)]
  .map((match) => `https://www.harrisonsdirect.co.uk/product/${match[1]}/`));

const parseProduct = (html, department, sourceUrl) => {
  const name = decodeHtml(firstMatch(html, /<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
    || firstMatch(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.replace(/\s+-\s+Harrisons Direct$/i, ""));
  const sku = decodeHtml(firstMatch(html, /<li>\s*Product Code:\s*([^<]+)<\/li>/i));
  const packQuantity = decodeHtml(firstMatch(html, /<li>\s*Pack Quantity:\s*([^<]+)<\/li>/i));
  const image = decodeHtml(firstMatch(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i));
  if (!name || !sku || !packQuantity || !image || !/^https:\/\//i.test(image)) return null;
  return {
    name,
    slug: slugify(`${name}-${sku}`),
    sku,
    category: department.slug,
    pack: `Pack of ${packQuantity}`,
    description: `${name} is supplied in a pack of ${packQuantity}.`,
    image,
    tags: [department.name, "Harrisons-authorized catalogue", "Price hidden"],
    availability: "Trade enquiry only",
    price: 0,
    featured: false,
    sourceUrl,
    imagePresentation: "full-product-contain",
  };
};

const publicRequest = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const liveProducts = await publicRequest("/rest/v1/products?select=slug,sku,name&order=id");
const knownSlugs = new Set(liveProducts.map((product) => product.slug));
const knownSkus = new Set(liveProducts.map((product) => product.sku));
const knownNames = new Set(liveProducts.map((product) => product.name));
const allCandidates = [];
const departmentReports = [];

for (const department of departments) {
  const listingUrls = Array.from({ length: listingPagesToReview }, (_, index) => index === 0
    ? department.sourceUrl
    : `${department.sourceUrl.replace(/\/$/, "")}/page/${index + 1}/`);
  const listingPages = await Promise.all(listingUrls.map(load));
  const links = unique(listingPages.flatMap(productLinks));
  const selected = [];
  const rejected = [];

  for (let index = 0; index < links.length && selected.length < targetPerCategory; index += productRequestBatchSize) {
    const batch = links.slice(index, index + productRequestBatchSize);
    const parsedBatch = await Promise.all(batch.map(async (sourceUrl) => {
      try {
        return { sourceUrl, product: parseProduct(await load(sourceUrl), department, sourceUrl), error: null };
      } catch (error) {
        return { sourceUrl, product: null, error: error instanceof Error ? error.message : String(error) };
      }
    }));
    for (const candidate of parsedBatch) {
      if (selected.length >= targetPerCategory) break;
      if (candidate.error) {
        rejected.push({ sourceUrl: candidate.sourceUrl, reason: "source_unavailable", detail: candidate.error });
        continue;
      }
      const product = candidate.product;
      if (!product) {
        rejected.push({ sourceUrl: candidate.sourceUrl, reason: "missing_required_factual_field_or_image" });
        continue;
      }
      if (knownSlugs.has(product.slug) || knownSkus.has(product.sku) || knownNames.has(product.name)) {
        rejected.push({ sourceUrl: candidate.sourceUrl, sku: product.sku, name: product.name, reason: "already_in_live_catalogue" });
        continue;
      }
      if (selected.some((current) => current.slug === product.slug || current.sku === product.sku || current.name === product.name)) {
        rejected.push({ sourceUrl: candidate.sourceUrl, sku: product.sku, name: product.name, reason: "duplicate_within_candidate_set" });
        continue;
      }
      selected.push(product);
    }
  }

  if (selected.length !== targetPerCategory) {
    throw new Error(`${department.name}: selected ${selected.length} clean candidates from ${links.length} public listing links; expected ${targetPerCategory}.`);
  }
  allCandidates.push(...selected);
  departmentReports.push({ department: department.name, slug: department.slug, listingUrls, sourceLinksReviewed: links.length, selected: selected.length, rejected });
}

if (allCandidates.length !== 60 || new Set(allCandidates.map((product) => product.slug)).size !== 60 || new Set(allCandidates.map((product) => product.sku)).size !== 60 || new Set(allCandidates.map((product) => product.name)).size !== 60) {
  throw new Error("Final candidate-set uniqueness guard failed.");
}
if (allCandidates.some((product) => product.price !== 0 || !product.image || !product.tags.includes("Price hidden") || product.imagePresentation !== "full-product-contain")) {
  throw new Error("Final candidate-set price-free or full-product-image policy guard failed.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ collectedAt: new Date().toISOString(), products: allCandidates }, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify({
  collectedAt: new Date().toISOString(),
  existingLiveProductCount: liveProducts.length,
  requestedProducts: 60,
  targetPerCategory,
  departmentReports,
  policy: "Only factual title, public product reference, pack quantity, matching supplier image, and category mapping were collected. Public supplier stock and trade-price values were not stored.",
}, null, 2)}\n`);

console.log(JSON.stringify({
  completed: true,
  candidateCount: allCandidates.length,
  byCategory: Object.fromEntries(departments.map((department) => [department.slug, allCandidates.filter((product) => product.category === department.slug).length])),
  outputPath,
  reportPath,
}, null, 2));
