const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

if (!baseUrl) throw new Error("Missing Supabase project URL.");

const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category,tags&order=category.asc,sku.asc`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Unable to audit collection tags: ${response.status}`);

const collectionReport = (tag) => {
  const entries = products.filter((product) => product.tags?.includes(tag));
  const byCategory = Object.fromEntries([...new Set(entries.map((product) => product.category))].sort().map((category) => [category, entries.filter((product) => product.category === category).length]));
  return { count: entries.length, by_category: byCategory, products: entries };
};

console.log(JSON.stringify({
  total_product_count: products.length,
  best_sellers: collectionReport("Best seller"),
  new_arrivals: collectionReport("New arrival"),
}, null, 2));
