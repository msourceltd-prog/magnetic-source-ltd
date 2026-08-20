import { mkdir, readFile, writeFile } from "node:fs/promises";

const listingPage = "/tmp/harrisons-baby-page-1.html";
const sitemap = "/home/ubuntu/upload/www.harrisonsdirect.co.uk_product-sitemap.xml_1787227561141.md";
const outputDirectory = "/home/ubuntu/harrisons-direct-source/baby-kids-replacement";
const department = "Baby & Kids";
const category = "baby-kids";
const liveCollisionSku = new Set(["72711A", "72710X", "72709T", "72708Q"]);
const decode = (value = "") => String(value)
  .replace(/&amp;/gi, "&")
  .replace(/&#8217;|&rsquo;/gi, "’")
  .replace(/&#8211;|&ndash;/gi, "–")
  .replace(/&#39;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/&nbsp;/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const slugify = (value) => decode(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 190);

const manualSecondPage = [
  ["pampers-baby-dry-nappies-taped-size-6-19-s", "Pampers Baby-Dry Nappies Size 6 15+kg, 33+ lbs 19’s", "5358N", "4"],
  ["nuby-weaning-spoons-6pk", "Nuby Weaning Spoons 6pk", "48880W", "6"],
  ["cottontails-for-mums-disposable-breast-pads-40-s", "Cottontails for Mums Disposable Breast Pads 40’s", "48758P", "6"],
  ["duralon-baby-bottle", "Duralon Baby Bottle (Designs May Vary)", "36960W", "12"],
  ["sudocrem-antiseptic-cream-60g-tub", "Sudocrem Antiseptic Cream 60g Tub", "3738H", "12"],
  ["pampers-new-baby-size-1-carry-pack-22-nappies", "Pampers New Baby Premium Protection Nappies Size 1 2-5kg, 4-11lbs 22’s", "2536N", "4"],
  ["pampers-new-baby-size-2-carry-pack-31-nappies", "Pampers New Baby Premium Protection Nappies Size 2 4-8kg, 9-18lbs 31’s", "2537Q", "4"],
  ["john-s-baby-oil-200ml", "Johnson’s Baby Oil 200ml", "90T", "6"],
  ["john-s-baby-oil-100ml", "Johnson’s Baby Oil 100ml", "1985T", "6"],
  ["pampers-baby-dry-nappies-junior-23-s", "Pampers Baby-Dry Nappies Size 5, 11-16kgs, 24-35lbs 23’s", "1240I", "4"],
  ["pampers-baby-dry-nappies-midi-30-s9390", "Pampers Baby-Dry Nappies Size 3, 6-10kgs, 13-22lbs 30’s", "1243R", "4"],
  ["johnson-s-baby-shampoo-100ml", "Johnson’s Baby Shampoo 100ml", "607T", "6"],
  ["pampers-baby-dry-nappies-maxi-27-s", "Pampers Baby-Dry Nappies Size 4, 9-14kgs, 20-31lbs, Maxi 25’s", "1232J", "4"],
  ["sudocrem-skin-care-cream-30g-white-tube", "Sudocrem Skin Care Cream 30g White Tube", "100E", "6"],
].map(([path, name, sku, packQuantity]) => ({
  sourceUrl: `https://www.harrisonsdirect.co.uk/product/${path}/`,
  name,
  sku,
  packQuantity,
}));

const exactSkuImage = {
  "5358N": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2019/03/Pampers-Baby-Dry-Nappies-Size-6-15kg-33-lbs-19s-5358N.jpg",
  "48880W": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2023/08/products-48880w_2.png",
  "48758P": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2023/08/products-48758p.png",
  "36960W": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2018/06/36960W-Duralon-Baby-Bottle_6-1.png",
  "3738H": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2023/08/products-3738h_1.jpg",
  "2536N": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2017/05/Pampers-New-Baby-Premium-Protection-Nappies-Size-1-2-5kg-4-11lbs-22s-2536N.jpg",
  "2537Q": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2017/05/2537Q-scaled.jpeg",
  "90T": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2016/04/Johnsons-Baby-Oil-200ml-90T.png",
  "1985T": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2015/10/Johnsons-Baby-Oil-100ml-1985T.png",
  "1240I": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2014/06/Pampers-Baby-Dry-Nappies-Size-5-11-16kgs-24-35lbs-23s-1240I.jpg",
  "1243R": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2023/08/products-1243r_1.png",
  "607T": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2023/08/products-607t.jpg",
  "1232J": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2014/04/Pampers-Baby-Dry-Nappies-Size-4-9-14kgs-20-31lbs-Maxi-25s-1232J.jpg",
  "100E": "https://www.harrisonsdirect.co.uk/wp-content/uploads/2013/09/100E-Sudocrem-Skin-Care-Cream-30g-White-Tube-.png",
};

const listingHtml = await readFile(listingPage, "utf8");
const cards = listingHtml.split(/<div class="product-card\b/i).slice(1);
const firstPage = cards.map((card) => {
  const path = card.match(/href="https:\/\/www\.harrisonsdirect\.co\.uk\/product\/([^"/]+)\//i)?.[1];
  const name = decode(card.match(/<h2 class="product-card__title">([\s\S]*?)<\/h2>/i)?.[1]);
  const sku = decode(card.match(/<li>\s*Product Code:\s*([^<]+)<\/li>/i)?.[1]);
  const packQuantity = decode(card.match(/<li>\s*Pack Quantity:\s*([^<]+)<\/li>/i)?.[1]);
  const image = decode(card.match(/<div class="product-card__image">[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1]);
  return path && name && sku && packQuantity ? {
    sourceUrl: `https://www.harrisonsdirect.co.uk/product/${path}/`,
    name,
    sku,
    packQuantity,
    image,
  } : null;
}).filter(Boolean).slice(0, 30).filter((record) => !liveCollisionSku.has(record.sku));

const sitemapText = await readFile(sitemap, "utf8");
const imageFor = (sourceUrl) => {
  const start = sitemapText.indexOf(sourceUrl);
  if (start === -1) return null;
  const after = sitemapText.slice(start + sourceUrl.length, start + sourceUrl.length + 500);
  return after.match(/https:\/\/www\.harrisonsdirect\.co\.uk\/wp-content\/uploads\/[^\s]+/i)?.[0] ?? null;
};

const rejected = [];
const selected = [...firstPage, ...manualSecondPage].map((record) => {
  const image = record.image || exactSkuImage[record.sku] || imageFor(record.sourceUrl);
  if (!image) rejected.push({ sourceUrl: record.sourceUrl, sku: record.sku, reason: "matching_sitemap_image_not_found" });
  const pack = `Pack of ${record.packQuantity}`;
  return {
    sourceUrl: record.sourceUrl,
    slug: slugify(`${record.name}-${record.sku}`),
    name: record.name,
    category,
    sku: record.sku,
    pack,
    description: `${record.name} is supplied as ${pack}.`,
    descriptionSource: "factual-listing-title-and-pack",
    image,
    tags: [department, "Harrisons-authorized catalogue", "Price hidden"],
    price: 0,
    stockCaptured: false,
  };
});

const uniqueValues = (field) => new Set(selected.map((item) => item[field])).size === selected.length;
const report = {
  department,
  category,
  requested: 40,
  selected: selected.length,
  uniqueSku: uniqueValues("sku"),
  uniqueSlug: uniqueValues("slug"),
  uniqueImage: uniqueValues("image"),
  imageCount: selected.filter((item) => item.image).length,
  rejected,
  stockPolicy: "No stock, availability, or price data was retained from source listings.",
};

if (selected.length !== 40 || rejected.length || !report.uniqueSku || !report.uniqueSlug || !report.uniqueImage) {
  throw new Error(`Baby & Kids validation failed: ${JSON.stringify(report)}`);
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(`${outputDirectory}/baby-kids-products.json`, JSON.stringify(selected, null, 2));
await writeFile(`${outputDirectory}/baby-kids-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
