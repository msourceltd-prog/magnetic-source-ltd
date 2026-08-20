import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/harrisons-direct-source/baby-kids-replacement/baby-kids-products.json";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";
const source = JSON.parse(await readFile(sourcePath, "utf8"));

if (source.length !== 40) throw new Error(`Expected 40 approved Baby & Kids records, found ${source.length}.`);
const category = {
  name: "Baby & Kids",
  slug: "baby-kids",
  summary: "Baby care, nursery essentials and practical children’s lines for everyday retail.",
};
const products = source.map((product) => ({
  slug: product.slug,
  name: product.name,
  category: category.slug,
  price: 0,
  sku: product.sku,
  availability: "Trade enquiry only",
  pack: product.pack,
  description: product.description,
  image: product.image,
  tags: ["Baby & Kids", "Harrisons-authorized catalogue", "Price hidden"],
  featured: false,
}));
const duplicate = (field) => [...new Set(products.map((product) => product[field]))].length !== products.length;
const invalid = products.filter((product) => !product.slug || !product.name || !product.sku || !product.pack || !product.description || !product.image || product.price !== 0 || !product.tags.includes("Price hidden"));
const stockLeak = products.filter((product) => /available|sold out|in stock|out of stock|only \d+ left/i.test(`${product.name} ${product.pack} ${product.description} ${product.tags.join(" ")}`));
const report = {
  preparedAt: new Date().toISOString(),
  category,
  productCount: products.length,
  uniqueSku: !duplicate("sku"),
  uniqueSlug: !duplicate("slug"),
  uniqueImage: !duplicate("image"),
  invalidRows: invalid.map((product) => product.sku),
  stockLeak: stockLeak.map((product) => product.sku),
  publicPricePolicy: "Database compatibility price is 0 only; public UI shows Price on request.",
};
if (invalid.length || duplicate("sku") || duplicate("slug") || duplicate("image") || stockLeak.length) {
  throw new Error(`Baby & Kids import validation failed: ${JSON.stringify(report)}`);
}
await writeFile(`${outputDirectory}/baby-kids-price-free-category.json`, JSON.stringify(category, null, 2));
await writeFile(`${outputDirectory}/baby-kids-price-free-products.json`, JSON.stringify(products, null, 2));
await writeFile(`${outputDirectory}/baby-kids-price-free-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
