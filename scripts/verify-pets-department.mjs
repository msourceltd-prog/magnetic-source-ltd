const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

if (!baseUrl) throw new Error("Missing Supabase project URL.");

const fetchRows = async (path) => {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const body = await response.json();
  if (!response.ok || !Array.isArray(body)) throw new Error(`Public catalogue verification failed for ${path}: ${response.status}`);
  return body;
};

const [categories, products] = await Promise.all([
  fetchRows("categories?select=name,slug,summary"),
  fetchRows("products?select=sku,name,category,pack,image,tags"),
]);
const orderedSlugs = ["household-pet", "sweets-snacks", "toys-gifts", "pets", "stationery-party", "health-beauty", "seasonal-christmas", "clearance", "baby-kids"];
const categoryCounts = orderedSlugs.map((slug) => ({
  slug,
  name: categories.find((category) => category.slug === slug)?.name ?? null,
  product_count: products.filter((product) => product.category === slug).length,
}));
const pets = products.filter((product) => product.category === "pets");
const report = {
  total_product_count: products.length,
  category_counts: categoryCounts,
  pets: {
    category: categories.find((category) => category.slug === "pets") ?? null,
    product_count: pets.length,
    best_seller_count: pets.filter((product) => product.tags?.includes("Best seller")).length,
    gem_imports_count: pets.filter((product) => product.tags?.includes("Gem Imports")).length,
    restored_authorised_count: pets.filter((product) => product.tags?.includes("Previous authorised pet range")).length,
    all_images_present: pets.every((product) => typeof product.image === "string" && product.image.startsWith("http")),
    all_packs_present: pets.every((product) => /^Pack of \d+$/i.test(product.pack)),
  },
};

if (!report.pets.category || report.pets.category.name !== "Pets" || report.pets.product_count !== 30 || report.pets.best_seller_count !== 5 || report.pets.gem_imports_count !== 24 || report.pets.restored_authorised_count !== 6 || !report.pets.all_images_present || !report.pets.all_packs_present) {
  throw new Error(`Live Pets department verification failed: ${JSON.stringify(report)}`);
}

console.log(JSON.stringify(report, null, 2));
