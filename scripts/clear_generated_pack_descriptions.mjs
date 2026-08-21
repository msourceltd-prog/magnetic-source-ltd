import { mkdir, writeFile } from "node:fs/promises";

const confirmationPhrase = "CLEAR_GENERATED_PACK_DESCRIPTIONS";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.DESCRIPTION_CLEANUP_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.DESCRIPTION_CLEANUP_ADMIN_PASSWORD;
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const backupPath = `${backupDirectory}/before-generated-description-cleanup-2026-08-21.json`;
const reportPath = "data/generated-description-cleanup-report.json";

if (process.env.CONFIRM_DESCRIPTION_CLEANUP !== confirmationPhrase) throw new Error("Description cleanup is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("DESCRIPTION_CLEANUP_ADMIN_PASSWORD is required for authenticated updates.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const products = await request("/rest/v1/products?select=id,sku,name,description,pack,category,image,slug,price,tags&order=id");
const generated = products.filter((product) => typeof product.description === "string" && /\bis supplied in a pack of\b/i.test(product.description));
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), rule: "Only descriptions containing the generated phrase 'is supplied in a pack of' are cleared to a blank value because the live column is NOT NULL.", affectedProducts: generated }, null, 2)}\n`);
const updated = [];
for (const product of generated) {
  const result = await request(`/rest/v1/products?id=eq.${encodeURIComponent(product.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ description: "" }) }, login.access_token);
  if (!Array.isArray(result) || result.length !== 1 || result[0].id !== product.id || result[0].description !== "") throw new Error(`Description cleanup could not be confirmed for ${product.sku}; review ${backupPath}.`);
  updated.push({ id: product.id, sku: product.sku, name: product.name });
}
const finalProducts = await request("/rest/v1/products?select=id,sku,name,description&order=id");
const remainingGenerated = finalProducts.filter((product) => typeof product.description === "string" && /\bis supplied in a pack of\b/i.test(product.description));
if (remainingGenerated.length) throw new Error(`Generated descriptions remain after cleanup: ${remainingGenerated.map((product) => product.sku).join(", ")}`);
const report = { completedAt: new Date().toISOString(), totalProducts: products.length, rowsUpdated: updated.length, storageValue: "", note: "The live description column is NOT NULL, so empty descriptions are stored as blank values. The public application treats blank and null descriptions identically.", backupPath, updated, remainingGeneratedRows: remainingGenerated.length };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
