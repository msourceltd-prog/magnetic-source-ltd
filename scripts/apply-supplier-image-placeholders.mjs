const url = process.env.SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !accessToken) throw new Error("SUPABASE_URL or SUPABASE_ACCESS_TOKEN is unavailable");
const ref = new URL(url).hostname.split(".")[0];
const query = "update public.products set image = '/product-image-pending.svg', updated_at = now() where sku like 'MS-%';";
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
if (!response.ok) throw new Error(`Image placeholder update failed (${response.status}): ${await response.text()}`);
console.log(JSON.stringify({ status: "supplier image placeholders applied" }));
