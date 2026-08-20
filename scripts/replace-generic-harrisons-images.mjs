import { readFile, writeFile } from "node:fs/promises";

const imagesPath = "/home/ubuntu/harrisons-direct-source/compact-product-images.json";
const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36";
const exactImages = {
  "72656F": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/08/The-Big-Squij-Pig-72656F.png",
  "72753A": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/08/Scrunchems-Sticky-Squishy-Highland-Cow-CDU-72753A.webp",
  "72996L": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/07/Mini-Muddle-Puzzle-72996L.webp",
  "72770B": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/06/Sure-Men-Whole-Body-Stick-Ocean-Rush-50ml-72770B.avif",
  "72769X": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/06/Sure-Women-Whole-Body-Stick-Rio-Coconut-50ml-72769X.avif",
  "72768U": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/06/Sure-Men-Whole-Body-Aerosol-Ocean-Rush-150ml-72768U.avif",
  "72767R": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/06/Sure-Women-Whole-Body-Aerosol-Rio-Coconut-150ml-72767R.avif",
  "72766O": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2026/06/Sure-Women-Whole-Body-Aerosol-Wild-Rose-150ml-72766O.avif",
};

const images = JSON.parse(await readFile(imagesPath, "utf8"));
const genericImagePattern = /about-us-banner-scaled\.jpg/i;
const targets = images.filter((record) => genericImagePattern.test(record.image ?? ""));

for (const record of targets) {
  if (exactImages[record.sku]) {
    record.image = exactImages[record.sku];
    record.imageConfirmed = true;
    record.error = null;
    continue;
  }
  const endpoint = `https://www.harrisonsdirect.co.uk/wp-json/wp/v2/media?search=${encodeURIComponent(record.sku)}&per_page=10`;
  const response = await fetch(endpoint, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) {
    record.imageConfirmed = false;
    record.error = `Media API HTTP ${response.status}`;
    continue;
  }
  const media = await response.json();
  const match = media.find((item) => {
    const metadata = `${item?.source_url ?? ""} ${item?.filename ?? ""} ${item?.title?.rendered ?? ""} ${item?.alt_text ?? ""}`.toLowerCase();
    return metadata.includes(record.sku.toLowerCase());
  });
  if (!match?.source_url) {
    record.imageConfirmed = false;
    record.error = "No SKU-matched media image found";
    continue;
  }
  record.image = match.source_url;
  record.imageConfirmed = true;
  record.error = null;
}

await writeFile(imagesPath, JSON.stringify(images, null, 2));
console.log(JSON.stringify({ targets: targets.length, replaced: targets.filter((record) => record.imageConfirmed).length }, null, 2));
