const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

if (!baseUrl) throw new Error("Missing Supabase project URL.");

const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category,tags&order=category.asc,sku.asc`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const products = await response.json();
if (!response.ok || !Array.isArray(products)) throw new Error(`Unable to audit collection tags: ${response.status}`);

const bestSellers = products.filter((product) => product.tags?.includes("Best seller"));
const newArrivals = products.filter((product) => product.tags?.includes("New arrival"));
const overlap = newArrivals.filter((product) => product.tags?.includes("Best seller"));
const missingNewArrivalTag = newArrivals.filter((product) => !product.tags?.includes("New arrival"));

console.log(JSON.stringify({
  best_seller_count: bestSellers.length,
  new_arrival_count: newArrivals.length,
  overlap_count: overlap.length,
  overlap,
  missing_new_arrival_tag_count: missingNewArrivalTag.length,
}, null, 2));
