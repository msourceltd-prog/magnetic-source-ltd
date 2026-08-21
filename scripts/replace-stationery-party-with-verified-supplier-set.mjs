import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "REPLACE_STATIONERY_PARTY_WITH_40_VERIFIED_SUPPLIER_PRODUCTS";
const dataPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/stationery-party-replacement.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/stationery-party-before-verified-supplier-set-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.STATIONERY_IMPORT_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.STATIONERY_IMPORT_ADMIN_PASSWORD;

if (process.env.CONFIRM_STATIONERY_PARTY_REPLACEMENT !== confirmationPhrase) {
  throw new Error("Replacement is locked. Set the exact confirmation phrase only for this owner-approved category replacement.");
}
if (!adminPassword) throw new Error("STATIONERY_IMPORT_ADMIN_PASSWORD is required for the authenticated Admin import session.");

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
const replacementProducts = source.products.map(({ sourceUrl, imageAssessment, sourceSku, ...product }) => product);
if (replacementProducts.length !== 40 || replacementProducts.some((product) => product.category !== "stationery-party" || product.price !== 0 || !product.image || !product.tags.includes("Price hidden"))) {
  throw new Error("Replacement dataset violates the required product count, price-free, category, tag, or image policy.");
}
if (new Set(replacementProducts.map((product) => product.slug)).size !== 40 || new Set(replacementProducts.map((product) => product.sku)).size !== 40) {
  throw new Error("Replacement product slugs and SKUs must be unique.");
}

const login = await request("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
if (!login?.access_token) throw new Error("Admin authentication failed; no import changes were made.");
const token = login.access_token;

const [oldProducts, allProducts] = await Promise.all([
  request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&category=eq.stationery-party&order=id", {}, token),
  request("/rest/v1/products?select=id,slug,sku,category&order=id", {}, token),
]);
if (oldProducts.length !== 37) throw new Error(`Expected 37 current Stationery & Party products, found ${oldProducts.length}. No change made.`);

const oldProductIds = new Set(oldProducts.map((product) => product.id));
const nonTargetProducts = allProducts.filter((product) => !oldProductIds.has(product.id) && product.category !== "stationery-party");
const occupiedSlugs = new Set(nonTargetProducts.map((product) => product.slug));
const occupiedSkus = new Set(nonTargetProducts.map((product) => product.sku));
const collisions = replacementProducts.filter((product) => occupiedSlugs.has(product.slug) || occupiedSkus.has(product.sku));
if (collisions.length) throw new Error(`Replacement identifier collision: ${collisions.map((product) => product.sku).join(", ")}. No change made.`);

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Current live Stationery & Party products before owner-approved verified supplier replacement", products: oldProducts }, null, 2)}\n`);

const inserted = await request("/rest/v1/products", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify(replacementProducts),
}, token);
if (!Array.isArray(inserted) || inserted.length !== 40) throw new Error("New supplier products could not be inserted completely; old products remain unchanged.");

const currentCategoryProducts = await request("/rest/v1/products?select=id,slug,sku,category,price,image,tags&category=eq.stationery-party&order=id", {}, token);
const replacementSkus = new Set(replacementProducts.map((product) => product.sku));
const imported = currentCategoryProducts.filter((product) => replacementSkus.has(product.sku));
if (imported.length !== 40 || imported.some((product) => product.category !== "stationery-party" || Number(product.price) !== 0 || !product.image || !product.tags.includes("Price hidden"))) {
  throw new Error("Inserted supplier products failed validation. Old Stationery & Party products were not deleted.");
}

const oldIds = oldProducts.map((product) => product.id).join(",");
await request(`/rest/v1/products?id=in.(${oldIds})`, { method: "DELETE" }, token);

const finalProducts = await request("/rest/v1/products?select=slug,sku,category,price,image,tags&category=eq.stationery-party", {}, token);
if (finalProducts.length !== 40 || finalProducts.some((product) => !replacementSkus.has(product.sku) || product.category !== "stationery-party" || Number(product.price) !== 0 || !product.image || !product.tags.includes("Price hidden"))) {
  throw new Error("Final Stationery & Party validation failed after replacement. Review the recorded backup before any correction.");
}

console.log(JSON.stringify({
  completed: true,
  replacedCategory: "stationery-party",
  removedProducts: oldProducts.length,
  importedProducts: finalProducts.length,
  backupPath,
  preserved: ["categories", "profiles", "auth.users", "demo_orders", "demo_order_items", "product-images storage"],
}, null, 2));
