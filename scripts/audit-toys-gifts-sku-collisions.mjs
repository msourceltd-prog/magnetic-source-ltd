import { readFile, writeFile } from "node:fs/promises";

const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const source = JSON.parse(await readFile(new URL("../data/gem-toys-gifts-import-source.json", import.meta.url), "utf8"));

const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Catalogue read failed: ${response.status} ${JSON.stringify(products).slice(0, 500)}`);

const existingBySku = new Map(products.map((product) => [product.sku, product]));
const collisions = source.products
  .filter((product) => existingBySku.has(product.sku))
  .map((product) => ({ source_sku: product.source_sku, proposed_sku: product.sku, proposed_name: product.name, existing: existingBySku.get(product.sku) }));
const toysCount = products.filter((product) => product.category === "toys-gifts").length;
const report = {
  created_at: new Date().toISOString(),
  current_toys_gifts_count: toysCount,
  proposed_import_count: source.products.length,
  collision_count: collisions.length,
  collisions,
};
await writeFile(new URL("../data/toys-gifts-sku-collision-audit.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
