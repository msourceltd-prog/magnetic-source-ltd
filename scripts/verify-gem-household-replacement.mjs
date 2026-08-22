const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const [productsResponse, categoryResponse] = await Promise.all([
  fetch(`${baseUrl}/rest/v1/products?select=category,sku,name,pack,image,tags`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }),
  fetch(`${baseUrl}/rest/v1/categories?slug=eq.household-pet&select=name,slug,summary`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }),
]);
const products = await productsResponse.json();
const categories = await categoryResponse.json();
if (!productsResponse.ok || !Array.isArray(products) || !categoryResponse.ok || !Array.isArray(categories) || categories.length !== 1) {
  throw new Error(`Household verification read failed: ${productsResponse.status}/${categoryResponse.status}`);
}

const householdProducts = products.filter((product) => product.category === "household-pet");
const bestSellerCount = householdProducts.filter((product) => product.tags?.includes("Best seller")).length;
const categoryCounts = Object.fromEntries([...new Set(products.map((product) => product.category))]
  .sort()
  .map((category) => [category, products.filter((product) => product.category === category).length]));
const valid = householdProducts.length === 50
  && bestSellerCount === 5
  && categories[0].name === "Household"
  && householdProducts.every((product) => product.sku.startsWith("GEM-") && product.pack?.startsWith("Pack of ") && /^https:\/\/www\.gemimports\.co\.uk\//.test(product.image || "") && product.tags?.includes("Price hidden"));
if (!valid) throw new Error(`Household replacement verification failed: ${JSON.stringify({ householdCount: householdProducts.length, bestSellerCount, category: categories[0] })}`);

console.log(JSON.stringify({
  total_products: products.length,
  household_count: householdProducts.length,
  household_best_seller_count: bestSellerCount,
  category: categories[0],
  category_counts: categoryCounts,
  sample: householdProducts.slice(0, 5),
}, null, 2));
