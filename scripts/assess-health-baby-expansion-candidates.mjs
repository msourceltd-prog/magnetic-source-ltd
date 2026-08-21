import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const outputPath = resolve("data/health-baby-candidate-assessment.json");
const candidates = {
  "health-beauty": [
    ["Hygie Hand Cleanser Mixed Case 35ml 24’s", "73197O", "https://www.harrisonsdirect.co.uk/product/hygie-hand-cleanser-mixed-case-35ml-24s/"],
    ["La Vida Caribena Body Mists Mixed Case 35ml 24’s", "73196L", "https://www.harrisonsdirect.co.uk/product/la-vida-caribena-body-mists-mixed-case-35ml-24s/"],
    ["Umbro Bodywash Power 400ml", "73097K", "https://www.harrisonsdirect.co.uk/product/umbro-bodywash-power-400ml/"],
    ["Umbro Bodywash Ice 400ml", "73096H", "https://www.harrisonsdirect.co.uk/product/umbro-bodywash-ice-400ml/"],
    ["Chupa Chups Strawberry Lip Balm", "73087F", "https://www.harrisonsdirect.co.uk/product/chupa-chups-strawberry-lip-balm/"],
    ["Chupa Chups Watermelon, Peach & Lemon Lip Balms", "73086C", "https://www.harrisonsdirect.co.uk/product/chupa-chups-watermelon-peach-lemon-lip-balms/"],
    ["Amplex Roll On Deodorant Active 50ml", "73041T", "https://www.harrisonsdirect.co.uk/product/amplex-roll-on-deodorant-active-50ml/"],
    ["Aussie Shampoo Mega Travel 100ml", "72983X", "https://www.harrisonsdirect.co.uk/product/aussie-shampoo-mega-travel-100ml/"],
    ["Aussie Conditioner Mega Travel 100ml", "72982U", "https://www.harrisonsdirect.co.uk/product/aussie-conditioner-mega-travel-100ml/"],
    ["Peppa Pig Bath & Shower Bubbles 400ml", "72913O", "https://www.harrisonsdirect.co.uk/product/peppa-pig-bath-shower-bubbles-400ml/"],
    ["Spiderman Stitch Bath & Shower Bubbles 400ml", "72911I", "https://www.harrisonsdirect.co.uk/product/spiderman-stitch-bath-shower-bubbles-400ml/"],
    ["Denman D90 The Mini Detangler Black", "72780G", "https://www.harrisonsdirect.co.uk/product/denman-d90-the-mini-detangler-black/"],
    ["Denman D6 The Shower Brush Black", "72779C", "https://www.harrisonsdirect.co.uk/product/denman-d6-the-shower-brush-black/"],
    ["Lip Balm SPF 15 Original 10g", "72719Y", "https://www.harrisonsdirect.co.uk/product/lip-balm-spf-15-original-10g/"],
    ["Sure Men Whole Body Stick Ocean Rush 50ml", "72770B", "https://www.harrisonsdirect.co.uk/product/sure-men-whole-body-stick-ocean-rush-50ml/"],
    ["Sure Women Whole Body Stick Rio Coconut 50ml", "72769X", "https://www.harrisonsdirect.co.uk/product/sure-women-whole-body-stick-rio-coconut-50ml/"],
    ["Sure Men Whole Body Aerosol Ocean Rush 150ml", "72768U", "https://www.harrisonsdirect.co.uk/product/sure-men-whole-body-aerosol-ocean-rush-150ml/"],
  ],
  "baby-kids": [
    ["Grow with Peppa Baby Lotion 350ml", "72710X", "https://www.harrisonsdirect.co.uk/product/grow-with-peppa-baby-lotion-350ml/"],
    ["Grow with Peppa Baby Conditioning Shampoo 350ml", "72709T", "https://www.harrisonsdirect.co.uk/product/grow-with-peppa-baby-conditioning-shampoo-350ml/"],
    ["NUK First Choice Day & Night Soother 2 Pack 6-18m Boys", "72594P", "https://www.harrisonsdirect.co.uk/product/first-choice-day-night-soother-2-pack-6-18m-boys/"],
    ["NUK First Choice Day & Night Soother 2 Pack 0-6m Boys", "72592J", "https://www.harrisonsdirect.co.uk/product/first-choice-day-night-soother-2-pack-0-6m-boys/"],
    ["4My Baby Nappy Bags Fragranced 200’s", "70523R", "https://www.harrisonsdirect.co.uk/product/4my-baby-nappy-bags-fragranced-200s/"],
    ["2 Pack Baby Sponges", "39537E", "https://www.harrisonsdirect.co.uk/product/2-pack-baby-sponges/"],
    ["Cheeky Panda Bamboo Baby Wipes Pack 60’s", "69375I", "https://www.harrisonsdirect.co.uk/product/cheeky-panda-bamboo-baby-wipes-pack-60s/"],
    ["Pampers Baby-Dry Nappy Pants Size 7 15+kg, 33+ lbs, 16’s", "69108A", "https://www.harrisonsdirect.co.uk/product/pampers-baby-dry-nappies-size-7-16ct-carry-pack-16s/"],
    ["Cherubs Baby Soothers Card of 25", "67332T", "https://www.harrisonsdirect.co.uk/product/cherubs-baby-soothers-card-of-25/"],
    ["Capitol Safety Soothers Blue 2 Pack", "67226W", "https://www.harrisonsdirect.co.uk/product/capitol-safety-soothers-blue-2-pack/"],
    ["Johnson’s Baby Cotton Pads 50’s", "64411S", "https://www.harrisonsdirect.co.uk/product/johnsons-baby-cotton-pads-50s/"],
    ["Pampers Scented Baby Wipes 52s", "64372V", "https://www.harrisonsdirect.co.uk/product/pampers-scented-baby-wipes-52s/"],
    ["Water Filled Cooling Teether 3+ Months Assorted Colours", "38859A", "https://www.harrisonsdirect.co.uk/product/water-filled-cooling-teether-3-months-assorted-colours/"],
    ["Johnson’s Baby Lotion 300ml", "61613O", "https://www.harrisonsdirect.co.uk/product/johnson-s-baby-lotion-300ml/"],
    ["Johnson’s Baby Bath 300ml", "61612L", "https://www.harrisonsdirect.co.uk/product/johnson-s-baby-bath-300ml/"],
    ["WaterWipes Sensitive Baby Wipes 60’s", "55935G", "https://www.harrisonsdirect.co.uk/product/water-wipes-sensitive-baby-wipes-60-s/"],
    ["Huggies Little Swimmers Assorted Sizes", "55913Q", "https://www.harrisonsdirect.co.uk/product/huggies-little-swimmers-assorted-sizes/"],
    ["Pampers Sensitive Baby Wipes 52’s", "51000U", "https://www.harrisonsdirect.co.uk/product/pampers-sensitive-baby-wipes-52-s/"],
    ["Cherubs Baby Feeding Bottle 250ml", "31960S", "https://www.harrisonsdirect.co.uk/product/cherubs-baby-feeding-bottle-250ml/"],
  ],
};
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku,slug,category`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue request failed: ${response.status} ${await response.text()}`);
const live = await response.json();
const liveSkus = new Set(live.map((product) => product.sku));
const liveNames = new Set(live.map((product) => normalize(product.name)));
const report = Object.fromEntries(Object.entries(candidates).map(([category, products]) => [category, products.map(([name, sourceSku, sourceUrl]) => ({ name, sourceSku, sourceUrl, available: !liveSkus.has(sourceSku) && !liveNames.has(normalize(name)) }))]));
await writeFile(outputPath, `${JSON.stringify({ assessedAt: new Date().toISOString(), liveProductCount: live.length, candidates: report }, null, 2)}\n`);
console.log(JSON.stringify({ liveProductCount: live.length, available: Object.fromEntries(Object.entries(report).map(([category, products]) => [category, products.filter((product) => product.available).length])), outputPath }, null, 2));
