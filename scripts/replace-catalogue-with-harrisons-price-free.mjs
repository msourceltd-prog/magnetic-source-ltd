import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const confirmationPhrase = "DELETE_OLD_CATALOGUE_AND_IMPORT_319_PRICE_FREE_PRODUCTS";
const sourceDirectory = "/home/ubuntu/harrisons-direct-source";
const backupPath = "/home/ubuntu/magnetic-source-catalogue-backups/catalogue-before-harrisons-price-free-2026-08-20.json";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.CONFIRM_PRICE_FREE_CATALOGUE_REPLACEMENT !== confirmationPhrase) {
  throw new Error("Replacement is locked. Set CONFIRM_PRICE_FREE_CATALOGUE_REPLACEMENT to the exact final owner approval phrase only after backup review.");
}
if (!url || !serviceRoleKey) {
  throw new Error("A server-only SUPABASE_SERVICE_ROLE_KEY and the project Supabase URL are required. Never expose the service key in frontend or Cloudflare public variables.");
}

const [backup, categoriesToImport, productsToImport] = await Promise.all([
  readFile(backupPath, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/compact-price-free-categories.json`, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/compact-price-free-products.json`, "utf8").then(JSON.parse),
]);

if (categoriesToImport.length !== 8 || productsToImport.length !== 319) {
  throw new Error(`Import payload mismatch: expected 8 categories and 319 products, received ${categoriesToImport.length} categories and ${productsToImport.length} products.`);
}
if (productsToImport.some((product) => product.price !== 0 || !product.tags?.includes("Price hidden") || !product.image)) {
  throw new Error("Import payload violates the price-free or exact-image policy. Stop before changing the live catalogue.");
}

const expectedOldProductCount = backup.products.length;
const oldCategorySlugs = backup.categories.map((category) => category.slug);
const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

const [{ data: currentCategories, error: currentCategoryError }, { data: currentProducts, error: currentProductError }] = await Promise.all([
  supabase.from("categories").select("id,name,slug,summary").order("id"),
  supabase.from("products").select("id,slug,sku,category").order("id"),
]);
if (currentCategoryError) throw currentCategoryError;
if (currentProductError) throw currentProductError;
if (currentProducts.length !== expectedOldProductCount) throw new Error(`Live product count changed from the fresh backup baseline (${expectedOldProductCount} expected, ${currentProducts.length} found). Stop and create a new backup.`);
if (currentCategories.length !== backup.categories.length) throw new Error(`Live category count changed from the fresh backup baseline (${backup.categories.length} expected, ${currentCategories.length} found). Stop and create a new backup.`);

const oldSlugs = new Set(currentProducts.map((product) => product.slug));
const oldSkus = new Set(currentProducts.map((product) => product.sku));
const productCollisions = productsToImport.filter((product) => oldSlugs.has(product.slug) || oldSkus.has(product.sku));
const categoryCollisions = categoriesToImport.filter((category) => currentCategories.some((current) => current.slug === category.slug));
if (productCollisions.length || categoryCollisions.length) {
  throw new Error(`Replacement collision detected: ${productCollisions.length} product collision(s), ${categoryCollisions.length} category collision(s). Old catalogue was not changed.`);
}

const { error: insertCategoriesError } = await supabase.from("categories").insert(categoriesToImport);
if (insertCategoriesError) throw insertCategoriesError;
for (const batch of chunk(productsToImport, 100)) {
  const { error } = await supabase.from("products").insert(batch);
  if (error) throw error;
}

const { data: importedProducts, error: importedReadError } = await supabase
  .from("products")
  .select("id,sku,category,price,tags,image")
  .in("category", categoriesToImport.map((category) => category.slug));
if (importedReadError) throw importedReadError;
if (importedProducts.length !== productsToImport.length) throw new Error(`New product validation failed: expected ${productsToImport.length}, found ${importedProducts.length}. Old catalogue rows were not deleted.`);
if (importedProducts.some((product) => Number(product.price) !== 0 || !product.tags?.includes("Price hidden") || !product.image)) {
  throw new Error("New product validation failed: a price-free tag, compatibility value, or exact image is missing. Old catalogue rows were not deleted.");
}

for (const batch of chunk(currentProducts.map((product) => product.id), 100)) {
  const { error } = await supabase.from("products").delete().in("id", batch);
  if (error) throw error;
}
for (const batch of chunk(oldCategorySlugs, 50)) {
  const { error } = await supabase.from("categories").delete().in("slug", batch);
  if (error) throw error;
}

const [{ count: finalProductCount, error: finalProductError }, { count: finalCategoryCount, error: finalCategoryError }] = await Promise.all([
  supabase.from("products").select("id", { count: "exact", head: true }),
  supabase.from("categories").select("id", { count: "exact", head: true }),
]);
if (finalProductError) throw finalProductError;
if (finalCategoryError) throw finalCategoryError;
if (finalProductCount !== productsToImport.length || finalCategoryCount !== categoriesToImport.length) {
  throw new Error(`Final catalogue validation failed: expected 319 products and 8 categories, found ${finalProductCount ?? 0} products and ${finalCategoryCount ?? 0} categories.`);
}

console.log(JSON.stringify({
  completed: true,
  importedProducts: finalProductCount,
  importedCategories: finalCategoryCount,
  pricePolicy: "All price values are hidden publicly; zero is retained only for the existing non-null database contract.",
  stockPolicy: "No supplier stock or availability count is imported or displayed.",
  preservedTables: ["profiles", "demo_orders", "demo_order_items", "auth.users", "storage.objects"],
}, null, 2));
