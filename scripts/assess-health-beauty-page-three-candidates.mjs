import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/health-beauty-page-three-candidate-assessment.json");
const candidates = [
  ["Brushworks Scalp Massaging Brush", "72317C", "https://www.harrisonsdirect.co.uk/product/brushworks-scalp-massaging-brush/"],
  ["Brushworks Refresh & Reset Face Mist 100ml", "72315W", "https://www.harrisonsdirect.co.uk/product/brushworks-refresh-reset-face-mist-100ml/"],
  ["Brushworks Pink Eyelash Curler", "72314T", "https://www.harrisonsdirect.co.uk/product/brushworks-pink-eyelash-curler/"],
  ["Brushworks Silicone Cleansing Pads 2 Pack", "72311K", "https://www.harrisonsdirect.co.uk/product/brushworks-silicone-cleansing-pads-2-pack/"],
  ["Brushworks Watermelon Dry Shampoo 50ml", "72272N", "https://www.harrisonsdirect.co.uk/product/brushworks-watermelon-dry-shampoo-50ml/"],
  ["Brushworks Micellar Cleansing Water 100ml", "72271K", "https://www.harrisonsdirect.co.uk/product/brushworks-micellar-cleansing-water-100ml/"],
  ["Dove Men Shower Gel Clean Comfort 55ml", "72250X", "https://www.harrisonsdirect.co.uk/product/dove-men-shower-gel-clean-comfort-55ml/"],
  ["Vaseline Intensive Care Lotion Healthy Hands 200ml", "72240S", "https://www.harrisonsdirect.co.uk/product/vaseline-intensive-care-lotion-healthy-hands-200ml/"],
];
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku,slug,category`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveSkus = new Set(live.map((product) => product.sku));
const liveNames = new Set(live.map((product) => normalize(product.name)));
const report = candidates.map(([name, sourceSku, sourceUrl]) => ({ name, sourceSku, sourceUrl, available: !liveSkus.has(sourceSku) && !liveNames.has(normalize(name)) }));
await writeFile(outputPath, `${JSON.stringify({ assessedAt: new Date().toISOString(), liveProductCount: live.length, candidates: report }, null, 2)}\n`);
console.log(JSON.stringify({ available: report.filter((product) => product.available).map((product) => product.sourceSku), outputPath }, null, 2));
