import { readFile, writeFile } from "node:fs/promises";

const manifestPath = "/home/ubuntu/harrisons-direct-source/compact-product-image-lookups.json";
const outputPath = "/home/ubuntu/harrisons-direct-source/compact-product-images.json";
const reportPath = "/home/ubuntu/harrisons-direct-source/compact-product-images-report.json";
const concurrency = 1;
const pauseMs = 1500;
const browserUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36";
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let existing = [];
try {
  existing = JSON.parse(await readFile(outputPath, "utf8"));
} catch {
  existing = [];
}

const resolvedBySku = new Map(existing.map((item) => [item.sku, item]));
const resolveImage = async (product) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    try {
      response = await fetch(product.sourceUrl, {
        headers: { "user-agent": browserUserAgent, accept: "text/html,application/xhtml+xml" },
      });
    } catch (error) {
      if (attempt < 3) {
        await wait(1000 * attempt);
        continue;
      }
      return { ...product, image: null, imageConfirmed: false, error: error instanceof Error ? error.message : String(error) };
    }
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 3) {
      await wait(1000 * attempt);
      continue;
    }
    if (!response.ok) return { ...product, image: null, imageConfirmed: false, error: `HTTP ${response.status}` };
    const html = await response.text();
    const image = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1]
      || null;
    return {
      ...product,
      image,
      imageConfirmed: Boolean(image),
      error: image ? null : "Primary Open Graph image missing",
    };
  }
  return { ...product, image: null, imageConfirmed: false, error: "Retries exhausted" };
};

const pendingProducts = manifest.filter((product) => !resolvedBySku.get(product.sku)?.imageConfirmed);
for (let index = 0; index < pendingProducts.length; index += concurrency) {
  const chunk = pendingProducts.slice(index, index + concurrency);
  if (chunk.length) {
    const results = await Promise.all(chunk.map(resolveImage));
    results.forEach((result) => resolvedBySku.set(result.sku, result));
    await writeFile(outputPath, JSON.stringify([...resolvedBySku.values()], null, 2));
    await wait(pauseMs);
  }
}

const resolved = manifest.map((product) => resolvedBySku.get(product.sku) ?? { ...product, image: null, imageConfirmed: false, error: "Not processed" });
await writeFile(outputPath, JSON.stringify(resolved, null, 2));
const report = {
  resolvedAt: new Date().toISOString(),
  total: resolved.length,
  imageConfirmed: resolved.filter((product) => product.imageConfirmed).length,
  imageMissing: resolved.filter((product) => !product.imageConfirmed).length,
  stockPolicy: "No source stock or availability field is requested, parsed, or retained.",
  pricePolicy: "No price field is requested, parsed, or retained.",
};
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
