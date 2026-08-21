import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const detailsPath = resolve("data/health-baby-expansion-verified-details.json");
const productsPath = resolve("data/health-baby-expansion.json");
const reportPath = resolve("data/health-baby-expansion-preparation-report.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const expectedCounts = { "health-beauty": 15, "baby-kids": 15 };
const blockedNames = new Set(["Tidyz Degradable Nappy Bags Pocket Pack 4 x 25’s"]);
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value) => normalize(value).replace(/\s+/g, "-");
const sourceDetails = JSON.parse(await readFile(detailsPath, "utf8")).products;
const products = sourceDetails.map((source) => ({
  slug: `${slugify(source.expectedName)}-${source.sku.toLowerCase()}`,
  name: source.expectedName,
  category: source.category,
  price: 0,
  sku: source.sku,
  availability: "Trade enquiry only",
  pack: source.pack,
  description: `${source.expectedName} is supplied as ${source.pack.toLowerCase()}.`,
  image: source.image,
  tags: [source.category === "baby-kids" ? "Baby & Kids" : "Health & Beauty", "Harrisons-authorized catalogue", "Price hidden", "Full product contained frame"],
  featured: false,
  sourceUrl: source.sourceUrl,
}));
const counts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, products.filter((product) => product.category === category).length]));
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku,slug`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveSkus = new Set(live.map((product) => product.sku));
const liveSlugs = new Set(live.map((product) => product.slug));
const liveNames = new Set(live.map((product) => normalize(product.name)));
const seenSkus = new Set();
const seenSlugs = new Set();
const seenNames = new Set();
const duplicateProblems = [];
for (const product of products) {
  if (seenSkus.has(product.sku) || liveSkus.has(product.sku)) duplicateProblems.push(`SKU collision: ${product.sku}`);
  if (seenSlugs.has(product.slug) || liveSlugs.has(product.slug)) duplicateProblems.push(`Slug collision: ${product.slug}`);
  if (seenNames.has(normalize(product.name)) || liveNames.has(normalize(product.name))) duplicateProblems.push(`Name collision: ${product.name}`);
  if (blockedNames.has(product.name)) duplicateProblems.push(`Owner-removed product is blocked: ${product.name}`);
  seenSkus.add(product.sku); seenSlugs.add(product.slug); seenNames.add(normalize(product.name));
}
const imageResults = [];
for (const product of products) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let ok = false;
  let contentType = "";
  try {
    let imageResponse = await fetch(product.image, { method: "HEAD", signal: controller.signal });
    if (!imageResponse.ok || !(imageResponse.headers.get("content-type") || "").startsWith("image/")) {
      imageResponse = await fetch(product.image, { method: "GET", headers: { Range: "bytes=0-2048" }, signal: controller.signal });
    }
    ok = imageResponse.ok;
    contentType = imageResponse.headers.get("content-type") || "";
  } catch {}
  clearTimeout(timeout);
  imageResults.push({ sku: product.sku, ok, contentType });
}
const invalidRecords = products.filter((product) => product.price !== 0 || !product.tags.includes("Price hidden") || !product.tags.includes("Full product contained frame") || !product.image.startsWith("https://") || !product.pack.startsWith("Pack of ") || !product.description.endsWith("."));
const report = {
  preparedAt: new Date().toISOString(),
  liveProductCount: live.length,
  preparedProductCount: products.length,
  categoryCounts: counts,
  duplicateProblems,
  invalidRecords: invalidRecords.map((product) => product.sku),
  inaccessibleImages: imageResults.filter((result) => !result.ok || !result.contentType.startsWith("image/")).map((result) => result.sku),
  valid: products.length === 30 && Object.entries(expectedCounts).every(([category, count]) => counts[category] === count) && !duplicateProblems.length && !invalidRecords.length && imageResults.every((result) => result.ok && result.contentType.startsWith("image/")),
};
await writeFile(productsPath, `${JSON.stringify({ preparedAt: report.preparedAt, products }, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.valid) throw new Error(`Health & Baby expansion preparation failed: ${JSON.stringify(report)}`);
console.log(JSON.stringify({ valid: report.valid, preparedProductCount: report.preparedProductCount, categoryCounts: report.categoryCounts, reportPath, productsPath }, null, 2));
