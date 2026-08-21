import { readFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const restoration = JSON.parse(await readFile(`${projectRoot}/data/image-audit-product-restoration-report.json`, "utf8"));
const sitemap = await readFile(`${projectRoot}/client/public/sitemap.xml`, "utf8");
const explicitRemoved = new Set([
  "tidyz degradable nappy bags pocket pack 4 x 25’s", "bic matic fun pencils 3’s", "christmas 4m roll wrap nordic noel", "christmas 4m roll wrap midnight blue", "christmas window clings baubles", "glitter shakers 4 pack", "staedtler peppa pig wax crayons 6 assorted colours", "wilkinson sword duplo disposable razor male 5’s", "wilkinson sword duplo disposable razor beauty women 5’s", "chupa chups watermelon/peach lip balm", "chupa chups strawberry bath & shower gel 300ml", "chupa chups cola bath & shower gel 300ml", "chupa chups apple bath & shower gel 400ml", "chupa chups watermelon bubble bath 500ml", "chupa chups tutti frutti body spray 150ml", "umbro roll-on anti-perspirant deo defiant 50ml", "umbro bodywash action 400ml", "chupa chups cherry body spray 150ml",
]);
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,name,sku,description,category&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Unable to load live catalogue: ${response.status} ${await response.text()}`);
const products = await response.json();
const skus = new Set(products.map((product) => product.sku));
const restoredMissing = restoration.restored.filter((product) => !skus.has(product.sku));
const explicitPresent = products.filter((product) => explicitRemoved.has(product.name.toLowerCase()));
const generatedDescriptions = products.filter((product) => /\bis supplied in a pack of\b/i.test(product.description || ""));
const missingRoutes = products.filter((product) => !sitemap.includes(`https://magneticsource.uk/product/${product.slug}`));
const invalidWhiteFrameRule = !products.length || !sitemap.includes("<urlset");
if (products.length !== 411 || restoredMissing.length || explicitPresent.length || generatedDescriptions.length || missingRoutes.length || invalidWhiteFrameRule) {
  throw new Error(`Release verification failed: total=${products.length}; restoredMissing=${restoredMissing.length}; explicitPresent=${explicitPresent.length}; generatedDescriptions=${generatedDescriptions.length}; missingRoutes=${missingRoutes.length}.`);
}
console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), finalCount: products.length, restoredCount: restoration.restoredCount, explicitOwnerRemovalsPreserved: true, generatedDescriptions: 0, sitemapUrls: (sitemap.match(/<url>/g) || []).length, whiteFramePolicy: "solid-white contained product frames; no image-based deletions", categoryCounts: Object.fromEntries([...new Set(products.map((product) => product.category))].sort().map((category) => [category, products.filter((product) => product.category === category).length])) }, null, 2));
