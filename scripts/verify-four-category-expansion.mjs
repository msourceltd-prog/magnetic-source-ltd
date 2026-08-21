import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dataPath = resolve("data/four-category-product-expansion.json");
const backupPath = "/home/ubuntu/magnetic-source-catalogue-backups/before-four-category-60-product-expansion-2026-08-21.json";
const reportPath = resolve("data/four-category-expansion-verification.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const expectedFinalCounts = {
  "baby-kids": 39,
  clearance: 38,
  "seasonal-christmas": 37,
  "stationery-party": 54,
  "toys-gifts": 54,
  "health-beauty": 49,
  "household-pet": 55,
  "sweets-snacks": 55,
};

const request = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
};
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured&order=id");
const approved = JSON.parse(await readFile(dataPath, "utf8")).products;
const backup = JSON.parse(await readFile(backupPath, "utf8")).products;
const bySku = (products) => new Map(products.map((product) => [product.sku, product]));
const currentBySku = bySku(current);
const backupBySku = bySku(backup);
const approvedBySku = bySku(approved);
const categoryCounts = Object.fromEntries(Object.keys(expectedFinalCounts).map((category) => [category, current.filter((product) => product.category === category).length]));
const mismatch = (actual, expected) => Object.entries(expected).filter(([key, value]) => actual[key] !== value).map(([key, value]) => ({ category: key, expected: value, actual: actual[key] }));
const approvedMissing = approved.filter((product) => !currentBySku.has(product.sku)).map((product) => product.sku);
const approvedChanged = approved.filter((product) => {
  const live = currentBySku.get(product.sku);
  return !live || ["slug", "name", "category", "price", "pack", "description", "image", "featured"].some((key) => JSON.stringify(live[key]) !== JSON.stringify(product[key])) || !Array.isArray(live.tags) || !live.tags.includes("Price hidden");
}).map((product) => product.sku);
const baselineMissing = backup.filter((product) => !currentBySku.has(product.sku)).map((product) => product.sku);
const unexpected = current.filter((product) => !backupBySku.has(product.sku) && !approvedBySku.has(product.sku)).map((product) => product.sku);
const priceOrImageViolations = current.filter((product) => Number(product.price) !== 0 || !product.image || !Array.isArray(product.tags) || !product.tags.includes("Price hidden")).map((product) => product.sku);
const result = {
  verifiedAt: new Date().toISOString(),
  backupProductCount: backup.length,
  approvedProductCount: approved.length,
  liveProductCount: current.length,
  categoryCounts,
  categoryCountMismatches: mismatch(categoryCounts, expectedFinalCounts),
  approvedMissing,
  approvedChanged,
  baselineMissing,
  unexpected,
  priceOrImageViolations,
  valid: current.length === 381 && backup.length === 321 && approved.length === 60 && !mismatch(categoryCounts, expectedFinalCounts).length && !approvedMissing.length && !approvedChanged.length && !baselineMissing.length && !unexpected.length && !priceOrImageViolations.length,
};
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);
if (!result.valid) throw new Error(`Post-import verification failed: ${JSON.stringify(result)}`);
console.log(JSON.stringify({ valid: result.valid, liveProductCount: result.liveProductCount, categoryCounts: result.categoryCounts, reportPath }, null, 2));
