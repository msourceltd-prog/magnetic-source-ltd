import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/child-appropriate-toy-candidate-assessment.json");
const candidates = [
  ["Crayola Pokemon 96 Page Colouring Book", "39638L", "https://www.harrisonsdirect.co.uk/product/crayola-pokemon-96-page-colouring-book/"],
  ["Monopoly Deal", "72989P", "https://www.harrisonsdirect.co.uk/product/monopoly-deal/"],
  ["Hydrostorm Blaster 2-in-1 Detachable Water Gun Assorted CDU", "73150Z", "https://www.harrisonsdirect.co.uk/product/hydrostorm-blaster-2-in-1-detachable-water-gun-assorted-cdu/"],
  ["Paw Patrol Dino Themed Vehicle Skye", "72846I", "https://www.harrisonsdirect.co.uk/product/paw-patrol-dino-themed-vehicle-skye/"],
  ["The Big Squij Hot Dog", "72655C", "https://www.harrisonsdirect.co.uk/product/the-big-squij-hot-dog/"],
  ["Fisher Price Pop-Up Play Tunnel", "73165T", "https://www.harrisonsdirect.co.uk/product/fisher-price-pop-up-play-tunnel/"],
  ["Zuru X-Shot Excel Hawk Eye With 16 Darts", "73164Q", "https://www.harrisonsdirect.co.uk/product/zuru-x-shot-excel-hawk-eye-with-16-darts/"],
  ["Zuru Xshot Excel Double Fury 4 Blaster Combo Pack", "73163N", "https://www.harrisonsdirect.co.uk/product/zuru-xshot-excel-double-fury-4-blaster-combo-pack/"],
  ["Zuru Metal Machines S1 T-Rex Playset", "73161H", "https://www.harrisonsdirect.co.uk/product/zuru-metal-machines-s1-t-rex-playset/"],
  ["Zuru Metal Machines S1 Road Rampage Playset", "73160E", "https://www.harrisonsdirect.co.uk/product/zuru-metal-machines-s1-road-rampage-playset/"],
  ["K-Pop Superstars Doll 3 Pack", "73159A", "https://www.harrisonsdirect.co.uk/product/k-pop-superstars-doll-3-pack/"],
  ["Fisher Price Baby Roll Around 6m+", "70692B", "https://www.harrisonsdirect.co.uk/product/fisher-price-baby-roll-around-6m/"],
  ["Scrunchems Sticky Squishy Highland Cow CDU", "72753A", "https://www.harrisonsdirect.co.uk/product/scrunchems-sticky-squishy-highland-cow-cdu/"],
  ["Crayola Clicks Retractable Markers 10 Pack Pastel Colours", "39633W", "https://www.harrisonsdirect.co.uk/product/crayola-clicks-retractable-markers-10-pack-pastel-colours/"],
  ["Crayola Clicks Retractable Markers 10 Pack Classic Colours", "39632T", "https://www.harrisonsdirect.co.uk/product/crayola-clicks-retractable-markers-10-pack-classic-colours/"],
  ["Push and Pop Fidget Game Assorted Colours", "73187J", "https://www.harrisonsdirect.co.uk/product/push-and-pop-fidget-game-assorted-colours/"],
  ["Capybara Pick N Pop Putty", "72991W", "https://www.harrisonsdirect.co.uk/product/capybara-pick-n-pop-putty/"],
  ["Colouring Book Animals & Oceans", "39623R", "https://www.harrisonsdirect.co.uk/product/colouring-book-animals-oceans/"],
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
