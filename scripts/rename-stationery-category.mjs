import { writeFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL;
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const adminEmail = process.env.MAGNETIC_ADMIN_EMAIL;
const adminPassword = process.env.MAGNETIC_ADMIN_PASSWORD;

if (!baseUrl || !adminEmail || !adminPassword) throw new Error("Missing authorised admin sign-in configuration.");

const signIn = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const auth = await signIn.json();
if (!signIn.ok || !auth.access_token) throw new Error(`Admin sign-in failed: ${signIn.status}`);

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${auth.access_token}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const currentResponse = await fetch(`${baseUrl}/rest/v1/categories?slug=eq.stationery-party&select=id,name,slug,summary`, { headers });
const current = await currentResponse.json();
if (!currentResponse.ok || !Array.isArray(current) || current.length !== 1) throw new Error(`Expected one Stationery category: ${currentResponse.status} ${JSON.stringify(current)}`);

await writeFile(new URL("../data/stationery-category-before-rename.json", import.meta.url), JSON.stringify({
  created_at: new Date().toISOString(),
  record: current[0],
}, null, 2));

const updateResponse = await fetch(`${baseUrl}/rest/v1/categories?slug=eq.stationery-party`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    name: "Stationery",
    summary: "Practical stationery and display lines for everyday retail.",
  }),
});
const updated = await updateResponse.json();
if (!updateResponse.ok || !Array.isArray(updated) || updated.length !== 1 || updated[0].name !== "Stationery") {
  throw new Error(`Stationery category rename failed: ${updateResponse.status} ${JSON.stringify(updated)}`);
}

console.log(JSON.stringify({ previous: current[0], updated: updated[0] }, null, 2));
