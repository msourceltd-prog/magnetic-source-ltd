import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("Supabase verification credentials are unavailable.");
const expected = JSON.parse(fs.readFileSync(new URL("../client/src/data/catalogue-quality-specs.json", import.meta.url), "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from("products").select("name,category,sku,availability,tags,image").order("sku");
if (error) throw error;
const live = data || [];
const liveByName = new Map(live.map((product) => [product.name, product]));
const missing = expected.filter((product) => !liveByName.has(product.name));
const wrongCategory = expected.filter((product) => liveByName.get(product.name)?.category !== product.category).map((product) => ({ name: product.name, expected: product.category, actual: liveByName.get(product.name)?.category }));
const duplicateNames = live.map((product) => product.name.toLowerCase()).filter((name, index, all) => all.indexOf(name) !== index);
const misclassified = live.filter((product) => (product.name === "Insulated Lunch Pouch" && product.category === "personal-care") || (/Bamboo Peg/i.test(product.name) && product.category === "kitchen-dining"));
const unconfirmedAvailability = live.filter((product) => product.availability !== "Availability to confirm");
const nonNeutralTags = live.filter((product) => product.tags?.join("|") !== "Catalogue line");
const nonPlaceholderImages = live.filter((product) => product.image !== "/product-image-pending.svg");
if (live.length !== expected.length || missing.length || wrongCategory.length || duplicateNames.length || misclassified.length || unconfirmedAvailability.length || nonNeutralTags.length || nonPlaceholderImages.length) {
  throw new Error(JSON.stringify({ live_total: live.length, expected_total: expected.length, missing: missing.map((product) => product.name), wrong_category: wrongCategory, duplicate_names: [...new Set(duplicateNames)], misclassified, unconfirmed_availability: unconfirmedAvailability.map((product) => product.name), non_neutral_tags: nonNeutralTags.map((product) => product.name), non_placeholder_images: nonPlaceholderImages.map((product) => product.name) }, null, 2));
}
console.log(JSON.stringify({ status: "live catalogue verified", categories: 13, products: live.length, correct_category_mapping: true, transparent_availability: true, neutral_supplier_images: true }, null, 2));
