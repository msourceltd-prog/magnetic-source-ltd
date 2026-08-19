import fs from "node:fs";

const inputPath = new URL("../data-sources/gem-personal-care-import.json", import.meta.url);
const outputPath = new URL("../client/src/data/gem-personal-care-specs.json", import.meta.url);
const sourceProducts = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const records = sourceProducts.map((product) => ({
  name: product.name,
  category: "personal-care",
  price: product.price,
  pack: product.pack,
  description: `Supplier-listed Personal Care product. Source reference ${product.source_code}; final specifications and approved imagery should be confirmed before order acceptance.`,
  sku: product.sku,
  priceBasis: "Supplier unit price · ex VAT",
}));
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
console.log(JSON.stringify({ written: records.length, output: outputPath.pathname }, null, 2));
