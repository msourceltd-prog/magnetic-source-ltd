import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and a public read key are required for live validation.");

const expectedCounts = {
  "charging-electrical": 40,
  clearance: 39,
  "health-beauty": 40,
  "household-pet": 40,
  "seasonal-christmas": 40,
  "stationery-party": 40,
  "sweets-snacks": 40,
  "toys-gifts": 40,
};
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
  supabase.from("categories").select("name,slug,summary").order("slug"),
  supabase.from("products").select("slug,name,category,price,sku,availability,pack,description,image,tags").order("id"),
]);
if (categoryError) throw categoryError;
if (productError) throw productError;

const counts = Object.fromEntries(Object.keys(expectedCounts).map((slug) => [slug, products.filter((product) => product.category === slug).length]));
const duplicate = (field) => {
  const seen = new Map();
  products.forEach((product) => seen.set(product[field], (seen.get(product[field]) || 0) + 1));
  return [...seen.entries()].filter(([, count]) => count > 1).map(([value]) => value);
};
const stockLeak = products.filter((product) => /available|sold out|in stock|out of stock|only \d+ left/i.test(`${product.name} ${product.pack} ${product.description} ${(product.tags || []).join(" ")}`));
const report = {
  categoryCount: categories.length,
  productCount: products.length,
  categorySlugs: categories.map((category) => category.slug),
  categoryCounts: counts,
  expectedCategoryCounts: expectedCounts,
  hiddenPriceProducts: products.filter((product) => product.tags?.includes("Price hidden") && Number(product.price) === 0).length,
  missingImages: products.filter((product) => !product.image || product.image.includes("product-image-pending")).map((product) => product.sku),
  duplicateSku: duplicate("sku"),
  duplicateSlug: duplicate("slug"),
  duplicateImage: duplicate("image"),
  stockLeak: stockLeak.map((product) => product.sku),
  priceFreeReady: categories.length === 8 && products.length === 319 && products.filter((product) => product.tags?.includes("Price hidden") && Number(product.price) === 0).length === 319 && !stockLeak.length,
};
console.log(JSON.stringify(report, null, 2));
