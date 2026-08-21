import { readFile, mkdir, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const originalBackupPath = `${backupDirectory}/before-all-product-category-migration-2026-08-21.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.CATEGORY_RESTORE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.CATEGORY_RESTORE_ADMIN_PASSWORD;
const confirmationPhrase = "RESTORE_PRE_MIGRATION_CATEGORIES";
const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

if (process.env.CONFIRM_CATEGORY_RESTORE !== confirmationPhrase) throw new Error("Confirmation phrase required. No category was changed.");
if (!adminPassword) throw new Error("CATEGORY_RESTORE_ADMIN_PASSWORD is required.");
const original = JSON.parse(await readFile(originalBackupPath, "utf8"));
const current = await request("/rest/v1/products?select=*&order=id", {});
if (!Array.isArray(original.products) || original.products.length !== 411 || current.length !== 411) throw new Error(`Expected 411 products in both backup and current catalogue; backup=${original.products?.length}, current=${current.length}.`);
const originalBySku = new Map(original.products.map((product) => [product.sku, product]));
const currentSkus = new Set(current.map((product) => product.sku));
const missing = original.products.filter((product) => !currentSkus.has(product.sku));
const unexpected = current.filter((product) => !originalBySku.has(product.sku));
if (missing.length || unexpected.length) throw new Error(`Catalogue SKU mismatch; missing=${missing.length}, unexpected=${unexpected.length}. No category was changed.`);
const changed = current.filter((product) => originalBySku.get(product.sku).category !== product.category);
await mkdir(backupDirectory, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const currentBackupPath = `${backupDirectory}/before-pre-migration-category-restore-${stamp}.json`;
await writeFile(currentBackupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Current 411-product catalogue before owner-approved category-only restoration", products: current }, null, 2)}\n`);
const restoredAssignments = changed.map((product) => ({ sku: product.sku, from: product.category, to: originalBySku.get(product.sku).category }));
if (process.env.DRY_RUN === "1") {
  console.log(JSON.stringify({ dryRun: true, changedCount: changed.length, totalProducts: current.length, currentBackupPath, restoredAssignments }, null, 2));
  process.exit(0);
}
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login.access_token) throw new Error("Admin authentication failed.");
for (const product of changed) {
  const restored = originalBySku.get(product.sku);
  const updated = await request(`/rest/v1/products?sku=eq.${encodeURIComponent(product.sku)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ category: restored.category }) }, login.access_token);
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0].category !== restored.category) throw new Error(`Could not restore category for ${product.sku}. Current backup: ${currentBackupPath}`);
}
const after = await request("/rest/v1/products?select=sku,category", {});
const mismatches = after.filter((product) => originalBySku.get(product.sku).category !== product.category);
if (after.length !== 411 || mismatches.length) throw new Error(`Post-restore validation failed; total=${after.length}, mismatches=${mismatches.length}. Current backup: ${currentBackupPath}`);
const counts = Object.fromEntries([...new Set(after.map((product) => product.category))].sort().map((category) => [category, after.filter((product) => product.category === category).length]));
console.log(JSON.stringify({ restoredCount: changed.length, totalProducts: after.length, currentBackupPath, originalBackupPath, counts }, null, 2));
