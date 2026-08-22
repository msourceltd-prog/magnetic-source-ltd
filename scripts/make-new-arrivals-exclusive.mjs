import { writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");

const signIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const auth = await signIn.json();
if (!signIn.ok || !auth.access_token) throw new Error(`Admin sign-in failed: ${signIn.status}`);

const headers = { apikey: anonKey, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" };
const getProducts = async () => {
  const response = await fetch(`${baseUrl}/rest/v1/products?select=sku,name,category,price,pack,image,tags&order=sku.asc`, { headers });
  const body = await response.json();
  if (!response.ok || !Array.isArray(body)) throw new Error(`Unable to read product tags: ${response.status}`);
  return body;
};

const beforeProducts = await getProducts();
const overlaps = beforeProducts.filter((product) => product.tags?.includes("New arrival") && product.tags?.includes("Best seller"));
if (!overlaps.length) throw new Error("No Best seller/New arrival overlap found to refine.");

const snapshots = overlaps.map((product) => ({ sku: product.sku, name: product.name, category: product.category, price: product.price, pack: product.pack, image: product.image, tags: product.tags }));
for (const product of overlaps) {
  const tags = product.tags.filter((tag) => tag !== "Best seller");
  if (!tags.includes("New arrival")) throw new Error(`Removing Best seller would remove the required New arrival tag for ${product.sku}.`);
  const response = await fetch(`${baseUrl}/rest/v1/products?sku=eq.${encodeURIComponent(product.sku)}`, { method: "PATCH", headers, body: JSON.stringify({ tags }) });
  const body = await response.json();
  if (!response.ok || !Array.isArray(body) || body.length !== 1) throw new Error(`Unable to update tags for ${product.sku}: ${response.status}`);
}

const afterProducts = await getProducts();
const afterBySku = new Map(afterProducts.map((product) => [product.sku, product]));
const changedFields = snapshots.filter((snapshot) => {
  const after = afterBySku.get(snapshot.sku);
  return !after || ["name", "category", "price", "pack", "image"].some((field) => after[field] !== snapshot[field]);
});
const bestSellers = afterProducts.filter((product) => product.tags?.includes("Best seller"));
const newArrivals = afterProducts.filter((product) => product.tags?.includes("New arrival"));
const remainingOverlap = newArrivals.filter((product) => product.tags?.includes("Best seller"));
const missingNewArrivalTag = newArrivals.filter((product) => !product.tags?.includes("New arrival"));

if (changedFields.length || remainingOverlap.length || missingNewArrivalTag.length || newArrivals.length !== 12 || bestSellers.length !== 47) {
  throw new Error(`Exclusive collection verification failed: ${JSON.stringify({ changedFields, bestSellerCount: bestSellers.length, newArrivalCount: newArrivals.length, remainingOverlap: remainingOverlap.map((product) => product.sku), missingNewArrivalTag: missingNewArrivalTag.map((product) => product.sku) })}`);
}

const report = { updated_at: new Date().toISOString(), removed_best_seller_tag_from: snapshots, best_seller_count: bestSellers.length, new_arrival_count: newArrivals.length, overlap_count: remainingOverlap.length, changed_fields: changedFields };
await writeFile(new URL("../data/new-arrivals-exclusive-verification.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
