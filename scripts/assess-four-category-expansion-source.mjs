import { readFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/harrisons-direct-source/compact-public-products.json";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const requestedCategories = ["household-pet", "sweets-snacks", "toys-gifts", "stationery-party"];

const request = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  const text = await response.text();
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const live = await request("/rest/v1/products?select=slug,sku,name,category&order=id");
const liveSlugs = new Set(live.map((product) => product.slug));
const liveSkus = new Set(live.map((product) => product.sku));
const liveNames = new Set(live.map((product) => product.name));

const assessment = requestedCategories.map((category) => {
  const candidates = source.filter((product) => product.category === category);
  const unused = candidates.filter((product) => !liveSlugs.has(product.slug) && !liveSkus.has(product.sku) && !liveNames.has(product.name));
  return {
    category,
    supplierCandidates: candidates.length,
    unusedSupplierCandidates: unused.length,
    unused: unused.map(({ name, sku, slug, pack, image, sourceUrl }) => ({ name, sku, slug, pack, image, sourceUrl })),
  };
});

console.log(JSON.stringify({
  targetPerCategory: 15,
  liveTotal: live.length,
  assessment,
}, null, 2));
