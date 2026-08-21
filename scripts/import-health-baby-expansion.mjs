import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "ADD_30_VERIFIED_HEALTH_BABY_PRODUCTS";
const dataPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/health-baby-expansion.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/before-health-baby-30-product-expansion-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.HEALTH_BABY_IMPORT_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.HEALTH_BABY_IMPORT_ADMIN_PASSWORD;
const expectedBefore = { "baby-kids": 39, clearance: 38, "seasonal-christmas": 37, "stationery-party": 54, "toys-gifts": 54, "health-beauty": 49, "household-pet": 55, "sweets-snacks": 55 };
const expectedAfter = { ...expectedBefore, "baby-kids": 54, "health-beauty": 64 };
const ownerRemovedNames = new Set(["Tidyz Degradable Nappy Bags Pocket Pack 4 x 25’s"]);

if (process.env.CONFIRM_HEALTH_BABY_EXPANSION !== confirmationPhrase) throw new Error("Health & Baby expansion is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("HEALTH_BABY_IMPORT_ADMIN_PASSWORD is required for the authenticated Admin import session.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
const countByCategory = (products) => Object.fromEntries(Object.keys(expectedBefore).map((category) => [category, products.filter((product) => product.category === category).length]));
const sameCounts = (actual, expected) => Object.keys(expected).every((category) => actual[category] === expected[category]);
const source = JSON.parse(await readFile(dataPath, "utf8"));
const products = source.products.map(({ sourceUrl, ...product }) => product);
const selectedCategories = new Set(["health-beauty", "baby-kids"]);
if (products.length !== 30 || new Set(products.map((product) => product.slug)).size !== 30 || new Set(products.map((product) => product.sku)).size !== 30 || new Set(products.map((product) => product.name)).size !== 30) throw new Error("Expansion dataset must contain exactly 30 unique records.");
if (products.some((product) => !selectedCategories.has(product.category) || product.price !== 0 || !product.image || !product.pack || !product.tags?.includes("Price hidden") || !product.tags?.includes("Full product contained frame") || ownerRemovedNames.has(product.name))) throw new Error("Expansion dataset violates category, price-free, full-product image, or owner-removal safeguards.");
const importCounts = Object.fromEntries([...selectedCategories].map((category) => [category, products.filter((product) => product.category === category).length]));
if (importCounts["health-beauty"] !== 15 || importCounts["baby-kids"] !== 15) throw new Error(`Expansion dataset must contain exactly 15 records per selected category: ${JSON.stringify(importCounts)}`);

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const currentCounts = countByCategory(current);
if (current.length !== 381 || !sameCounts(currentCounts, expectedBefore)) throw new Error(`Unexpected pre-import catalogue state: total ${current.length}; counts ${JSON.stringify(currentCounts)}. No records were changed.`);
const currentSlugs = new Set(current.map((product) => product.slug));
const currentSkus = new Set(current.map((product) => product.sku));
const currentNames = new Set(current.map((product) => product.name));
if (products.some((product) => currentSlugs.has(product.slug) || currentSkus.has(product.sku) || currentNames.has(product.name))) throw new Error("A validated import product now conflicts with the live catalogue. No records were changed.");

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 381-product catalogue before owner-approved Health & Beauty and Baby & Kids 30-product expansion", products: current }, null, 2)}\n`);
const insertedSkus = [];
for (const product of products) {
  const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(product) }, token);
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].sku !== product.sku) throw new Error(`Product ${product.sku} could not be confirmed after insert. Review ${backupPath}.`);
  insertedSkus.push(product.sku);
}
const finalProducts = await request("/rest/v1/products?select=category,price,image,tags,sku,name&order=id");
const finalCounts = countByCategory(finalProducts);
if (finalProducts.length !== 411 || !sameCounts(finalCounts, expectedAfter) || finalProducts.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden") || !product.tags?.includes("Full product contained frame") && insertedSkus.includes(product.sku)) || finalProducts.some((product) => ownerRemovedNames.has(product.name))) throw new Error(`Final Health & Baby validation failed: total ${finalProducts.length}; counts ${JSON.stringify(finalCounts)}. Review ${backupPath}.`);
console.log(JSON.stringify({ completed: true, addedProducts: insertedSkus.length, categoryCounts: finalCounts, totalProducts: finalProducts.length, backupPath }, null, 2));
