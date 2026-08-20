import { readFile, writeFile } from "node:fs/promises";

const candidatesPath = "/home/ubuntu/harrisons-direct-source/compact-product-image-lookups.json";
const imagesPath = "/home/ubuntu/harrisons-direct-source/compact-product-images.json";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";

const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
const resolvedImages = JSON.parse(await readFile(imagesPath, "utf8"));
const imageBySku = new Map(resolvedImages.filter((item) => item.imageConfirmed && item.image).map((item) => [item.sku, item.image]));

const categories = {
  "Health & Beauty": "health-beauty",
  "Stationery & Party": "stationery-party",
  "Toys & Gifts": "toys-gifts",
  "Charging & Electrical": "charging-electrical",
  "Sweets & Snacks": "sweets-snacks",
  "Household & Pet": "household-pet",
  "Seasonal & Christmas": "seasonal-christmas",
  Clearance: "clearance",
};

const dataset = candidates.map((candidate) => ({
  name: candidate.name,
  slug: candidate.slug,
  sku: candidate.sku,
  category: categories[candidate.department],
  categoryName: candidate.department,
  pack: `Pack of ${candidate.packQuantity}`,
  description: `${candidate.name} is supplied in a pack of ${candidate.packQuantity}.`,
  descriptionSource: "factual-name-and-pack",
  image: imageBySku.get(candidate.sku) ?? null,
  sourceUrl: candidate.sourceUrl,
  price: null,
  priceStatus: "pending-authorized-trade-price",
  stockCaptured: false,
  tags: [candidate.department, "Harrisons-authorized catalogue", "Price pending"],
}));

const duplicateValues = (field) => {
  const seen = new Map();
  for (const product of dataset) {
    if (!product[field]) continue;
    const matches = seen.get(product[field]) ?? [];
    matches.push(product.sku);
    seen.set(product[field], matches);
  }
  return [...seen.entries()].filter(([, skus]) => skus.length > 1).map(([value, skus]) => ({ value, skus }));
};

const requiredFields = ["name", "slug", "sku", "category", "pack", "description", "image", "sourceUrl"];
const invalidRows = dataset.flatMap((product) => {
  const missing = requiredFields.filter((field) => !product[field]);
  return missing.length ? [{ sku: product.sku, missing }] : [];
});
const stockLeakRows = dataset.filter((product) => product.stockCaptured !== false);
const priceLeakRows = dataset.filter((product) => product.price !== null);
const byCategory = Object.keys(categories).map((categoryName) => ({
  category: categoryName,
  products: dataset.filter((product) => product.categoryName === categoryName).length,
}));
const report = {
  assembledAt: new Date().toISOString(),
  productCount: dataset.length,
  byCategory,
  confirmedImageCount: dataset.filter((product) => Boolean(product.image)).length,
  requiredFieldFailures: invalidRows,
  duplicateSkus: duplicateValues("sku"),
  duplicateSlugs: duplicateValues("slug"),
  duplicateImageUrls: duplicateValues("image"),
  stockLeakRows: stockLeakRows.map((product) => product.sku),
  priceLeakRows: priceLeakRows.map((product) => product.sku),
  readyForPriceEnrichment: invalidRows.length === 0 && stockLeakRows.length === 0 && priceLeakRows.length === 0,
  importBlockedUntil: "An owner-authorized per-pack trade-price source is supplied.",
};

await writeFile(`${outputDirectory}/compact-price-pending-products.json`, JSON.stringify(dataset, null, 2));
await writeFile(`${outputDirectory}/compact-price-pending-validation.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
