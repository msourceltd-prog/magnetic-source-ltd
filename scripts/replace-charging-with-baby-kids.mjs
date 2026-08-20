import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const confirmationPhrase = "REPLACE_CHARGING_ELECTRICAL_WITH_40_BABY_KIDS_PRODUCTS";
const sourceDirectory = "/home/ubuntu/harrisons-direct-source";
const backupPath = "/home/ubuntu/magnetic-source-catalogue-backups/charging-electrical-before-baby-kids-2026-08-20.json";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.CONFIRM_BABY_KIDS_REPLACEMENT !== confirmationPhrase) {
  throw new Error("Replacement is locked. Set CONFIRM_BABY_KIDS_REPLACEMENT to the exact owner confirmation phrase only after backup review.");
}
if (!url || !serviceRoleKey) throw new Error("A server-only SUPABASE_SERVICE_ROLE_KEY and Supabase URL are required. Never expose the service key in frontend code or Cloudflare.");

const [backup, category, products] = await Promise.all([
  readFile(backupPath, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/baby-kids-price-free-category.json`, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/baby-kids-price-free-products.json`, "utf8").then(JSON.parse),
]);
if (backup.categories.length !== 1 || backup.categories[0].slug !== "charging-electrical" || backup.products.length !== 40) {
  throw new Error("Targeted backup does not match the expected 40-product Charging & Electrical category.");
}
if (category.slug !== "baby-kids" || products.length !== 40 || products.some((product) => product.category !== category.slug || product.price !== 0 || !product.tags?.includes("Price hidden") || !product.image)) {
  throw new Error("Baby & Kids payload violates the validated category, price-hidden, or image policy.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: liveCategories, error: categoryReadError }, { data: liveOldProducts, error: productReadError }, { data: allProducts, error: allProductReadError }] = await Promise.all([
  supabase.from("categories").select("id,name,slug,summary").order("id"),
  supabase.from("products").select("id,slug,sku,category").eq("category", "charging-electrical").order("id"),
  supabase.from("products").select("slug,sku").order("id"),
]);
if (categoryReadError) throw categoryReadError;
if (productReadError) throw productReadError;
if (allProductReadError) throw allProductReadError;
if (liveOldProducts.length !== 40 || !liveCategories.some((item) => item.slug === "charging-electrical") || liveCategories.some((item) => item.slug === "baby-kids")) {
  throw new Error("Live targeted category baseline changed. Stop and create a new targeted backup before replacement.");
}
const existingSku = new Set(allProducts.map((product) => product.sku));
const existingSlug = new Set(allProducts.map((product) => product.slug));
const collisions = products.filter((product) => existingSku.has(product.sku) || existingSlug.has(product.slug));
if (collisions.length) throw new Error(`Baby & Kids collision detected for ${collisions.map((product) => product.sku).join(", ")}. Live data was not changed.`);

const { error: categoryInsertError } = await supabase.from("categories").insert(category);
if (categoryInsertError) throw categoryInsertError;
const { error: productInsertError } = await supabase.from("products").insert(products);
if (productInsertError) throw productInsertError;

const { data: imported, error: importedReadError } = await supabase.from("products").select("id,sku,category,price,tags,image").eq("category", "baby-kids");
if (importedReadError) throw importedReadError;
if (imported.length !== 40 || imported.some((product) => Number(product.price) !== 0 || !product.tags?.includes("Price hidden") || !product.image)) {
  throw new Error("New Baby & Kids validation failed. The old category has not been deleted.");
}

const { error: oldProductDeleteError } = await supabase.from("products").delete().in("id", liveOldProducts.map((product) => product.id));
if (oldProductDeleteError) throw oldProductDeleteError;
const { error: oldCategoryDeleteError } = await supabase.from("categories").delete().eq("slug", "charging-electrical");
if (oldCategoryDeleteError) throw oldCategoryDeleteError;

const [{ count: finalBabyCount, error: finalBabyError }, { count: oldCount, error: oldCountError }, { count: categoryCount, error: categoryCountError }] = await Promise.all([
  supabase.from("products").select("id", { count: "exact", head: true }).eq("category", "baby-kids"),
  supabase.from("products").select("id", { count: "exact", head: true }).eq("category", "charging-electrical"),
  supabase.from("categories").select("id", { count: "exact", head: true }),
]);
if (finalBabyError) throw finalBabyError;
if (oldCountError) throw oldCountError;
if (categoryCountError) throw categoryCountError;
if (finalBabyCount !== 40 || oldCount !== 0 || categoryCount !== 8) {
  throw new Error(`Final targeted validation failed: Baby & Kids=${finalBabyCount}, Charging & Electrical=${oldCount}, categories=${categoryCount}.`);
}
console.log(JSON.stringify({ completed: true, removedCategory: "charging-electrical", importedCategory: "baby-kids", importedProducts: finalBabyCount, preserved: ["profiles", "demo_orders", "demo_order_items", "auth.users", "storage.objects"] }, null, 2));
