const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const response = await fetch(`${baseUrl}/rest/v1/products?select=category,sku,name,pack,image,tags`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Catalogue verification failed: ${response.status} ${JSON.stringify(products).slice(0, 500)}`);

const seasonalProducts = products.filter((product) => product.category === "seasonal-christmas");
const categoryCounts = Object.fromEntries([...new Set(products.map((product) => product.category))]
  .sort()
  .map((category) => [category, products.filter((product) => product.category === category).length]));
const bestSellerCount = seasonalProducts.filter((product) => product.tags?.includes("Best seller")).length;

const valid = seasonalProducts.length === 100 && bestSellerCount === 5 && seasonalProducts.every((product) => (
  product.sku.startsWith("GEM-")
  && product.pack?.startsWith("Pack of ")
  && /^https:\/\/www\.gemimports\.co\.uk\//.test(product.image || "")
  && Array.isArray(product.tags)
  && product.tags.includes("Price hidden")
));
if (!valid) throw new Error(`Gem Seasonal verification failed: ${JSON.stringify({ seasonal_count: seasonalProducts.length, bestSellerCount, sample: seasonalProducts.slice(0, 3) })}`);

console.log(JSON.stringify({
  total_products: products.length,
  seasonal_christmas_count: seasonalProducts.length,
  seasonal_best_seller_count: bestSellerCount,
  all_seasonal_skus_are_gem: seasonalProducts.every((product) => product.sku.startsWith("GEM-")),
  category_counts: categoryCounts,
  sample: seasonalProducts.slice(0, 5),
}, null, 2));
