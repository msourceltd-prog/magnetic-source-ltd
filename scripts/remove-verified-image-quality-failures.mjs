import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "REMOVE_89_VERIFIED_IMAGE_QUALITY_FAILURES";
const candidatesPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/verified-image-quality-removal-candidates.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/before-89-image-quality-removals-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.IMAGE_AUDIT_REMOVE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.IMAGE_AUDIT_REMOVE_ADMIN_PASSWORD;
const expectedBefore = { "baby-kids": 54, clearance: 38, "seasonal-christmas": 37, "stationery-party": 54, "toys-gifts": 54, "health-beauty": 64, "household-pet": 55, "sweets-snacks": 55 };
const expectedAfter = { "baby-kids": 45, clearance: 23, "seasonal-christmas": 37, "stationery-party": 50, "toys-gifts": 52, "health-beauty": 46, "household-pet": 40, "sweets-snacks": 29 };
if (process.env.CONFIRM_IMAGE_AUDIT_REMOVAL !== confirmationPhrase) throw new Error("Image-quality removal is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("IMAGE_AUDIT_REMOVE_ADMIN_PASSWORD is required for the authenticated removal session.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
const countByCategory = (products) => Object.fromEntries(Object.keys(expectedBefore).map((category) => [category, products.filter((product) => product.category === category).length]));
const sameCounts = (actual, expected) => Object.keys(expected).every((category) => actual[category] === expected[category]);
const source = JSON.parse(await readFile(candidatesPath, "utf8"));
const candidateSkus = source.products.map((product) => product.sku);
if (source.totalCandidates !== 89 || candidateSkus.length !== 89 || new Set(candidateSkus).size !== 89) throw new Error("The verified removal dataset must contain exactly 89 unique SKUs.");
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const currentCounts = countByCategory(current);
if (current.length !== 411 || !sameCounts(currentCounts, expectedBefore)) throw new Error(`Unexpected pre-removal catalogue state: total ${current.length}; counts ${JSON.stringify(currentCounts)}. No records were changed.`);
const currentBySku = new Map(current.map((product) => [product.sku, product]));
const missingCandidates = candidateSkus.filter((sku) => !currentBySku.has(sku));
if (missingCandidates.length) throw new Error(`A verified removal candidate is no longer live: ${JSON.stringify(missingCandidates)}. No records were changed.`);
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 411-product catalogue before owner-approved permanent removal of 89 manually reviewed image-quality failures", products: current, removalCandidates: source.products }, null, 2)}\n`);
const deleted = [];
for (const sku of candidateSkus) {
  const target = currentBySku.get(sku);
  const result = await request(`/rest/v1/products?id=eq.${encodeURIComponent(target.id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } }, token);
  if (!Array.isArray(result) || result.length !== 1 || result[0].sku !== sku) throw new Error(`Deletion of ${sku} could not be confirmed. Review ${backupPath}; do not retry without checking the backup.`);
  deleted.push(sku);
}
const finalProducts = await request("/rest/v1/products?select=id,slug,name,category,price,sku,image,tags&order=id");
const finalCounts = countByCategory(finalProducts);
const stillPresent = candidateSkus.filter((sku) => finalProducts.some((product) => product.sku === sku));
if (finalProducts.length !== 322 || !sameCounts(finalCounts, expectedAfter) || stillPresent.length) throw new Error(`Final image-quality removal validation failed: ${JSON.stringify({ total: finalProducts.length, counts: finalCounts, stillPresent, backupPath })}`);
console.log(JSON.stringify({ completed: true, removedProducts: deleted.length, categoryCounts: finalCounts, totalProducts: finalProducts.length, backupPath }, null, 2));
