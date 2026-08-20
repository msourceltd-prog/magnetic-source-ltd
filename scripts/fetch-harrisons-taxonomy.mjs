import { mkdir, writeFile } from "node:fs/promises";

const api = "https://www.harrisonsdirect.co.uk/wp-json/wp/v2/product_cat";
const outputDirectory = "/home/ubuntu/harrisons-direct-source";
const pageCount = 4;
const perPage = 100;

await mkdir(outputDirectory, { recursive: true });

const pages = await Promise.all(
  Array.from({ length: pageCount }, async (_, index) => {
    const page = index + 1;
    const response = await fetch(`${api}?per_page=${perPage}&page=${page}`, {
      headers: { accept: "application/json", "user-agent": "MagneticSourceCatalogueAudit/1.0" },
    });
    if (!response.ok) throw new Error(`Category page ${page} failed with ${response.status}`);
    const categories = await response.json();
    await writeFile(`${outputDirectory}/taxonomy-page-${page}.json`, JSON.stringify(categories, null, 2));
    return categories;
  }),
);

const categories = pages.flat();
const normalise = (value) => value.toLowerCase().replace(/&amp;|&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const roots = [
  { name: "Wholesale Health & Beauty", magneticName: "Health & Beauty", slug: "health-beauty" },
  { name: "Wholesale Stationery", magneticName: "Stationery & Party", slug: "stationery-party" },
  { name: "Wholesale Toys & Gifts", magneticName: "Toys & Gifts", slug: "toys-gifts" },
  { name: "Wholesale Charging", magneticName: "Charging & Electrical", slug: "charging-electrical" },
  { name: "Wholesale Sweets & Snacks", magneticName: "Sweets & Snacks", slug: "sweets-snacks" },
  { name: "Wholesale Household", magneticName: "Household & Pet", slug: "household-pet" },
  { name: "Christmas", magneticName: "Seasonal & Christmas", slug: "seasonal-christmas" },
  { name: "Clearance", magneticName: "Clearance", slug: "clearance" },
].map((definition) => {
  const category = categories.find((item) => normalise(item.name) === normalise(definition.name));
  return {
    ...definition,
    sourceCategoryId: category?.id ?? null,
    sourceCategoryLink: category?.link ?? null,
    sourceProductCount: category?.count ?? null,
  };
});

const missingRoots = roots.filter((root) => !root.sourceCategoryId).map((root) => root.name);
const report = {
  retrievedAt: new Date().toISOString(),
  totalSourceCategoryCount: categories.length,
  roots,
  missingRoots,
  readyForProductSelection: missingRoots.length === 0,
};

await writeFile(`${outputDirectory}/taxonomy-all.json`, JSON.stringify(categories, null, 2));
await writeFile(`${outputDirectory}/magnetic-category-roots.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
