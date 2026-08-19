import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("Supabase image-audit credentials are unavailable.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from("products").select("id,name,category,image").order("category").order("id");
if (error) throw error;
const products = data || [];
const byImage = new Map();
for (const product of products) byImage.set(product.image || "MISSING", [...(byImage.get(product.image || "MISSING") || []), product]);
const repeated = [...byImage.entries()].filter(([, assigned]) => assigned.length > 1).map(([image, assigned]) => ({ image, count: assigned.length, products: assigned.map((product) => ({ id: product.id, name: product.name, category: product.category })) }));
const report = { total_products: products.length, unique_images: byImage.size, repeated_image_groups: repeated.length, repeated_assignments: repeated.reduce((sum, group) => sum + group.count, 0), repeated };
fs.writeFileSync("/home/ubuntu/product-image-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ total_products: report.total_products, unique_images: report.unique_images, repeated_image_groups: report.repeated_image_groups, repeated_assignments: report.repeated_assignments }, null, 2));
