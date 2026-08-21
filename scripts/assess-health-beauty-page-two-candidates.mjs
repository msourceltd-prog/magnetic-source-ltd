import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/health-beauty-page-two-candidate-assessment.json");
const candidates = [
  ["Sure Women Whole Body Aerosol Rio Coconut 150ml", "72767R", "https://www.harrisonsdirect.co.uk/product/sure-women-whole-body-aerosol-rio-coconut-150ml/"],
  ["Sure Women Whole Body Aerosol Wild Rose 150ml", "72766O", "https://www.harrisonsdirect.co.uk/product/sure-women-whole-body-aerosol-wild-rose-150ml/"],
  ["Nivea Shave Mens After Shave Moisturiser Protect & Care 75ml", "72754D", "https://www.harrisonsdirect.co.uk/product/nivea-shave-mens-after-shave-moisturiser-protect-care-75ml/"],
  ["Amplex Roll On Deodorant Ocean 50ml", "72743V", "https://www.harrisonsdirect.co.uk/product/amplex-roll-on-deodorant-ocean-50ml/"],
  ["So Useful 3 Ply Pocket Tissues 10’s 6 Pack", "39630N", "https://www.harrisonsdirect.co.uk/product/pocket-tissues-6pk-cdu/"],
  ["Palmolive Shampoo 2in1 350ml", "72569P", "https://www.harrisonsdirect.co.uk/product/palmolive-shampoo-2in1-350ml-pmp-1-25/"],
  ["Rennie Chewing Gum 750g 10’s", "72295G", "https://www.harrisonsdirect.co.uk/product/rennie-chewing-gum-750g-10s/"],
  ["L’Oreal Men Expert Antiperspirant Deodorant Thermic Resist Roll On 50ml", "72571W", "https://www.harrisonsdirect.co.uk/product/loreal-men-expert-antiperspirant-deodorant-thermic-resist-roll-on-50ml/"],
  ["L’Oreal Men Expert Antiperspirant Deodorant Carbon Protect Roll On 50ml", "72570T", "https://www.harrisonsdirect.co.uk/product/loreal-men-expert-antiperspirant-deodorant-carbon-protect-roll-on-50ml/"],
  ["Baylis & Harding Goodness Oud Cedar & Amber Body Wash 100ml", "72566G", "https://www.harrisonsdirect.co.uk/product/baylis-harding-goodness-oud-cedar-amber-body-wash-100ml/"],
  ["Baylis & Harding Elements Pink Blossom & Lotus Flower Hand Wash 500ml", "72564A", "https://www.harrisonsdirect.co.uk/product/baylis-harding-elements-pink-blossom-lotus-flower-hand-wash-500ml/"],
  ["Baylis & Harding Jojoba Vanilla & Almond Oil Hand Wash 500ml", "72563X", "https://www.harrisonsdirect.co.uk/product/baylis-harding-jojoba-vanilla-almond-oil-hand-wash-500ml/"],
  ["Baylis & Harding Vetiver Cedar & Lemongrass Anti-Bacterial Hand Wash 500ml", "72562U", "https://www.harrisonsdirect.co.uk/product/baylis-harding-vetiver-cedar-lemongrass-anti-bacterial-hand-wash-500ml/"],
  ["Wash & Go 2 in 1 Shampoo & Conditioner Classic 290ml", "72241V", "https://www.harrisonsdirect.co.uk/product/wash-go-2-in-1-shampoo-conditioner-classic-290ml/"],
  ["Malibu 3 Pack 100ml Lotion SPF 8 SPF 20 Aftersun", "72472V", "https://www.harrisonsdirect.co.uk/product/malibu-3-pack-100ml-lotion-spf-8-spf-20-aftersun/"],
  ["Femfresh Wipes 10’s", "72306U", "https://www.harrisonsdirect.co.uk/product/femfresh-wipes-10s/"],
  ["Imperial Leather Bodywash Cotton & Vanilla 235ml", "72304O", "https://www.harrisonsdirect.co.uk/product/imperial-leather-bodywash-cotton-vanilla-235ml/"],
  ["Got2b Glued 4 Brows & Edges 16ml 2in1 Gel", "72327H", "https://www.harrisonsdirect.co.uk/product/got2b-glued-4-brows-edges-16ml-2in1-gel/"],
  ["Jakemans Soothing Menthol Lozenges Cherry Menthol 73g", "72332X", "https://www.harrisonsdirect.co.uk/product/jakemans-soothing-menthol-lozenges-cherry-menthol-73g/"],
  ["Original Source Shower Milk Lime & Coconut 250ml", "72305R", "https://www.harrisonsdirect.co.uk/product/original-source-shower-milk-lime-coconut-250ml/"],
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
