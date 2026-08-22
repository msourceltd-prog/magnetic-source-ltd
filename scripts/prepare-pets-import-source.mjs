import { readFile, writeFile } from "node:fs/promises";

const decode = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&rsquo;/g, "’")
  .replace(/\s+/g, " ")
  .trim();

const slugify = (value) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const parseGemProducts = (html) => html
  .split(/(?=<div class="fprd"[^>]*>)/)
  .filter((block) => /<div class="fprd"[^>]*data-ref="[^"]+"/.test(block))
  .map((block) => {
    const take = (pattern, label) => {
      const match = block.match(pattern);
      if (!match?.[1]) throw new Error(`Missing ${label} in Gem product card.`);
      return decode(match[1]);
    };
    const sourceSku = take(/data-ref="([^"]+)"/, "supplier SKU");
    return {
      source_sku: sourceSku,
      sku: `GEM-${sourceSku}`,
      name: take(/<span itemprop="name">([\s\S]*?)<\/span>/, `name for ${sourceSku}`),
      image: take(/<meta itemprop="image" content="([^"]+)"\s*\/>/, `image for ${sourceSku}`),
      carton_quantity: Number(take(/Carton Qty:<\/label><h6[^>]*>([\d.]+)/, `carton quantity for ${sourceSku}`)),
    };
  });

const backup = JSON.parse(await readFile(new URL("../data/household-pet-before-gem-replacement.json", import.meta.url), "utf8"));
const gemProducts = parseGemProducts(await readFile(new URL("../data/gem-pets-source.html", import.meta.url), "utf8"));

const selectedBackupSkus = ["72619U", "72567J", "72568M", "HPE-72360G", "HPE-72404S", "HPE-72364S"];
const selectedGemSourceSkus = [
  "PET7199OB", "PET13127", "PET12979", "PET4249", "PET4253", "PET6392",
  "PET12575OB", "PET1073", "PET7348OB", "PET0866OB", "PET6414OB", "PET8185OB",
  "PET12794", "PET12933", "PET13027OB", "PET12528OB", "PET13185OB", "PET9298OB",
  "PET12717OB", "PET2456OB", "PET6403OB", "PET12190OB", "PET8095OB", "PET13021OB",
];

const brandFor = (name) => {
  if (/^good boy\b/i.test(name)) return "Good Boy";
  if (/^nylabone\b/i.test(name)) return "Nylabone";
  if (/^rosewood\b/i.test(name)) return "Rosewood";
  return null;
};

const selectedBackup = selectedBackupSkus.map((sku) => {
  const product = backup.products.find((entry) => entry.sku === sku);
  if (!product) throw new Error(`Selected backup product ${sku} was not found.`);
  const brand = brandFor(product.name);
  if (!brand) throw new Error(`Selected backup product ${sku} has no verified brand.`);
  return {
    source_type: "Previous authorised pet range",
    source_sku: sku,
    sku,
    name: product.name,
    slug: `pets-${slugify(product.name)}-${slugify(sku)}`,
    brand,
    pack: product.pack,
    description: product.description?.trim() || `${product.name} is supplied as ${product.pack.toLowerCase()}. Supplier reference: ${sku}.`,
    image: product.image,
  };
});

const selectedGem = selectedGemSourceSkus.map((sourceSku) => {
  const product = gemProducts.find((entry) => entry.source_sku === sourceSku);
  if (!product) throw new Error(`Selected Gem Imports product ${sourceSku} was not found.`);
  const pack = `Pack of ${product.carton_quantity}`;
  return {
    source_type: "Gem Imports Pet Care",
    source_sku: sourceSku,
    sku: product.sku,
    name: product.name,
    slug: `pets-${slugify(product.name)}-${slugify(product.sku)}`,
    brand: null,
    pack,
    description: `${product.name} is supplied as ${pack.toLowerCase()}. Supplier reference: ${sourceSku}.`,
    image: product.image,
  };
});

const products = [...selectedBackup, ...selectedGem];
const brandCounts = Object.fromEntries([...new Set(selectedBackup.map((product) => product.brand))].map((brand) => [brand, selectedBackup.filter((product) => product.brand === brand).length]));
const duplicateSkus = products.filter((product, index) => products.findIndex((candidate) => candidate.sku === product.sku) !== index).map((product) => product.sku);

if (products.length !== 30 || selectedBackup.length !== 6 || selectedGem.length !== 24) throw new Error("Pets selection must contain exactly six backup products and twenty-four Gem Imports products.");
if (Object.values(brandCounts).some((count) => count > 2)) throw new Error(`Brand cap breached: ${JSON.stringify(brandCounts)}`);
if (duplicateSkus.length) throw new Error(`Duplicate selected SKUs: ${[...new Set(duplicateSkus)].join(", ")}`);

const source = {
  created_at: new Date().toISOString(),
  instruction: "User approved a new Pets department using some source-confirmed branded products from the previous Household & Pet backup and a balanced complementary selection from the authorised Gem Imports Pet Care range.",
  product_count: products.length,
  source_counts: { previous_authorised_pet_range: selectedBackup.length, gem_imports_pet_care: selectedGem.length },
  verified_brand_counts: brandCounts,
  products,
};

await writeFile(new URL("../data/pets-import-source.json", import.meta.url), JSON.stringify(source, null, 2));
console.log(JSON.stringify({
  product_count: source.product_count,
  source_counts: source.source_counts,
  verified_brand_counts: source.verified_brand_counts,
  selected_products: products.map(({ sku, name, source_type, brand, pack }) => ({ sku, name, source_type, brand, pack })),
}, null, 2));
