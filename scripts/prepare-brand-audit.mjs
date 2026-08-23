import fs from "node:fs";
import path from "node:path";

const auditDirectory = path.resolve("data/brand-audit");
const products = JSON.parse(fs.readFileSync(path.join(auditDirectory, "products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(auditDirectory, "categories.json"), "utf8"));

const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
const grouped = new Map();

for (const product of products) {
  const category = product.category || "uncategorised";
  const list = grouped.get(category) || [];
  list.push(product);
  grouped.set(category, list);
}

const manifest = [];
for (const [slug, list] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  const filename = `category-${slug.replace(/[^a-z0-9-]/gi, "-")}.txt`;
  const heading = `${categoryNames.get(slug) || slug} (${slug}) — ${list.length} products`;
  const rows = list.map((product) => {
    const description = product.description ? ` | Description: ${product.description.replace(/\s+/g, " ").trim()}` : "";
    return `- ID: ${product.id} | Name: ${product.name} | SKU: ${product.sku || "—"}${description}`;
  });
  fs.writeFileSync(path.join(auditDirectory, filename), `${heading}\n\n${rows.join("\n")}\n`);
  manifest.push({ slug, name: categoryNames.get(slug) || slug, product_count: list.length, file: path.join(auditDirectory, filename) });
}

fs.writeFileSync(path.join(auditDirectory, "category-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ products: products.length, categories: manifest.length, manifest }, null, 2));
