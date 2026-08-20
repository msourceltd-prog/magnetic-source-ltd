import { readFile, writeFile } from "node:fs/promises";

const listingResultPath = "/home/ubuntu/extract_harrisons_compact_listings.json";
const clearanceRecoveryPath = "/home/ubuntu/recover_clearance_listing.json";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";
const targetPerDepartment = 40;

const listings = JSON.parse(await readFile(listingResultPath, "utf8"));
const clearanceRecovery = JSON.parse(await readFile(clearanceRecoveryPath, "utf8"));
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

const candidateLists = new Map(Object.keys(categories).map((department) => [department, []]));
for (const entry of listings.results) {
  const department = entry.output?.department;
  if (!categories[department]) continue;
  let products = [];
  try {
    products = JSON.parse(entry.output?.products ?? "[]");
  } catch {
    continue;
  }
  products.forEach((product, index) => candidateLists.get(department).push({ ...product, page: Number(entry.output?.page_number ?? 0), index }));
}

try {
  const recoveryProducts = JSON.parse(clearanceRecovery.results?.[0]?.output?.products ?? "[]");
  recoveryProducts.forEach((product, index) => candidateLists.get("Clearance").push({ ...product, page: 1, index }));
} catch {
  // The existing page-two Clearance rows remain usable if the recovered response is malformed.
}

const candidates = [];
const usedSkus = new Set();
const usedSlugs = new Set();
const reports = [];
for (const [department, category] of Object.entries(categories).sort(([, left], [, right]) => left.order - right.order)) {
  const rows = candidateLists.get(department).sort((left, right) => left.page - right.page || left.index - right.index);
  const limit = department === "Clearance" ? Math.min(39, rows.length) : targetPerDepartment;
  const selected = [];
  for (const row of rows) {
    if (selected.length >= limit) break;
    const name = decodeHtml(row.name);
    const sku = decodeHtml(row.sku);
    const recordSlug = slugify(`${name}-${sku}`);
    if (!name || !sku || !row.pack_quantity || !row.source_url || usedSkus.has(sku) || usedSlugs.has(recordSlug)) continue;
    const product = {
      lookup: `${department}|${sku}|${row.source_url}`,
      department,
      categorySlug: category.slug,
      name,
      sku,
      packQuantity: decodeHtml(row.pack_quantity),
      sourceUrl: row.source_url,
      slug: recordSlug,
    };
    usedSkus.add(sku);
    usedSlugs.add(recordSlug);
    selected.push(product);
    candidates.push(product);
  }
  reports.push({ department, target: limit, selected: selected.length });
}

const report = {
  generatedAt: new Date().toISOString(),
  count: candidates.length,
  reports,
  excludes: ["stock quantities", "availability labels", "prices", "discount percentages", "login-only fields"],
};

await writeFile(`${outputDirectory}/compact-product-image-lookups.json`, JSON.stringify(candidates, null, 2));
await writeFile(`${outputDirectory}/compact-product-image-lookups-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
