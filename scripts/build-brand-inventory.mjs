import fs from "node:fs";
import path from "node:path";

const auditDirectory = path.resolve("data/brand-audit");
const products = JSON.parse(fs.readFileSync(path.join(auditDirectory, "products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(auditDirectory, "categories.json"), "utf8"));

const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
const namedBrands = [
  "Amplex", "Aquafresh", "Aussie", "Baylis & Harding", "Bubble T", "Candy Kittens", "Capri Sun", "Chupa Chups",
  "Cuticura", "Denman", "Dove", "Enliven", "Face Facts", "Femfresh", "FLO", "Fresh Start", "Got2b", "Good Boy",
  "Golden Rounds", "Grow with Peppa", "Gummi King", "Haribo", "Imperial Leather", "Jakemans", "Johny Bee", "Just Stationery",
  "Kandelicious", "La Vida Caribena", "Little Learners", "Malibu", "Maoam", "Man' Stuff", "Nivea", "Nylabone",
  "Original Source", "Palmolive", "Pantene", "Paw Patrol", "Peppa Pig", "Pez", "Pokémon", "Rennie", "Rosewood", "Snoopy",
  "Squishmallows", "Star Wars: Unlimited", "Sure", "Swizzels", "Toxic Waste", "Umbro", "Van Holten", "Wilkinson Sword",
  "Wisdom", "Wonder Cookies", "World's Smallest", "Zuru"
];

const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const brandPatterns = namedBrands.map((brand) => ({
  brand,
  pattern: new RegExp(`(^|[^A-Za-z0-9])${escapeForRegex(brand).replace("Pokémon", "Pok[eé]mon")}($|[^A-Za-z0-9])`, "i"),
}));

const results = new Map();
const unbranded = new Map();
const brandedProducts = [];
for (const product of products) {
  const match = brandPatterns.find(({ pattern }) => pattern.test(product.name) || pattern.test(product.description || ""));
  if (match) {
    const record = results.get(match.brand) || { brand: match.brand, product_ids: [], categories: new Map(), examples: [] };
    record.product_ids.push(product.id);
    record.categories.set(product.category, (record.categories.get(product.category) || 0) + 1);
    if (record.examples.length < 5) record.examples.push(product.name);
    results.set(match.brand, record);
    brandedProducts.push({
      brand: match.brand,
      category: categoryNames.get(product.category) || product.category,
      category_slug: product.category,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku || "",
    });
  } else {
    const list = unbranded.get(product.category) || [];
    list.push({ id: product.id, name: product.name });
    unbranded.set(product.category, list);
  }
}

const inventory = [...results.values()]
  .map((record) => ({
    brand: record.brand,
    product_count: record.product_ids.length,
    product_ids: record.product_ids.sort((a, b) => Number(a) - Number(b)),
    categories: [...record.categories.entries()]
      .map(([slug, count]) => ({ slug, name: categoryNames.get(slug) || slug, product_count: count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    examples: record.examples,
  }))
  .sort((a, b) => b.product_count - a.product_count || a.brand.localeCompare(b.brand));

const byCategory = [...categoryNames.entries()]
  .filter(([slug, name]) => slug !== "homepage-settings" && name.toLowerCase() !== "homepage settings")
  .map(([slug, name]) => {
    const categoryProducts = products.filter((product) => product.category === slug);
    const brandedCount = categoryProducts.filter((product) => brandPatterns.some(({ pattern }) => pattern.test(product.name) || pattern.test(product.description || ""))).length;
    const genericProducts = unbranded.get(slug) || [];
    return {
      slug,
      name,
      product_count: categoryProducts.length,
      explicit_brand_product_count: brandedCount,
      no_confident_brand_count: genericProducts.length,
      no_confident_brand_examples: genericProducts.slice(0, 8).map((product) => product.name),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const payload = {
  scope: { total_products: products.length, categories: byCategory.length, methodology: "Only product-name or description matches to an explicitly named brand are counted. Supplier references and generic product descriptors are not counted as brands." },
  brands: inventory,
  categories: byCategory,
};

fs.writeFileSync(path.join(auditDirectory, "brand-inventory.json"), `${JSON.stringify(payload, null, 2)}\n`);

const lines = [
  "# Magnetic Source Website Brand Inventory",
  "",
  `**Scope:** ${products.length} live catalogue products across ${byCategory.length} customer-facing categories.`,
  "",
  "> Only an explicit brand match in a product name or description is counted. Supplier references and generic product descriptors are left unbranded rather than guessed.",
  "",
  "## Recognized Explicit Brands",
  "",
  "| Brand | Products | Categories | Example product |",
  "|---|---:|---|---|",
  ...inventory.map((record) => `| ${record.brand} | ${record.product_count} | ${record.categories.map((category) => `${category.name} (${category.product_count})`).join(", ")} | ${record.examples[0]} |`),
  "",
  "## Brand Coverage by Category",
  "",
  "| Category | Products | Explicit-brand products | No confident brand |",
  "|---|---:|---:|---:|",
  ...byCategory.map((category) => `| ${category.name} | ${category.product_count} | ${category.explicit_brand_product_count} | ${category.no_confident_brand_count} |`),
  "",
  "## Interpretation",
  "",
  "Large generic ranges, especially Seasonal & Christmas, Stationery, Household, Baby & Kids, and Toys & Gifts, are intentionally not attributed to a brand without an explicit name in the record. This avoids presenting a product range or supplier reference as a manufacturer brand.",
  "",
];
fs.writeFileSync(path.join(auditDirectory, "brand-inventory.md"), `${lines.join("\n")}\n`);

const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const brandProductRows = [
  ["Brand", "Category", "Category slug", "Product ID", "Product name", "SKU"],
  ...brandedProducts
    .sort((left, right) => left.brand.localeCompare(right.brand) || left.product_name.localeCompare(right.product_name))
    .map((product) => [product.brand, product.category, product.category_slug, product.product_id, product.product_name, product.sku]),
];
fs.writeFileSync(path.join(auditDirectory, "brand-product-list.csv"), `${brandProductRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);

const unbrandedRows = [
  ["Category", "Category slug", "Product ID", "Product name"],
  ...[...unbranded.entries()].flatMap(([slug, list]) => list.map((product) => [categoryNames.get(slug) || slug, slug, product.id, product.name])),
];
fs.writeFileSync(path.join(auditDirectory, "unbranded-product-review.csv"), `${unbrandedRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);
console.log(JSON.stringify({ brands: inventory.length, explicit_brand_products: inventory.reduce((total, brand) => total + brand.product_count, 0), total_products: products.length }, null, 2));
