import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = process.env.STATIONERY_RESEARCH_FILE || "/home/ubuntu/stationery_party_supplier_research.json";
const outputPath = "/home/ubuntu/magnetic-source-ecommerce-v2/data/stationery-party-replacement.json";

const slugify = (value) => value.normalize("NFKD").replace(/[’']/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const packFromSupplier = (value) => `Pack of ${value.match(/\b(\d+)\b/)?.[1] || "1"}`;

const research = JSON.parse(await readFile(sourcePath, "utf8"));
const products = research.results.flatMap(({ output }) => output.product_candidates.split("\n").filter(Boolean).map((line) => {
  const [name, sourceSku, supplierPack, description, sourceUrl, image, imageAssessment] = line.split(" | ");
  if (!name || !sourceSku || !supplierPack || !description || !sourceUrl || !image || !imageAssessment) throw new Error(`Invalid supplier candidate: ${line}`);
  return {
    slug: `stationery-party-${slugify(`${name}-${sourceSku}`)}`, name, category: "stationery-party", price: 0, sku: `STP-${sourceSku}`,
    availability: "Availability to confirm", pack: packFromSupplier(supplierPack), description: `${description} Supplier reference: ${sourceSku}.`, image,
    tags: ["Stationery & Party", "Price hidden"], featured: false, sourceUrl, imageAssessment,
  };
}));

if (products.length !== 40) throw new Error(`Expected 40 verified products, received ${products.length}.`);
if (new Set(products.map((product) => product.slug)).size !== 40 || new Set(products.map((product) => product.sku)).size !== 40) throw new Error("Replacement product identifiers must be unique.");
if (products.some((product) => product.category !== "stationery-party" || product.price !== 0 || !product.image.startsWith("https://www.harrisonsdirect.co.uk/") || !product.tags.includes("Price hidden"))) throw new Error("Replacement data violates the category, price-free, real-image, or tag policy.");

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "Harrison's Direct authorized supplier product pages", generatedAt: new Date().toISOString(), products }, null, 2)}\n`);
console.log(`Prepared ${products.length} validated Stationery & Party products.`);
