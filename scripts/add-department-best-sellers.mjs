import { writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;

const selections = {
  "household-pet": ["72736Z", "72619U", "72568M", "HPE-72404S", "72624K"],
  "sweets-snacks": ["67242U", "67241R", "9838V", "SWE-6388I", "72535O"],
  "toys-gifts": ["39638L", "73164Q", "73165T", "72989P", "72749N"],
  "stationery-party": ["STP-39594Z", "STP-49719Q", "STP-4148U", "STP-65367L", "STP-39602E"],
  "health-beauty": ["73097K", "73096H", "73086C", "72754D", "HBT-551W"],
  "seasonal-christmas": ["73202K", "69932D", "22804U", "22803R", "22800I"],
  "baby-kids": ["72591G", "70408S", "69108A", "64355U", "3738H"],
};

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");
if (Object.values(selections).some((skus) => skus.length !== 5)) throw new Error("Each department must contain exactly five selected SKUs.");

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

const backup = [];
const updated = [];

for (const [department, skus] of Object.entries(selections)) {
  for (const sku of skus) {
    const readResponse = await fetch(`${baseUrl}/rest/v1/products?select=id,sku,name,category,tags&sku=eq.${encodeURIComponent(sku)}`, { headers });
    const records = await readResponse.json();
    if (!readResponse.ok || !Array.isArray(records) || records.length !== 1) throw new Error(`Unable to read ${sku}: ${readResponse.status}`);
    const product = records[0];
    if (product.category !== department) throw new Error(`${sku} is in ${product.category}, expected ${department}`);
    if (product.tags?.includes("New arrival")) throw new Error(`${sku} is already a New arrival and must remain there`);

    const nextTags = ["Best seller", ...(product.tags || []).filter((tag) => tag !== "Best seller")];
    backup.push(product);
    const updateResponse = await fetch(`${baseUrl}/rest/v1/products?id=eq.${product.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ tags: nextTags }),
    });
    const [record] = await updateResponse.json();
    if (!updateResponse.ok || !record?.tags?.includes("Best seller") || record.category !== department) {
      throw new Error(`Best seller update failed for ${sku}: ${updateResponse.status}`);
    }
    updated.push({ department, sku: record.sku, name: record.name, tags: record.tags });
  }
}

await writeFile(new URL("../data/department-best-seller-expansion-backup.json", import.meta.url), JSON.stringify({
  createdAt: new Date().toISOString(),
  instruction: "User requested five suitable branded products from each remaining department in the Best sellers collection.",
  selections,
  records: backup,
}, null, 2));

await writeFile(new URL("../data/department-best-seller-expansion-results.json", import.meta.url), JSON.stringify({
  createdAt: new Date().toISOString(),
  expectedCount: 35,
  updatedCount: updated.length,
  selections,
  updated,
}, null, 2));

console.log(JSON.stringify({ updatedCount: updated.length, departments: Object.keys(selections), updated }, null, 2));
