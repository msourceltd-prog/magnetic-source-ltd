import { mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Read-only Supabase credentials are unavailable.");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
  supabase.from("categories").select("id,name,slug,summary").eq("slug", "charging-electrical"),
  supabase.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").eq("category", "charging-electrical").order("id"),
]);
if (categoryError) throw categoryError;
if (productError) throw productError;
if (categories.length !== 1 || products.length !== 40) {
  throw new Error(`Expected one Charging & Electrical category with 40 products; found ${categories.length} category and ${products.length} products.`);
}

const outputDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const outputPath = `${outputDirectory}/charging-electrical-before-baby-kids-2026-08-20.json`;
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, JSON.stringify({ createdAt: new Date().toISOString(), categories, products }, null, 2));
console.log(JSON.stringify({ backup: outputPath, category: categories[0].slug, productCount: products.length }, null, 2));
