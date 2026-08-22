import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;
const bestSellerSourceSkus = new Set(["STA0323", "STA0270", "STA12610", "STA1361", "STA0319"]);

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");

const source = JSON.parse(await readFile(new URL("../data/gem-stationery-import-source.json", import.meta.url), "utf8"));
if (source.product_count !== 100 || source.products.length !== 100) throw new Error("Expected exactly 100 prepared Gem Imports Stationery products.");

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

const readUrl = new URL(`${baseUrl}/rest/v1/products`);
readUrl.searchParams.set("select", "id,slug,name,category,price,sku,availability,pack,description,image,tags,featured");
readUrl.searchParams.set("category", "eq.stationery-party");
readUrl.searchParams.set("order", "id.asc");
const currentResponse = await fetch(readUrl, { headers });
const currentProducts = await currentResponse.json();
if (!currentResponse.ok || !Array.isArray(currentProducts) || currentProducts.length !== 31) {
  throw new Error(`Expected exactly 31 current Stationery & Party products; received ${currentResponse.status} ${JSON.stringify(currentProducts).slice(0, 500)}`);
}

await writeFile(new URL("../data/stationery-before-gem-replacement.json", import.meta.url), JSON.stringify({
  created_at: new Date().toISOString(),
  instruction: "User requested the same authorised Gem Imports replacement process used for Baby & Kids and Seasonal & Christmas, now scoped only to Stationery & Party and renamed publicly to Stationery.",
  replaced_count: currentProducts.length,
  records: currentProducts,
}, null, 2));

const deleteResponse = await fetch(`${baseUrl}/rest/v1/products?category=eq.stationery-party`, { method: "DELETE", headers });
const deleted = await deleteResponse.json();
if (!deleteResponse.ok || !Array.isArray(deleted) || deleted.length !== 31) {
  throw new Error(`Stationery delete failed: ${deleteResponse.status} ${JSON.stringify(deleted).slice(0, 500)}`);
}

const productsToInsert = source.products.map((product) => ({
  slug: product.slug,
  name: product.name,
  category: "stationery-party",
  price: 0,
  sku: product.sku,
  availability: "Availability to confirm",
  pack: product.pack,
  description: product.description,
  image: product.image,
  tags: bestSellerSourceSkus.has(product.source_sku) ? ["Best seller", "Price hidden", "Gem Imports"] : ["Price hidden", "Gem Imports"],
  featured: false,
}));

const insertResponse = await fetch(`${baseUrl}/rest/v1/products`, {
  method: "POST",
  headers,
  body: JSON.stringify(productsToInsert),
});
const inserted = await insertResponse.json();
if (!insertResponse.ok || !Array.isArray(inserted) || inserted.length !== 100) {
  throw new Error(`Gem Imports Stationery insertion failed after replacement: ${insertResponse.status} ${JSON.stringify(inserted).slice(0, 1000)}`);
}

const verificationUrl = new URL(`${baseUrl}/rest/v1/products`);
verificationUrl.searchParams.set("select", "sku,name,category,pack,image,tags");
verificationUrl.searchParams.set("category", "eq.stationery-party");
verificationUrl.searchParams.set("order", "sku.asc");
const verificationResponse = await fetch(verificationUrl, { headers });
const verified = await verificationResponse.json();
const bestSellerCount = verified.filter((product) => product.tags?.includes("Best seller")).length;
if (!verificationResponse.ok || !Array.isArray(verified) || verified.length !== 100 || bestSellerCount !== 5 || verified.some((product) => !product.sku.startsWith("GEM-") || product.category !== "stationery-party")) {
  throw new Error(`Stationery replacement verification failed: ${verificationResponse.status} ${JSON.stringify({ count: verified.length, bestSellerCount, sample: verified.slice(0, 4) }).slice(0, 1000)}`);
}

console.log(JSON.stringify({
  deleted_count: deleted.length,
  inserted_count: inserted.length,
  verified_count: verified.length,
  stationery_best_seller_count: bestSellerCount,
  sample: verified.slice(0, 5),
}, null, 2));
