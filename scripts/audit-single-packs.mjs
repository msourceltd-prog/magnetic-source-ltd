const response = await fetch(
  "https://pylhokxuqqbldnfjwjem.supabase.co/rest/v1/products?select=sku,name,pack,description,category&pack=eq.Pack%20of%201&order=category.asc,name.asc",
  { headers: { apikey: "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq" } },
);

if (!response.ok) throw new Error(`Catalogue audit failed: ${response.status}`);
const products = await response.json();
console.log(JSON.stringify({ count: products.length, products }, null, 2));
