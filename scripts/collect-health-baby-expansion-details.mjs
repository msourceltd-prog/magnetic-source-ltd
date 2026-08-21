import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputPath = resolve("data/health-baby-expansion-verified-details.json");
const candidates = [
  ["health-beauty", "Palmolive Shampoo 2in1 350ml", "72569P", "https://www.harrisonsdirect.co.uk/product/palmolive-shampoo-2in1-350ml-pmp-1-25/"],
  ["health-beauty", "Rennie Chewing Gum 750g 10’s", "72295G", "https://www.harrisonsdirect.co.uk/product/rennie-chewing-gum-750g-10s/"],
  ["health-beauty", "L’Oreal Men Expert Antiperspirant Deodorant Thermic Resist Roll On 50ml", "72571W", "https://www.harrisonsdirect.co.uk/product/loreal-men-expert-antiperspirant-deodorant-thermic-resist-roll-on-50ml/"],
  ["health-beauty", "Baylis & Harding Goodness Oud Cedar & Amber Body Wash 100ml", "72566G", "https://www.harrisonsdirect.co.uk/product/baylis-harding-goodness-oud-cedar-amber-body-wash-100ml/"],
  ["health-beauty", "Baylis & Harding Elements Pink Blossom & Lotus Flower Hand Wash 500ml", "72564A", "https://www.harrisonsdirect.co.uk/product/baylis-harding-elements-pink-blossom-lotus-flower-hand-wash-500ml/"],
  ["health-beauty", "Baylis & Harding Jojoba Vanilla & Almond Oil Hand Wash 500ml", "72563X", "https://www.harrisonsdirect.co.uk/product/baylis-harding-jojoba-vanilla-almond-oil-hand-wash-500ml/"],
  ["health-beauty", "Baylis & Harding Vetiver Cedar & Lemongrass Anti-Bacterial Hand Wash 500ml", "72562U", "https://www.harrisonsdirect.co.uk/product/baylis-harding-vetiver-cedar-lemongrass-anti-bacterial-hand-wash-500ml/"],
  ["health-beauty", "Wash & Go 2 in 1 Shampoo & Conditioner Classic 290ml", "72241V", "https://www.harrisonsdirect.co.uk/product/wash-go-2-in-1-shampoo-conditioner-classic-290ml/"],
  ["health-beauty", "Malibu 3 Pack 100ml Lotion SPF 8 SPF 20 Aftersun", "72472V", "https://www.harrisonsdirect.co.uk/product/malibu-3-pack-100ml-lotion-spf-8-spf-20-aftersun/"],
  ["health-beauty", "Femfresh Wipes 10’s", "72306U", "https://www.harrisonsdirect.co.uk/product/femfresh-wipes-10s/"],
  ["health-beauty", "Imperial Leather Bodywash Cotton & Vanilla 235ml", "72304O", "https://www.harrisonsdirect.co.uk/product/imperial-leather-bodywash-cotton-vanilla-235ml/"],
  ["health-beauty", "Got2b Glued 4 Brows & Edges 16ml 2in1 Gel", "72327H", "https://www.harrisonsdirect.co.uk/product/got2b-glued-4-brows-edges-16ml-2in1-gel/"],
  ["health-beauty", "Jakemans Soothing Menthol Lozenges Cherry Menthol 73g", "72332X", "https://www.harrisonsdirect.co.uk/product/jakemans-soothing-menthol-lozenges-cherry-menthol-73g/"],
  ["health-beauty", "Original Source Shower Milk Lime & Coconut 250ml", "72305R", "https://www.harrisonsdirect.co.uk/product/original-source-shower-milk-lime-coconut-250ml/"],
  ["health-beauty", "Brushworks Refresh & Reset Face Mist 100ml", "72315W", "https://www.harrisonsdirect.co.uk/product/brushworks-refresh-reset-face-mist-100ml/"],
  ["baby-kids", "Mini Activity Cube Tray Box", "70819Q", "https://www.harrisonsdirect.co.uk/product/mini-activity-cube-tray-box/"],
  ["baby-kids", "Fisher Price 10cm Soft Animal Friends", "70818N", "https://www.harrisonsdirect.co.uk/product/fisher-price-10cm-soft-animal-friends/"],
  ["baby-kids", "Fisher Price 8 Inch Animal Plush CDU", "70817K", "https://www.harrisonsdirect.co.uk/product/fisher-price-8-animal-plush-cdu/"],
  ["baby-kids", "Fisher Price Animal Ball 12.5cm CDU", "70814B", "https://www.harrisonsdirect.co.uk/product/fisher-price-animal-ball-12-5cm-cdu/"],
  ["baby-kids", "Infunbebe Mini Vehicles 6 Pack", "70820U", "https://www.harrisonsdirect.co.uk/product/infunbebe-mini-vehicles-6-pack/"],
  ["baby-kids", "Ms Rachel Jumbo Peg Puzzle", "70688O", "https://www.harrisonsdirect.co.uk/product/ms-rachel-jumbo-peg-puzzle/"],
  ["baby-kids", "Fisher Price Bath Blocks", "69356B", "https://www.harrisonsdirect.co.uk/product/fisher-price-bath-blocks/"],
  ["baby-kids", "Fisher Price Baby Training Ball", "69354V", "https://www.harrisonsdirect.co.uk/product/fisher-price-baby-training-ball/"],
  ["baby-kids", "Fisher Price Tee-Pee Play Tent", "69352P", "https://www.harrisonsdirect.co.uk/product/fisher-price-tee-pee-play-tent/"],
  ["baby-kids", "Fisher Price Portable Circular Ball Pit 25pc", "69350J", "https://www.harrisonsdirect.co.uk/product/fisher-price-portable-circular-ball-pit-25pc/"],
  ["baby-kids", "Play+ Are You a Monkey Like Me", "70041B", "https://www.harrisonsdirect.co.uk/product/play-are-you-a-monkey-like-me/"],
  ["baby-kids", "Play+ Shhh Who’s There Baby Animals", "70039U", "https://www.harrisonsdirect.co.uk/product/play-shhhwhos-there-baby-animals/"],
  ["baby-kids", "Play+ Rainmaker Shake & Twist Gecko", "70044K", "https://www.harrisonsdirect.co.uk/product/play-rainmaker-shake-twist-gecko/"],
  ["baby-kids", "Play+ Search and Shine In the Jungle", "70040Y", "https://www.harrisonsdirect.co.uk/product/play-search-and-shine-in-the-jungle/"],
  ["baby-kids", "Bluey’s Telephone", "70046Q", "https://www.harrisonsdirect.co.uk/product/blueys-telephone/"],
];
const getMeta = (html, property) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"))?.[1] || "";
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&#8217;/g, "’").replace(/&quot;/g, "\"");
const pause = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const details = [];
for (const [category, expectedName, sku, sourceUrl] of candidates) {
  let attempt = 0;
  let html = "";
  let status = 0;
  while (attempt < 3 && !html) {
    attempt += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0" }, signal: controller.signal });
      status = response.status;
      if (response.ok) html = await response.text();
    } catch {}
    clearTimeout(timeout);
    if (!html) await pause(700 * attempt);
  }
  const image = decode(getMeta(html, "og:image"));
  const title = decode(getMeta(html, "og:title")).replace(/ from Harrisons Direct$/i, "") || expectedName;
  const packMatch = html.match(/Pack Quantity\s*:?\s*<[^>]*>\s*([0-9]+)/i) || html.match(/Pack Quantity\s*:?\s*([0-9]+)/i);
  const pack = packMatch ? `Pack of ${packMatch[1]}` : "";
  details.push({ category, expectedName, name: title, sku, pack, image, sourceUrl, status, collected: Boolean(html && image && pack) });
  await pause(300);
}
await writeFile(outputPath, `${JSON.stringify({ collectedAt: new Date().toISOString(), products: details }, null, 2)}\n`);
console.log(JSON.stringify({ total: details.length, collected: details.filter((product) => product.collected).length, failures: details.filter((product) => !product.collected).map((product) => ({ sku: product.sku, status: product.status })), outputPath }, null, 2));
