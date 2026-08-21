import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const auditPath = resolve("data/full-catalogue-image-audit-report.json");
const outputPath = resolve("data/verified-image-quality-removal-candidates.json");
const candidateSkus = [
  "100E", "1985T", "31960S", "36960W", "48880W", "55935G", "67227Z", "69375I", "90T",
  "38495S", "4342K", "6359W", "65397A", "68612B", "69828M", "69830T", "69832Z", "69834F", "69835I", "69836L", "69838R", "69882Y", "69890X", "69892D",
  "72332X", "72562U", "72563X", "72564A", "72743V", "72766O", "72767R", "72768U", "72770B", "72779C", "72780G", "73041T", "HBT-1789X", "HBT-560Y", "HBT-63817U", "HBT-66347H", "HBT-67865L", "HBT-72570T",
  "39631Q", "39636F", "39640S", "39641V", "39649T", "60342I", "60343L", "72615I", "72616L", "72617O", "72630D", "72750R", "HPE-72363P", "HPE-72364S", "HPE-72365V",
  "STP-39559U", "STP-39575S", "STP-65367L", "STX-22650Z",
  "72535O", "72536R", "72537U", "73027B", "73033U", "73034X", "73111I", "75994X", "75995A", "75996D", "75997G", "75998J", "75999M", "76000O", "9592V", "9596H", "9838V", "SWE-6388I", "SWE-72371O", "SWE-72548C", "SWE-72549F", "SWE-72550J", "SWE-72551M", "SWE-75991O", "SWE-7907V", "SWE-7909B",
  "73103J", "73104M",
];
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,sku,name,slug,category,image,tags&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const audit = JSON.parse(await readFile(auditPath, "utf8"));
const auditBySku = new Map(audit.results.map((result) => [result.sku, result]));
const bySku = new Map(products.map((product) => [product.sku, product]));
const duplicates = candidateSkus.filter((sku, index) => candidateSkus.indexOf(sku) !== index);
const missing = candidateSkus.filter((sku) => !bySku.has(sku));
const auditMissing = candidateSkus.filter((sku) => !auditBySku.has(sku) || !(auditBySku.get(sku).flags || []).length);
if (duplicates.length || missing.length || auditMissing.length) throw new Error(`Candidate compilation failed: ${JSON.stringify({ duplicates, missing, auditMissing })}`);
const productsToRemove = candidateSkus.map((sku) => ({ ...bySku.get(sku), auditFlags: auditBySku.get(sku).flags }));
const categoryCounts = productsToRemove.reduce((counts, product) => ({ ...counts, [product.category]: (counts[product.category] || 0) + 1 }), {});
const output = { compiledAt: new Date().toISOString(), totalCandidates: productsToRemove.length, categoryCounts, auditRule: "Manually reviewed and documented full-product image failures only. Every item has an objective audit flag and a documented unsuitable dark, busy, supplier-style, or photographic canvas presentation.", products: productsToRemove };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ totalCandidates: output.totalCandidates, categoryCounts, outputPath }, null, 2));
