import fs from "node:fs";

const inputPath = new URL("../data-sources/gem-personal-care-products.json", import.meta.url);
const outputPath = new URL("../data-sources/gem-personal-care-validated.json", import.meta.url);
const reportPath = new URL("../data-sources/gem-personal-care-classification-report.json", import.meta.url);
const products = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const accepted = products.filter((product) => product.source_category.startsWith("Personal Care"));
const excluded = products.filter((product) => !product.source_category.startsWith("Personal Care"));
const countBy = (items, key) => Object.fromEntries([...items.reduce((map, item) => map.set(item[key], (map.get(item[key]) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]));
const invalid = accepted.filter((product) => !product.source_code || !product.name || !Number.isFinite(product.unit_price_gbp) || !product.vat_text || !product.carton_qty);
if (invalid.length) throw new Error(`Invalid accepted records: ${invalid.map((product) => product.source_code).join(", ")}`);
fs.writeFileSync(outputPath, JSON.stringify(accepted, null, 2));
fs.writeFileSync(reportPath, JSON.stringify({
  total_source_records: products.length,
  accepted_personal_care_records: accepted.length,
  excluded_non_personal_care_records: excluded.length,
  accepted_source_categories: countBy(accepted, "source_category"),
  excluded_source_categories: countBy(excluded, "source_category"),
  sample_excluded_records: excluded.slice(0, 10).map(({ source_code, name, source_category }) => ({ source_code, name, source_category })),
}, null, 2));
console.log(JSON.stringify({ accepted: accepted.length, excluded: excluded.length }, null, 2));
