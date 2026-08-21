import { readFile, writeFile } from "node:fs/promises";

const listingResultPath = "/home/ubuntu/extract_harrisons_compact_listings.json";
const sitemapPath = "/home/ubuntu/upload/www.harrisonsdirect.co.uk_product-sitemap.xml_1787227561141.md";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";
const targetPerDepartment = 40;

const listings = JSON.parse(await readFile(listingResultPath, "utf8"));
const sitemap = await readFile(sitemapPath, "utf8");

const categories = {
  "Health & Beauty": { name: "Health & Beauty", slug: "health-beauty", order: 6 },
  "Stationery & Party": { name: "Stationery & Party", slug: "stationery-party", order: 5 },
  "Toys & Gifts": { name: "Toys & Gifts", slug: "toys-gifts", order: 4 },
  "Charging & Electrical": { name: "Charging & Electrical", slug: "charging-electrical", order: 3 },
  "Sweets & Snacks": { name: "Sweets & Snacks", slug: "sweets-snacks", order: 2 },
  "Household & Pet": { name: "Household & Pet", slug: "household-pet", order: 1 },
  "Seasonal & Christmas": { name: "Seasonal & Christmas", slug: "seasonal-christmas", order: 7 },
  Clearance: { name: "Clearance", slug: "clearance", order: 0 },
};

const decodeHtml = (value = "") => String(value)
  .replace(/&amp;/gi, "&")
  .replace(/&#8217;|&rsquo;/gi, "’")
  .replace(/&#8211;|&ndash;/gi, "–")
  .replace(/&#8220;|&ldquo;/gi, "“")
  .replace(/&#8221;|&rdquo;/gi, "”")
  .replace(/&#39;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/\s+/g, " ")
  .trim();

const slugify = (value) => decodeHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 190);
const sourceSlug = (url) => url.match(/\/product\/([^/]+)\/?$/i)?.[1] ?? null;

const imageBySourceSlug = new Map();
const productEntryPattern = /https:\/\/www\.harrisonsdirect\.co\.uk\/product\/([^/\s]+)\/([\s\S]*?)(?=https:\/\/www\.harrisonsdirect\.co\.uk\/product\/|$)/gi;
for (const match of sitemap.matchAll(productEntryPattern)) {
  const slug = match[1];
  const image = match[2].match(/https:\/\/www\.harrisonsdirect\.co\.uk\/wp-content\/uploads\/[^\s<]+/i)?.[0] ?? null;
  if (image && !imageBySourceSlug.has(slug)) imageBySourceSlug.set(slug, image);
}

const candidatesByDepartment = new Map(Object.keys(categories).map((department) => [department, []]));
for (const entry of listings.results) {
  const department = entry.output?.department;
  if (!categories[department]) continue;
  const pageNumber = Number(entry.output?.page_number ?? 0);
  let products = [];
  try {
    products = JSON.parse(entry.output?.products ?? "[]");
  } catch {
    continue;
  }
  products.forEach((product, index) => candidatesByDepartment.get(department).push({ ...product, pageNumber, index }));
}

for (const candidates of candidatesByDepartment.values()) {
  candidates.sort((left, right) => left.pageNumber - right.pageNumber || left.index - right.index);
}

const selected = [];
const rejected = [];
const usedSkus = new Set();
const usedSlugs = new Set();
const departmentReports = [];
const departments = Object.entries(categories).sort(([, left], [, right]) => left.order - right.order);

for (const [department, category] of departments) {
  const candidates = candidatesByDepartment.get(department) ?? [];
  const departmentProducts = [];
  const target = department === "Clearance" ? Math.min(39, candidates.length) : targetPerDepartment;

  for (const candidate of candidates) {
    if (departmentProducts.length >= target) break;
    const sourceUrl = candidate.source_url;
    const sourceProductSlug = sourceSlug(sourceUrl);
    const image = sourceProductSlug ? imageBySourceSlug.get(sourceProductSlug) ?? null : null;
    const sku = decodeHtml(candidate.sku);
    const name = decodeHtml(candidate.name);
    const recordSlug = slugify(`${name}-${sku}`);
    if (!name || !sku || !candidate.pack_quantity || !sourceUrl) {
      rejected.push({ department, sourceUrl, sku, reason: "missing_required_listing_field" });
      continue;
    }
    if (!image) {
      rejected.push({ department, sourceUrl, sku, reason: "no_matching_sitemap_image" });
      continue;
    }
    if (usedSkus.has(sku) || usedSlugs.has(recordSlug)) {
      rejected.push({ department, sourceUrl, sku, reason: "duplicate_across_compact_dataset" });
      continue;
    }
    usedSkus.add(sku);
    usedSlugs.add(recordSlug);
    departmentProducts.push({
      name,
      slug: recordSlug,
      sku,
      category: category.slug,
      categoryName: category.name,
      pack: `Pack of ${decodeHtml(candidate.pack_quantity)}`,
      description: "",
      descriptionSource: "optional-manual-description-only",
      image,
      sourceUrl,
      price: null,
      priceStatus: "pending-authorized-trade-price",
      stockCaptured: false,
      tags: [category.name, "Harrisons-authorized catalogue", "Price pending"],
    });
  }
  selected.push(...departmentProducts);
  departmentReports.push({ department, requested: target, candidates: candidates.length, selected: departmentProducts.length });
}

const report = {
  builtAt: new Date().toISOString(),
  sourceListingPages: listings.results.length,
  productCount: selected.length,
  imageMappedCount: selected.filter((product) => Boolean(product.image)).length,
  pricePendingCount: selected.filter((product) => product.price === null).length,
  departmentReports,
  rejectedCount: rejected.length,
  stockPolicy: "No supplier stock, availability, discount, or login-only price text is stored in this dataset.",
  pricePolicy: "Prices are intentionally null until an authorized Harrison’s trade-price source is supplied.",
};

await writeFile(`${outputDirectory}/compact-public-products.json`, JSON.stringify(selected, null, 2));
await writeFile(`${outputDirectory}/compact-public-products-rejected.json`, JSON.stringify(rejected, null, 2));
await writeFile(`${outputDirectory}/compact-public-catalogue-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
