const PUBLIC_SUPABASE_URL = "https://pylhokxuqqbldnfjwjem.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const url = new URL(`${PUBLIC_SUPABASE_URL}/rest/v1/products`);
url.searchParams.set("select", "id,slug,sku,name,category,description,image,pack,tags,featured");
url.searchParams.set("category", "eq.baby-kids");
url.searchParams.set("order", "name.asc");

const response = await fetch(url, {
  headers: {
    apikey: PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
  },
});

if (!response.ok) throw new Error(`Baby & Kids audit failed: ${response.status} ${await response.text()}`);

const products = await response.json();
const report = {
  audited_at: new Date().toISOString(),
  category: "baby-kids",
  count: products.length,
  products,
};

console.log(JSON.stringify(report, null, 2));
