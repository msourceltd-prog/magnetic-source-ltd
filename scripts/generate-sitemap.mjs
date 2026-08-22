/**
 * Trade Ledger, Recut: build-time SEO utility for the canonical, non-www
 * Magnetic Source public catalogue. It includes only public indexable routes
 * and reads public product/category slugs; protected and transactional routes
 * remain deliberately excluded.
 */
import { writeFile } from "node:fs/promises";

const siteUrl = "https://magneticsource.uk";
const supabaseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const lastmod = new Date().toISOString().slice(0, 10);

const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/shop?category=best-sellers", changefreq: "weekly", priority: "0.8" },
  { path: "/shop?category=new-arrivals", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/delivery-returns", changefreq: "monthly", priority: "0.6" },
  { path: "/trade-account", changefreq: "monthly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
];

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function readPublicRows(table) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=slug&order=slug.asc`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Unable to read public ${table} for sitemap: ${response.status} ${response.statusText}`);
  return response.json();
}

const [categories, products] = await Promise.all([readPublicRows("categories"), readPublicRows("products")]);
const categoryPages = categories.filter(({ slug }) => slug !== "clearance").map(({ slug }) => ({ path: `/shop?category=${encodeURIComponent(slug)}`, changefreq: "weekly", priority: "0.8" }));
const productPages = products.map(({ slug }) => ({ path: `/product/${encodeURIComponent(slug)}`, changefreq: "weekly", priority: "0.6" }));
const urls = [...staticPages, ...categoryPages, ...productPages];

const rows = urls.map(({ path, changefreq, priority }) => [
  "  <url>",
  `    <loc>${xmlEscape(`${siteUrl}${path}`)}</loc>`,
  `    <lastmod>${lastmod}</lastmod>`,
  `    <changefreq>${changefreq}</changefreq>`,
  `    <priority>${priority}</priority>`,
  "  </url>",
].join("\n")).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
await writeFile(new URL("../client/public/sitemap.xml", import.meta.url), sitemap);
console.log(`Generated sitemap.xml with ${urls.length} public URLs (${categories.length} categories, ${products.length} products).`);
