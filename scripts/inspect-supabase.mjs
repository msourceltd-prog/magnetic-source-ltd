import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error(JSON.stringify({ connected: false, reason: "SUPABASE_URL or SUPABASE_KEY is unavailable" }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const tableNames = ["profiles", "categories", "products", "demo_orders", "demo_order_items"];
const tables = {};
const expectedColumns = {
  profiles: "id,role,created_at",
  categories: "id,name,slug,summary,created_at",
  products: "id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at",
  demo_orders: "id,order_reference,customer_name,customer_email,company,address_line_1,address_line_2,city,postcode,subtotal,status,created_at",
  demo_order_items: "id,demo_order_id,product_sku,product_name,unit_price,quantity",
};

for (const tableName of tableNames) {
  const { error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true }).limit(1);
  const { error: schemaError } = await supabase.from(tableName).select(expectedColumns[tableName]).limit(1);
  tables[tableName] = error
    ? { exists: false, code: error.code || null, message: error.message }
    : { exists: true, count: count ?? 0, expectedColumnsReady: !schemaError, schemaMessage: schemaError?.message || null };
}

const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
const productImagesBucket = bucketsError
  ? { exists: false, message: bucketsError.message }
  : { exists: (buckets || []).some((bucket) => bucket.id === "product-images") };

console.log(JSON.stringify({
  connected: true,
  host: new URL(url).host,
  tables,
  productImagesBucket,
}, null, 2));
