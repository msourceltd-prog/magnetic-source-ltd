/**
 * Trade Ledger, Recut: static SEO head renderer for Cloudflare SPA assets.
 * It writes a lightweight index.html at every public canonical path, allowing
 * crawlers to receive the correct title, description, canonical, social cards,
 * and homepage Organization schema before the React application hydrates.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = "https://magneticsource.uk";
const publicDir = path.resolve("dist/public");
const supabaseUrl = "https://pylhokxuqqbldnfjwjem.supabase.co";
const anonKey = "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq";
const defaultImage = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=85";

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalizeTitle(value) {
  const suffix = " | Magnetic Source";
  const branded = value.includes("Magnetic Source") ? value : `${value}${suffix}`;
  const contextual = branded.length >= 50 ? branded : `${branded} | UK Wholesale Trade`;
  if (contextual.length <= 60) return contextual;
  const withoutBrand = contextual.replace(/\s*\|\s*Magnetic Source(?: Ltd)?/gi, "").trim();
  return `${withoutBrand.slice(0, 60 - suffix.length).trimEnd()}${suffix}`;
}

function normalizeDescription(value) {
  const branded = value.includes("Magnetic Source") ? value : `Magnetic Source: ${value}`;
  const support = " Magnetic Source provides practical UK wholesale catalogue information and trade enquiry support.";
  let description = branded.replace(/\s+/g, " ").trim();
  while (description.length < 150) description += support;
  if (description.length <= 160) return description;
  const clipped = description.slice(0, 160);
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace >= 150 ? clipped.slice(0, lastSpace) : clipped;
}

async function readProducts() {
  const response = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,name,description,pack,sku,image&order=slug.asc`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Unable to read public product metadata for prerendering: ${response.status} ${response.statusText}`);
  return response.json();
}

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Magnetic Source Ltd",
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  telephone: "+44 7856 262726",
  vatID: "GB469 1754 52",
  taxID: "15466397",
  address: { "@type": "PostalAddress", streetAddress: "Flat 1, Saviours House, 15 Newport Road", addressLocality: "Hayes", addressRegion: "England", postalCode: "UB4 8FR", addressCountry: "GB" },
};

const publicPages = [
  { path: "/", title: "UK Wholesale Catalogue | Magnetic Source Trade Supply", description: "Magnetic Source Ltd provides a curated UK wholesale catalogue of practical retail lines, clear pack details and trade enquiry support for independent retailers.", schema: organization },
  { path: "/shop", title: "Wholesale Products & Trade Catalogue | Magnetic Source", description: "Browse the Magnetic Source UK wholesale catalogue for practical retail products, clear pack formats, product references and trade quote enquiries." },
  { path: "/about", title: "About Magnetic Source | UK Wholesale Trade Supply", description: "Discover how Magnetic Source Ltd curates practical UK wholesale products, clear product information and straightforward trade support for independent retailers." },
  { path: "/contact", title: "Contact Magnetic Source | UK Trade Enquiries", description: "Contact Magnetic Source Ltd for UK wholesale catalogue questions, product information, delivery discussions and practical trade account enquiries." },
  { path: "/delivery-returns", title: "Delivery & Returns | Magnetic Source Wholesale", description: "Read Magnetic Source delivery and returns information for UK wholesale catalogue enquiries, including confirmation of trade terms before orders proceed." },
  { path: "/trade-account", title: "Trade Account Enquiries | Magnetic Source Wholesale", description: "Learn how to start a Magnetic Source trade account enquiry for practical UK wholesale products, clear pack details and supported retail sourcing." },
  { path: "/terms", title: "Website Terms | Magnetic Source UK Wholesale", description: "Review the Magnetic Source UK wholesale website terms for catalogue information, trade enquiries, product confirmation and responsible site use." },
  { path: "/privacy", title: "Privacy Notice | Magnetic Source UK Wholesale", description: "Read the Magnetic Source privacy notice for UK wholesale catalogue browsing, trade enquiries, browser storage and customer information handling." },
];

function headForPage(page) {
  const title = normalizeTitle(page.title);
  const description = normalizeDescription(page.description);
  const canonical = `${siteUrl}${page.path}`;
  const image = page.image || defaultImage;
  const schema = page.schema ? `<script id="magnetic-source-structured-data" type="application/ld+json">${JSON.stringify(page.schema).replace(/</g, "\\u003c")}</script>` : "";
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    '<meta name="robots" content="index, follow" />',
    '<meta property="og:site_name" content="Magnetic Source Ltd" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${page.path.startsWith("/product/") ? "product" : "website"}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta property="og:locale" content="en_GB" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    schema,
  ].join("\n    ");
}

function renderPage(template, page) {
  const stripped = template
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name="description"[^>]*>/i, "")
    .replace(/\s*<meta\s+name="robots"[^>]*>/i, "")
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[^>]*>/i, "")
    .replace(/\s*<script\s+id="magnetic-source-structured-data"[\s\S]*?<\/script>/i, "");
  return stripped.replace("</head>", `    ${headForPage(page)}\n  </head>`);
}

const template = await readFile(path.join(publicDir, "index.html"), "utf8");
const products = await readProducts();
const productPages = products.map((product) => ({
  path: `/product/${encodeURIComponent(product.slug)}`,
  title: `Wholesale ${product.name} | Magnetic Source`,
  description: `Magnetic Source wholesale product: ${product.name}. ${product.description} Pack format: ${product.pack}; product reference: ${product.sku}.`,
  image: product.image || defaultImage,
}));

for (const page of [...publicPages, ...productPages]) {
  if (page.path === "/") {
    await writeFile(path.join(publicDir, "index.html"), renderPage(template, page));
    continue;
  }
  const outputDirectory = path.join(publicDir, page.path.replace(/^\//, ""));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "index.html"), renderPage(template, page));
}

console.log(`Pre-rendered canonical SEO heads for ${publicPages.length + productPages.length} public pages (${productPages.length} products).`);
