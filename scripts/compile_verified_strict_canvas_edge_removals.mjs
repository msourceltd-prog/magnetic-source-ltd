import { readFile, writeFile } from "node:fs/promises";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const strictReport = JSON.parse(await readFile("data/strict-canvas-edge-audit-report.json", "utf8"));
const candidateSkus = [
  "1232J", "1240I", "2536N", "39537E", "48758P", "5358N", "55913Q", "607T", "61612L", "70523R", "70814B", "70817K",
  "39630N", "72569P", "72571W", "72769X", "73196L", "HBT-62816L", "HBT-68712F", "HBT-69460S", "HBT-72889L",
  "39529F", "72388O", "HPE-39614P", "HPE-72383Z", "HPE-72387L",
  "22768G", "22771Q", "22784E", "22796P",
  "STP-31754R", "STP-34567P", "STP-36259Q", "STP-37404Q", "STP-4148U", "STX-39480E", "STX-39481H", "STX-39493S", "STX-39494V", "STX-39510Z", "STX-39512F", "STX-39513I",
  "72819C", "72820G", "73028E", "73109B", "73110F", "73112L", "73113O", "73114R", "73115U", "73116X", "SWE-72545T", "SWE-72546W",
  "39632T", "39633W", "72656F", "72683L", "72753A", "72989P", "73159A", "TGY-70562I", "TGY-71039A", "TGY-71040E", "TGY-72083N", "TGY-72221L", "TGY-72985D",
];
if (candidateSkus.length !== 67 || new Set(candidateSkus).size !== 67) throw new Error("Expected exactly 67 unique manually verified strict-edge candidates.");
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,sku,name,slug,category,price,availability,pack,description,image,tags,featured,created_at,updated_at&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const bySku = new Map(products.map((product) => [product.sku, product]));
const auditBySku = new Map(strictReport.results.map((product) => [product.sku, product]));
const missingLive = candidateSkus.filter((sku) => !bySku.has(sku));
const missingAudit = candidateSkus.filter((sku) => auditBySku.get(sku)?.status !== "review");
if (products.length !== 322 || missingLive.length || missingAudit.length) throw new Error(`Strict edge candidate compilation failed: ${JSON.stringify({ productTotal: products.length, missingLive, missingAudit })}`);
const candidates = candidateSkus.map((sku) => ({ ...bySku.get(sku), strictEdgeEvidence: { touches: auditBySku.get(sku).touches, nonwhiteCanvasEdges: auditBySku.get(sku).nonwhite_canvas_edges, reasons: auditBySku.get(sku).reasons } }));
const categoryCounts = candidates.reduce((counts, product) => ({ ...counts, [product.category]: (counts[product.category] || 0) + 1 }), {});
const output = { compiledAt: new Date().toISOString(), totalCandidates: candidates.length, categoryCounts, rule: "Owner-approved strict rule: permanently remove when the actual product or non-white source content touches top, bottom, left, or right image-canvas edge. Keep only visible white clearance on all four sides.", products: candidates };
await writeFile("data/verified-strict-canvas-edge-removals.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ totalCandidates: output.totalCandidates, categoryCounts, outputPath: "data/verified-strict-canvas-edge-removals.json" }, null, 2));
