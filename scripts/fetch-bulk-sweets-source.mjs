import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const collectionUrl = "https://www.bulkwholesalesweets.co.uk/collections/wholesale-sweets/products.json";
const outputDirectory = "/home/ubuntu/bulk-wholesale-sweets-source";
const pageLimit = 250;
const maximumPages = 20;

const decodeHtml = (value = "") => value
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/\s+/g, " ")
  .trim();

const textFromHtml = (value) => decodeHtml(
  String(value || "")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<\/p\s*>/gi, " ")
    .replace(/<[^>]*>/g, " "),
);

const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "")
  .slice(0, 190);

const sourceTags = (tags = []) => tags
  .filter((tag) => tag && tag.toLowerCase() !== "all")
  .map((tag) => tag.replace(/^Sweets\//i, "").replace(/\//g, " · ").trim())
  .filter(Boolean)
  .slice(0, 10);

const packFrom = ({ title, variant }) => {
  const countMatch = title.match(/(?:-|–|—)\s*([^—–-]*(?:count|pack|case|tub|jar|box|bag|roll|display|pcs?)[^—–-]*)$/i);
  const weightMatch = title.match(/\b\d+(?:\.\d+)?\s?(?:kg|g|ml|cl|litre|l)\b/i);
  const parts = [weightMatch?.[0]?.replace(/\s+/g, ""), countMatch?.[1]?.trim()]
    .filter(Boolean)
    .map((part) => part.replace(/\bcount\b/i, "count"));
  if (parts.length) return parts.join(" · ");
  if (variant.grams) return variant.grams >= 1000 ? `${(variant.grams / 1000).toFixed(variant.grams % 1000 ? 2 : 0)}kg` : `${variant.grams}g`;
  return "Pack information supplied on request";
};

const normaliseProduct = (product) => {
  const sourceDescription = textFromHtml(product.body_html);
  const image = product.images?.[0]?.src || null;
  const variants = product.variants || [];
  return variants.map((variant, index) => {
    const variantSuffix = variants.length > 1 && variant.title && variant.title !== "Default Title" ? ` — ${variant.title}` : "";
    const name = `${product.title}${variantSuffix}`.trim();
    const sku = String(variant.sku || `BWS-${product.id}-${variant.id}`).trim();
    const pack = packFrom({ title: name, variant });
    const description = sourceDescription || `${name} is listed in Sweets & Confectionery and supplied as ${pack}.`;
    return {
      sourceProductId: String(product.id),
      sourceVariantId: String(variant.id),
      sourceUrl: `https://www.bulkwholesalesweets.co.uk/products/${product.handle}`,
      slug: slugify(variants.length > 1 ? `${product.handle}-${variant.id}` : product.handle),
      name,
      category: "sweets-confectionery",
      price: Number(variant.price),
      sku,
      pack,
      description,
      descriptionSource: sourceDescription ? "supplier-copy" : "title-and-pack-derived",
      image,
      tags: [...new Set(["Sweets & Confectionery", ...sourceTags(product.tags), product.vendor].filter(Boolean))],
      featured: false,
      availability: "Availability on request",
      priceBasis: "Supplier listed price · ex VAT",
      supplierStockCaptured: false,
      sourceUpdatedAt: product.updated_at,
    };
  });
};

await mkdir(outputDirectory, { recursive: true });

const sourceProducts = [];
for (let page = 1; page <= maximumPages; page += 1) {
  const response = await fetch(`${collectionUrl}?limit=${pageLimit}&page=${page}`, {
    headers: { accept: "application/json", "user-agent": "MagneticSourceCatalogueAudit/1.0" },
  });
  if (!response.ok) throw new Error(`Source collection request failed on page ${page}: ${response.status}`);
  const payload = await response.json();
  const products = Array.isArray(payload.products) ? payload.products : [];
  await writeFile(join(outputDirectory, `source-page-${String(page).padStart(2, "0")}.json`), JSON.stringify(payload, null, 2));
  sourceProducts.push(...products);
  if (products.length < pageLimit) break;
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const candidateRows = sourceProducts.flatMap(normaliseProduct);
const seenSkus = new Set();
const seenSlugs = new Set();
const excluded = [];
const records = [];

for (const row of candidateRows) {
  const reason = !row.name ? "missing_name"
    : !row.image ? "missing_image"
      : !Number.isFinite(row.price) || row.price < 0 ? "invalid_price"
        : seenSkus.has(row.sku) ? "duplicate_sku"
          : seenSlugs.has(row.slug) ? "duplicate_slug"
            : null;
  if (reason) {
    excluded.push({ sourceProductId: row.sourceProductId, sourceVariantId: row.sourceVariantId, name: row.name, reason });
    continue;
  }
  seenSkus.add(row.sku);
  seenSlugs.add(row.slug);
  records.push(row);
}

const report = {
  source: collectionUrl,
  retrievedAt: new Date().toISOString(),
  sourceProductCount: sourceProducts.length,
  candidateVariantCount: candidateRows.length,
  approvedRecordCount: records.length,
  excludedRecordCount: excluded.length,
  excludedByReason: Object.fromEntries([...new Set(excluded.map((item) => item.reason))].map((reason) => [reason, excluded.filter((item) => item.reason === reason).length])),
  supplierCopyCount: records.filter((item) => item.descriptionSource === "supplier-copy").length,
  titleAndPackDescriptionCount: records.filter((item) => item.descriptionSource === "title-and-pack-derived").length,
  stockPolicy: "Supplier stock quantities and source availability values were intentionally excluded. Imported rows use Availability on request for schema compatibility; the public interface must not render availability.",
  pricePolicy: "Supplier-listed prices are captured as visible GBP prices with an ex-VAT basis, as stated in the source terms.",
};

await writeFile(join(outputDirectory, "products-normalized.json"), JSON.stringify(records, null, 2));
await writeFile(join(outputDirectory, "products-excluded.json"), JSON.stringify(excluded, null, 2));
await writeFile(join(outputDirectory, "validation-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
