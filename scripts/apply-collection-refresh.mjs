import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");

const source = JSON.parse(await readFile(new URL("../data/collection-refresh-source.json", import.meta.url), "utf8"));
if (source.best_seller_additions?.length !== 5 || source.new_arrival_additions?.length !== 12) throw new Error("Unexpected collection refresh source size.");

const signIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const auth = await signIn.json();
if (!signIn.ok || !auth.access_token) throw new Error(`Admin sign-in failed: ${signIn.status}`);

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${auth.access_token}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const getRows = async (path) => {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers });
  const body = await response.json();
  if (!response.ok || !Array.isArray(body)) throw new Error(`GET ${path} failed: ${response.status}`);
  return body;
};

const products = await getRows("products?select=id,sku,name,category,price,pack,image,tags&order=sku.asc");
const bySku = new Map(products.map((product) => [product.sku, product]));
const tagPlan = new Map();
const addTag = (sku, tag) => {
  const current = tagPlan.get(sku) ?? { add: new Set(), remove: new Set() };
  current.add.add(tag);
  tagPlan.set(sku, current);
};
const removeTag = (sku, tag) => {
  const current = tagPlan.get(sku) ?? { add: new Set(), remove: new Set() };
  current.remove.add(tag);
  tagPlan.set(sku, current);
};
for (const entry of source.best_seller_additions) addTag(entry.sku, "Best seller");
for (const entry of source.new_arrival_additions) addTag(entry.sku, "New arrival");
const desiredNewArrivalSkus = new Set(source.new_arrival_additions.map((entry) => entry.sku));
for (const product of products.filter((product) => product.tags?.includes("New arrival") && !desiredNewArrivalSkus.has(product.sku))) removeTag(product.sku, "New arrival");

const before = [...tagPlan].map(([sku, plannedTags]) => {
  const product = bySku.get(sku);
  if (!product) throw new Error(`Selected collection SKU ${sku} is not live.`);
  return { sku, name: product.name, category: product.category, price: product.price, pack: product.pack, image: product.image, tags: product.tags ?? [], added_tags: [...plannedTags.add], removed_tags: [...plannedTags.remove] };
});

for (const entry of before) {
  if (!entry.tags.includes("Price hidden")) throw new Error(`Selected collection SKU ${entry.sku} is missing Price hidden.`);
  const expectedSelection = [...source.best_seller_additions, ...source.new_arrival_additions].find((candidate) => candidate.sku === entry.sku);
  if (expectedSelection && expectedSelection.category !== entry.category) throw new Error(`Category changed before collection update for ${entry.sku}.`);
}

const changes = [];
for (const entry of before) {
  const mergedTags = [...new Set([...entry.tags, ...entry.added_tags])].filter((tag) => !entry.removed_tags.includes(tag));
  if (JSON.stringify(mergedTags) === JSON.stringify(entry.tags)) continue;
  const response = await fetch(`${baseUrl}/rest/v1/products?sku=eq.${encodeURIComponent(entry.sku)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ tags: mergedTags }),
  });
  const updated = await response.json();
  if (!response.ok || !Array.isArray(updated) || updated.length !== 1) throw new Error(`Tag update failed for ${entry.sku}: ${response.status}`);
  changes.push({ sku: entry.sku, before_tags: entry.tags, after_tags: updated[0].tags });
}

const verifiedProducts = await getRows("products?select=sku,name,category,price,pack,image,tags&order=sku.asc");
const afterBySku = new Map(verifiedProducts.map((product) => [product.sku, product]));
const fieldChanges = before.filter((entry) => {
  const after = afterBySku.get(entry.sku);
  return !after || ["name", "category", "price", "pack", "image"].some((field) => after[field] !== entry[field]);
});
const bestSellers = verifiedProducts.filter((product) => product.tags?.includes("Best seller"));
const newArrivals = verifiedProducts.filter((product) => product.tags?.includes("New arrival"));
const newArrivalCategoryCounts = Object.fromEntries([...new Set(newArrivals.map((product) => product.category))].sort().map((category) => [category, newArrivals.filter((product) => product.category === category).length]));

const expectedNewArrivalCounts = source.expected_new_arrival_category_counts;
const newArrivalCountsMatch = Object.keys(expectedNewArrivalCounts).length === Object.keys(newArrivalCategoryCounts).length
  && Object.entries(expectedNewArrivalCounts).every(([category, count]) => newArrivalCategoryCounts[category] === count);
if (fieldChanges.length || bestSellers.length !== source.expected_collection_counts_after_update.best_sellers || newArrivals.length !== source.expected_collection_counts_after_update.new_arrivals || !newArrivalCountsMatch) {
  throw new Error(`Collection refresh verification failed: ${JSON.stringify({ fieldChanges, bestSellerCount: bestSellers.length, newArrivalCount: newArrivals.length, newArrivalCategoryCounts })}`);
}

const report = {
  updated_at: new Date().toISOString(),
  changed_product_count: changes.length,
  best_seller_count: bestSellers.length,
  new_arrival_count: newArrivals.length,
  new_arrival_category_counts: newArrivalCategoryCounts,
  preserved_field_changes: fieldChanges,
  changes,
};
await writeFile(new URL("../data/collection-refresh-verification.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
