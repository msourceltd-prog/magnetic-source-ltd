const baseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const departments = [
  "household-pet",
  "sweets-snacks",
  "toys-gifts",
  "stationery-party",
  "health-beauty",
  "seasonal-christmas",
  "baby-kids",
];

const brandPattern = /\b(?:Amos|Barbie|Bic|Bluey|Capitol|Chupa Chups|Colgate|Cottontails|Crayola|Disney|Fabulosa|Good Boy|Haribo|Johnson'?s|Nivea|Nylabone|PAW Patrol|Peppa Pig|Pok[eé]mon|Rosewood|Staedtler|Star Wars|Toxic Waste|Umbro|Wilkinson Sword|World's Smallest)\b/i;

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
};

const output = {};

for (const department of departments) {
  const query = new URLSearchParams({
    select: "id,sku,name,category,tags,pack,description",
    category: `eq.${department}`,
    order: "id.asc",
  });
  const response = await fetch(`${baseUrl}/rest/v1/products?${query}`, { headers });
  if (!response.ok) throw new Error(`${department}: ${response.status} ${await response.text()}`);
  const products = await response.json();
  output[department] = products
    .filter((product) => !product.tags?.includes("Best seller") && !product.tags?.includes("New arrival"))
    .filter((product) => brandPattern.test(`${product.name} ${product.description || ""}`))
    .map(({ sku, name, pack, tags }) => ({ sku, name, pack, tags }));
}

console.log(JSON.stringify(output, null, 2));
