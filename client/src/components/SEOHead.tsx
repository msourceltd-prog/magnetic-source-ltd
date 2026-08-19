/**
 * Trade Ledger, Recut: route-aware, deployment-safe SEO metadata. Canonicals
 * resolve from the active production origin unless VITE_SITE_URL is supplied.
 */
import { useEffect } from "react";

type Schema = Record<string, unknown> | Record<string, unknown>[];
type SEOHeadProps = { title: string; description: string; path?: string; image?: string; noIndex?: boolean; schema?: Schema };

function setMeta(selector: string, attribute: "name" | "property", key: string, value: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.content = value;
}

export default function SEOHead({ title, description, path = "/", image = "/manus-storage/magnetic-source-hero_df95ca9d.jpg", noIndex = false, schema }: SEOHeadProps) {
  useEffect(() => {
    const base = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || window.location.origin;
    const canonical = `${base}${path === "/" ? "/" : path}`;
    const fullImage = image.startsWith("http") ? image : `${base}${image}`;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", path.startsWith("/product/") ? "product" : "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", fullImage);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", fullImage);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    const existingScript = document.getElementById("magnetic-source-structured-data");
    if (existingScript) existingScript.remove();
    if (schema) { const script = document.createElement("script"); script.id = "magnetic-source-structured-data"; script.type = "application/ld+json"; script.text = JSON.stringify(schema); document.head.appendChild(script); }
  }, [title, description, path, image, noIndex, schema]);
  return null;
}
