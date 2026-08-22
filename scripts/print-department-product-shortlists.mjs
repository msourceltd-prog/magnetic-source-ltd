const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const departments = ["toys-gifts", "stationery-party", "seasonal-christmas", "baby-kids"];

for (const department of departments) {
  const query = new URLSearchParams({
    select: "sku,name,pack,tags",
    category: `eq.${department}`,
    order: "id.asc",
  });
  const response = await fetch(`${baseUrl}/rest/v1/products?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`${department}: ${response.status}`);
  const products = await response.json();
  console.log(`\n${department.toUpperCase()} (${products.length} products)`);
  for (const product of products.filter((item) => !item.tags?.includes("Best seller") && !item.tags?.includes("New arrival"))) {
    console.log(`${product.sku} | ${product.name} | ${product.pack}`);
  }
}
