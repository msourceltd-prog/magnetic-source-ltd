import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;
const bestSellerSourceSkus = new Set(["CLE13130OB", "CLE13347OB", "CLE13132OB", "CLE13190OB", "CLE13189OB"]);

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");

const source = JSON.parse(await readFile(new URL("../data/gem-household-half-range-import-source.json", import.meta.url), "utf8"));
if (source.product_count !== 50 || source.products.length !== 50) throw new Error("Expected exactly 50 selected Gem Imports household products.");

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

const currentResponse = await fetch(`${baseUrl}/rest/v1/products?category=eq.household-pet&select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured&order=id.asc`, { headers });
const currentProducts = await currentResponse.json();
if (!currentResponse.ok || !Array.isArray(currentProducts) || currentProducts.length !== 46) {
  throw new Error(`Expected exactly 46 current Household & Pet products; received ${currentResponse.status} ${JSON.stringify(currentProducts).slice(0, 500)}`);
}

const categoryResponse = await fetch(`${baseUrl}/rest/v1/categories?slug=eq.household-pet&select=id,name,slug,summary`, { headers });
const currentCategory = await categoryResponse.json();
if (!categoryResponse.ok || !Array.isArray(currentCategory) || currentCategory.length !== 1) throw new Error(`Expected one Household category: ${categoryResponse.status}`);

await writeFile(new URL("../data/household-pet-before-gem-replacement.json", import.meta.url), JSON.stringify({
  created_at: new Date().toISOString(),
  instruction: "User requested an authorised half-range Gem Imports household replacement and public Household rename, scoped only to Household & Pet.",
  replaced_count: currentProducts.length,
  products: currentProducts,
  category_before_rename: currentCategory[0],
}, null, 2));

const deleteResponse = await fetch(`${baseUrl}/rest/v1/products?category=eq.household-pet`, { method: "DELETE", headers });
const deleted = await deleteResponse.json();
if (!deleteResponse.ok || !Array.isArray(deleted) || deleted.length !== 46) throw new Error(`Household delete failed: ${deleteResponse.status} ${JSON.stringify(deleted).slice(0, 500)}`);

const productsToInsert = source.products.map((product) => ({
  slug: product.slug,
  name: product.name,
  category: "household-pet",
  price: 0,
  sku: product.sku,
  availability: "Availability to confirm",
  pack: product.pack,
  description: product.description,
  image: product.image,
  tags: bestSellerSourceSkus.has(product.source_sku) ? ["Best seller", "Price hidden", "Gem Imports"] : ["Price hidden", "Gem Imports"],
  featured: false,
}));

const insertResponse = await fetch(`${baseUrl}/rest/v1/products`, { method: "POST", headers, body: JSON.stringify(productsToInsert) });
const inserted = await insertResponse.json();
if (!insertResponse.ok || !Array.isArray(inserted) || inserted.length !== 50) throw new Error(`Gem Imports Household insertion failed: ${insertResponse.status} ${JSON.stringify(inserted).slice(0, 1000)}`);

const categoryUpdateResponse = await fetch(`${baseUrl}/rest/v1/categories?slug=eq.household-pet`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ name: "Household", summary: "Practical household lines for everyday retail." }),
});
const updatedCategory = await categoryUpdateResponse.json();
if (!categoryUpdateResponse.ok || !Array.isArray(updatedCategory) || updatedCategory.length !== 1 || updatedCategory[0].name !== "Household") {
  throw new Error(`Household category rename failed: ${categoryUpdateResponse.status} ${JSON.stringify(updatedCategory)}`);
}

const verificationResponse = await fetch(`${baseUrl}/rest/v1/products?category=eq.household-pet&select=sku,name,category,pack,image,tags&order=sku.asc`, { headers });
const verified = await verificationResponse.json();
const bestSellerCount = verified.filter((product) => product.tags?.includes("Best seller")).length;
if (!verificationResponse.ok || !Array.isArray(verified) || verified.length !== 50 || bestSellerCount !== 5 || verified.some((product) => !product.sku.startsWith("GEM-") || product.category !== "household-pet")) {
  throw new Error(`Household replacement verification failed: ${verificationResponse.status} ${JSON.stringify({ count: verified.length, bestSellerCount, sample: verified.slice(0, 4) }).slice(0, 1000)}`);
}

console.log(JSON.stringify({ deleted_count: deleted.length, inserted_count: inserted.length, household_best_seller_count: bestSellerCount, category_after_rename: updatedCategory[0], sample: verified.slice(0, 5) }, null, 2));
