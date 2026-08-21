import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rawDatasetPath = resolve("data/four-category-product-expansion-verified-details.json");
const replacementsPath = resolve("data/four-category-collision-replacements.json");
const outputPath = resolve("data/four-category-product-expansion-collision-safe.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const prefixes = { "household-pet": "HPE", "sweets-snacks": "SWE", "toys-gifts": "TGY", "stationery-party": "STX" };
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value) => normalize(value).replace(/\s+/g, "-");

const raw = JSON.parse(await readFile(rawDatasetPath, "utf8"));
const replacements = JSON.parse(await readFile(replacementsPath, "utf8"));
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,name,sku`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveNames = new Set(live.map((product) => normalize(product.name)));
const liveSkus = new Set(live.map((product) => product.sku));
const liveSlugs = new Set(live.map((product) => product.slug));
const conflictsByCategory = Object.fromEntries(Object.keys(prefixes).map((category) => [category, []]));
for (const product of raw) {
  const importSku = `${prefixes[product.category]}-${product.sku}`;
  const importSlug = `${product.category}-${slugify(product.name)}-${product.sku.toLowerCase()}`;
  if (liveNames.has(normalize(product.name)) || liveSkus.has(importSku) || liveSlugs.has(importSlug)) conflictsByCategory[product.category].push(product);
}
for (const [category, conflicts] of Object.entries(conflictsByCategory)) {
  if (conflicts.length > (replacements[category] || []).length) {
    throw new Error(`${category} has ${conflicts.length} live collision(s) but only ${(replacements[category] || []).length} verified replacement candidate(s).`);
  }
}

const replacementQueues = Object.fromEntries(Object.entries(replacements).map(([category, products]) => [category, [...products]]));
const collisionNames = new Set(Object.values(conflictsByCategory).flat().map((product) => normalize(product.name)));
const collisionSafe = raw.map((product) => {
  if (!collisionNames.has(normalize(product.name))) return product;
  const replacement = replacementQueues[product.category].shift();
  if (!replacement) throw new Error(`No remaining replacement is available for ${product.name}.`);
  return { category: product.category, ...replacement };
});
if (collisionSafe.length !== 60 || new Set(collisionSafe.map((product) => `${product.category}:${product.sku}`)).size !== 60 || new Set(collisionSafe.map((product) => normalize(product.name))).size !== 60) {
  throw new Error("The collision-safe dataset is not 60 records with unique names and category/SKU identifiers.");
}
const categoryCounts = Object.fromEntries(Object.keys(prefixes).map((category) => [category, collisionSafe.filter((product) => product.category === category).length]));
if (Object.values(categoryCounts).some((count) => count !== 15)) throw new Error(`Category count failure: ${JSON.stringify(categoryCounts)}`);

await writeFile(outputPath, `${JSON.stringify({ createdAt: new Date().toISOString(), replacementRule: "Only candidates already present in the live catalogue were replaced with equal-count verified category-matched alternatives.", replaced: Object.fromEntries(Object.entries(conflictsByCategory).map(([category, products]) => [category, products.map((product) => ({ name: product.name, sku: product.sku }))])), categoryCounts, products: collisionSafe }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, categoryCounts, replacementCounts: Object.fromEntries(Object.entries(conflictsByCategory).map(([category, products]) => [category, products.length])) }, null, 2));
