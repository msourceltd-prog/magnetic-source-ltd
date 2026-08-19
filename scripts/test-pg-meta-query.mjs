const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_KEY is unavailable");

const response = await fetch(`${url}/pg-meta/default/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "select 1 as readiness_check;" }),
});

console.log(JSON.stringify({ status: response.status, response: await response.text() }, null, 2));
