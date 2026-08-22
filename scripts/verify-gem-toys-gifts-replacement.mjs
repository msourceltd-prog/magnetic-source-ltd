const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const response = await fetch(`${baseUrl}/rest/v1/products?select=category,sku,name,pack,image,tags`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Catalogue verification failed: ${response.status} ${JSON.stringify(products).slice(0, 500)}`);

const toysProducts = products.filter((product) => product.category === "toys-gifts");
const seasonalDuplicate = products.filter((product) => product.sku === "GEM-TOY7869OB");
const categoryCounts = Object.fromEntries([...new Set(products.map((product) => product.category))]
  .sort()
  .map((category) => [category, products.filter((product) => product.category === category).length]));
const bestSellerCount = toysProducts.filter((product) => product.tags?.includes("Best seller")).length;

const valid = toysProducts.length === 99 && bestSellerCount === 5 && seasonalDuplicate.length === 1 && seasonalDuplicate[0].category === "seasonal-christmas" && toysProducts.every((product) => (
  product.sku.startsWith("GEM-")
  && product.pack?.startsWith("Pack of ")
  && /^https:\/\/www\.gemimports\.co\.uk\//.test(product.image || "")
  && Array.isArray(product.tags)
  && product.tags.includes("Price hidden")
));
if (!valid) throw new Error(`Gem Toys & Gifts verification failed: ${JSON.stringify({ toys_count: toysProducts.length, bestSellerCount, seasonalDuplicate, sample: toysProducts.slice(0, 3) })}`);

console.log(JSON.stringify({
  total_products: products.length,
  toys_gifts_count: toysProducts.length,
  toys_gifts_best_seller_count: bestSellerCount,
  retained_seasonal_duplicate: seasonalDuplicate[0],
  all_toys_gifts_skus_are_gem: toysProducts.every((product) => product.sku.startsWith("GEM-")),
  category_counts: categoryCounts,
  sample: toysProducts.slice(0, 5),
}, null, 2));
