import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/child-appropriate-toy-page-two-assessment.json");
const candidates = [
  ["Nebulus Scooter Neon Orange With Black Chrome Finish", "73037G", "https://www.harrisonsdirect.co.uk/product/nebulus-scooter-neon-orange-with-black-chrome-finish/"],
  ["Unicorn Trail Twist Folding Light Up Scooter", "73036D", "https://www.harrisonsdirect.co.uk/product/unicorn-trail-twist-folding-light-up-scooter/"],
  ["Dinosaur Trail Twist Folding Light Up Scooter", "73035A", "https://www.harrisonsdirect.co.uk/product/dinosaur-trail-twist-folding-light-up-scooter/"],
  ["Palm Pals Colson Hot Dog Approx 5 inch", "72380Q", "https://www.harrisonsdirect.co.uk/product/palm-pals-colson-hot-dog-approx-5/"],
  ["Palm Pals Tomas BLT Approx 5 inch", "72378J", "https://www.harrisonsdirect.co.uk/product/palm-pals-tomas-blt-approx-5/"],
  ["Staedtler Peppa Pig Fibre Tip Pens 6 Assorted Colours", "39569Z", "https://www.harrisonsdirect.co.uk/product/staedtler-peppa-pig-fibre-tip-pens-6-assorted-colours/"],
  ["Animigos Funky Friends Burger", "72686U", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-burger/"],
  ["Animigos Funky Friends Daisy", "72685R", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-daisy/"],
  ["Animigos Funky Friends Tulip", "72684O", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-tulip/"],
  ["Animigos Funky Friends Sunflower", "72683L", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-sunflower/"],
  ["Animigos Funky Friends Pizza", "72682I", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-pizza/"],
  ["Animigos Funky Friends French Fries", "72681F", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-french-fries/"],
  ["Animigos Funky Friends Taco", "72680C", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-taco/"],
  ["Animigos Funky Friends Succulent", "72677S", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-succulent/"],
  ["Animigos Funky Friends Avocado", "72676P", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-avocado/"],
  ["Animigos Funky Friends Bubble Tea", "72675M", "https://www.harrisonsdirect.co.uk/product/animigos-funky-friends-bubble-tea/"],
  ["Clickeez 2 Pack Series 3 CDU", "72737C", "https://www.harrisonsdirect.co.uk/product/clickeez-2-pack-series-3-cdu/"],
  ["Fidget Fortune Teller", "72992Z", "https://www.harrisonsdirect.co.uk/product/fidget-fortune-teller/"],
  ["WWE Championship Title Slap Bands CDU", "72784S", "https://www.harrisonsdirect.co.uk/product/wwe-championship-title-slap-bands-cdu/"],
  ["LEGO Creator 31383 Floral Decor Perfume Bottle", "72816T", "https://www.harrisonsdirect.co.uk/product/lego-creator-31383-floral-decor-perfume-bottle/"],
  ["Flip N Trix Assorted Clipstrip", "72740M", "https://www.harrisonsdirect.co.uk/product/flip-n-trix-assorted-clipstrip-2-x-8/"],
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
