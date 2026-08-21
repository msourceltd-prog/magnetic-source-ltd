import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dataPath = resolve("data/four-category-product-expansion.json");
const sitemapPath = resolve("client/public/sitemap.xml");
const stylesPath = resolve("client/src/styles/supplier-catalogue-refinement.css");
const reportPath = resolve("data/four-category-expansion-release-verification.json");
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const baseUrl = "https://magneticsource.uk";
const expectedCounts = { "household-pet": 55, "sweets-snacks": 55, "toys-gifts": 54, "stationery-party": 54 };
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,slug,name,category,price,sku,pack,description,image,tags&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const approved = JSON.parse(await readFile(dataPath, "utf8")).products;
const sitemap = await readFile(sitemapPath, "utf8");
const styles = await readFile(stylesPath, "utf8");
const liveBySku = new Map(live.map((product) => [product.sku, product]));
const matchesPublicSearch = (product, query) => {
  const terms = normalize(query).split(" ").filter(Boolean);
  const searchable = normalize(`${product.name} ${product.sku} ${product.pack} ${product.description} ${product.category} ${(product.tags || []).join(" ")}`);
  const searchTerms = new Set(searchable.split(" ").filter(Boolean));
  return terms.every((term) => searchTerms.has(term));
};
const approvedChecks = approved.map((product) => {
  const liveProduct = liveBySku.get(product.sku);
  const route = `${baseUrl}/product/${product.slug}`;
  return {
    sku: product.sku,
    found: Boolean(liveProduct),
    categoryMatches: liveProduct?.category === product.category,
    imageMatches: liveProduct?.image === product.image,
    priceFree: Number(liveProduct?.price) === 0 && liveProduct?.tags?.includes("Price hidden"),
    searchFindsExactName: Boolean(liveProduct) && matchesPublicSearch(liveProduct, product.name),
    routeInSitemap: sitemap.includes(`<loc>${route}</loc>`),
  };
});
const categoryCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, live.filter((product) => product.category === category).length]));
const failures = approvedChecks.filter((check) => !check.found || !check.categoryMatches || !check.imageMatches || !check.priceFree || !check.searchFindsExactName || !check.routeInSitemap);
const expectedSitemapUrls = 16 + live.length;
const sitemapUrls = (sitemap.match(/<loc>/g) || []).length;
const styleChecks = {
  containedImages: styles.includes("object-fit: contain !important"),
  noCropFrameRule: styles.includes("complete product image") || styles.includes("without changing any contained product image"),
  ledgerFacts: styles.includes(".product-ledger i") && styles.includes(".product-ledger b"),
  sourceMotifs: styles.includes(".product-card::before") && styles.includes(".image-corner"),
};
const result = {
  verifiedAt: new Date().toISOString(),
  liveProductCount: live.length,
  addedProductCount: approved.length,
  categoryCounts,
  sitemapUrls,
  expectedSitemapUrls,
  styleChecks,
  failedProductChecks: failures,
  valid: live.length === 381 && approved.length === 60 && Object.entries(expectedCounts).every(([category, count]) => categoryCounts[category] === count) && sitemapUrls === expectedSitemapUrls && Object.values(styleChecks).every(Boolean) && !failures.length,
};
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);
if (!result.valid) throw new Error(`Four-category release validation failed: ${JSON.stringify(result)}`);
console.log(JSON.stringify({ valid: result.valid, liveProductCount: result.liveProductCount, categoryCounts: result.categoryCounts, sitemapUrls: result.sitemapUrls, styleChecks: result.styleChecks, reportPath }, null, 2));
