import { readFile, writeFile } from "node:fs/promises";

const directory = "/home/ubuntu/bulk-wholesale-sweets-source";
const sourceRows = JSON.parse(await readFile(`${directory}/products-normalized.json`, "utf8"));

const category = {
  name: "Sweets & Confectionery",
  slug: "sweets-confectionery",
  summary: "Supplier-authorized confectionery lines with clear ex-VAT prices, pack information, and product imagery.",
};

const mappedProducts = sourceRows.map((row) => ({
  slug: row.slug,
  name: row.name,
  category: category.slug,
  price: row.price,
  sku: row.sku,
  availability: "Availability on request",
  pack: row.pack,
  description: row.description,
  image: row.image,
  tags: [...new Set(row.tags.filter((tag) => tag && tag !== "Sweets"))].slice(0, 12),
  featured: false,
}));

const sourceManifest = sourceRows.map((row) => ({
  slug: row.slug,
  sku: row.sku,
  sourceProductId: row.sourceProductId,
  sourceVariantId: row.sourceVariantId,
  sourceUrl: row.sourceUrl,
  sourceUpdatedAt: row.sourceUpdatedAt,
  descriptionSource: row.descriptionSource,
  priceBasis: row.priceBasis,
  supplierStockCaptured: false,
}));

const tagCounts = Object.fromEntries(
  [...new Set(mappedProducts.flatMap((row) => row.tags))]
    .sort((left, right) => left.localeCompare(right))
    .map((tag) => [tag, mappedProducts.filter((row) => row.tags.includes(tag)).length]),
);

const report = {
  category,
  productCount: mappedProducts.length,
  priceBasis: "Supplier listed price · ex VAT",
  stockDisplay: "No supplier stock count or source availability value is retained. Database compatibility value is Availability on request and the public UI will hide availability.",
  fieldsUsed: ["slug", "name", "category", "price", "sku", "availability", "pack", "description", "image", "tags", "featured"],
  categoryTagCounts: tagCounts,
};

await writeFile(`${directory}/categories-import.json`, JSON.stringify([category], null, 2));
await writeFile(`${directory}/products-import.json`, JSON.stringify(mappedProducts, null, 2));
await writeFile(`${directory}/source-verification-manifest.json`, JSON.stringify(sourceManifest, null, 2));
await writeFile(`${directory}/category-mapping-report.json`, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ category, productCount: mappedProducts.length, tagCount: Object.keys(tagCounts).length }, null, 2));
