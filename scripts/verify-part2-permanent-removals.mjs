import { writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";

const targets = [
  ["Johny Bee Splash Brush 12g", "72802C"], ["Mallow & Marsh Dulce de Leche Coated in Milk Chocolate 100g", "SWE-72697C"], ["Gummi King Pizza 90g", "73027B"], ["Mitsuba Korean Crispies 85g", "72819C"], ["Mitsuba Katsu Curry Crispies 85g", "72820G"], ["Barbie Gummies Bag 100g", "73109B"], ["Hot Wheels Gummies Bag 100g", "73110F"], ["Tetris Gummies Bag 125g", "73112L"], ["Pac-Man Gummies Bag 125g", "73113O"], ["Space Invaders Gummies Bag 125g", "73114R"], ["Tetris Sour Foam Gums Bag 125g", "73115U"], ["Pac-Man Sour Foam Gums Bag 125g", "73116X"], ["Real Good Food Yoghurt Coated Cranberries Pouch 150g", "75994X"],
  ["Paw Patrol Dino Themed Vehicle Skye", "72846I"], ["Animigos Funky Friends – Sunflower", "72683L"], ["K-Pop Superstars Doll 3 Pack", "73159A"], ["Umbro Socks & Ice Hair & Body Wash 150ml Gift Set", "73103J"], ["Umbro Body Wash 3D Torso – 4 Assorted 350ml Gift Set", "73104M"],
  ["Push and Pop Fidget Game – Assorted Colours", "73187J"], ["Water Filled Cooling Teether 3+ Months Assorted Colours", "38859A"], ["Johnson’s Baby Shampoo 300ml", "61614R"], ["Play+ Rainmaker Shake & Twist Gecko", "70044K"], ["Capitol Safety Soothers Pink 2 Pack", "67227Z"], ["Cottontails for Mums Disposable Breast Pads 40’s", "48758P"], ["Johnson’s Baby Shampoo 100ml", "607T"],
  ["Foil Helium Balloon 18″ – Congratulations", "STP-39280W"], ["Foil Helium Balloon 18″ – Baby Shower", "STP-39279S"], ["Foil Helium Balloon 18″ – You’re Engaged", "STP-39278P"], ["Foil Helium Balloon 18″ – Happy Birthday", "STP-39276J"], ["Foil Helium Balloon 18″ – Birthday Boy", "STP-39274D"], ["Packed Wrap 2 Sheets & 2 Tags – Traditional Female", "STP-35020M"], ["Easynote Pocket Soft Touch Notebook – Pastel Colours", "65510Z"], ["Gift Bag Extra Large – Holographic Assorted Colours W330 x H450 x D100mm", "STP-5808I"], ["Easynote Slim Soft Touch Notebook – Pastel Colours", "65509V"], ["Just Stationery A4 Hardback Notebook Brights Design", "STP-65474L"], ["9 Unicorn & Animal Erasers", "39486W"], ["2027 Memo Calendar with Shopping Pad & Pen", "STX-22640U"], ["Bic 4 Colours Shine Tubo Pen Tub", "STP-31754R"], ["Duralon Glue Stick", "STP-37404Q"], ["Baby Girl Card Teddy", "STX-39480E"], ["Baby Boy Card Bunting", "STX-39481H"], ["Birthday Card – Open Square Stars 160mm x 160mm", "STX-39493S"], ["Birthday Card – Open Square Cheers 160mm x 160mm", "STX-39494V"],
  ["M.Y Tennis Set Super Neon", "64606K"], ["Child Face Mask – Princess", "54049H"], ["Paper Snack & Sandwich Bags 15x25cm 25’s", "38495S"], ["Haribo Sour Skeletons 140g £1.25 PMP – Best Before End 9/26", "4342K"],
  ["Brushworks Rose Resin Roller & Gua Sha", "HBT-72309D"], ["Pretty Cosmetic Pads 80’s", "HBT-2349T"], ["Aloha Sun Lotion SPF 30 Pocket Pack 50ml", "HBT-1095O"], ["Wash & Go 2 in 1 Shampoo & Conditioner Classic 290ml", "72241V"], ["Brushworks Refresh & Reset Face Mist 100ml", "72315W"], ["Baylis & Harding Vetiver Cedar & Lemongrass Anti-Bacterial Hand Wash 500ml", "72562U"], ["Baylis & Harding Jojoba Vanilla & Almond Oil Hand Wash 500ml", "72563X"], ["Denman D6 The Shower Brush Black", "72779C"], ["Denman D90 The Mini Detangler Black", "72780G"], ["LaModa Rainbow Slim Handled Detangler Brush", "HBT-67865L"], ["L’Oreal Men Expert Antiperspirant Deodorant Carbon Protect Roll On 50ml", "HBT-72570T"], ["L’Oreal Men Expert Antiperspirant Deodorant Thermic Resist Roll On 50ml", "72571W"], ["Simple Sensitive Twin Soap 2 x 100g Bars", "HBT-62816L"],
  ["Rosewood Collagen Chicken Rolls 70g", "HPE-72358Z"], ["Folding Umbrella in CDU Assorted Colours", "39631Q"], ["Hilka Junior Children’s Ear Defenders – Blue", "39640S"], ["Hilka Junior Children’s Ear Defenders – Pink", "39641V"], ["Good Boy Threads Bungee Figure 8 Tugger Dog Toy", "HPE-72387L"],
];

const normalise = (value = "") => value.toLowerCase().replace(/[’'′″“”–—-]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const normaliseSku = (value = "") => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,sku,slug,category,description,image,tags&order=id`, { headers: { apikey: publicKey } });
if (!response.ok) throw new Error(`Live catalogue read failed: ${response.status} ${await response.text()}`);
const products = await response.json();
const requestedBySku = new Map();
const duplicateInstructions = [];
for (const [name, sku] of targets) {
  const key = normaliseSku(sku);
  if (requestedBySku.has(key)) duplicateInstructions.push({ name, sku, duplicateOf: requestedBySku.get(key) });
  else requestedBySku.set(key, { name, sku });
}
const resolved = [];
const missing = [];
const ambiguous = [];
for (const target of requestedBySku.values()) {
  const skuMatches = products.filter((product) => normaliseSku(product.sku) === normaliseSku(target.sku));
  const exactMatches = skuMatches.filter((product) => normalise(product.name) === normalise(target.name));
  if (exactMatches.length === 1) resolved.push({ ...target, product: exactMatches[0], reason: "exact_name_and_sku" });
  else if (skuMatches.length === 1) resolved.push({ ...target, product: skuMatches[0], reason: "unique_sku_name_variant" });
  else if (skuMatches.length > 1 || exactMatches.length > 1) ambiguous.push({ ...target, skuMatches: skuMatches.map((product) => ({ id: product.id, name: product.name, sku: product.sku })) });
  else missing.push(target);
}
const realGoodFood = products.filter((product) => /real\s+good\s+food/i.test(`${product.name} ${product.description || ""} ${(product.tags || []).join(" ")}`));
const directIds = new Set(resolved.map((entry) => entry.product.id));
const combined = [...resolved.map((entry) => entry.product), ...realGoodFood.filter((product) => !directIds.has(product.id))];
const report = {
  generatedAt: new Date().toISOString(),
  liveProductCount: products.length,
  instructionLines: targets.length,
  uniqueReferenceTargets: requestedBySku.size,
  duplicateInstructions,
  resolved,
  missing,
  ambiguous,
  realGoodFood,
  combinedUniqueDeletionCandidates: combined,
};
await writeFile(`${projectRoot}/data/part2-permanent-removal-preflight.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ liveProductCount: products.length, uniqueReferenceTargets: requestedBySku.size, resolved: resolved.length, missing: missing.length, ambiguous: ambiguous.length, realGoodFood: realGoodFood.length, combinedUniqueDeletionCandidates: combined.length, duplicateInstructions: duplicateInstructions.length }, null, 2));
if (missing.length || ambiguous.length) process.exitCode = 2;
