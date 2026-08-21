import { readFile, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,sku,name,slug&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue read failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const [preflight, registry, sitemap] = await Promise.all([
  JSON.parse(await readFile(`${projectRoot}/data/additional-six-removal-preflight.json`, "utf8")),
  JSON.parse(await readFile(`${projectRoot}/data/permanent-deletion-registry.json`, "utf8")),
  readFile(`${projectRoot}/client/public/sitemap.xml`, "utf8"),
]);
const targets = preflight.resolved.map((entry) => entry.product);
const liveSkus = new Set(products.map((product) => product.sku));
const registrySkus = new Set((registry.entries || []).map((entry) => entry.sku));
const liveMatches = targets.filter((target) => liveSkus.has(target.sku));
const missingRegistry = targets.filter((target) => !registrySkus.has(target.sku));
const sitemapMatches = targets.filter((target) => sitemap.includes(`/product/${target.slug}`));
const sitemapCount = (sitemap.match(/<loc>/g) || []).length;
if (products.length !== 315 || liveMatches.length || missingRegistry.length || sitemapMatches.length || sitemapCount !== 331) throw new Error(`Additional six verification failed: products=${products.length}, live=${liveMatches.length}, registry=${missingRegistry.length}, sitemapMatches=${sitemapMatches.length}, sitemap=${sitemapCount}`);
const result = { verifiedAt: new Date().toISOString(), productCount: products.length, deletedTargets: targets.map((target) => ({ sku: target.sku, name: target.name })), liveMatches: 0, missingRegistry: 0, sitemapMatches: 0, sitemapCount };
await writeFile(`${projectRoot}/data/additional-six-removal-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
