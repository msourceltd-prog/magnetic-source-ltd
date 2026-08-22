import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;
const audit = JSON.parse(await readFile(new URL("../data/clearance-collection-audit.json", import.meta.url), "utf8"));

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");
if (!Array.isArray(audit) || audit.length !== 31 || audit.some((product) => !Array.isArray(product.tags))) {
  throw new Error("The expected 31-record Clearance collection audit is unavailable.");
}

const signIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const auth = await signIn.json();
if (!signIn.ok || !auth.access_token) throw new Error(`Admin sign-in failed: ${signIn.status}`);

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${auth.access_token}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const ordered = [...audit].sort((a, b) => b.id - a.id);
const newArrivalIds = new Set(ordered.slice(0, 12).map((product) => product.id));
const backup = [];
const updated = [];

for (const product of ordered) {
  const collectionTag = newArrivalIds.has(product.id) ? "New arrival" : "Best seller";
  const tags = [collectionTag, ...product.tags.filter((tag) => !["Clearance", "New arrival", "Best seller"].includes(tag))];
  const response = await fetch(`${baseUrl}/rest/v1/products?id=eq.${product.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ tags }),
  });
  const record = await response.json();
  if (!response.ok || !Array.isArray(record) || record.length !== 1 || record[0].tags?.[0] !== collectionTag) {
    throw new Error(`Collection assignment failed for ${product.sku}: ${response.status} ${JSON.stringify(record)}`);
  }
  backup.push({ id: product.id, sku: product.sku, name: product.name, tags: product.tags });
  updated.push({ id: product.id, sku: product.sku, collection: collectionTag, tags: record[0].tags });
}

await writeFile(new URL("../data/clearance-collection-backup.json", import.meta.url), JSON.stringify({
  createdAt: new Date().toISOString(),
  instruction: "User requested the existing Clearance collection be divided into Best sellers and New arrivals while leaving all other category assignments unchanged.",
  records: backup,
}, null, 2));

console.log(JSON.stringify({
  total: updated.length,
  bestSellers: updated.filter((record) => record.collection === "Best seller").length,
  newArrivals: updated.filter((record) => record.collection === "New arrival").length,
  records: updated,
}, null, 2));
