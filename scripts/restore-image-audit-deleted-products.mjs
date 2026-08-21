import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "RESTORE_ALL_IMAGE_AUDIT_PRODUCTS";
const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const backupsRoot = "/home/ubuntu/magnetic-source-catalogue-backups";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.RESTORE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.RESTORE_ADMIN_PASSWORD;
const backupPath = `${backupsRoot}/before-image-audit-product-restoration-2026-08-21.json`;
const reportPath = `${projectRoot}/data/image-audit-product-restoration-report.json`;
const firstAuditPath = `${projectRoot}/data/verified-image-quality-removal-candidates.json`;
const strictAuditPath = `${projectRoot}/data/verified-strict-canvas-edge-removals.json`;
const sourceBackupPath = `${backupsRoot}/before-89-image-quality-removals-2026-08-21.json`;
const permanentDeletionRegistryPath = `${projectRoot}/data/permanent-deletion-registry.json`;

const explicitlyRemoved = new Set([
  "tidyz degradable nappy bags pocket pack 4 x 25’s",
  "bic matic fun pencils 3’s",
  "christmas 4m roll wrap nordic noel",
  "christmas 4m roll wrap midnight blue",
  "christmas window clings baubles",
  "glitter shakers 4 pack",
  "staedtler peppa pig wax crayons 6 assorted colours",
  "wilkinson sword duplo disposable razor male 5’s",
  "wilkinson sword duplo disposable razor beauty women 5’s",
  "chupa chups watermelon/peach lip balm",
  "chupa chups strawberry bath & shower gel 300ml",
  "chupa chups cola bath & shower gel 300ml",
  "chupa chups apple bath & shower gel 400ml",
  "chupa chups watermelon bubble bath 500ml",
  "chupa chups tutti frutti body spray 150ml",
  "umbro roll-on anti-perspirant deo defiant 50ml",
  "umbro bodywash action 400ml",
  "chupa chups cherry body spray 150ml",
].map((name) => name.toLowerCase()));

if (process.env.CONFIRM_RESTORE_IMAGE_AUDIT_PRODUCTS !== confirmationPhrase) throw new Error("Restoration is locked. Set the exact owner-approved confirmation phrase to continue.");
if (!adminPassword) throw new Error("RESTORE_ADMIN_PASSWORD is required for authenticated restoration.");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const [firstAudit, strictAudit, sourceBackup, permanentDeletionRegistry] = await Promise.all([firstAuditPath, strictAuditPath, sourceBackupPath, permanentDeletionRegistryPath].map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const candidateSkus = [...new Set([...firstAudit.products, ...strictAudit.products].map((product) => product.sku))];
if (candidateSkus.length !== 156) throw new Error(`Expected 156 unique image-audit restoration candidates, found ${candidateSkus.length}.`);
const sourceBySku = new Map(sourceBackup.products.map((product) => [product.sku, product]));
const restoreProducts = candidateSkus.map((sku) => sourceBySku.get(sku)).filter(Boolean);
if (restoreProducts.length !== 156) throw new Error(`The pre-audit backup is missing ${candidateSkus.length - restoreProducts.length} restoration records.`);
const permanentlyDeletedSkus = new Set((permanentDeletionRegistry.entries || []).map((entry) => entry.sku));
const protectedMatches = restoreProducts.filter((product) => explicitlyRemoved.has(product.name.toLowerCase()) || permanentlyDeletedSkus.has(product.sku));
if (protectedMatches.length) throw new Error(`A protected owner-requested deletion was found in the restoration set: ${protectedMatches.map((product) => product.name).join(", ")}`);
const payload = restoreProducts.map((product) => ({ slug: product.slug, name: product.name, category: product.category, price: product.price, sku: product.sku, availability: product.availability, pack: product.pack, description: /\bis supplied in a pack of\b/i.test(product.description || "") ? "" : (product.description || ""), image: product.image, tags: product.tags, featured: product.featured }));

const liveProducts = await request("/rest/v1/products?select=id,slug,name,sku,description&order=id");
const liveSkus = new Set(liveProducts.map((product) => product.sku));
const liveSlugs = new Set(liveProducts.map((product) => product.slug));
const liveNames = new Set(liveProducts.map((product) => product.name));
const conflicts = payload.filter((product) => liveSkus.has(product.sku) || liveSlugs.has(product.slug) || liveNames.has(product.name));
if (conflicts.length) throw new Error(`Restoration collision guard blocked ${conflicts.length} existing record(s): ${conflicts.map((product) => product.sku).join(", ")}`);
if (liveProducts.length !== 255) throw new Error(`Baseline guard failed: expected 255 live products, found ${liveProducts.length}.`);

const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; no records were restored.");
await mkdir(backupsRoot, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Current 255-product catalogue before restoring all products deleted exclusively by image audits", products: liveProducts }, null, 2)}\n`);
const restored = [];
for (let index = 0; index < payload.length; index += 24) {
  const batch = payload.slice(index, index + 24);
  const result = await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(batch) }, login.access_token);
  if (!Array.isArray(result) || result.length !== batch.length) throw new Error(`Restoration batch ${index / 24 + 1} did not return every expected record; review ${backupPath}.`);
  restored.push(...result.map((product) => ({ id: product.id, sku: product.sku, name: product.name, category: product.category })));
}
const finalProducts = await request("/rest/v1/products?select=id,slug,name,category,sku,description&order=id");
const finalSkus = new Set(finalProducts.map((product) => product.sku));
const missing = candidateSkus.filter((sku) => !finalSkus.has(sku));
const reintroducedExplicitRemoval = finalProducts.filter((product) => explicitlyRemoved.has(product.name.toLowerCase()));
const generatedDescriptions = finalProducts.filter((product) => /\bis supplied in a pack of\b/i.test(product.description || ""));
if (finalProducts.length !== 411 || missing.length || reintroducedExplicitRemoval.length || generatedDescriptions.length) throw new Error(`Post-restoration validation failed: total=${finalProducts.length}, missing=${missing.length}, protected=${reintroducedExplicitRemoval.length}, generatedDescriptions=${generatedDescriptions.length}. Review ${backupPath}.`);
const categoryCounts = Object.fromEntries([...new Set(finalProducts.map((product) => product.category))].sort().map((category) => [category, finalProducts.filter((product) => product.category === category).length]));
const report = { completedAt: new Date().toISOString(), baselineCount: liveProducts.length, restoredCount: restored.length, finalCount: finalProducts.length, categoryCounts, backupPath, explicitOwnerRemovalsPreserved: true, generatedDescriptionRows: generatedDescriptions.length, restored };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
