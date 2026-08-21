import { writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const reportPath = `${projectRoot}/data/owner-specified-product-removal-preflight.json`;
const normalize = (value = "") => value.toLowerCase().replace(/[’'–—-]/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const requested = [
  { line: 1, sku: "72810B", name: "Johny Bee 3D Gummy Surprise 57g", category: "sweets-snacks" },
  { line: 2, sku: "72592J", name: "NUK First Choice Day & Night Soother 2 Pack 0-6m Boys", category: "baby-kids" },
  { line: 3, sku: "STP-39395U", name: "Gift Bag Medium Colourful Hearts W180xH230xD100mm", category: "stationery-party" },
  { line: 4, sku: "STP-3899", name: "Gift Bag Large Cross My Heart W266xH330xD140mm", category: "stationery-party" },
  { line: 5, sku: "STP-39582O", name: "Are We There Yet Bumper Activity Set", category: "stationery-party" },
  { line: 6, sku: "65243L", name: "Sharpie Fluo XL Highlighters Assorted 4 Pack", category: "clearance" },
  { line: 7, sku: "72594P", name: "NUK First Choice Day & Night Soother 2 Pack 6-18m Boys", category: "baby-kids" },
  { line: 8, sku: "64356X", name: "Johnson’s Baby Powder Natural 200g", category: "baby-kids" },
  { line: 9, sku: "39648Q", name: "Summit Metal Tent Pegs 18cm Pack of 20", category: "household-pet" },
  { line: 10, sku: "39637I", name: "Blackmoor 20cm Frying Pan", category: "household-pet" },
  { line: 11, sku: "22790X", name: "Christmas 4m Roll Wrap Novelty Cute", category: "seasonal-christmas" },
  { line: 12, sku: null, name: "Christmas Gift Bag Medium Most Wonderful", category: "seasonal-christmas" },
  { line: 13, sku: "22772T", name: "Christmas Gift Bag Small Most Wonderful", category: "seasonal-christmas" },
  { line: 14, sku: null, name: "Christmas 4m Roll Wrap Red & White", category: "seasonal-christmas" },
  { line: 15, sku: "STP-39646K", name: "Pentel Recycology Rollerball 4 Pack", category: "stationery-party" },
  { line: 16, sku: "STP-39644E", name: "Pentel Gel Grip 2 Pack Gold Silver", category: "stationery-party" },
  { line: 17, sku: "STP-39643B", name: "Pentel Energel X Retractable Gel Pen 2 Pack Blue", category: "stationery-party" },
  { line: 18, sku: "STP-39642Y", name: "Pentel Energel X Retractable Gel Pen 2 Pack Black", category: "stationery-party" },
  { line: 19, sku: "STP-39485T", name: "6 Novelty Eraser Top Pencils", category: "stationery-party" },
  { line: 20, sku: "STP-39644E", name: "Pentel Gel Grip 2 Pack Gold Silver", category: "stationery-party", duplicateOf: 16 },
];
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,sku,name,category,slug,image&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue read failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const resolve = (item) => {
  const skuMatches = item.sku ? products.filter((product) => normalize(product.sku) === normalize(item.sku)) : [];
  const nameMatches = products.filter((product) => normalize(product.name) === normalize(item.name));
  const candidates = skuMatches.length ? skuMatches : nameMatches;
  return { ...item, candidates: candidates.map((product) => ({ id: product.id, sku: product.sku, name: product.name, category: product.category, slug: product.slug, image: product.image })), exact: candidates.length === 1 ? candidates[0] : null, resolution: candidates.length === 1 ? (skuMatches.length ? "sku" : "name") : candidates.length ? "ambiguous" : "missing" };
};
const results = requested.map(resolve);
const uniqueResolved = [...new Map(results.filter((result) => result.exact).map((result) => [result.exact.id, result.exact])).values()];
const report = { verifiedAt: new Date().toISOString(), liveProductTotal: products.length, requestedLines: requested.length, uniqueRequestedProducts: uniqueResolved.length, resolved: results, unresolved: results.filter((result) => !result.exact), duplicateLines: results.filter((result) => result.duplicateOf).map((result) => ({ line: result.line, duplicateOf: result.duplicateOf, sku: result.sku })) };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ liveProductTotal: products.length, requestedLines: requested.length, uniqueRequestedProducts: uniqueResolved.length, unresolved: report.unresolved.map((result) => ({ line: result.line, sku: result.sku, name: result.name, resolution: result.resolution, candidates: result.candidates })), duplicateLines: report.duplicateLines, reportPath }, null, 2));
