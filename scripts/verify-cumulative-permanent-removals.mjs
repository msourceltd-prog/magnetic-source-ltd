import { readFile, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const request = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
};

const [products, registry, part2Preflight, sitemap] = await Promise.all([
  request("/rest/v1/products?select=id,sku,name,slug,category,description,tags&order=id"),
  JSON.parse(await readFile(`${projectRoot}/data/permanent-deletion-registry.json`, "utf8")),
  JSON.parse(await readFile(`${projectRoot}/data/part2-permanent-removal-preflight.json`, "utf8")),
  readFile(`${projectRoot}/client/public/sitemap.xml`, "utf8"),
]);
const registrySkus = new Set((registry.entries || []).map((entry) => entry.sku).filter(Boolean));
const liveRegistryMatches = products.filter((product) => registrySkus.has(product.sku));
const realGoodFood = products.filter((product) => /real\s+good\s+food/i.test(`${product.name} ${product.description || ""} ${(product.tags || []).join(" ")}`));
const part2Slugs = part2Preflight.combinedUniqueDeletionCandidates.map((product) => product.slug);
const sitemapRemnants = part2Slugs.filter((slug) => sitemap.includes(`/product/${slug}`));
const expectedSitemapCount = 16 + products.length;
const actualSitemapCount = (sitemap.match(/<loc>/g) || []).length;
if (products.length !== 321 || liveRegistryMatches.length || realGoodFood.length || sitemapRemnants.length || actualSitemapCount !== expectedSitemapCount) {
  throw new Error(`Cumulative removal verification failed: products=${products.length}, liveRegistry=${liveRegistryMatches.length}, realGoodFood=${realGoodFood.length}, sitemapRemnants=${sitemapRemnants.length}, sitemap=${actualSitemapCount}/${expectedSitemapCount}`);
}
const result = { verifiedAt: new Date().toISOString(), productCount: products.length, registryEntries: registrySkus.size, liveRegistryMatches: 0, realGoodFoodMatches: 0, part2SitemapRemnants: 0, sitemapUrlCount: actualSitemapCount, categoryCounts: Object.fromEntries([...new Set(products.map((product) => product.category))].sort().map((category) => [category, products.filter((product) => product.category === category).length])) };
await writeFile(`${projectRoot}/data/cumulative-permanent-removal-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
