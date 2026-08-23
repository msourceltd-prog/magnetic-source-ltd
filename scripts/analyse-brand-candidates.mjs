import fs from "node:fs";
import path from "node:path";

const auditDirectory = path.resolve("data/brand-audit");
const products = JSON.parse(fs.readFileSync(path.join(auditDirectory, "products.json"), "utf8"));

const cleanToken = (token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}&'-]+$/gu, "");
const prefixes = new Map();

for (const product of products) {
  const tokens = product.name.split(/\s+/).map(cleanToken).filter(Boolean);
  for (let size = 1; size <= Math.min(4, tokens.length); size += 1) {
    const prefix = tokens.slice(0, size).join(" ");
    const entry = prefixes.get(prefix) || { count: 0, products: [] };
    entry.count += 1;
    entry.products.push({ id: product.id, name: product.name, category: product.category });
    prefixes.set(prefix, entry);
  }
}

const candidates = [...prefixes.entries()]
  .filter(([prefix, entry]) => prefix.length >= 3 && entry.count >= 2)
  .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
  .map(([prefix, entry]) => ({ prefix, count: entry.count, examples: entry.products.slice(0, 5) }));

const leadingTokens = new Map();
for (const product of products) {
  const token = cleanToken(product.name.split(/\s+/)[0] || "");
  if (!token) continue;
  const entry = leadingTokens.get(token) || { count: 0, products: [] };
  entry.count += 1;
  entry.products.push({ id: product.id, name: product.name, category: product.category });
  leadingTokens.set(token, entry);
}

const initialTokenInventory = [...leadingTokens.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([token, entry]) => ({ token, count: entry.count, examples: entry.products.slice(0, 3) }));

fs.writeFileSync(path.join(auditDirectory, "leading-prefix-candidates.json"), `${JSON.stringify(candidates, null, 2)}\n`);
fs.writeFileSync(path.join(auditDirectory, "initial-token-inventory.json"), `${JSON.stringify(initialTokenInventory, null, 2)}\n`);
console.log(JSON.stringify({ product_count: products.length, repeated_prefix_candidates: candidates.length, candidates: candidates.slice(0, 120) }, null, 2));
