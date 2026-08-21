import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rawDatasetPath = resolve("data/four-category-product-expansion-collision-safe.json");
const preparedDatasetPath = resolve("data/four-category-product-expansion.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const categoryConfig = {
  "household-pet": { label: "Household & Pet", prefix: "HPE" },
  "sweets-snacks": { label: "Sweets & Snacks", prefix: "SWE" },
  "toys-gifts": { label: "Toys & Gifts", prefix: "TGY" },
  "stationery-party": { label: "Stationery & Party", prefix: "STX" },
};
const expectedCategories = Object.keys(categoryConfig);
const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/[’'`]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
const slugify = (value) => normalize(value).replace(/\s+/g, "-");

const request = async (path) => {
  const response = await fetch(`${supabaseUrl}${path}`, { headers: { apikey: publicKey } });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
};

const verifyImage = async (url) => {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30000) });
      const type = response.headers.get("content-type") || "";
      if (response.ok && type.startsWith("image/")) return { url, ok: true, status: response.status, type };
      lastError = { url, ok: false, status: response.status, type };
    } catch (error) {
      lastError = { url, ok: false, status: "network-error", type: "", reason: error instanceof Error ? error.message : String(error) };
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  return lastError;
};

const collisionSafeSource = JSON.parse(await readFile(rawDatasetPath, "utf8"));
const rawProducts = collisionSafeSource.products;
const categoryCounts = Object.fromEntries(expectedCategories.map((category) => [category, rawProducts.filter((product) => product.category === category).length]));
for (const [category, count] of Object.entries(categoryCounts)) {
  if (count !== 15) throw new Error(`${category} must contain exactly 15 candidates, found ${count}.`);
}
if (rawProducts.length !== 60) throw new Error(`Expected 60 candidates, found ${rawProducts.length}.`);
if (rawProducts.some((product) => !categoryConfig[product.category] || !product.name || !product.sku || !product.pack || !product.image || product.imagePresentation !== "full-product-contain")) {
  throw new Error("Every candidate must have a known requested category, factual name/SKU/pack, source image, and the full-product-contain presentation rule.");
}

const sourceSkus = new Set();
const sourceNames = new Set();
for (const product of rawProducts) {
  const normalizedName = normalize(product.name);
  if (sourceSkus.has(product.sku) || sourceNames.has(normalizedName)) throw new Error(`Duplicate candidate identified: ${product.name} / ${product.sku}.`);
  sourceSkus.add(product.sku);
  sourceNames.add(normalizedName);
}

const imageChecks = [];
for (let index = 0; index < rawProducts.length; index += 4) {
  imageChecks.push(...await Promise.all(rawProducts.slice(index, index + 4).map((product) => verifyImage(product.image))));
}
const badImages = imageChecks.filter((image) => !image.ok);
if (badImages.length) throw new Error(`Image validation failed for ${badImages.length} candidate(s): ${JSON.stringify(badImages)}`);

const liveProducts = await request("/rest/v1/products?select=slug,name,sku,category");
const liveSlugs = new Set(liveProducts.map((product) => product.slug));
const liveSkus = new Set(liveProducts.map((product) => product.sku));
const liveNames = new Set(liveProducts.map((product) => normalize(product.name)));
const products = rawProducts.map((product) => {
  const config = categoryConfig[product.category];
  const sku = `${config.prefix}-${product.sku}`;
  const slug = `${product.category}-${slugify(product.name)}-${product.sku.toLowerCase()}`;
  return {
    slug,
    name: product.name,
    category: product.category,
    price: 0,
    sku,
    availability: "Trade enquiry",
    pack: product.pack,
    description: `${product.name} is supplied as ${product.pack.toLowerCase()}. Supplier reference: ${product.sku}.`,
    image: product.image,
    tags: [config.label, "Price hidden"],
    featured: false,
    sourceUrl: product.sourceUrl,
    sourceSku: product.sku,
    imageAssessment: "Verified supplier product image; use a contained full-product frame so the complete package, item, bottle, handle, or edge remains visible without cropping or excessive zoom.",
  };
});
if (products.some((product) => liveSlugs.has(product.slug) || liveSkus.has(product.sku) || liveNames.has(normalize(product.name)))) {
  const conflicts = products.filter((product) => liveSlugs.has(product.slug) || liveSkus.has(product.sku) || liveNames.has(normalize(product.name)));
  throw new Error(`Candidate conflicts with a live product: ${JSON.stringify(conflicts.map((product) => ({ name: product.name, sku: product.sku })))}`);
}

const prepared = {
  source: "Verified Harrison's Direct supplier product pages",
  generatedAt: new Date().toISOString(),
  imageRule: "Every product uses a verified matching supplier packshot and must render in a contained full-product image frame with no crop, stretch, or excessive zoom.",
  categoryCounts,
  products,
};
await writeFile(preparedDatasetPath, `${JSON.stringify(prepared, null, 2)}\n`);
console.log(JSON.stringify({ preparedProducts: products.length, categoryCounts, imageChecks: imageChecks.length, liveProducts: liveProducts.length, preparedDatasetPath }, null, 2));
