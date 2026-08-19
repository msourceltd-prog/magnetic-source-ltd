import fs from "node:fs";

const inputPath = new URL("../data-sources/gem-personal-care-validated.json", import.meta.url);
const outputPath = new URL("../data-sources/gem-personal-care-import.json", import.meta.url);
const reportPath = new URL("../data-sources/gem-personal-care-import-report.json", import.meta.url);
const products = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const acceptedPrefixes = [
  "Personal Care - Beauty",
  "Personal Care - Hair Care",
  "Personal Care - Toiletries",
  "Personal Care - Dental",
  "Personal Care - Shaving",
  "Personal Care",
];
const excludedTerms = ["Sports & Fitness", "Textiles", "Charmz"];
const kept = products.filter((product) => acceptedPrefixes.some((prefix) => product.source_category === prefix || product.source_category.startsWith(`${prefix} -`)) && !excludedTerms.some((term) => product.source_category.includes(term)) && product.vat_text === "excl. VAT");
const excluded = products.filter((product) => !kept.includes(product));
const duplicates = kept.map((product) => product.source_code).filter((code, index, all) => all.indexOf(code) !== index);
if (duplicates.length) throw new Error(`Duplicate source codes: ${[...new Set(duplicates)].join(", ")}`);
const records = kept.map((product, index) => ({
  id: index + 1,
  slug: `gem-${product.source_code.toLowerCase()}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  name: product.name,
  category: "personal-care",
  price: product.unit_price_gbp,
  sku: `GEM-${product.source_code}`,
  availability: "Availability to confirm",
  pack: `Unit; carton of ${product.carton_qty}`,
  description: `Supplier-listed Personal Care item from Gem Imports. Final product specifications and approved imagery should be confirmed before order acceptance.`,
  image: "supplier-image-pending",
  tags: ["Gem Imports source"],
  featured: false,
  source_code: product.source_code,
  source_category: product.source_category,
  source_unit_price_gbp: product.unit_price_gbp,
  source_vat_text: product.vat_text,
  source_carton_qty: product.carton_qty,
  source_carton_price_gbp: product.carton_price_gbp,
  source_url: product.source_url,
}));
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
fs.writeFileSync(reportPath, JSON.stringify({
  source_records: products.length,
  import_records: records.length,
  excluded_records: excluded.length,
  import_categories: Object.fromEntries([...new Set(records.map((record) => record.source_category))].sort().map((category) => [category, records.filter((record) => record.source_category === category).length])),
  excluded_examples: excluded.slice(0, 20).map(({ source_code, name, source_category }) => ({ source_code, name, source_category })),
}, null, 2));
console.log(JSON.stringify({ import_records: records.length, excluded_records: excluded.length, first_three: records.slice(0, 3) }, null, 2));
