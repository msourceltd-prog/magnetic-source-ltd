import { mkdir, writeFile } from "node:fs/promises";

const confirmationPhrase = "REMOVE_SPECIFIED_PRODUCTS";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.REMOVE_PRODUCTS_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.REMOVE_PRODUCTS_ADMIN_PASSWORD;
const confirmed = process.env.CONFIRM_REMOVE_17_PRODUCTS === confirmationPhrase;

const requestedProducts = [
  { category: "baby-kids", name: "Tidyz Degradable Nappy Bags Pocket Pack 4 x 25's" },
  { category: "clearance", name: "Bic Matic Fun Pencils 3's" },
  { category: "seasonal-christmas", name: "Christmas 4m Roll Wrap Nordic Noel" },
  { category: "seasonal-christmas", name: "Christmas 4m Roll Wrap Midnight Blue" },
  { category: "seasonal-christmas", name: "Christmas Window Clings Baubles" },
  { category: "stationery-party", name: "Glitter Shakers 4 Pack" },
  { category: "toys-gifts", name: "Staedtler Peppa Pig Wax Crayons 6 Assorted Colours" },
  { category: "health-beauty", name: "Wilkinson Sword Duplo Disposable Razor Male 5's" },
  { category: "health-beauty", name: "Wilkinson Sword Duplo Disposable Razor Beauty Women 5's" },
  { category: "health-beauty", name: "Chupa Chups Watermelon/Peach Lip Balm" },
  { category: "health-beauty", name: "Chupa Chups Strawberry Bath & Shower Gel 300ml" },
  { category: "health-beauty", name: "Chupa Chups Cola Bath & Shower Gel 300ml" },
  { category: "health-beauty", name: "Chupa Chups Apple Bath & Shower Gel 400ml" },
  { category: "health-beauty", name: "Chupa Chups Watermelon Bubble Bath 500ml" },
  { category: "health-beauty", name: "Chupa Chups Tutti Frutti Body Spray 150ml" },
  { category: "health-beauty", name: "Umbro Roll-On Anti-Perspirant Deo Defiant 50ml" },
  { category: "health-beauty", name: "Umbro Bodywash Action 400ml" },
  { category: "health-beauty", name: "Chupa Chups Cherry Body Spray 150ml" },
];

const expectedCountsBefore = {
  "baby-kids": 40,
  clearance: 39,
  "seasonal-christmas": 40,
  "stationery-party": 40,
  "toys-gifts": 40,
  "health-beauty": 60,
};

const expectedCountsAfter = {
  "baby-kids": 39,
  clearance: 38,
  "seasonal-christmas": 37,
  "stationery-party": 39,
  "toys-gifts": 39,
  "health-beauty": 49,
};

const normalize = (value) => value
  .normalize("NFKC")
  .replace(/[\u2018\u2019\u02BC]/g, "'")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase("en-GB");

const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: publicKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const countByCategory = (products) => Object.fromEntries(
  Object.keys(expectedCountsBefore).map((category) => [
    category,
    products.filter((product) => product.category === category).length,
  ]),
);

const validateCounts = (actual, expected, stage) => {
  const mismatches = Object.entries(expected)
    .filter(([category, count]) => actual[category] !== count)
    .map(([category, count]) => `${category}: expected ${count}, found ${actual[category]}`);
  if (mismatches.length) throw new Error(`${stage} category-count guard failed. ${mismatches.join("; ")}. No deletion was attempted.`);
};

const products = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id");
if (products.length !== 339) throw new Error(`Pre-removal total-count guard failed: expected 339 products, found ${products.length}. No deletion was attempted.`);
validateCounts(countByCategory(products), expectedCountsBefore, "Pre-removal");

const matches = requestedProducts.map((target) => ({
  ...target,
  matches: products.filter((product) => product.category === target.category && normalize(product.name) === normalize(target.name)),
}));

const missing = matches.filter(({ matches: found }) => found.length === 0).map(({ category, name }) => ({ category, name }));
const duplicates = matches.filter(({ matches: found }) => found.length > 1).map(({ category, name, matches: found }) => ({ category, name, ids: found.map((product) => product.id) }));
const matchedProducts = matches.flatMap(({ matches: found }) => found);

if (missing.length || duplicates.length || matchedProducts.length !== requestedProducts.length) {
  throw new Error(JSON.stringify({
    message: "Exact-match guard failed; no deletion was attempted.",
    expectedMatches: requestedProducts.length,
    actualMatches: matchedProducts.length,
    missing,
    duplicates,
  }, null, 2));
}

const matchReport = matchedProducts.map(({ id, category, name, slug, sku }) => ({ id, category, name, slug, sku }));

if (!confirmed) {
  console.log(JSON.stringify({
    dryRun: true,
    message: `All ${requestedProducts.length} exact requested products were found. No records were changed. Set CONFIRM_REMOVE_17_PRODUCTS=REMOVE_SPECIFIED_PRODUCTS and REMOVE_PRODUCTS_ADMIN_PASSWORD to delete them.`,
    matchedProducts: matchReport,
    countsBefore: countByCategory(products),
    expectedCountsAfter,
  }, null, 2));
  process.exit(0);
}

if (!adminPassword) throw new Error("REMOVE_PRODUCTS_ADMIN_PASSWORD is required for the authenticated Admin deletion session.");

const login = await request("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
if (!login?.access_token) throw new Error("Admin authentication failed; no records were changed.");

const token = login.access_token;
const authenticatedSnapshot = await request("/rest/v1/products?select=id,slug,name,category,price,sku,availability,pack,description,image,tags,featured,created_at,updated_at&order=id", {}, token);
if (authenticatedSnapshot.length !== 339) throw new Error(`Authenticated pre-removal total-count guard failed: expected 339 products, found ${authenticatedSnapshot.length}. No deletion was attempted.`);
validateCounts(countByCategory(authenticatedSnapshot), expectedCountsBefore, "Authenticated pre-removal");

const authenticatedMatches = requestedProducts.flatMap((target) => authenticatedSnapshot.filter(
  (product) => product.category === target.category && normalize(product.name) === normalize(target.name),
));
if (authenticatedMatches.length !== requestedProducts.length || new Set(authenticatedMatches.map((product) => product.id)).size !== requestedProducts.length) {
  throw new Error("Authenticated exact-match guard failed; product rows changed after validation. No deletion was attempted.");
}

const dateStamp = new Date().toISOString().slice(0, 10);
const backupPath = `${backupDirectory}/before-17-product-removal-${dateStamp}.json`;
await mkdir(backupDirectory, { recursive: true });
await writeFile(backupPath, `${JSON.stringify({
  backedUpAt: new Date().toISOString(),
  source: "Magnetic Source catalogue immediately before owner-approved exact removal of 17 products",
  catalogueCount: authenticatedSnapshot.length,
  categoryCounts: countByCategory(authenticatedSnapshot),
  removalTargets: requestedProducts,
  matchedProducts: authenticatedMatches,
  fullCatalogue: authenticatedSnapshot,
}, null, 2)}\n`);

const ids = authenticatedMatches.map((product) => product.id);
const deleted = await request(`/rest/v1/products?id=in.(${ids.join(",")})`, {
  method: "DELETE",
  headers: { Prefer: "return=representation" },
}, token);

if (!Array.isArray(deleted) || deleted.length !== requestedProducts.length || new Set(deleted.map((product) => product.id)).size !== requestedProducts.length || deleted.some((product) => !ids.includes(product.id))) {
  throw new Error(`Deletion response guard failed: expected only ${requestedProducts.length} selected products to be deleted. Review ${backupPath} before any recovery action.`);
}

const finalProducts = await request("/rest/v1/products?select=id,slug,name,category,sku&order=id");
if (finalProducts.length !== 321) throw new Error(`Post-removal total-count validation failed: expected 321 products, found ${finalProducts.length}. Review ${backupPath}.`);
validateCounts(countByCategory(finalProducts), expectedCountsAfter, "Post-removal");

const remainingTargets = requestedProducts.flatMap((target) => finalProducts.filter(
  (product) => product.category === target.category && normalize(product.name) === normalize(target.name),
));
if (remainingTargets.length) throw new Error(`Post-removal exact-name validation failed: ${remainingTargets.length} requested product(s) remain. Review ${backupPath}.`);

console.log(JSON.stringify({
  completed: true,
  removedProducts: deleted.map(({ category, name, slug, sku }) => ({ category, name, slug, sku })),
  removedCount: deleted.length,
  totalProducts: finalProducts.length,
  categoryCounts: countByCategory(finalProducts),
  backupPath,
}, null, 2));
