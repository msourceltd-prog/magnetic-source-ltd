import { readFile } from "node:fs/promises";

const candidates = JSON.parse(await readFile(new URL("../data/branded-best-seller-candidates.json", import.meta.url), "utf8"));

for (const [department, products] of Object.entries(candidates)) {
  console.log(`\n${department.toUpperCase()} (${products.length} branded candidates)`);
  for (const product of products.slice(0, 16)) {
    console.log(`${product.sku} | ${product.name} | ${product.pack}`);
  }
}
