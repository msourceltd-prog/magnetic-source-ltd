import { readFile, writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;
const projectApiKey = process.env.SUPABASE_KEY;
const bestSellerSkus = new Set(["72619U", "72568M", "HPE-72404S", "GEM-PET7199OB", "GEM-PET12575OB"]);

if (!baseUrl) throw new Error("Missing Supabase project URL.");

const source = JSON.parse(await readFile(new URL("../data/pets-import-source.json", import.meta.url), "utf8"));
if (source.product_count !== 30 || source.products.length !== 30) throw new Error("Expected exactly 30 selected Pets products.");
if (source.source_counts?.previous_authorised_pet_range !== 6 || source.source_counts?.gem_imports_pet_care !== 24) throw new Error("Pets range must contain six restored authorised products and twenty-four Gem Imports products.");
if (Object.values(source.verified_brand_counts ?? {}).some((count) => count > 2)) throw new Error("A verified pet brand exceeds the two-product cap.");

const sessionKey = adminEmail && adminPassword ? await (async () => {
  const signIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const auth = await signIn.json();
  if (!signIn.ok || !auth.access_token) throw new Error(`Admin sign-in failed: ${signIn.status}`);
  return auth.access_token;
})() : projectApiKey;

if (!sessionKey) throw new Error("Missing authorised project credential and admin sign-in configuration.");

const headers = {
  apikey: adminEmail && adminPassword ? anonKey : projectApiKey,
  Authorization: `Bearer ${sessionKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const fetchJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${JSON.stringify(body).slice(0, 1200)}`);
  return body;
};

const selectedSkuSet = new Set(source.products.map((product) => product.sku));
const [existingCategories, allProducts] = await Promise.all([
  fetchJson("categories?slug=eq.pets&select=id,name,slug,summary"),
  fetchJson("products?select=id,sku,slug,category,name,tags"),
]);
const existingPets = allProducts.filter((product) => product.category === "pets");
const collisions = allProducts.filter((product) => selectedSkuSet.has(product.sku) && product.category !== "pets");

if (collisions.length) throw new Error(`Pets import blocked by existing SKU collisions: ${collisions.map((product) => `${product.sku} in ${product.category}`).join(", ")}`);
if (existingCategories.length > 1) throw new Error("More than one Pets category already exists.");
if (existingPets.length) throw new Error(`Pets import blocked because ${existingPets.length} existing Pets products are present; no data was changed.`);

let category;
if (existingCategories.length === 1) {
  category = existingCategories[0];
  if (category.name !== "Pets") throw new Error(`Existing pets slug has unexpected category name: ${category.name}`);
} else {
  const createdCategories = await fetchJson("categories", {
    method: "POST",
    body: JSON.stringify({
      name: "Pets",
      slug: "pets",
      summary: "Pet care, accessories and everyday animal essentials for retail.",
    }),
  });
  if (!Array.isArray(createdCategories) || createdCategories.length !== 1) throw new Error("Failed to create exactly one Pets category.");
  category = createdCategories[0];
}

const productsToInsert = source.products.map((product) => ({
  slug: product.slug,
  name: product.name,
  category: "pets",
  price: 0,
  sku: product.sku,
  availability: "Availability to confirm",
  pack: product.pack,
  description: product.description,
  image: product.image,
  tags: [
    ...(bestSellerSkus.has(product.sku) ? ["Best seller"] : []),
    "Price hidden",
    product.source_type === "Gem Imports Pet Care" ? "Gem Imports" : "Previous authorised pet range",
  ],
  featured: false,
}));

const inserted = await fetchJson("products", { method: "POST", body: JSON.stringify(productsToInsert) });
if (!Array.isArray(inserted) || inserted.length !== 30) throw new Error(`Pets insertion returned ${Array.isArray(inserted) ? inserted.length : "an invalid"} result.`);

const verified = await fetchJson("products?category=eq.pets&select=sku,name,category,pack,image,tags&order=sku.asc");
const bestSellerCount = verified.filter((product) => product.tags?.includes("Best seller")).length;
const gemCount = verified.filter((product) => product.tags?.includes("Gem Imports")).length;
const restoredCount = verified.filter((product) => product.tags?.includes("Previous authorised pet range")).length;
const allImagesPresent = verified.every((product) => typeof product.image === "string" && product.image.startsWith("http"));
const allPacksPresent = verified.every((product) => /^Pack of \d+$/i.test(product.pack));
const missingSkus = source.products.filter((product) => !verified.some((entry) => entry.sku === product.sku)).map((product) => product.sku);

if (verified.length !== 30 || bestSellerCount !== 5 || gemCount !== 24 || restoredCount !== 6 || !allImagesPresent || !allPacksPresent || missingSkus.length) {
  throw new Error(`Pets verification failed: ${JSON.stringify({ count: verified.length, bestSellerCount, gemCount, restoredCount, allImagesPresent, allPacksPresent, missingSkus })}`);
}

const audit = {
  imported_at: new Date().toISOString(),
  category,
  product_count: verified.length,
  source_counts: { previous_authorised_pet_range: restoredCount, gem_imports_pet_care: gemCount },
  verified_brand_counts: source.verified_brand_counts,
  best_seller_count: bestSellerCount,
  products: verified,
};
await writeFile(new URL("../data/pets-import-verification.json", import.meta.url), JSON.stringify(audit, null, 2));
console.log(JSON.stringify({
  category,
  product_count: verified.length,
  source_counts: audit.source_counts,
  verified_brand_counts: audit.verified_brand_counts,
  best_seller_count: bestSellerCount,
  sample: verified.slice(0, 6),
}, null, 2));
