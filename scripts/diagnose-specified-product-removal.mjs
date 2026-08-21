import { readFile } from "node:fs/promises";

const backupPath = process.env.REMOVAL_BACKUP_PATH || "/home/ubuntu/magnetic-source-catalogue-backups/before-17-product-removal-2026-08-21.json";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const request = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const countByCategory = (products) => Object.fromEntries(
  [...new Set(products.map((product) => product.category))].sort().map((category) => [
    category,
    products.filter((product) => product.category === category).length,
  ]),
);

const backup = JSON.parse(await readFile(backupPath, "utf8"));
const previous = backup.fullCatalogue;
if (!Array.isArray(previous) || previous.length !== 339) throw new Error(`Backup guard failed: expected 339 records in ${backupPath}.`);

const live = await request("/rest/v1/products?select=id,slug,name,category,sku,price,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
const liveIds = new Set(live.map((product) => product.id));
const removedTargetNames = new Set(backup.removalTargets.map((target) => `${target.category}:${target.name.normalize("NFKC").replace(/[\u2018\u2019\u02BC]/g, "'").toLowerCase()}`));
const normalize = (value) => value.normalize("NFKC").replace(/[\u2018\u2019\u02BC]/g, "'").toLowerCase();
const missing = previous.filter((product) => !liveIds.has(product.id)).map((product) => ({
  ...product,
  isRemovalTarget: removedTargetNames.has(`${product.category}:${normalize(product.name)}`),
}));

console.log(JSON.stringify({
  backupPath,
  backupTotal: previous.length,
  liveTotal: live.length,
  backupCounts: countByCategory(previous),
  liveCounts: countByCategory(live),
  missingCount: missing.length,
  missing,
  nonTargetMissing: missing.filter((product) => !product.isRemovalTarget),
}, null, 2));
