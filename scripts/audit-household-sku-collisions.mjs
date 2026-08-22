import { readFile, writeFile } from "node:fs/promises";

const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const source = JSON.parse(await readFile(new URL("../data/gem-household-half-range-import-source.json", import.meta.url), "utf8"));

const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Catalogue read failed: ${response.status} ${JSON.stringify(products).slice(0, 500)}`);

const existingBySku = new Map(products.map((product) => [product.sku, product]));
const collisions = source.products
  .filter((product) => existingBySku.has(product.sku))
  .map((product) => ({ source_sku: product.source_sku, proposed_sku: product.sku, proposed_name: product.name, existing: existingBySku.get(product.sku) }));
const currentHouseholdCount = products.filter((product) => product.category === "household-pet").length;
const report = {
  created_at: new Date().toISOString(),
  current_household_pet_count: currentHouseholdCount,
  proposed_half_range_count: source.products.length,
  collision_count: collisions.length,
  collisions,
};
await writeFile(new URL("../data/household-sku-collision-audit.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
