import { readFile, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const deletionReport = JSON.parse(await readFile(`${projectRoot}/data/owner-specified-product-removal-report.json`, "utf8"));
const registry = JSON.parse(await readFile(`${projectRoot}/data/permanent-deletion-registry.json`, "utf8"));
const sitemap = await readFile(`${projectRoot}/client/public/sitemap.xml`, "utf8");
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,sku,name,slug,category&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live product read failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const deletedIds = new Set(deletionReport.deleted.map((product) => product.id));
const deletedSkus = new Set(deletionReport.deleted.map((product) => product.sku));
const registrySkus = new Set((registry.entries || []).map((entry) => entry.sku));
const presentDeleted = products.filter((product) => deletedIds.has(product.id) || deletedSkus.has(product.sku));
const missingRegistryEntries = deletionReport.deleted.filter((product) => !registrySkus.has(product.sku));
const deletedRoutesInSitemap = deletionReport.deleted.filter((product) => sitemap.includes(`/product/${product.slug}`));
const testProductPresent = products.some((product) => product.sku === "DELETE-TEST-20260821");
const report = {
  verifiedAt: new Date().toISOString(),
  liveProductCount: products.length,
  deletedProductsPresent: presentDeleted.map((product) => ({ sku: product.sku, name: product.name })),
  missingRegistryEntries: missingRegistryEntries.map((product) => product.sku),
  deletedRoutesInSitemap: deletedRoutesInSitemap.map((product) => product.slug),
  testProductPresent,
  sitemapUrls: (sitemap.match(/<url>/g) || []).length,
  categoryCounts: Object.fromEntries([...new Set(products.map((product) => product.category))].sort().map((category) => [category, products.filter((product) => product.category === category).length])),
};
await writeFile(`${projectRoot}/data/owner-specified-product-removal-release-verification.json`, `${JSON.stringify(report, null, 2)}\n`);
if (report.liveProductCount !== 392 || report.deletedProductsPresent.length || report.missingRegistryEntries.length || report.deletedRoutesInSitemap.length || testProductPresent || report.sitemapUrls !== 408) throw new Error(`Release verification failed: ${JSON.stringify(report)}`);
console.log(JSON.stringify(report, null, 2));
