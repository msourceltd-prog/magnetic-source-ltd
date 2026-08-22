import { readFile, writeFile } from "node:fs/promises";

const html = await readFile(new URL("../data/gem-baby-source.html", import.meta.url), "utf8");

const decode = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&rsquo;/g, "’")
  .replace(/&ndash;/g, "–")
  .replace(/\s+/g, " ")
  .trim();

const matchText = (source, pattern, label) => {
  const match = source.match(pattern);
  if (!match?.[1]) throw new Error(`Missing ${label} in a Gem Imports baby product card.`);
  return decode(match[1]);
};

const productBlocks = html.split(/(?=<div class="fprd"[^>]*>)/).filter((block) => /<div class="fprd"[^>]*data-ref="[^"]+"/.test(block));
const products = productBlocks.map((block) => {
  const sku = matchText(block, /data-ref="([^"]+)"/, "supplier SKU");
  const name = matchText(block, /<span itemprop="name">([\s\S]*?)<\/span>/, `name for ${sku}`);
  const productPath = matchText(block, /<a href="([^"]+)" title="[^"]*" class="lnk">/, `product URL for ${sku}`);
  const image = matchText(block, /<meta itemprop="image" content="([^"]+)"\s*\/>/, `image for ${sku}`);
  const cartonQuantity = Number(matchText(block, /Carton Qty:<\/label><h6[^>]*>([\d.]+)/, `carton quantity for ${sku}`));
  const unitPrice = Number(matchText(block, /Unit Price:<\/label><h6[^>]*>£([\d.]+)/, `unit price for ${sku}`));
  const cartonPrice = Number(matchText(block, /Carton Price:<\/label><h6[^>]*>£([\d.]+)/, `carton price for ${sku}`));

  if (!Number.isInteger(cartonQuantity) || cartonQuantity < 1) throw new Error(`Invalid carton quantity for ${sku}.`);

  return {
    source_sku: sku,
    sku: `GEM-${sku}`,
    source_url: `https://www.gemimports.co.uk${productPath}`,
    name,
    image,
    carton_quantity: cartonQuantity,
    unit_price_ex_vat: unitPrice,
    carton_price_ex_vat: cartonPrice,
    category: "baby-kids",
    pack: `Pack of ${cartonQuantity}`,
    slug: `gem-${sku.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}`,
    description: `Gem Imports baby wholesale line: ${name}. Supplied in packs of ${cartonQuantity}.`,
  };
});

const duplicateSkus = products.filter((product, index) => products.findIndex((candidate) => candidate.sku === product.sku) !== index);
if (products.length !== 55 || duplicateSkus.length) {
  throw new Error(`Expected 55 unique Gem Imports Baby products; found ${products.length} records and ${duplicateSkus.length} duplicates.`);
}

await writeFile(new URL("../data/gem-baby-import-source.json", import.meta.url), JSON.stringify({
  created_at: new Date().toISOString(),
  source: "https://www.gemimports.co.uk/dept/baby-wholesale-uk_d017.htm",
  product_count: products.length,
  products,
}, null, 2));

console.log(JSON.stringify({ product_count: products.length, sample: products.slice(0, 6) }, null, 2));
