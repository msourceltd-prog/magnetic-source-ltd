import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "RESTORE_PHYSICAL_CATALOGUE_TO_319";
const compactSourcePath = "/home/ubuntu/harrisons-direct-source/compact-price-free-products.json";
const babySourcePath = "/home/ubuntu/harrisons-direct-source/baby-kids-price-free-products.json";
const stationerySourcePath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/stationery-party-replacement.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/catalogue-before-physical-319-restoration-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.PHYSICAL_RESTORE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.PHYSICAL_RESTORE_ADMIN_PASSWORD;
const expectedCounts = { "baby-kids": 40, clearance: 39, "health-beauty": 40, "household-pet": 40, "seasonal-christmas": 40, "stationery-party": 40, "sweets-snacks": 40, "toys-gifts": 40 };

if (process.env.CONFIRM_PHYSICAL_CATALOGUE_RESTORATION !== confirmationPhrase) throw new Error("Physical catalogue restoration is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("PHYSICAL_RESTORE_ADMIN_PASSWORD is required for the authenticated restore session.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
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
  "stationery-party": stationerySource.products.map(({ sourceUrl, sourceSku, imageAssessment, ...product }) => product),
  "sweets-snacks": compactProducts.filter((product) => product.category === "sweets-snacks"),
  "toys-gifts": compactProducts.filter((product) => product.category === "toys-gifts"),
};
if (Object.entries(expectedCounts).some(([category, expected]) => sourceByCategory[category].length < expected)) throw new Error("Verified supplier source does not cover every required category count.");

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const beforeCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, current.filter((product) => product.category === category).length]));
const deficits = Object.fromEntries(Object.entries(expectedCounts).map(([category, expected]) => [category, expected - beforeCounts[category]]));
if (current.length !== 254 || Object.values(deficits).some((value) => value < 0)) throw new Error(`Expected 254 products and non-negative deficits, found ${current.length}: ${JSON.stringify(deficits)}.`);
const currentSkus = new Set(current.map((product) => product.sku));
const currentNames = new Set(current.map((product) => product.name));
const currentSlugs = new Set(current.map((product) => product.slug));
const selected = [];
for (const category of Object.keys(expectedCounts)) {
  const candidates = sourceByCategory[category].filter((product) => !currentSkus.has(product.sku) && !currentNames.has(product.name));
  if (candidates.length < deficits[category]) throw new Error(`Not enough verified candidates for ${category}: need ${deficits[category]}, have ${candidates.length}.`);
  for (const candidate of candidates.slice(0, deficits[category])) {
    const slug = currentSlugs.has(candidate.slug) || selected.some((product) => product.slug === candidate.slug) ? `restored-${category}-${candidate.slug}` : candidate.slug;
    selected.push({ ...candidate, slug });
  }
}
if (selected.length !== 65 || new Set(selected.map((product) => product.sku)).size !== selected.length || new Set(selected.map((product) => product.slug)).size !== selected.length) throw new Error(`Invalid exact restoration selection: ${selected.length} products.`);
if (selected.some((product) => product.price !== 0 || !product.image || !product.tags?.includes("Price hidden"))) throw new Error("A selected record violates price-free or real-image rules.");

await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Physical 254-product catalogue before exact restoration", counts: beforeCounts, products: current, selectedRestoration: selected.map(({ image, ...product }) => product) }, null, 2)}\n`);
const insertedSkus = [];
for (const product of selected) {
  const inserted = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(product) }, token);
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].sku !== product.sku) throw new Error(`Could not confirm ${product.sku} after insertion.`);
  insertedSkus.push(product.sku);
}
const final = await request("/rest/v1/products?select=category,price,image,tags,sku&order=id");
const finalCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, final.filter((product) => product.category === category).length]));
if (final.length !== 319 || Object.entries(expectedCounts).some(([category, expected]) => finalCounts[category] !== expected) || final.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) throw new Error(`Final physical restoration validation failed: ${JSON.stringify({ total: final.length, finalCounts })}. Review ${backupPath}.`);
console.log(JSON.stringify({ completed: true, restoredProducts: insertedSkus.length, totalProducts: final.length, finalCounts, backupPath }, null, 2));
