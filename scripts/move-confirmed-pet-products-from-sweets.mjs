import { mkdir, writeFile } from "node:fs/promises";

const projectRoot = "/home/ubuntu/magnetic-source-ecommerce-v2";
const backupDirectory = "/home/ubuntu/magnetic-source-catalogue-backups";
const supabaseUrl = process.env.SUPABASE_URL || "https://pylhokxuqqbldnfjwjem.supabase.co";
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.PET_CATEGORY_FIX_ADMIN_EMAIL || "msourceltd@gmail.com";
const adminPassword = process.env.PET_CATEGORY_FIX_ADMIN_PASSWORD;
const confirmationPhrase = "MOVE_CONFIRMED_PET_PRODUCTS";
const skus = ["HPE-72383Z", "72619U", "72385F", "72388O", "72617O", "72615I", "60343L", "HPE-72404S"];
const request = async (path, options = {}, token) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { apikey: publicKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

if (process.env.CONFIRM_PET_CATEGORY_FIX !== confirmationPhrase) throw new Error("Confirmation phrase required. No category was changed.");
if (!adminPassword) throw new Error("PET_CATEGORY_FIX_ADMIN_PASSWORD is required.");
const before = await request("/rest/v1/products?select=*&order=id", {});
const matches = before.filter((product) => skus.includes(product.sku));
if (matches.length !== skus.length || matches.some((product) => product.category !== "sweets-snacks")) throw new Error(`Expected exactly eight listed SKUs in Sweets & Snacks; found ${matches.length} with categories ${matches.map((product) => product.category).join(", ")}.`);
await mkdir(backupDirectory, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const backupPath = `${backupDirectory}/before-confirmed-pet-category-correction-${stamp}.json`;
await writeFile(backupPath, `${JSON.stringify(before, null, 2)}\n`);
const login = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
const token = login.access_token;
if (!token) throw new Error("Admin authentication failed.");
const updated = await request(`/rest/v1/products?sku=in.(${skus.join(",")})`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ category: "household-pet" }) }, token);
if (!Array.isArray(updated) || updated.length !== skus.length || updated.some((product) => product.category !== "household-pet")) throw new Error("The exact pet-product category update did not complete; review the backup before retrying.");
const after = await request("/rest/v1/products?select=id,sku,name,category", {});
const stillInSweets = after.filter((product) => skus.includes(product.sku) && product.category === "sweets-snacks");
const householdCount = after.filter((product) => product.category === "household-pet").length;
const sweetsCount = after.filter((product) => product.category === "sweets-snacks").length;
if (after.length !== 411 || stillInSweets.length || householdCount !== 45 || sweetsCount !== 57) throw new Error(`Post-update validation failed: total=${after.length}; household=${householdCount}; sweets=${sweetsCount}; remainingInSweets=${stillInSweets.length}.`);
console.log(JSON.stringify({ movedCount: updated.length, totalProducts: after.length, householdPet: householdCount, sweetsSnacks: sweetsCount, backupPath, moved: updated.map((product) => ({ sku: product.sku, name: product.name, category: product.category })) }, null, 2));
