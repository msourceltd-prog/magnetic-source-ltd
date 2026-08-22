/**
 * Trade Ledger, Recut: canonical non-www metadata for public wholesale routes.
 * All page-head values are normalized for the Magnetic Source SEO baseline.
 */
import { useEffect } from "react";

type Schema = Record<string, unknown> | Record<string, unknown>[];
type SEOHeadProps = { title: string; description: string; path?: string; image?: string; noIndex?: boolean; schema?: Schema };
export const MAGNETIC_SOURCE_URL = "https://magneticsource.uk";

function normalizeTitle(value: string) {
  const brandSuffix = " | Magnetic Source";
  const withBrand = value.includes("Magnetic Source") ? value : `${value}${brandSuffix}`;
  const withContext = withBrand.length >= 50 ? withBrand : `${withBrand} | UK Wholesale Trade`;
  if (withContext.length <= 60) return withContext;
  const withoutBrand = withContext.replace(/\s*\|\s*Magnetic Source(?: Ltd)?/gi, "").trim();
  return `${withoutBrand.slice(0, 60 - brandSuffix.length).trimEnd()}${brandSuffix}`;
}

function normalizeDescription(value: string) {
  const branded = value.includes("Magnetic Source") ? value : `Magnetic Source: ${value}`;
  const support = " Magnetic Source provides practical UK wholesale catalogue information and customer account support.";
  let description = branded.replace(/\s+/g, " ").trim();
  while (description.length < 150) description += support;
  if (description.length <= 160) return description;
  const clipped = description.slice(0, 160);
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace >= 150 ? clipped.slice(0, lastSpace) : clipped;
}

function setMeta(selector: string, attribute: "name" | "property", key: string, value: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.content = value;
}

export default function SEOHead({ title, description, path = "/", image = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=85", noIndex = false, schema }: SEOHeadProps) {
  useEffect(() => {
    const canonical = `${MAGNETIC_SOURCE_URL}${path === "/" ? "/" : path}`;
    const fullImage = image.startsWith("http") ? image : `${MAGNETIC_SOURCE_URL}${image}`;
    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);
    document.title = normalizedTitle;
    setMeta('meta[name="description"]', "name", "description", normalizedDescription);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Magnetic Source Ltd");
    setMeta('meta[property="og:title"]', "property", "og:title", normalizedTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", normalizedDescription);
    setMeta('meta[property="og:type"]', "property", "og:type", path.startsWith("/product/") ? "product" : "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", fullImage);
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", "Magnetic Source UK wholesale catalogue");
    setMeta('meta[property="og:locale"]', "property", "og:locale", "en_GB");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", normalizedTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", normalizedDescription);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", fullImage);
    setMeta('meta[name="twitter:url"]', "name", "twitter:url", canonical);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    const existingScript = document.getElementById("magnetic-source-structured-data");
    if (existingScript) existingScript.remove();
    if (schema) { const script = document.createElement("script"); script.id = "magnetic-source-structured-data"; script.type = "application/ld+json"; script.text = JSON.stringify(schema); document.head.appendChild(script); }
  }, [title, description, path, image, noIndex, schema]);
  return null;
}
