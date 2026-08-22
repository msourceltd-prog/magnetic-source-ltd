import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;
const expectedPack = "Pack of 24";
const audit = JSON.parse(await readFile(new URL("../data/pack-of-one-audit.json", import.meta.url), "utf8"));

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");
if (audit.count !== 62 || audit.products.some((product) => product.pack !== "Pack of 1")) {
  throw new Error("The audited Pack of 1 product set is not the expected 62 records.");
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

const backup = [];
const updated = [];
for (const product of audit.products) {
  const readResponse = await fetch(`${baseUrl}/rest/v1/products?select=id,sku,name,pack,description&sku=eq.${encodeURIComponent(product.sku)}`, { headers });
  const current = await readResponse.json();
  if (!readResponse.ok || !Array.isArray(current) || current.length !== 1 || current[0].pack !== "Pack of 1") {
    throw new Error(`Unexpected source state for ${product.sku}: ${readResponse.status} ${JSON.stringify(current)}`);
  }
  backup.push(current[0]);

  const description = String(current[0].description || "").replace(/pack of 1/gi, "pack of 24");
  const updateResponse = await fetch(`${baseUrl}/rest/v1/products?id=eq.${current[0].id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ pack: expectedPack, description }),
  });
  const record = await updateResponse.json();
  if (!updateResponse.ok || !Array.isArray(record) || record.length !== 1 || record[0].pack !== expectedPack) {
    throw new Error(`Update failed for ${product.sku}: ${updateResponse.status} ${JSON.stringify(record)}`);
  }
  updated.push({ sku: record[0].sku, name: record[0].name, pack: record[0].pack });
}

await writeFile(new URL("../data/pack-of-one-to-24-admin-backup.json", import.meta.url), JSON.stringify({
  createdAt: new Date().toISOString(),
  instruction: "User confirmed the wholesaler pack is Pack of 24 for all audited Pack of 1 records.",
  records: backup,
}, null, 2));

console.log(JSON.stringify({ updated: updated.length, pack: expectedPack, records: updated }, null, 2));
