import { mkdir, readFile, writeFile } from "node:fs/promises";

const candidatesPath = "/home/ubuntu/health_beauty_supplier_expansion.json";
const replacementPath = "/home/ubuntu/health_beauty_duplicate_replacement.json";
const outputPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/health-beauty-expansion.json";
const slugify = (value) => value.normalize("NFKD").replace(/[’']/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const [candidates, replacement] = await Promise.all([
  readFile(candidatesPath, "utf8").then(JSON.parse),
  readFile(replacementPath, "utf8").then(JSON.parse),
]);
const sourceProducts = candidates.results.map(({ output }) => output);
const duplicateIndex = sourceProducts.findIndex((product) => product.sku === "70001H");
if (sourceProducts.length !== 20 || duplicateIndex < 0 || !replacement.results[0]?.output) throw new Error("Health & Beauty research data is incomplete or does not contain the expected duplicate replacement.");
sourceProducts.splice(duplicateIndex, 1, replacement.results[0].output);
const liveDuplicateIndex = sourceProducts.findIndex((product) => product.sku === "73087F");
if (liveDuplicateIndex < 0) throw new Error("Health & Beauty research data does not contain the expected live duplicate candidate.");
sourceProducts.splice(liveDuplicateIndex, 1, {
  name: "Face Facts Ceramide Repairing Lip Balm 10ml",
  pack: "Pack of 12",
  sku: "72107P",
  description: "Face Facts Ceramide Repairing Lip Balm 10ml is supplied in a pack of 12.",
  image_url: "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/03/Face-Facts-Ceramide-Repairing-Lip-Balm-10ml-72107P.jpg",
  source_url: "https://www.harrisonsdirect.co.uk/product/face-facts-ceramide-repairing-lip-balm-10ml/",
  image_assessment: "The complete retail lip balm package is fully visible and centered on a clean white background without cropping, lifestyle elements, or watermark.",
});

const products = sourceProducts.map((source) => ({
  slug: `health-beauty-${slugify(`${source.name}-${source.sku}`)}`,
  name: source.name,
  category: "health-beauty",
  price: 0,
  sku: `HBT-${source.sku}`,
  availability: "Availability to confirm",
  pack: source.pack,
  description: `${source.description} Supplier reference: ${source.sku}.`,
  image: source.image_url,
  tags: ["Health & Beauty", "Price hidden"],
  featured: false,
  sourceUrl: source.source_url,
  sourceSku: source.sku,
  imageAssessment: source.image_assessment,
}));

if (products.length !== 20 || new Set(products.map((product) => product.slug)).size !== 20 || new Set(products.map((product) => product.sku)).size !== 20) throw new Error("Health & Beauty expansion identifiers are not uniquely valid.");
if (products.some((product) => product.category !== "health-beauty" || product.price !== 0 || !product.image.startsWith("https://www.harrisonsdirect.co.uk/") || !product.tags.includes("Price hidden"))) throw new Error("Health & Beauty expansion violates required category, price-free, real-image, or tag policy.");

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "Harrison's Direct authorized supplier product pages", generatedAt: new Date().toISOString(), products }, null, 2)}\n`);
console.log(`Prepared ${products.length} validated Health & Beauty expansion products.`);
