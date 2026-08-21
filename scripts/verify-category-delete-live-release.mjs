import { readFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const allowedCategories = ["baby-kids", "clearance", "health-beauty", "household-pet", "seasonal-christmas", "stationery-party", "sweets-snacks", "toys-gifts"];
const deleteTest = JSON.parse(await readFile(`${projectRoot}/data/permanent-delete-persistence-test-report.json`, "utf8"));
const sitemap = await readFile(`${projectRoot}/client/public/sitemap.xml`, "utf8");
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,slug,name,sku,category&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Could not read live products: ${response.status} ${await response.text()}`);
const products = await response.json();
const invalid = products.filter((product) => !allowedCategories.includes(product.category));
const deleteTestPresent = products.filter((product) => product.sku === deleteTest.testedSku || product.slug === "admin-delete-test-20260821");
const missingRoutes = products.filter((product) => !sitemap.includes(`https://magneticsource.uk/product/${product.slug}`));
const categoryCounts = Object.fromEntries(allowedCategories.map((category) => [category, products.filter((product) => product.category === category).length]));
if (products.length !== 411 || invalid.length || deleteTestPresent.length || missingRoutes.length || (sitemap.match(/<url>/g) || []).length !== 427) {
  throw new Error(`Verification failed: total=${products.length}; invalid=${invalid.length}; deleteTestPresent=${deleteTestPresent.length}; missingRoutes=${missingRoutes.length}; sitemapUrls=${(sitemap.match(/<url>/g) || []).length}.`);
}
console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), totalProducts: products.length, categoryCounts, invalidCategoryProducts: 0, deleteTestProductStillAbsent: true, productRoutesPresent: products.length, sitemapUrls: (sitemap.match(/<url>/g) || []).length }, null, 2));
