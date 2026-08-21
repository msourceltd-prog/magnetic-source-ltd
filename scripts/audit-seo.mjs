/**
 * Trade Ledger, Recut: release-level audit for public crawler-facing assets.
 * Confirms static heads, sitemap entries, crawl directives, and visible route
 * affordances without indexing protected admin or transactional surfaces.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = "https://magneticsource.uk";
const publicDir = path.resolve("dist/public");
const staticPaths = ["/", "/shop", "/about", "/contact", "/delivery-returns", "/trade-account", "/terms", "/privacy"];
const sitemap = await readFile(path.join(publicDir, "sitemap.xml"), "utf8");
const robots = await readFile(path.join(publicDir, "robots.txt"), "utf8");
const productPaths = [...sitemap.matchAll(/<loc>https:\/\/magneticsource\.uk(\/product\/[^<]+)<\/loc>/g)].map((match) => match[1]);
const allPaths = [...staticPaths, ...productPaths];
const fixedSitemapPaths = 16; // Eight core public pages plus eight category views.
const expectedSitemapUrlCount = productPaths.length + fixedSitemapPaths;

const failures = [];
const requiredMeta = [
  '<meta name="robots" content="index, follow"',
  '<meta property="og:site_name" content="Magnetic Source Ltd"',
  '<meta property="og:title"',
  '<meta property="og:description"',
  '<meta property="og:url"',
  '<meta property="og:image"',
  '<meta name="twitter:card" content="summary_large_image"',
  '<meta name="twitter:title"',
  '<meta name="twitter:description"',
  '<meta name="twitter:image"',
  '<meta name="twitter:url"',
];

function decodeHtml(value) {
  return value.replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

for (const routePath of allPaths) {
  const filePath = routePath === "/" ? path.join(publicDir, "index.html") : path.join(publicDir, routePath, "index.html");
  const html = await readFile(filePath, "utf8");
  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/i)?.[1] || "");
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || "");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
  if (title.length < 50 || title.length > 60) failures.push(`${routePath}: title has ${title.length} characters`);
  if (description.length < 150 || description.length > 160) failures.push(`${routePath}: description has ${description.length} characters`);
  if (!title.includes("Magnetic Source")) failures.push(`${routePath}: title missing brand`);
  if (!description.includes("Magnetic Source")) failures.push(`${routePath}: description missing brand`);
  if (canonical !== `${siteUrl}${routePath}`) failures.push(`${routePath}: canonical mismatch (${canonical})`);
  for (const meta of requiredMeta) if (!html.includes(meta)) failures.push(`${routePath}: missing ${meta}`);
}

if (!robots.includes("User-agent: *") || !robots.includes("Allow: /") || !robots.includes("Sitemap: https://magneticsource.uk/sitemap.xml")) failures.push("robots.txt does not include the required allow-all and sitemap directives");
if (robots.includes("Disallow:")) failures.push("robots.txt contains an unexpected disallow directive");
if ((sitemap.match(/<loc>/g) || []).length !== expectedSitemapUrlCount) failures.push(`sitemap URL count is not ${expectedSitemapUrlCount}`);
if (!sitemap.includes("<lastmod>") || !sitemap.includes("<changefreq>") || !sitemap.includes("<priority>")) failures.push("sitemap lacks required URL fields");
const homepage = await readFile(path.join(publicDir, "index.html"), "utf8");
if (!homepage.includes('"@type":"Organization"') || !homepage.includes('"name":"Magnetic Source Ltd"') || !homepage.includes('"postalCode":"UB4 8FR"')) failures.push("homepage Organization schema is incomplete");

if (failures.length) {
  console.error("SEO audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`SEO audit passed for ${allPaths.length} pre-rendered public pages, ${expectedSitemapUrlCount} sitemap URLs, root robots.txt, and homepage Organization schema.`);
