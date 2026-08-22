import { readFile, writeFile } from "node:fs/promises";

const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const results = JSON.parse(await readFile(new URL("../data/department-best-seller-expansion-results.json", import.meta.url), "utf8"));
const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
const verified = [];

for (const [department, skus] of Object.entries(results.selections)) {
  const count = { bestSeller: 0, newArrival: 0, correctDepartment: 0 };
  for (const sku of skus) {
    const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category,tags&sku=eq.${encodeURIComponent(sku)}`, { headers });
    const [product] = await response.json();
    if (!response.ok || !product) throw new Error(`Could not verify ${sku}`);
    if (product.category === department) count.correctDepartment += 1;
    if (product.tags?.[0] === "Best seller") count.bestSeller += 1;
    if (product.tags?.includes("New arrival")) count.newArrival += 1;
    verified.push({ department, ...product });
  }
  if (count.correctDepartment !== 5 || count.bestSeller !== 5 || count.newArrival !== 0) {
    throw new Error(`${department} verification failed: ${JSON.stringify(count)}`);
  }
}

const report = { verifiedAt: new Date().toISOString(), departmentCount: Object.keys(results.selections).length, verifiedCount: verified.length, records: verified };
await writeFile(new URL("../data/department-best-seller-expansion-verification.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ departments: report.departmentCount, verified: report.verifiedCount }, null, 2));
