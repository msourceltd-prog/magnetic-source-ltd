import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const confirmationPhrase = "DELETE_OLD_CATALOGUE_AFTER_BULK_SWEETS_IMPORT";
const sourceDirectory = "/home/ubuntu/bulk-wholesale-sweets-source";
const backupPath = "/home/ubuntu/magnetic-source-catalogue-backups/catalogue-before-bulk-sweets-2026-08-20.json";
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.CONFIRM_CATALOGUE_REPLACEMENT !== confirmationPhrase) {
  throw new Error("Replacement is locked. Set CONFIRM_CATALOGUE_REPLACEMENT to the exact approved confirmation phrase only after final owner approval.");
}
if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and a server-only SUPABASE_SERVICE_ROLE_KEY are required. Do not expose this key in the frontend or Cloudflare public variables.");
}

const [backup, categoriesToImport, productsToImport] = await Promise.all([
  readFile(backupPath, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/categories-import.json`, "utf8").then(JSON.parse),
  readFile(`${sourceDirectory}/products-import.json`, "utf8").then(JSON.parse),
]);

const oldCategorySlugs = backup.categories.map((category) => category.slug);
const expectedOldProductCount = backup.products.length;
const newCategory = categoriesToImport[0];
const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

const [{ data: currentCategories, error: currentCategoryError }, { data: currentProducts, error: currentProductError }] = await Promise.all([
  supabase.from("categories").select("id,name,slug,summary").order("id"),
  supabase.from("products").select("id,slug,sku,category").order("id"),
]);
if (currentCategoryError) throw currentCategoryError;
if (currentProductError) throw currentProductError;
if (currentProducts.length !== expectedOldProductCount) throw new Error(`Live product count changed from the backup baseline (${expectedOldProductCount} expected, ${currentProducts.length} found). Stop and create a fresh backup.`);
if (currentCategories.some((category) => category.slug === newCategory.slug)) throw new Error(`Category ${newCategory.slug} already exists. Stop to avoid an ambiguous replacement.`);

const existingSlugs = new Set(currentProducts.map((product) => product.slug));
const existingSkus = new Set(currentProducts.map((product) => product.sku));
const collisions = productsToImport.filter((product) => existingSlugs.has(product.slug) || existingSkus.has(product.sku));
if (collisions.length) throw new Error(`New source products conflict with ${collisions.length} current SKU or slug values. Stop and resolve before replacement.`);

const { error: categoryInsertError } = await supabase.from("categories").insert(newCategory);
if (categoryInsertError) throw categoryInsertError;

for (const batch of chunk(productsToImport, 150)) {
  const { error } = await supabase.from("products").insert(batch);
  if (error) throw error;
}

const { count: importedCount, error: importedCountError } = await supabase
  .from("products")
  .select("id", { count: "exact", head: true })
  .eq("category", newCategory.slug);
if (importedCountError) throw importedCountError;
if (importedCount !== productsToImport.length) throw new Error(`Imported product count mismatch (${productsToImport.length} expected, ${importedCount ?? 0} found). Old catalogue rows were not deleted.`);

for (const batch of chunk(currentProducts.map((product) => product.id), 150)) {
  const { error } = await supabase.from("products").delete().in("id", batch);
  if (error) throw error;
}

const { error: categoryDeleteError } = await supabase.from("categories").delete().in("slug", oldCategorySlugs);
if (categoryDeleteError) throw categoryDeleteError;

const [{ count: finalProductCount, error: finalProductCountError }, { count: finalCategoryCount, error: finalCategoryCountError }] = await Promise.all([
  supabase.from("products").select("id", { count: "exact", head: true }),
  supabase.from("categories").select("id", { count: "exact", head: true }),
]);
if (finalProductCountError) throw finalProductCountError;
if (finalCategoryCountError) throw finalCategoryCountError;
if (finalProductCount !== productsToImport.length || finalCategoryCount !== 1) {
  throw new Error(`Final catalogue validation failed (${finalProductCount ?? 0} products and ${finalCategoryCount ?? 0} categories). Preserve the backup and stop for investigation.`);
}

console.log(JSON.stringify({
  completed: true,
  importedCategory: newCategory.slug,
  importedProducts: finalProductCount,
  remainingCategories: finalCategoryCount,
  preservedTables: ["profiles", "demo_orders", "demo_order_items", "auth.users", "storage.objects"],
  stockPolicy: "No source inventory counts were imported; public UI hides availability.",
}, null, 2));
