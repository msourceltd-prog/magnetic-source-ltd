import fs from "node:fs";

const sourcePath = new URL("../data-sources/gem-imports-personal-care.html", import.meta.url);
const outputPath = new URL("../data-sources/gem-personal-care-products.json", import.meta.url);
const html = fs.readFileSync(sourcePath, "utf8");
const decode = (value = "") => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const attribute = (block, name) => decode(block.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "");
const text = (value = "") => decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
const blocks = html.match(/<div class="fprd"[\s\S]*?<\/form>\s*<\/div>/g) || [];
const products = blocks.map((block) => {
  const unit = block.match(/<div class="unit">[\s\S]*?<h6[^>]*>£([\d.]+)\s*<span>([^<]+)<\/span>/);
  const cartonQty = block.match(/<div class="qty">[\s\S]*?<h6[^>]*>(\d+)<\/h6>/);
  const carton = block.match(/<div class="trade">[\s\S]*?<h6[^>]*>£([\d.]+)\s*<span>([^<]+)<\/span>/);
  const stock = text(block.match(/<div class="stock">([\s\S]*?)<\/div>/)?.[1] || "");
  return {
    source: "Gem Imports",
    source_url: "https://www.gemimports.co.uk/dept/wholesale-personal-care_d0014.htm?rrp=100&dord=13",
    source_code: attribute(block, "data-ref"),
    source_category: attribute(block, "data-category"),
    name: attribute(block, "data-name"),
    unit_price_gbp: Number(unit?.[1]),
    vat_text: text(unit?.[2] || ""),
    carton_qty: Number(cartonQty?.[1]),
    carton_price_gbp: Number(carton?.[1]),
    carton_vat_text: text(carton?.[2] || ""),
    source_availability: stock || null,
    source_product_path: attribute(block, "content"),
    source_image_url: attribute(block, "href"),
  };
}).filter((product) => product.source_code && product.name && Number.isFinite(product.unit_price_gbp));

const duplicateCodes = products.map((product) => product.source_code).filter((code, index, all) => all.indexOf(code) !== index);
if (products.length !== 244 || duplicateCodes.length) throw new Error(JSON.stringify({ extracted: products.length, duplicate_codes: [...new Set(duplicateCodes)] }, null, 2));
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
console.log(JSON.stringify({ extracted: products.length, sample: products.slice(0, 3) }, null, 2));
