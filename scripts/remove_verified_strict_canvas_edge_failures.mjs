import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "REMOVE_67_STRICT_CANVAS_EDGE_FAILURES";
const candidatesPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/verified-strict-canvas-edge-removals.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/before-67-strict-canvas-edge-removals-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.STRICT_EDGE_REMOVE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.STRICT_EDGE_REMOVE_ADMIN_PASSWORD;
const expectedBefore = { "baby-kids": 45, clearance: 23, "seasonal-christmas": 37, "stationery-party": 50, "toys-gifts": 52, "health-beauty": 46, "household-pet": 40, "sweets-snacks": 29 };
const expectedAfter = { "baby-kids": 33, clearance: 23, "seasonal-christmas": 33, "stationery-party": 38, "toys-gifts": 39, "health-beauty": 37, "household-pet": 35, "sweets-snacks": 17 };

if (process.env.CONFIRM_STRICT_EDGE_REMOVAL !== confirmationPhrase) throw new Error("Strict canvas-edge removal is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("STRICT_EDGE_REMOVE_ADMIN_PASSWORD is required for the authenticated removal session.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
const counts = (products, expectation) => Object.fromEntries(Object.keys(expectation).map((category) => [category, products.filter((product) => product.category === category).length]));
const matches = (actual, expected) => Object.keys(expected).every((category) => actual[category] === expected[category]);
const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
const candidateSkus = candidates.products.map((product) => product.sku);
if (candidates.totalCandidates !== 67 || candidateSkus.length !== 67 || new Set(candidateSkus).size !== 67) throw new Error("The strict removal dataset must contain exactly 67 unique candidates.");
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const currentCounts = counts(current, expectedBefore);
const bySku = new Map(current.map((product) => [product.sku, product]));
const missing = candidateSkus.filter((sku) => !bySku.has(sku));
if (current.length !== 322 || !matches(currentCounts, expectedBefore) || missing.length) throw new Error(`Unexpected pre-removal state: ${JSON.stringify({ total: current.length, currentCounts, missing })}. No records were changed.`);
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 322-product catalogue before owner-approved strict four-sided canvas-edge removal", products: current, removalCandidates: candidates.products }, null, 2)}\n`);
const deleted = [];
for (const sku of candidateSkus) {
  const target = bySku.get(sku);
  const result = await request(`/rest/v1/products?id=eq.${encodeURIComponent(target.id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } }, token);
  if (!Array.isArray(result) || result.length !== 1 || result[0].sku !== sku) throw new Error(`Deletion could not be confirmed for ${sku}. Review ${backupPath}; do not retry before checking the backup.`);
  deleted.push(sku);
}
const finalProducts = await request("/rest/v1/products?select=id,slug,name,category,price,sku,image,tags&order=id");
const finalCounts = counts(finalProducts, expectedAfter);
const stillPresent = candidateSkus.filter((sku) => finalProducts.some((product) => product.sku === sku));
if (finalProducts.length !== 255 || !matches(finalCounts, expectedAfter) || stillPresent.length) throw new Error(`Strict edge removal validation failed: ${JSON.stringify({ total: finalProducts.length, finalCounts, stillPresent, backupPath })}`);
console.log(JSON.stringify({ completed: true, removedProducts: deleted.length, categoryCounts: finalCounts, totalProducts: finalProducts.length, backupPath }, null, 2));
