import { mkdir, readFile, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const preflightPath = `${projectRoot}/data/additional-six-removal-preflight.json`;
const registryPath = `${projectRoot}/data/permanent-deletion-registry.json`;
const reportPath = `${projectRoot}/data/additional-six-removal-report.json`;
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.PERMANENT_DELETE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.PERMANENT_DELETE_ADMIN_PASSWORD;
const confirmationPhrase = "PERMANENTLY_DELETE_ADDITIONAL_SIX";
const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
const ownStoragePath = (url) => {
  const prefix = `${supabaseUrl}/storage/v1/object/public/product-images/`;
  return url?.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length).split("?")[0]) : null;
};
if (process.env.CONFIRM_ADDITIONAL_SIX_DELETE !== confirmationPhrase) throw new Error("Confirmation phrase required. No product was deleted.");
if (!adminPassword) throw new Error("PERMANENT_DELETE_ADMIN_PASSWORD is required.");
const [preflight, current, registry] = await Promise.all([
  JSON.parse(await readFile(preflightPath, "utf8")),
  request("/rest/v1/products?select=*&order=id"),
  JSON.parse(await readFile(registryPath, "utf8")),
]);
const targets = preflight.resolved.map((entry) => entry.product);
if (preflight.missing.length || preflight.ambiguous.length || targets.length !== 6) throw new Error("Preflight must contain exactly six unique verified products and no unresolved entries.");
if (current.length !== 321) throw new Error(`Baseline guard failed: expected 321 products, found ${current.length}.`);
const currentById = new Map(current.map((product) => [product.id, product]));
const mismatches = targets.filter((target) => { const live = currentById.get(target.id); return !live || live.sku !== target.sku || live.name !== target.name; });
if (mismatches.length) throw new Error(`Exact target validation failed for ${mismatches.length} record(s). No product was deleted.`);
await mkdir(backupDirectory, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const backupPath = `${backupDirectory}/before-additional-six-removal-${stamp}.json`;
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 321-product catalogue before six owner-requested permanent removals", products: current, targets }, null, 2)}\n`);
if (process.env.DRY_RUN === "1") { console.log(JSON.stringify({ dryRun: true, targetCount: targets.length, backupPath, targets: targets.map((product) => ({ id: product.id, sku: product.sku, name: product.name })) }, null, 2)); process.exit(0); }
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed.");
const ids = targets.map((target) => target.id);
const deleted = await request(`/rest/v1/products?id=in.(${ids.join(",")})`, { method: "DELETE", headers: { Prefer: "return=representation" } }, login.access_token);
if (!Array.isArray(deleted) || deleted.length !== targets.length) throw new Error(`Database deletion did not return all targets: expected=${targets.length}, returned=${Array.isArray(deleted) ? deleted.length : 0}. Review ${backupPath}.`);
const after = await request("/rest/v1/products?select=id,sku,name,slug,category,image&order=id");
if (after.length !== 315 || after.some((product) => ids.includes(product.id))) throw new Error(`Post-delete validation failed: total=${after.length}. Review ${backupPath}.`);
const imageCounts = new Map();
for (const product of after) imageCounts.set(product.image, (imageCounts.get(product.image) || 0) + 1);
const exclusiveOwnedPaths = targets.map((target) => ownStoragePath(target.image)).filter((path) => path && !imageCounts.get(`${supabaseUrl}/storage/v1/object/public/product-images/${path}`));
let removedOwnedFiles = [];
if (exclusiveOwnedPaths.length) removedOwnedFiles = await request("/storage/v1/object/product-images", { method: "DELETE", body: JSON.stringify({ prefixes: exclusiveOwnedPaths }) }, login.access_token) || exclusiveOwnedPaths;
const existingEntries = Array.isArray(registry.entries) ? registry.entries : [];
const existingSkus = new Set(existingEntries.map((entry) => entry.sku));
const now = new Date().toISOString();
const entries = [...existingEntries, ...targets.filter((target) => !existingSkus.has(target.sku)).map((target) => ({ id: target.id, sku: target.sku, name: target.name, slug: target.slug, deletedAt: now, reason: "Owner-specified additional six permanent removal" }))];
await writeFile(registryPath, `${JSON.stringify({ updatedAt: now, entries }, null, 2)}\n`);
const report = { completedAt: now, deletedCount: deleted.length, beforeTotal: current.length, afterTotal: after.length, backupPath, removedOwnedFiles, deleted: deleted.map((product) => ({ id: product.id, sku: product.sku, name: product.name, category: product.category, slug: product.slug })) };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
