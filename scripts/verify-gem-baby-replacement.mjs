const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const response = await fetch(`${baseUrl}/rest/v1/products?select=category,sku,name,pack,image,tags`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Catalogue verification failed: ${response.status} ${JSON.stringify(products).slice(0, 500)}`);

const babyProducts = products.filter((product) => product.category === "baby-kids");
const categoryCounts = Object.fromEntries([...new Set(products.map((product) => product.category))]
  .sort()
  .map((category) => [category, products.filter((product) => product.category === category).length]));

const valid = babyProducts.length === 55 && babyProducts.every((product) => (
  product.sku.startsWith("GEM-")
  && product.pack?.startsWith("Pack of ")
  && /^https:\/\/www\.gemimports\.co\.uk\//.test(product.image || "")
  && Array.isArray(product.tags)
  && product.tags.includes("Price hidden")
));

if (!valid) throw new Error(`Gem Baby verification failed: ${JSON.stringify({ baby_count: babyProducts.length, sample: babyProducts.slice(0, 3) })}`);

console.log(JSON.stringify({
  total_products: products.length,
  baby_kids_count: babyProducts.length,
  all_baby_skus_are_gem: babyProducts.every((product) => product.sku.startsWith("GEM-")),
  category_counts: categoryCounts,
  sample: babyProducts.slice(0, 5),
}, null, 2));
