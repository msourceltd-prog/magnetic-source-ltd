import { readFile, writeFile } from "node:fs/promises";

const backup = JSON.parse(await readFile(new URL("../data/household-pet-before-gem-replacement.json", import.meta.url), "utf8"));
const petTerms = /good boy|nylabone|rosewood|dog|cat|pet|chew|bone|collar|poo|litter|treat|puppy|kitten|animal|doggy/i;
const brandFor = (name) => {
  if (/^good boy\b/i.test(name)) return "Good Boy";
  if (/^nylabone\b/i.test(name)) return "Nylabone";
  if (/^rosewood\b/i.test(name)) return "Rosewood";
  return null;
};
const petCandidates = backup.products
  .filter((product) => petTerms.test(product.name))
  .map((product) => ({ ...product, brand: brandFor(product.name) }));
const branded = petCandidates.filter((product) => product.brand);
const report = {
  backup_product_count: backup.products.length,
  pet_candidate_count: petCandidates.length,
  branded_pet_candidate_count: branded.length,
  brand_counts: Object.fromEntries([...new Set(branded.map((product) => product.brand))].sort().map((brand) => [brand, branded.filter((product) => product.brand === brand).length])),
  pet_candidates: petCandidates.map(({ sku, name, pack, image, description, tags, brand }) => ({ sku, name, pack, image, description, tags, brand })),
};
await writeFile(new URL("../data/backup-pet-product-audit.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
