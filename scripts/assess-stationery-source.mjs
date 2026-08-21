import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_KEY are required.");

const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/[’'`]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const sourcePath = resolve("data/stationery-party-replacement.json");
const resultPath = resolve("data/stationery-party-source-assessment.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: liveProducts, error } = await supabase
  .from("products")
  .select("id,name,sku,category")
  .eq("category", "stationery-party");
if (error) throw error;

const liveNames = new Set((liveProducts || []).map((product) => normalize(product.name)));
const liveSkus = new Set((liveProducts || []).map((product) => normalize(String(product.sku || "").replace(/^STP-/, ""))));
const removedNames = new Set([normalize("Glitter Shakers 4 Pack")]);

const reusable = source.products
  .filter((product) => !removedNames.has(normalize(product.name)))
  .filter((product) => !liveNames.has(normalize(product.name)))
  .filter((product) => !liveSkus.has(normalize(String(product.sku || "").replace(/^STP-/, ""))))
  .map((product) => ({
    name: product.name,
    sku: String(product.sku || "").replace(/^STP-/, ""),
    pack: product.pack,
    image: product.image,
    sourceUrl: product.sourceUrl,
    imageAssessment: product.imageAssessment,
  }));

const result = {
  liveStationeryCount: (liveProducts || []).length,
  sourceProductCount: source.products.length,
  reusableCandidateCount: reusable.length,
  reusable,
};
await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ liveStationeryCount: result.liveStationeryCount, reusableCandidateCount: reusable.length, resultPath }, null, 2));
