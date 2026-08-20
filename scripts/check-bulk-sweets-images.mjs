import { readFile, writeFile } from "node:fs/promises";

const recordsPath = "/home/ubuntu/bulk-wholesale-sweets-source/products-normalized.json";
const outputPath = "/home/ubuntu/bulk-wholesale-sweets-source/image-delivery-report.json";
const records = JSON.parse(await readFile(recordsPath, "utf8"));
const concurrency = 12;
const issues = [];
let completed = 0;

const checkImage = async (record) => {
  try {
    const response = await fetch(record.image, {
      method: "GET",
      headers: { range: "bytes=0-0", "user-agent": "MagneticSourceImageCheck/1.0" },
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.startsWith("image/")) {
      issues.push({ sku: record.sku, name: record.name, image: record.image, status: response.status, contentType: type || null });
    }
  } catch (error) {
    issues.push({ sku: record.sku, name: record.name, image: record.image, status: null, contentType: null, error: error instanceof Error ? error.message : String(error) });
  }
  completed += 1;
};

for (let index = 0; index < records.length; index += concurrency) {
  await Promise.all(records.slice(index, index + concurrency).map(checkImage));
}

const report = {
  checkedAt: new Date().toISOString(),
  checkedImageCount: completed,
  issueCount: issues.length,
  allImagesReachable: issues.length === 0,
  issues,
};

await writeFile(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  checkedImageCount: report.checkedImageCount,
  issueCount: report.issueCount,
  allImagesReachable: report.allImagesReachable,
}, null, 2));
