import fs from "node:fs";

const specs = JSON.parse(fs.readFileSync(new URL("../client/src/data/catalogue-quality-specs.json", import.meta.url), "utf8"));
const requiredCategories = [
  "baby-family", "diy-hardware", "electrical-accessories", "gifts-gadgets", "home-utility", "household-cleaning", "kitchen-dining", "medical-first-aid", "party-events", "personal-care", "pets", "seasonal", "stationery",
];
const expected = { "baby-family": 20, "diy-hardware": 28, "electrical-accessories": 20, "gifts-gadgets": 22, "home-utility": 30, "household-cleaning": 28, "kitchen-dining": 28, "medical-first-aid": 22, "party-events": 22, "personal-care": 26, pets: 24, seasonal: 22, stationery: 26 };
const counts = Object.fromEntries(requiredCategories.map((category) => [category, specs.filter((item) => item.category === category).length]));
const names = specs.map((item) => item.name.toLowerCase());
const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
const unexpected = specs.filter((item) => !requiredCategories.includes(item.category));
const missing = requiredCategories.filter((category) => counts[category] !== expected[category]);
if (missing.length || duplicateNames.length || unexpected.length || specs.length !== 318) {
  throw new Error(JSON.stringify({ total: specs.length, counts, missing, duplicate_names: [...new Set(duplicateNames)], unexpected_categories: unexpected.map((item) => item.category) }, null, 2));
}
console.log(JSON.stringify({ status: "valid", total: specs.length, counts }, null, 2));
