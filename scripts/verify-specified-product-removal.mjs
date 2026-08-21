import { access, readFile } from "node:fs/promises";
import path from "node:path";

const backupPath = "/home/ubuntu/magnetic-source-catalogue-backups/before-17-product-removal-2026-08-21.json";
const publicDir = path.resolve("dist/public");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const expectedCategoryCounts = {
  "baby-kids": 39,
  clearance: 38,
  "health-beauty": 49,
  "household-pet": 40,
  "seasonal-christmas": 37,
  "stationery-party": 39,
  "sweets-snacks": 40,
  "toys-gifts": 39,
};

const normalize = (value) => value
  .normalize("NFKC")
  .replace(/[\u2018\u2019\u02BC]/g, "'")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const request = async (pathName) => {
  const response = await fetch(`${supabaseUrl}${pathName}`, { headers: { apikey: publicKey } });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${pathName} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const products = await request("/rest/v1/products?select=id,slug,name,category,sku,pack,description,tags&order=id");
const backup = JSON.parse(await readFile(backupPath, "utf8"));
const targets = backup.removalTargets;
const removedProducts = backup.matchedProducts;
if (!Array.isArray(targets) || targets.length !== 18 || !Array.isArray(removedProducts) || removedProducts.length !== 18) {
  throw new Error(`Backup guard failed: expected 18 requested records in ${backupPath}.`);
}

const actualCategoryCounts = Object.fromEntries(Object.keys(expectedCategoryCounts).map((category) => [
  category,
  products.filter((product) => product.category === category).length,
]));
const categoryMismatches = Object.entries(expectedCategoryCounts).filter(([category, count]) => actualCategoryCounts[category] !== count);
const remainingExactNames = targets.flatMap((target) => products.filter((product) => product.category === target.category && normalize(product.name) === normalize(target.name)));
const searchMatches = targets.flatMap((target) => {
  const terms = normalize(target.name).split(" ").filter(Boolean);
  return products
    .filter((product) => {
      const searchable = normalize(`${product.name} ${product.sku} ${product.pack} ${product.description} ${product.category} ${product.tags.join(" ")}`);
      const searchableTerms = new Set(searchable.split(" ").filter(Boolean));
      return terms.every((term) => searchableTerms.has(term));
    })
    .map((product) => ({ query: target.name, product: product.name, slug: product.slug }));
});

const sitemap = await readFile(path.join(publicDir, "sitemap.xml"), "utf8");
const sitemapCount = (sitemap.match(/<loc>/g) || []).length;
const sitemapTargets = removedProducts.filter((product) => sitemap.includes(`/product/${product.slug}`));
const renderedTargetRoutes = [];
for (const product of removedProducts) {
  try {
    await access(path.join(publicDir, "product", product.slug, "index.html"));
    renderedTargetRoutes.push(product.slug);
  } catch {
    // Expected: pre-rendered removal routes no longer exist in a clean build.
  }
}

const failures = [];
if (products.length !== 321) failures.push(`expected 321 live products, found ${products.length}`);
if (categoryMismatches.length) failures.push(`unexpected category counts: ${categoryMismatches.map(([category, count]) => `${category} expected ${count}, found ${actualCategoryCounts[category]}`).join("; ")}`);
if (remainingExactNames.length) failures.push(`${remainingExactNames.length} exact removal target(s) remain in public catalogue data`);
if (searchMatches.length) failures.push(`${searchMatches.length} removal-target full-name search match(es) remain: ${JSON.stringify(searchMatches)}`);
if (sitemapCount !== 337) failures.push(`expected 337 sitemap URLs, found ${sitemapCount}`);
if (sitemapTargets.length) failures.push(`${sitemapTargets.length} removed product route(s) remain in sitemap`);
if (renderedTargetRoutes.length) failures.push(`${renderedTargetRoutes.length} removed product route(s) remain in pre-rendered output`);

if (failures.length) {
  console.error(`Exact-product removal verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  verified: true,
  removedCount: targets.length,
  liveProductCount: products.length,
  categoryCounts: actualCategoryCounts,
  searchQueriesWithResults: 0,
  sitemapUrlCount: sitemapCount,
  sitemapRoutesRemaining: 0,
  preRenderedRoutesRemaining: 0,
}, null, 2));
