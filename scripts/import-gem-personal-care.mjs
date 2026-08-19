import fs from "node:fs";

const url = process.env.SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !accessToken) throw new Error("SUPABASE_URL or SUPABASE_ACCESS_TOKEN is unavailable");
const products = JSON.parse(fs.readFileSync(new URL("../data-sources/gem-personal-care-import.json", import.meta.url), "utf8"));
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const productValues = products.map((product) => `(${quote(product.slug)}, ${quote(product.name)}, 'personal-care', ${Number(product.price).toFixed(2)}, ${quote(product.sku)}, 'Availability to confirm', ${quote(product.pack)}, ${quote(product.description)}, '/product-image-pending.svg', array['Catalogue line'], false)`).join(",\n");
const query = `begin;
delete from public.products where category = 'personal-care';
insert into public.products (slug, name, category, price, sku, availability, pack, description, image, tags, featured) values
${productValues};
commit;`;
const ref = new URL(url).hostname.split(".")[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
if (!response.ok) throw new Error(`Gem Imports Personal Care import failed (${response.status}): ${await response.text()}`);
console.log(JSON.stringify({ replaced_personal_care_records: products.length }, null, 2));
