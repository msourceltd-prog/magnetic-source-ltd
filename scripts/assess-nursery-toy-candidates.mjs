import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/nursery-toy-candidate-assessment.json");
const candidates = [
  ["Mini Activity Cube Tray Box", "70819Q", "https://www.harrisonsdirect.co.uk/product/mini-activity-cube-tray-box/"],
  ["Fisher Price 10cm Soft Animal Friends", "70818N", "https://www.harrisonsdirect.co.uk/product/fisher-price-10cm-soft-animal-friends/"],
  ["Fisher Price 8 Inch Animal Plush CDU", "70817K", "https://www.harrisonsdirect.co.uk/product/fisher-price-8-animal-plush-cdu/"],
  ["Fisher Price Animal Ball 12.5cm CDU", "70814B", "https://www.harrisonsdirect.co.uk/product/fisher-price-animal-ball-12-5cm-cdu/"],
  ["Infunbebe Mini Vehicles 6 Pack", "70820U", "https://www.harrisonsdirect.co.uk/product/infunbebe-mini-vehicles-6-pack/"],
  ["Ms Rachel Jumbo Peg Puzzle", "70688O", "https://www.harrisonsdirect.co.uk/product/ms-rachel-jumbo-peg-puzzle/"],
  ["Fisher Price Bath Blocks", "69356B", "https://www.harrisonsdirect.co.uk/product/fisher-price-bath-blocks/"],
  ["Fisher Price Baby Training Ball", "69354V", "https://www.harrisonsdirect.co.uk/product/fisher-price-baby-training-ball/"],
  ["Fisher Price Tee-Pee Play Tent", "69352P", "https://www.harrisonsdirect.co.uk/product/fisher-price-tee-pee-play-tent/"],
  ["Fisher Price Portable Circular Ball Pit 25pc", "69350J", "https://www.harrisonsdirect.co.uk/product/fisher-price-portable-circular-ball-pit-25pc/"],
  ["Play+ Are You a Monkey Like Me", "70041B", "https://www.harrisonsdirect.co.uk/product/play-are-you-a-monkey-like-me/"],
  ["Play+ Shhh Who’s There Baby Animals", "70039U", "https://www.harrisonsdirect.co.uk/product/play-shhhwhos-there-baby-animals/"],
  ["Play+ Rainmaker Shake & Twist Gecko", "70044K", "https://www.harrisonsdirect.co.uk/product/play-rainmaker-shake-twist-gecko/"],
  ["Play+ Search and Shine In the Jungle", "70040Y", "https://www.harrisonsdirect.co.uk/product/play-search-and-shine-in-the-jungle/"],
  ["Bluey’s Telephone", "70046Q", "https://www.harrisonsdirect.co.uk/product/blueys-telephone/"],
  ["Peppa Pig Sing With Me Peppa", "69295O", "https://www.harrisonsdirect.co.uk/product/peppa-pig-sing-with-me-peppa/"],
  ["Peppa Pig Whizz Around", "69293I", "https://www.harrisonsdirect.co.uk/product/peppa-pig-whizz-around-whizz-around/"],
  ["Miss Rachel Speak & Sing Doll", "69853M", "https://www.harrisonsdirect.co.uk/product/miss-rachel-speak-sing-doll/"],
  ["Miss Rachel Tummy Time Activity Bus", "69852J", "https://www.harrisonsdirect.co.uk/product/miss-rachel-tummy-time-activity-bus/"],
  ["Mummy Pig Peppa & George Bath Squirters", "67506Y", "https://www.harrisonsdirect.co.uk/product/mummy-pig-peppa-george-bath-squirters/"],
  ["Peppa’s Tea Set", "66702O", "https://www.harrisonsdirect.co.uk/product/peppas-tea-set/"],
  ["Tooky Toy Take-Along Tool Box", "66643H", "https://www.harrisonsdirect.co.uk/product/tooky-toy-take-along-tool-box/"],
  ["Casdon GPS Steering Wheel", "66564Q", "https://www.harrisonsdirect.co.uk/product/casdon-gps-steering-wheel/"],
  ["Infunbebe My First Spinning Top", "54324U", "https://www.harrisonsdirect.co.uk/product/infunbebe-my-first-spinning-top/"],
  ["TOMY Toomies 7 in 1 Bath Activity Octopus", "63952D", "https://www.harrisonsdirect.co.uk/product/tomy-toomies-7-in-1-bath-activity-octopus/"],
  ["Casdon Joseph Joseph Chop2Pot", "61165Z", "https://www.harrisonsdirect.co.uk/product/casdon-joseph-joseph-chop2pot/"],
  ["TOMY Toomies Peppa Pull & Go Pedalo", "61122W", "https://www.harrisonsdirect.co.uk/product/peppa-pull-go-pedalo/"],
];
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku,slug,category`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveSkus = new Set(live.map((product) => product.sku));
const liveNames = new Set(live.map((product) => normalize(product.name)));
const report = candidates.map(([name, sourceSku, sourceUrl]) => ({ name, sourceSku, sourceUrl, available: !liveSkus.has(sourceSku) && !liveNames.has(normalize(name)) }));
await writeFile(outputPath, `${JSON.stringify({ assessedAt: new Date().toISOString(), liveProductCount: live.length, candidates: report }, null, 2)}\n`);
console.log(JSON.stringify({ candidates: report.length, available: report.filter((product) => product.available).map((product) => product.sourceSku), outputPath }, null, 2));
