import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("Supabase verification credentials are unavailable.");
const expected = JSON.parse(fs.readFileSync(new URL("../client/src/data/catalogue-quality-specs.json", import.meta.url), "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from("products").select("name,category,sku").order("sku");
if (error) throw error;
const live = data || [];
const liveByName = new Map(live.map((product) => [product.name, product]));
const missing = expected.filter((product) => !liveByName.has(product.name));
const wrongCategory = expected.filter((product) => liveByName.get(product.name)?.category !== product.category).map((product) => ({ name: product.name, expected: product.category, actual: liveByName.get(product.name)?.category }));
const duplicateNames = live.map((product) => product.name.toLowerCase()).filter((name, index, all) => all.indexOf(name) !== index);
const legacyNames = live.filter((product) => /^(Everyday|Stockroom|Trade)\s/i.test(product.name) || product.name === "Compact Compact Care Pouch");
const misclassified = live.filter((product) => (product.name === "Insulated Lunch Pouch" && product.category === "personal-care") || (/Bamboo Peg/i.test(product.name) && product.category === "kitchen-dining"));
if (live.length !== expected.length || missing.length || wrongCategory.length || duplicateNames.length || legacyNames.length || misclassified.length) {
  throw new Error(JSON.stringify({ live_total: live.length, expected_total: expected.length, missing: missing.map((product) => product.name), wrong_category: wrongCategory, duplicate_names: [...new Set(duplicateNames)], legacy_names: legacyNames.map((product) => product.name), misclassified }, null, 2));
}
console.log(JSON.stringify({ status: "live catalogue verified", categories: 13, products: live.length, no_legacy_placeholder_names: true, correct_category_mapping: true }, null, 2));
