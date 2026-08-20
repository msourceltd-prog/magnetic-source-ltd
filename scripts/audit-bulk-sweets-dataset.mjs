import { readFile, writeFile } from "node:fs/promises";

const inputPath = "/home/ubuntu/bulk-wholesale-sweets-source/products-normalized.json";
const outputPath = "/home/ubuntu/bulk-wholesale-sweets-source/import-readiness-report.json";
const rows = JSON.parse(await readFile(inputPath, "utf8"));

const requiredFields = ["slug", "name", "category", "price", "sku", "pack", "description", "image", "sourceUrl"];
const fieldFailures = rows.flatMap((row) => requiredFields
  .filter((field) => row[field] === null || row[field] === undefined || row[field] === "")
  .map((field) => ({ sku: row.sku, name: row.name, field })));

const valuesWithDuplicates = (getValue) => {
  const grouped = new Map();
  for (const row of rows) {
    const value = getValue(row);
    const items = grouped.get(value) || [];
    items.push({ sku: row.sku, name: row.name, sourceUrl: row.sourceUrl });
    grouped.set(value, items);
  }
  return [...grouped.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([value, items]) => ({ value, items }));
};

const duplicateSkus = valuesWithDuplicates((row) => row.sku);
const duplicateSlugs = valuesWithDuplicates((row) => row.slug);
const duplicateIdentity = valuesWithDuplicates((row) => `${row.name.toLowerCase()}|${row.pack.toLowerCase()}|${Number(row.price).toFixed(2)}`);
const repeatedImages = valuesWithDuplicates((row) => row.image);
const stockPattern = /\b\d+\s*(?:in\s*stock|left\s*in\s*stock|available)\b|\bsold\s*out\b/i;
const stockLeaks = rows
  .filter((row) => stockPattern.test(JSON.stringify({ availability: row.availability, description: row.description, tags: row.tags })))
  .map((row) => ({ sku: row.sku, name: row.name }));
const invalidImages = rows
  .filter((row) => !/^https:\/\/cdn\.shopify\.com\//.test(row.image))
  .map((row) => ({ sku: row.sku, name: row.name, image: row.image }));
const invalidPrices = rows
  .filter((row) => !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)
  .map((row) => ({ sku: row.sku, name: row.name, price: row.price }));
const wrongCategories = rows
  .filter((row) => row.category !== "sweets-confectionery")
  .map((row) => ({ sku: row.sku, name: row.name, category: row.category }));

const report = {
  rowCount: rows.length,
  fieldFailureCount: fieldFailures.length,
  duplicateSkuGroups: duplicateSkus.length,
  duplicateSlugGroups: duplicateSlugs.length,
  duplicateIdentityGroups: duplicateIdentity.length,
  repeatedImageGroups: repeatedImages.length,
  stockLeakCount: stockLeaks.length,
  invalidImageCount: invalidImages.length,
  invalidPriceCount: invalidPrices.length,
  wrongCategoryCount: wrongCategories.length,
  readyForImport: fieldFailures.length === 0
    && duplicateSkus.length === 0
    && duplicateSlugs.length === 0
    && duplicateIdentity.length === 0
    && repeatedImages.length === 0
    && stockLeaks.length === 0
    && invalidImages.length === 0
    && invalidPrices.length === 0
    && wrongCategories.length === 0,
  issues: {
    fieldFailures,
    duplicateSkus,
    duplicateSlugs,
    duplicateIdentity,
    repeatedImages,
    stockLeaks,
    invalidImages,
    invalidPrices,
    wrongCategories,
  },
};

await writeFile(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  rowCount: report.rowCount,
  fieldFailureCount: report.fieldFailureCount,
  duplicateSkuGroups: report.duplicateSkuGroups,
  duplicateSlugGroups: report.duplicateSlugGroups,
  duplicateIdentityGroups: report.duplicateIdentityGroups,
  repeatedImageGroups: report.repeatedImageGroups,
  stockLeakCount: report.stockLeakCount,
  invalidImageCount: report.invalidImageCount,
  invalidPriceCount: report.invalidPriceCount,
  wrongCategoryCount: report.wrongCategoryCount,
  readyForImport: report.readyForImport,
}, null, 2));
