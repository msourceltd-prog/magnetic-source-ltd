import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "ADD_60_VERIFIED_FOUR_CATEGORY_PRODUCTS";
const dataPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/four-category-product-expansion.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/before-four-category-60-product-expansion-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.FOUR_CATEGORY_IMPORT_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.FOUR_CATEGORY_IMPORT_ADMIN_PASSWORD;
const expectedBefore = {
  "baby-kids": 39,
  clearance: 38,
  "seasonal-christmas": 37,
  "stationery-party": 39,
  "toys-gifts": 39,
  "health-beauty": 49,
  "household-pet": 40,
  "sweets-snacks": 40,
};
const expectedAfter = {
  ...expectedBefore,
  "stationery-party": 54,
  "toys-gifts": 54,
  "household-pet": 55,
  "sweets-snacks": 55,
};

if (process.env.CONFIRM_FOUR_CATEGORY_EXPANSION !== confirmationPhrase) throw new Error("Four-category expansion is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("FOUR_CATEGORY_IMPORT_ADMIN_PASSWORD is required for the authenticated Admin import session.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: publicKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const countByCategory = (products) => Object.fromEntries(Object.keys(expectedBefore).map((category) => [category, products.filter((product) => product.category === category).length]));
const sameCounts = (actual, expected) => Object.keys(expected).every((category) => actual[category] === expected[category]);
const source = JSON.parse(await readFile(dataPath, "utf8"));
const products = source.products.map(({ sourceUrl, sourceSku, imageAssessment, ...product }) => product);
if (products.length !== 60 || new Set(products.map((product) => product.slug)).size !== 60 || new Set(products.map((product) => product.sku)).size !== 60 || new Set(products.map((product) => product.name)).size !== 60) {
  throw new Error("Expansion dataset must contain exactly 60 unique records.");
}
const requestedCategories = new Set(["household-pet", "sweets-snacks", "toys-gifts", "stationery-party"]);
if (products.some((product) => !requestedCategories.has(product.category) || product.price !== 0 || !product.image || !product.pack || !product.tags?.includes("Price hidden"))) {
  throw new Error("Expansion dataset violates the requested categories, price-free policy, or required full-product data policy.");
}
const importCounts = Object.fromEntries([...requestedCategories].map((category) => [category, products.filter((product) => product.category === category).length]));
if (Object.values(importCounts).some((count) => count !== 15)) throw new Error(`Expansion dataset must contain 15 products per requested category: ${JSON.stringify(importCounts)}`);

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const currentCounts = countByCategory(current);
if (current.length !== 321 || !sameCounts(currentCounts, expectedBefore)) throw new Error(`Unexpected pre-import catalogue state: total ${current.length}; counts ${JSON.stringify(currentCounts)}. No records were changed.`);
const currentSlugs = new Set(current.map((product) => product.slug));
const currentSkus = new Set(current.map((product) => product.sku));
const currentNames = new Set(current.map((product) => product.name));
if (products.some((product) => currentSlugs.has(product.slug) || currentSkus.has(product.sku) || currentNames.has(product.name))) {
  throw new Error("A validated import product now conflicts with the live catalogue. No records were changed.");
}

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 321-product catalogue before owner-approved four-category 60-product expansion", products: current }, null, 2)}\n`);

const insertedSkus = [];
for (const product of products) {
  const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(product) }, token);
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].sku !== product.sku) throw new Error(`Product ${product.sku} could not be confirmed after insert. Review ${backupPath}.`);
  insertedSkus.push(product.sku);
}

const finalProducts = await request("/rest/v1/products?select=category,price,image,tags,sku&order=id");
const finalCounts = countByCategory(finalProducts);
if (finalProducts.length !== 381 || !sameCounts(finalCounts, expectedAfter) || finalProducts.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) {
  throw new Error(`Final four-category validation failed: total ${finalProducts.length}; counts ${JSON.stringify(finalCounts)}. Review ${backupPath}.`);
}

console.log(JSON.stringify({ completed: true, addedProducts: insertedSkus.length, categoryCounts: finalCounts, totalProducts: finalProducts.length, backupPath }, null, 2));
