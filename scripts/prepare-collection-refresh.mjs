import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const refreshedCategories = ["baby-kids", "household-pet", "toys-gifts", "pets", "stationery-party", "seasonal-christmas"];
const babyBestSellerSkus = ["GEM-BAB8114", "GEM-BAB5368", "GEM-BAB5367", "GEM-BAB0731", "GEM-BAB0719"];

if (!baseUrl) throw new Error("Missing Supabase project URL.");

const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category,pack,image,tags&order=category.asc,sku.asc`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Unable to prepare collection refresh: ${response.status}`);

const bySku = new Map(products.map((product) => [product.sku, product]));
const select = (skus, label) => skus.map((sku) => {
  const product = bySku.get(sku);
  if (!product) throw new Error(`${label} SKU ${sku} is not live.`);
  return product;
});

const babyBestSellers = select(babyBestSellerSkus, "Baby Best seller");
if (babyBestSellers.some((product) => product.category !== "baby-kids" || !product.sku.startsWith("GEM-"))) throw new Error("Baby Best seller selection must contain live Gem Imports Baby & Kids products.");

const newArrivalAdditions = refreshedCategories.flatMap((category) => {
  if (category === "baby-kids") return babyBestSellers.slice(0, 2);
  const selection = products.filter((product) => product.category === category && product.tags?.includes("Best seller")).slice(0, 2);
  if (selection.length !== 2) throw new Error(`Expected two existing source-verified Best sellers for ${category}.`);
  return selection;
});

const duplicateNewArrivals = newArrivalAdditions.filter((product, index) => newArrivalAdditions.findIndex((candidate) => candidate.sku === product.sku) !== index);
if (newArrivalAdditions.length !== 12 || duplicateNewArrivals.length) throw new Error("New arrival selection must contain twelve unique products.");

const source = {
  created_at: new Date().toISOString(),
  instruction: "Refresh Best sellers and New arrivals with a category-balanced selection from the current catalogue, including newly added Pets products, without changing product categories or commercial data.",
  best_seller_additions: babyBestSellers.map((product) => ({ sku: product.sku, name: product.name, category: product.category, source: "Authorised Gem Imports Baby & Kids range" })),
  new_arrival_additions: newArrivalAdditions.map((product) => ({ sku: product.sku, name: product.name, category: product.category, source: product.tags?.includes("Gem Imports") ? "Authorised Gem Imports range" : "Source-confirmed restored Pets range" })),
  expected_collection_counts_after_update: { best_sellers: 59, new_arrivals: 12 },
  expected_new_arrival_category_counts: Object.fromEntries(refreshedCategories.map((category) => [category, 2])),
};

await writeFile(new URL("../data/collection-refresh-source.json", import.meta.url), JSON.stringify(source, null, 2));
console.log(JSON.stringify(source, null, 2));
