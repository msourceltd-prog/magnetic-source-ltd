import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "ADD_20_VERIFIED_HEALTH_BEAUTY_PRODUCTS";
const dataPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/health-beauty-expansion.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/health-beauty-before-20-product-expansion-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.HEALTH_BEAUTY_IMPORT_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.HEALTH_BEAUTY_IMPORT_ADMIN_PASSWORD;

if (process.env.CONFIRM_HEALTH_BEAUTY_EXPANSION !== confirmationPhrase) throw new Error("Health & Beauty expansion is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("HEALTH_BEAUTY_IMPORT_ADMIN_PASSWORD is required for the authenticated Admin import session.");

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

const source = JSON.parse(await readFile(dataPath, "utf8"));
const products = source.products.map(({ sourceUrl, sourceSku, imageAssessment, ...product }) => product);
if (products.length !== 20 || new Set(products.map((product) => product.slug)).size !== 20 || new Set(products.map((product) => product.sku)).size !== 20) throw new Error("Expansion dataset does not contain 20 unique products.");
if (products.some((product) => product.category !== "health-beauty" || product.price !== 0 || !product.image || !product.tags?.includes("Price hidden") || !product.sku.startsWith("HBT-"))) throw new Error("Expansion dataset violates the category, price-free, real-image, or identifier policy.");

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const currentSlugs = new Set(current.map((product) => product.slug));
const currentSkus = new Set(current.map((product) => product.sku));
const currentNames = new Set(current.map((product) => product.name));
if (products.some((product) => currentSlugs.has(product.slug) || currentSkus.has(product.sku) || currentNames.has(product.name))) throw new Error("An expansion product conflicts with an existing product identifier or name. No records were changed.");
const healthBefore = current.filter((product) => product.category === "health-beauty");
if (healthBefore.length !== 40 || current.length !== 319) throw new Error(`Expected 40 Health & Beauty and 319 total products, found ${healthBefore.length} and ${current.length}. No records were changed.`);

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Health & Beauty catalogue before owner-approved 20-product supplier expansion", products: healthBefore }, null, 2)}\n`);

const insertedSkus = [];
for (const product of products) {
  const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(product) }, token);
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].sku !== product.sku) throw new Error(`Health & Beauty record ${product.sku} could not be confirmed after insert.`);
  insertedSkus.push(product.sku);
}

const finalProducts = await request("/rest/v1/products?select=category,price,image,tags,sku&order=id");
const finalHealth = finalProducts.filter((product) => product.category === "health-beauty");
if (finalProducts.length !== 339 || finalHealth.length !== 60 || finalProducts.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) throw new Error(`Final Health & Beauty expansion validation failed: total ${finalProducts.length}, health ${finalHealth.length}. Review ${backupPath}.`);

console.log(JSON.stringify({ completed: true, addedProducts: insertedSkus.length, healthBeautyProducts: finalHealth.length, totalProducts: finalProducts.length, backupPath }, null, 2));
