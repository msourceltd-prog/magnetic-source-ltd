import { writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const targets = [
  { name: "Amos Audio Lollipop Cola", sku: "72214P" },
  { name: "Christmas Gift Bag Medium – Whimsical Woodland", sku: null },
  { name: "EVA Clogs Child Size 4", sku: "72037A" },
  { name: "Rosewood Cooling Collar – Small", sku: "HPE-72363P" },
  { name: "Toxic Waste Apple Popcorn 120g", sku: "72537U" },
  { name: "Haribo Bone Shakers 140g £1.25 PMP", sku: "9592V" },
];
const normalise = (value = "") => value.toLowerCase().replace(/[’'′″“”–—-]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const normaliseSku = (value = "") => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,sku,slug,category,image&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue read failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const resolved = [];
const missing = [];
const ambiguous = [];
for (const target of targets) {
  const nameMatches = products.filter((product) => normalise(product.name) === normalise(target.name));
  const matches = target.sku ? nameMatches.filter((product) => normaliseSku(product.sku) === normaliseSku(target.sku)) : nameMatches;
  if (matches.length === 1) resolved.push({ ...target, product: matches[0], reason: target.sku ? "exact_name_and_sku" : "unique_exact_name" });
  else if (!matches.length) missing.push({ ...target, nameMatches: nameMatches.map((product) => ({ id: product.id, name: product.name, sku: product.sku })) });
  else ambiguous.push({ ...target, matches: matches.map((product) => ({ id: product.id, name: product.name, sku: product.sku })) });
}
const report = { generatedAt: new Date().toISOString(), baselineProductCount: products.length, targets, resolved, missing, ambiguous };
await writeFile(`${projectRoot}/data/additional-six-removal-preflight.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ baselineProductCount: products.length, resolved: resolved.length, missing: missing.length, ambiguous: ambiguous.length, matches: resolved.map((entry) => ({ sku: entry.product.sku, name: entry.product.name, category: entry.product.category })) }, null, 2));
if (missing.length || ambiguous.length) process.exitCode = 2;
