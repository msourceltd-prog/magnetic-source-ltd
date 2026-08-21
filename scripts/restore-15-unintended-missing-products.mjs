import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "RESTORE_15_UNINTENDED_MISSING_PRODUCTS";
const discrepancyPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/current-catalogue-discrepancy.json";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.UNINTENDED_MISSING_RESTORE_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.UNINTENDED_MISSING_RESTORE_ADMIN_PASSWORD;
const expectedCountsBefore = {
  "baby-kids": 36,
  clearance: 35,
  "health-beauty": 47,
  "household-pet": 36,
  "seasonal-christmas": 35,
  "stationery-party": 38,
  "sweets-snacks": 40,
  "toys-gifts": 39,
};
const expectedCountsAfter = {
  "baby-kids": 39,
  clearance: 38,
  "health-beauty": 49,
  "household-pet": 40,
  "seasonal-christmas": 37,
  "stationery-party": 39,
  "sweets-snacks": 40,
  "toys-gifts": 39,
};

if (process.env.CONFIRM_RESTORE_15_UNINTENDED_MISSING_PRODUCTS !== confirmationPhrase) {
  throw new Error("Restoration is locked. Set the exact recovery confirmation phrase only after reviewing the missing-record report.");
}
if (!adminPassword) throw new Error("UNINTENDED_MISSING_RESTORE_ADMIN_PASSWORD is required for the authenticated Admin restore session.");

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
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const countByCategory = (products, expected) => Object.fromEntries(Object.keys(expected).map((category) => [
  category,
  products.filter((product) => product.category === category).length,
]));

const assertCounts = (counts, expected, stage) => {
  const mismatches = Object.entries(expected).filter(([category, count]) => counts[category] !== count);
  if (mismatches.length) throw new Error(`${stage} count guard failed: ${mismatches.map(([category, count]) => `${category} expected ${count}, found ${counts[category]}`).join("; ")}.`);
};

const discrepancy = JSON.parse(await readFile(discrepancyPath, "utf8"));
const toRestore = discrepancy.nonTargetMissing;
if (!Array.isArray(toRestore) || toRestore.length !== 15 || toRestore.some((product) => product.isRemovalTarget)) {
  throw new Error("Recovery input guard failed: expected exactly 15 non-target records from the saved discrepancy report.");
}

const login = await request("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");

const token = login.access_token;
const current = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id", {}, token);
if (current.length !== 306) throw new Error(`Pre-restoration total guard failed: expected 306 products, found ${current.length}. No records were changed.`);
assertCounts(countByCategory(current, expectedCountsBefore), expectedCountsBefore, "Pre-restoration");

const existingSlugs = new Set(current.map((product) => product.slug));
const existingSkus = new Set(current.map((product) => product.sku));
const existingNames = new Set(current.map((product) => product.name));
if (toRestore.some((product) => existingSlugs.has(product.slug) || existingSkus.has(product.sku) || existingNames.has(product.name))) {
  throw new Error("Recovery collision guard failed: at least one intended record is already present. No records were changed.");
}
if (toRestore.some((product) => Number(product.price) !== 0 || !product.image || !product.tags?.includes("Price hidden"))) {
  throw new Error("Recovery data guard failed: a record violates the existing price-free, image, or tag policy.");
}

const dateStamp = new Date().toISOString().slice(0, 10);
const backupPath = `${backupDirectory}/before-15-unintended-missing-products-restoration-${dateStamp}.json`;
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({
  backedUpAt: new Date().toISOString(),
  source: "Current 306-product catalogue before restoring 15 confirmed non-target records from the pre-removal backup",
  counts: countByCategory(current, expectedCountsBefore),
  products: current,
  restoring: toRestore,
}, null, 2)}\n`);

const insertable = toRestore.map(({ id, created_at, updated_at, isRemovalTarget, ...product }) => product);
const inserted = await request("/rest/v1/products", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify(insertable),
}, token);
if (!Array.isArray(inserted) || inserted.length !== 15 || new Set(inserted.map((product) => product.sku)).size !== 15) {
  throw new Error(`Restoration response guard failed. Review ${backupPath} before taking any recovery action.`);
}

const finalProducts = await request("/rest/v1/products?select=slug,name,category,sku,price,image,tags&order=id", {}, token);
if (finalProducts.length !== 321) throw new Error(`Post-restoration total validation failed: expected 321 products, found ${finalProducts.length}. Review ${backupPath}.`);
assertCounts(countByCategory(finalProducts, expectedCountsAfter), expectedCountsAfter, "Post-restoration");
if (insertable.some((product) => !finalProducts.some((currentProduct) => currentProduct.sku === product.sku))) {
  throw new Error(`Post-restoration presence validation failed. Review ${backupPath}.`);
}

console.log(JSON.stringify({
  completed: true,
  restoredCount: inserted.length,
  restoredProducts: inserted.map(({ category, name, sku }) => ({ category, name, sku })),
  totalProducts: finalProducts.length,
  categoryCounts: countByCategory(finalProducts, expectedCountsAfter),
  backupPath,
}, null, 2));
