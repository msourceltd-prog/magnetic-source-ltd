import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/harrisons-direct-source/compact-price-pending-products.json";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";

const departmentMeta = {
  "Household & Pet": { slug: "household-pet", summary: "Household essentials, cleaning lines and practical pet products for independent retail." },
  "Sweets & Snacks": { slug: "sweets-snacks", summary: "Confectionery, snack and impulse lines for convenience and gift retail." },
  "Charging & Electrical": { slug: "charging-electrical", summary: "Cables, charging, mobile and practical electrical accessories." },
  "Toys & Gifts": { slug: "toys-gifts", summary: "Toys, games, plush, novelty and giftable lines for retail displays." },
  "Stationery & Party": { slug: "stationery-party", summary: "Stationery, cards, wrapping and party essentials for everyday occasions." },
  "Health & Beauty": { slug: "health-beauty", summary: "Personal care, toiletries and health-and-beauty lines for routine retail demand." },
  "Seasonal & Christmas": { slug: "seasonal-christmas", summary: "Seasonal gifting, celebration and Christmas lines for timely retail displays." },
  Clearance: { slug: "clearance", summary: "Selected clearance lines for flexible trade enquiries." },
};

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const categories = Object.entries(departmentMeta).map(([name, value]) => ({ name, slug: value.slug, summary: value.summary }));
const products = source.map((product) => {
  const meta = departmentMeta[product.categoryName];
  if (!meta) throw new Error(`No category mapping for ${product.categoryName}`);
  return {
    slug: product.slug,
    name: product.name,
    category: meta.slug,
    price: 0,
    sku: product.sku,
    availability: "Trade enquiry only",
    pack: product.pack,
    description: product.description,
    image: product.image,
    tags: [product.categoryName, "Harrisons-authorized catalogue", "Price hidden"],
    featured: product.categoryName === "Sweets & Snacks" || product.categoryName === "Toys & Gifts",
  };
});

const duplicate = (field) => {
  const seen = new Map();
  products.forEach((product) => seen.set(product[field], [...(seen.get(product[field]) ?? []), product.sku]));
  return [...seen.entries()].filter(([, skus]) => skus.length > 1).map(([value, skus]) => ({ value, skus }));
};
const invalid = products.filter((product) => !product.slug || !product.name || !product.category || !product.sku || !product.pack || !product.description || !product.image || product.price !== 0 || !product.tags.includes("Price hidden"));
const publicStockLeak = products.filter((product) => /available|sold out|only \d+ left|in stock|out of stock/i.test(`${product.name} ${product.pack} ${product.description} ${product.tags.join(" ")}`));
const report = {
  preparedAt: new Date().toISOString(),
  categoryCount: categories.length,
  productCount: products.length,
  categoryCounts: categories.map((category) => ({ category: category.slug, products: products.filter((product) => product.category === category.slug).length })),
  numericCompatibilityValue: 0,
  publicPriceRule: "All records carry the Price hidden tag; public UI displays Price on request rather than 0.00.",
  publicStockRule: "No source stock or availability text is in names, pack data, descriptions, or tags.",
  invalidRows: invalid.map((product) => product.sku),
  duplicateSku: duplicate("sku"),
  duplicateSlug: duplicate("slug"),
  duplicateImage: duplicate("image"),
  publicStockLeak: publicStockLeak.map((product) => product.sku),
};

await writeFile(`${outputDirectory}/compact-price-free-categories.json`, JSON.stringify(categories, null, 2));
await writeFile(`${outputDirectory}/compact-price-free-products.json`, JSON.stringify(products, null, 2));
await writeFile(`${outputDirectory}/compact-price-free-import-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
