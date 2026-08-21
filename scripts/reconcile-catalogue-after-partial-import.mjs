import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "RECONCILE_319_VERIFIED_CATALOGUE_AFTER_PARTIAL_IMPORT";
const compactSourcePath = "/home/ubuntu/harrisons-direct-source/compact-price-free-products.json";
const babySourcePath = "/home/ubuntu/harrisons-direct-source/baby-kids-price-free-products.json";
const stationerySourcePath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/stationery-party-replacement.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/catalogue-before-partial-import-reconciliation-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.CATALOGUE_RECONCILE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.CATALOGUE_RECONCILE_ADMIN_PASSWORD;
const expectedCounts = {
  "baby-kids": 40,
  clearance: 39,
  "health-beauty": 40,
  "household-pet": 40,
  "seasonal-christmas": 40,
  "stationery-party": 40,
  "sweets-snacks": 40,
  "toys-gifts": 40,
};

if (process.env.CONFIRM_CATALOGUE_RECONCILIATION !== confirmationPhrase) throw new Error("Reconciliation is locked. Set the exact owner-approved confirmation phrase only after reviewing the count plan.");
if (!adminPassword) throw new Error("CATALOGUE_RECONCILE_ADMIN_PASSWORD is required for the authenticated Admin reconciliation session.");

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

const [compactProducts, babyProducts, stationerySource] = await Promise.all([
  readFile(compactSourcePath, "utf8").then(JSON.parse),
  readFile(babySourcePath, "utf8").then(JSON.parse),
  readFile(stationerySourcePath, "utf8").then(JSON.parse),
]);
const sourceByCategory = {
  "baby-kids": babyProducts,
  clearance: compactProducts.filter((product) => product.category === "clearance"),
  "health-beauty": compactProducts.filter((product) => product.category === "health-beauty"),
  "household-pet": compactProducts.filter((product) => product.category === "household-pet"),
  "seasonal-christmas": compactProducts.filter((product) => product.category === "seasonal-christmas"),
  "stationery-party": stationerySource.products.map(({ sourceUrl, imageAssessment, sourceSku, ...product }) => product),
  "sweets-snacks": compactProducts.filter((product) => product.category === "sweets-snacks"),
  "toys-gifts": compactProducts.filter((product) => product.category === "toys-gifts"),
};
if (Object.entries(expectedCounts).some(([category, count]) => sourceByCategory[category].length !== count)) {
  throw new Error(`Supplier source category totals do not match the reconciliation plan: ${JSON.stringify(Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, sourceByCategory[category].length])))}.`);
}

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const currentProducts = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id", {}, token);
const currentSku = new Set(currentProducts.map((product) => product.sku));
const currentSlug = new Set(currentProducts.map((product) => product.slug));
const beforeCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, currentProducts.filter((product) => product.category === category).length]));
const deficits = Object.fromEntries(Object.entries(expectedCounts).map(([category, expected]) => [category, expected - beforeCounts[category]]));
if (Object.values(deficits).some((count) => count < 0)) throw new Error(`A category exceeds its approved reconciliation count: ${JSON.stringify(deficits)}. No records were changed.`);

const selected = [];
for (const category of Object.keys(expectedCounts)) {
  const candidates = sourceByCategory[category].filter((product) => !currentSku.has(product.sku));
  if (candidates.length < deficits[category]) throw new Error(`Not enough verified candidates for ${category}: need ${deficits[category]}, found ${candidates.length}.`);
  for (const product of candidates.slice(0, deficits[category])) {
    let slug = product.slug;
    if (currentSlug.has(slug) || selected.some((candidate) => candidate.slug === slug)) slug = `restored-${category}-${slug}`;
    selected.push({ ...product, slug });
  }
}
if (selected.length !== 42) throw new Error(`Expected exactly 42 reconciliation records, selected ${selected.length}. No records were changed.`);
if (new Set(selected.map((product) => product.sku)).size !== selected.length || new Set(selected.map((product) => product.slug)).size !== selected.length) throw new Error("The reconciliation selection has duplicate SKU or slug identifiers.");
if (selected.some((product) => currentSku.has(product.sku) || currentSlug.has(product.slug) || product.price !== 0 || !product.image || !product.tags?.includes("Price hidden"))) throw new Error("The reconciliation selection violates identifier, price-free, or real-image safeguards.");

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Catalogue before exact partial-import reconciliation", counts: beforeCounts, products: currentProducts, selectedRestoration: selected.map(({ image, ...product }) => product) }, null, 2)}\n`);

const insertedSkus = [];
for (const product of selected) {
  const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(product) }, token);
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].sku !== product.sku) throw new Error(`Record ${product.sku} could not be confirmed after insertion.`);
  insertedSkus.push(product.sku);
}

const finalProducts = await request("/rest/v1/products?select=category,sku,price,image,tags&order=id", {}, token);
const finalCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, finalProducts.filter((product) => product.category === category).length]));
if (finalProducts.length !== 319 || Object.entries(expectedCounts).some(([category, count]) => finalCounts[category] !== count) || finalProducts.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) {
  throw new Error(`Final reconciliation validation failed: ${JSON.stringify({ total: finalProducts.length, finalCounts })}. Review ${backupPath} before any correction.`);
}

console.log(JSON.stringify({ completed: true, restoredProducts: insertedSkus.length, finalProducts: finalProducts.length, finalCounts, backupPath }, null, 2));
