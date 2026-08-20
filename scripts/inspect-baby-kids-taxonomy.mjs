import { readFile } from "node:fs/promises";

const source = "/home/ubuntu/harrisons-direct-source/taxonomy-all.json";
const categories = JSON.parse(await readFile(source, "utf8"));
const matches = categories
  .filter((category) => ["children", "baby"].includes(category.slug))
  .map(({ id, name, slug, parent, count, link, description }) => ({
    id,
    name,
    slug,
    parent,
    count,
    link,
    description: (description ?? "").replace(/<[^>]+>/g, "").trim(),
  }));

const childrenSubcategories = categories
  .filter((category) => category.parent === 289 && category.count > 0)
  .map(({ id, name, slug, parent, count, link }) => ({ id, name, slug, parent, count, link }))
  .sort((a, b) => b.count - a.count);

console.log(JSON.stringify({ matches, childrenSubcategories }, null, 2));
