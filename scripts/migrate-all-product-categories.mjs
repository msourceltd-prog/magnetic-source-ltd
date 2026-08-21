import { mkdir, readFile, writeFile } from "node:fs/promises";

const confirmationPhrase = "MIGRATE_ALL_PRODUCT_CATEGORIES";
const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const backupsRoot = "/home/ubuntu/magnetic-source-catalogue-backups";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.CATEGORY_MIGRATION_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.CATEGORY_MIGRATION_ADMIN_PASSWORD;
const allowedCategories = ["baby-kids", "clearance", "health-beauty", "household-pet", "seasonal-christmas", "stationery-party", "sweets-snacks", "toys-gifts"];
const backupPath = `${backupsRoot}/before-all-product-category-migration-2026-08-21.json`;
const reportPath = `${projectRoot}/data/all-product-category-migration-report.json`;
const reviewPath = `${projectRoot}/uncategorised_review.txt`;
const normalize = (value) => String(value || "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const includesAny = (value, terms) => terms.some((term) => value.includes(term));

function classify(product) {
  const text = normalize(`${product.name} ${product.description || ""}`);
  if (includesAny(text, ["clearance", "discontinued"])) return { category: "clearance", reason: "explicit clearance/discontinued wording", ambiguous: false };
  if (includesAny(text, ["christmas", "xmas", "santa", "festive", "seasonal", "winter wonderland", "halloween", "easter", "valentine", "advent", "ho ho ho"])) return { category: "seasonal-christmas", reason: "seasonal wording", ambiguous: false };
  if (includesAny(text, ["baby", "nappy", "nursery", "soother", "teether", "breast pad", "baby wipe", "little swimmers", "infant", "toddler", "newborn", "fisher price", "nuby", "weaning", "activity cube", "infunbebe", "bath blocks", "play tent", "rainmaker", "blueys telephone", "play search and shine", "play are you a monkey"])) return { category: "baby-kids", reason: "baby/nursery wording", ambiguous: false };
  if (includesAny(text, ["shampoo", "conditioner", "body wash", "bodywash", "shower gel", "shower", "bubble bath", "bath fizz", "bath bomb", "bath salt", "soap", "deodorant", "antiperspirant", "toothpaste", "toothbrush", "mouthwash", "lip balm", "lip gloss", "lipstick", "nail", "hand cream", "body cream", "skin care", "skin", "face mask", "face", "razor", "razors", "hair", "brush", "cosmetic", "beauty", "makeup", "make up", "perfume", "fragrance", "body mist", "aerosol", "roll on", "sanitary", "wipes", "vitamin", "health", "loreal", "palmolive", "sudocrem", "aquafresh", "wisdom", "denman", "cuticura", "nivea", "simple sensitive", "pantene", "enliven", "baylis", "umbro", "metanium", "toiletries", "lotion", "aftersun", "fabulosa", "ariel pods", "bamboo pads", "flo bamboo", "sure women", "sure men", "manstuff", "bubble t"])) return { category: "health-beauty", reason: "health or beauty wording", ambiguous: false };
  if (includesAny(text, ["sweet", "sweets", "gummy", "gummies", "gummi king", "haribo", "maoam", "toxic waste", "popcorn", "chocolate", "candy", "candy kittens", "kandelicious", "johny bee", "lollipop", "lollies", "chew", "chews", "crisp", "crisps", "biscuit", "cookie", "cookies", "snack", "peanuts", "nuts", "raisins", "ginger pouch", "honeycomb", "fruit mix", "capri sun", "sour", "cola", "confection", "golden rounds", "jakemans", "lozenges", "swizzels", "drumstick", "cranberries"])) return { category: "sweets-snacks", reason: "sweets/snacks wording", ambiguous: false };
  if (includesAny(text, ["pen", "pencil", "marker", "highlighter", "stampers", "erasers", "colouring", "crayola", "notebook", "notepad", "calendar", "diary", "organiser", "gift bag", "card", "cards", "birthday", "banner", "table cover", "glue", "stationery", "wrap", "roll wrap", "party", "shakers", "writing", "desk", "paper", "cork", "dry wipe", "sticker", "stickers", "cling", "clings", "colour", "colouring book"])) return { category: "stationery-party", reason: "stationery/party wording", ambiguous: false };
  if (includesAny(text, ["dog", "cat", "pet", "good boy", "rosewood", "chewable", "chewables", "chewy", "bones", "tugger", "collar", "animal food", "washing up", "kitchen", "frying pan", "tent peg", "backpack", "umbrella", "glasses", "ear defenders", "poncho", "tissue", "bottle", "household", "home", "clean", "sponge", "kitchen roll", "tool", "battery", "storage", "summit", "hilka", "laundry", "pods", "compass", "tent light", "hat", "fedora", "clogs"])) return { category: "household-pet", reason: "household/pet wording", ambiguous: false };
  if (includesAny(text, ["toy", "toys", "game", "puzzle", "doll", "plush", "squishy", "scooter", "laser tag", "x shot", "xshot", "blaster", "playset", "clickeez", "palm pals", "animigos", "fuggler", "monopoly", "pokemon", "peppa pig", "paw patrol", "barbie", "hot wheels", "care bears", "capybara", "scrunchems", "k pop", "hot shots", "ball", "figure", "pig", "squij", "star wars", "tennis set", "minions"])) return { category: "toys-gifts", reason: "toy/gift wording", ambiguous: false };
  return { category: "toys-gifts", reason: "no reliable category keyword; owner rule sends ambiguous product to Toys & Gifts", ambiguous: true };
}

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const [products, categories] = await Promise.all([
  request("/rest/v1/products?select=id,name,slug,sku,category,description,pack,image,tags,price,availability,featured&order=id"),
  request("/rest/v1/categories?select=id,name,slug,summary&order=slug"),
]);
if (products.length !== 411) throw new Error(`Expected 411 live products before migration, found ${products.length}.`);
const categorySlugs = categories.map((category) => category.slug).sort();
if (JSON.stringify(categorySlugs) !== JSON.stringify([...allowedCategories].sort())) throw new Error(`Expected exactly the eight existing category slugs, found: ${categorySlugs.join(", ")}`);
const assignments = products.map((product) => ({ product, ...classify(product) }));
const ambiguous = assignments.filter((entry) => entry.ambiguous);
const categoryCounts = Object.fromEntries(allowedCategories.map((category) => [category, assignments.filter((entry) => entry.category === category).length]));
const changed = assignments.filter((entry) => entry.product.category !== entry.category);
await writeFile(reviewPath, [`# Uncategorised review`, `# Generated ${new Date().toISOString()}`, `# These items were assigned to Toys & Gifts only because their name and description did not give a reliable category signal.`, "", ...ambiguous.map((entry) => `${entry.product.sku}\t${entry.product.name}\tassigned: toys-gifts\t${entry.reason}`), ""].join("\n"));
const report = { assessedAt: new Date().toISOString(), totalProducts: products.length, categoryCounts, changedCount: changed.length, unchangedCount: products.length - changed.length, ambiguousCount: ambiguous.length, ambiguous: ambiguous.map((entry) => ({ sku: entry.product.sku, name: entry.product.name, previousCategory: entry.product.category, assignedCategory: entry.category, reason: entry.reason })), reviewPath, assignments: assignments.map((entry) => ({ id: entry.product.id, sku: entry.product.sku, name: entry.product.name, previousCategory: entry.product.category, category: entry.category, reason: entry.reason })) };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (process.env.CONFIRM_CATEGORY_MIGRATION !== confirmationPhrase) {
  console.log(JSON.stringify({ mode: "dry-run", totalProducts: products.length, categoryCounts, changedCount: changed.length, ambiguousCount: ambiguous.length, reportPath, reviewPath }, null, 2));
  process.exit(0);
}
if (!adminPassword) throw new Error("CATEGORY_MIGRATION_ADMIN_PASSWORD is required for the confirmation-locked write.");
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
if (!login?.access_token) throw new Error("Admin authentication failed; category migration was not run.");
await mkdir(backupsRoot, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({ backedUpAt: new Date().toISOString(), source: "Full 411-product catalogue before one-time category migration", categories, products }, null, 2)}\n`);
for (const entry of assignments) {
  const result = await request(`/rest/v1/products?id=eq.${entry.product.id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ category: entry.category }) }, login.access_token);
  if (!Array.isArray(result) || result.length !== 1 || result[0].category !== entry.category) throw new Error(`Category update failed for ${entry.product.sku}; review ${backupPath}.`);
}
const finalProducts = await request("/rest/v1/products?select=id,name,sku,category&order=id");
const invalid = finalProducts.filter((product) => !allowedCategories.includes(product.category));
const finalCounts = Object.fromEntries(allowedCategories.map((category) => [category, finalProducts.filter((product) => product.category === category).length]));
if (finalProducts.length !== 411 || invalid.length || Object.values(finalCounts).reduce((sum, count) => sum + count, 0) !== 411) throw new Error(`Post-migration validation failed: total=${finalProducts.length}; invalid=${invalid.length}. Review ${backupPath}.`);
const finalReport = { ...report, migratedAt: new Date().toISOString(), backupPath, finalCounts, completed: true };
await writeFile(reportPath, `${JSON.stringify(finalReport, null, 2)}\n`);
console.log(JSON.stringify({ mode: "migrated", totalProducts: finalProducts.length, categoryCounts: finalCounts, changedCount: changed.length, ambiguousCount: ambiguous.length, reportPath, reviewPath, backupPath }, null, 2));
