import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("Supabase audit credentials are unavailable.");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [categoryResult, productResult] = await Promise.all([
  supabase.from("categories").select("id,name,slug,summary").order("name"),
  supabase.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("category").order("id"),
]);
if (categoryResult.error) throw categoryResult.error;
if (productResult.error) throw productResult.error;

const categories = categoryResult.data || [];
const products = productResult.data || [];
const counts = Object.fromEntries(categories.map((category) => [category.slug, products.filter((product) => product.category === category.slug).length]));
fs.writeFileSync("/home/ubuntu/catalogue-audit.json", JSON.stringify({ categories, products, counts }, null, 2));
console.log(JSON.stringify({ category_count: categories.length, product_count: products.length, counts }, null, 2));
