import { readFile, writeFile } from "node:fs/promises";

const html = await readFile(new URL("../data/gem-pets-source.html", import.meta.url), "utf8");

const decode = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&rsquo;/g, "’")
  .replace(/\s+/g, " ")
  .trim();

const matchText = (source, pattern, label) => {
  const match = source.match(pattern);
  if (!match?.[1]) throw new Error(`Missing ${label} in a Gem Imports pet product card.`);
  return decode(match[1]);
};

const productBlocks = html.split(/(?=<div class="fprd"[^>]*>)/).filter((block) => /<div class="fprd"[^>]*data-ref="[^"]+"/.test(block));
const products = productBlocks.map((block) => {
  const sourceSku = matchText(block, /data-ref="([^"]+)"/, "supplier SKU");
  return {
    source_sku: sourceSku,
    sku: `GEM-${sourceSku}`,
    name: matchText(block, /<span itemprop="name">([\s\S]*?)<\/span>/, `name for ${sourceSku}`),
    product_path: matchText(block, /<a href="([^"]+)" title="[^"]*" class="lnk">/, `product path for ${sourceSku}`),
    image: matchText(block, /<meta itemprop="image" content="([^"]+)"\s*\/>/, `image for ${sourceSku}`),
    carton_quantity: Number(matchText(block, /Carton Qty:<\/label><h6[^>]*>([\d.]+)/, `carton quantity for ${sourceSku}`)),
    unit_price_ex_vat: Number(matchText(block, /Unit Price:<\/label><h6[^>]*>£([\d.]+)/, `unit price for ${sourceSku}`)),
    carton_price_ex_vat: Number(matchText(block, /Carton Price:<\/label><h6[^>]*>£([\d.]+)/, `carton price for ${sourceSku}`)),
  };
});

const brandPatterns = [
  "Good Boy", "Nylabone", "Rosewood", "Pedigree", "Whiskas", "Felix", "Winalot", "Bakers", "Dreamies", "Pooch & Mutt", "Trixie", "KONG", "Chuckit", "Frolic", "Harringtons", "Burgess", "Sheba", "Iams", "Purina", "Forthglade", "Lily's Kitchen", "Bob Martin", "Petface", "FURminator", "Beaphar", "Johnson's", "Petkin", "Beco", "Ancol", "Catit", "Feliway", "Bionic", "Meowee", "Mikki", "Pets at Home", "Buster", "Kruuse", "Beco Pets"
];
const brandFor = (name) => brandPatterns.find((brand) => new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(name)) ?? null;
const withBrands = products.map((product) => ({ ...product, brand: brandFor(product.name) }));
const branded = withBrands.filter((product) => product.brand);
const grouped = Object.fromEntries([...new Set(branded.map((product) => product.brand))].sort().map((brand) => [brand, branded.filter((product) => product.brand === brand)]));

const report = {
  supplier_product_count: products.length,
  explicit_branded_product_count: branded.length,
  brand_counts: Object.fromEntries(Object.entries(grouped).map(([brand, entries]) => [brand, entries.length])),
  branded_products: branded,
  all_product_names: withBrands.map(({ source_sku, name, brand }) => ({ source_sku, name, brand })),
};
await writeFile(new URL("../data/gem-pets-brand-audit.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  supplier_product_count: products.length,
  explicit_branded_product_count: branded.length,
  brand_counts: report.brand_counts,
  branded_products: branded.map(({ source_sku, name, brand }) => ({ source_sku, name, brand })),
}, null, 2));
