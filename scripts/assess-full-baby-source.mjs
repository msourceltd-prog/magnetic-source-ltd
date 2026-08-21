import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = "/home/ubuntu/harrisons-direct-source/baby-kids-price-free-products.json";
const outputPath = resolve("data/full-baby-source-availability.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku,slug,category`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveNames = new Set(live.map((product) => normalize(product.name)));
const liveSkus = new Set(live.map((product) => product.sku));
const unavailableByOwner = new Set(["tidyz-degradable-nappy-bags-pocket-pack-4-x-25-s-55844e"]);
const available = source.filter((product) => !liveNames.has(normalize(product.name)) && !liveSkus.has(product.sku) && !unavailableByOwner.has(product.slug));
const report = { assessedAt: new Date().toISOString(), sourceCount: source.length, liveBabyKidsCount: live.filter((product) => product.category === "baby-kids").length, availableCount: available.length, available: available.map((product) => ({ name: product.name, sku: product.sku, slug: product.slug, pack: product.pack, image: product.image })) };
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ sourceCount: report.sourceCount, liveBabyKidsCount: report.liveBabyKidsCount, availableCount: report.availableCount, available: report.available.map((product) => product.sku), outputPath }, null, 2));
