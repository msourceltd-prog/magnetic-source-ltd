import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "RESTORE_24_MISSING_VERIFIED_CATALOGUE_PRODUCTS";
const compactSourcePath = "/home/ubuntu/harrisons-direct-source/compact-price-free-products.json";
const babySourcePath = "/home/ubuntu/harrisons-direct-source/baby-kids-price-free-products.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/catalogue-before-missing-product-restoration-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.CATALOGUE_RESTORE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.CATALOGUE_RESTORE_ADMIN_PASSWORD;
const expectedCounts = {
  "baby-kids": 40,
  clearance: 40,
  "health-beauty": 40,
  "household-pet": 40,
  "seasonal-christmas": 40,
  "stationery-party": 40,
  "sweets-snacks": 40,
  "toys-gifts": 40,
};

if (process.env.CONFIRM_CATALOGUE_RESTORATION !== confirmationPhrase) throw new Error("Restoration is locked. Set the exact owner-approved confirmation phrase only after count validation.");
if (!adminPassword) throw new Error("CATALOGUE_RESTORE_ADMIN_PASSWORD is required for the authenticated Admin restore session.");

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

const [compactProducts, babyProducts] = await Promise.all([
  readFile(compactSourcePath, "utf8").then(JSON.parse),
  readFile(babySourcePath, "utf8").then(JSON.parse),
]);
const baselineProducts = [
  ...compactProducts.filter((product) => product.category !== "charging-electrical" && product.category !== "stationery-party"),
  ...babyProducts,
];
if (baselineProducts.length !== 279) throw new Error(`Expected 279 non-Stationery baseline products, found ${baselineProducts.length}.`);

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const currentProducts = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id", {}, token);
const currentSku = new Set(currentProducts.map((product) => product.sku));
const currentSlug = new Set(currentProducts.map((product) => product.slug));
const missing = baselineProducts.filter((product) => !currentSku.has(product.sku));
const beforeCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, currentProducts.filter((product) => product.category === category).length]));
const deficits = Object.fromEntries(Object.entries(expectedCounts).map(([category, expected]) => [category, expected - beforeCounts[category]]));
if (Object.values(deficits).some((count) => count < 0)) throw new Error(`A live category exceeds its expected baseline: ${JSON.stringify(deficits)}. No records were changed.`);
const toRestore = Object.keys(expectedCounts).flatMap((category) => {
  const candidates = missing.filter((product) => product.category === category);
  if (candidates.length < deficits[category]) throw new Error(`Not enough verified missing candidates for ${category}: need ${deficits[category]}, found ${candidates.length}.`);
  return candidates.slice(0, deficits[category]);
});
if (toRestore.length !== 24) throw new Error(`Expected a 24-product count-deficit restore, selected ${toRestore.length}. No records were changed.`);
if (toRestore.some((product) => currentSlug.has(product.slug))) throw new Error("A selected restoration product has a conflicting existing slug. No records were changed.");
if (toRestore.some((product) => product.price !== 0 || !product.image || !product.tags?.includes("Price hidden"))) throw new Error("Selected source data violates the price-free or real-image policy.");
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Current catalogue before restoring 24 missing verified supplier records", counts: beforeCounts, products: currentProducts }, null, 2)}\n`);

const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(toRestore) }, token);
if (!Array.isArray(inserted) || inserted.length !== 24) throw new Error("The missing-record restoration did not insert all 24 products.");

const finalProducts = await request("/rest/v1/products?select=category,sku,price,image,tags&order=id", {}, token);
const finalCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, finalProducts.filter((product) => product.category === category).length]));
if (finalProducts.length !== 319 || Object.entries(expectedCounts).some(([category, count]) => finalCounts[category] !== count) || finalProducts.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) {
  throw new Error(`Final validation failed: ${JSON.stringify({ total: finalProducts.length, finalCounts })}. Review ${backupPath} before any correction.`);
}

console.log(JSON.stringify({ completed: true, restoredProducts: toRestore.length, finalProducts: finalProducts.length, finalCounts, backupPath }, null, 2));
