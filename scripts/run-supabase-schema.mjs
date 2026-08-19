import { readFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !accessToken) throw new Error("SUPABASE_URL or SUPABASE_ACCESS_TOKEN is unavailable");

const ref = new URL(url).hostname.split(".")[0];
const query = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const body = await response.text();
if (!response.ok) throw new Error(`Supabase migration failed (${response.status}): ${body}`);
console.log(JSON.stringify({ status: response.status, result: "Schema migration completed" }));
