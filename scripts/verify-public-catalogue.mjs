import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(JSON.stringify({ configured: false, reason: "Public Supabase environment values are unavailable" }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [categories, products] = await Promise.all([
  supabase.from("categories").select("id", { count: "exact", head: true }),
  supabase.from("products").select("id", { count: "exact", head: true }),
]);

console.log(JSON.stringify({
  configured: true,
  categories: categories.error ? { readable: false, message: categories.error.message } : { readable: true, count: categories.count ?? 0 },
  products: products.error ? { readable: false, message: products.error.message } : { readable: true, count: products.count ?? 0 },
}, null, 2));
