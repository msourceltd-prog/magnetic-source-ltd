/**
 * Trade Ledger, Recut: shared trading shell retaining the reference-inspired
 * utility → operating header → department-tape browsing hierarchy.
 */
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import ConsentNotice from "@/components/ConsentNotice";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { MAGNETIC_SOURCE_URL } from "@/components/SEOHead";

type LayoutSEO = { title: string; description: string; path?: string; image?: string; schema?: Record<string, unknown> | Record<string, unknown>[]; noIndex?: boolean };

export default function StoreLayout({ children, seo }: { children: ReactNode; seo?: LayoutSEO }) {
  const [location] = useLocation();
  const path = location.split("?")[0] || "/";
  const routeMeta: LayoutSEO = {
    "/": { title:"UK Wholesale Catalogue | Magnetic Source Trade Supply", description:"Magnetic Source Ltd provides a curated UK wholesale catalogue of practical retail lines, clear pack details and trade enquiry support for independent retailers." },
    "/shop": { title:"Wholesale Products & Trade Catalogue | Magnetic Source", description:"Browse the Magnetic Source UK wholesale catalogue for practical retail products, clear pack formats, product references and trade quote enquiries." },
    "/about": { title:"About Magnetic Source | UK Wholesale Trade Supply", description:"Discover how Magnetic Source Ltd curates practical UK wholesale products, clear product information and straightforward trade support for independent retailers." },
    "/contact": { title:"Contact Magnetic Source | UK Trade Enquiries", description:"Contact Magnetic Source Ltd for UK wholesale catalogue questions, product information, delivery discussions and practical trade account enquiries." },
    "/delivery-returns": { title:"Delivery & Returns | Magnetic Source Wholesale", description:"Read Magnetic Source delivery and returns information for UK wholesale catalogue enquiries, including confirmation of trade terms before orders proceed." },
    "/trade-account": { title:"Trade Account Enquiries | Magnetic Source Wholesale", description:"Learn how to start a Magnetic Source trade account enquiry for practical UK wholesale products, clear pack details and supported retail sourcing." },
    "/privacy": { title:"Privacy Notice | Magnetic Source UK Wholesale", description:"Read the Magnetic Source privacy notice for UK wholesale catalogue browsing, trade enquiries, browser storage and customer information handling." },
    "/terms": { title:"Website Terms | Magnetic Source UK Wholesale", description:"Review the Magnetic Source UK wholesale website terms for catalogue information, trade enquiries, product confirmation and responsible site use." },
    "/cart": { title:"Basket | Magnetic Source Ltd", description:"Review your selected Magnetic Source catalogue lines before continuing." },
    "/checkout": { title:"Checkout | Magnetic Source Ltd", description:"Review your Magnetic Source enquiry details and selected catalogue lines." },
    "/order-confirmation": { title:"Order confirmation | Magnetic Source Ltd", description:"Your Magnetic Source catalogue enquiry has been recorded." },
  }[path] || { title:"UK Wholesale Catalogue | Magnetic Source Trade Supply", description:"Magnetic Source Ltd provides practical UK wholesale catalogue information, product details and a clear trade enquiry path for retailers." };
  const noIndex = seo?.noIndex ?? ["/admin","/cart","/checkout","/order-confirmation"].includes(path);
  const organization = path === "/" ? { "@context":"https://schema.org", "@type":"Organization", name:"Magnetic Source Ltd", url:MAGNETIC_SOURCE_URL, description:"A curated UK trade source for practical, dependable retail stock.", logo:`${MAGNETIC_SOURCE_URL}/favicon.svg`, telephone:"+44 7856 262726", vatID:"GB469 1754 52", taxID:"15466397", address:{ "@type":"PostalAddress", streetAddress:"Flat 1, Saviours House, 15 Newport Road", addressLocality:"Hayes", addressRegion:"England", postalCode:"UB4 8FR", addressCountry:"GB" }, contactPoint:{ "@type":"ContactPoint", contactType:"sales", email:"trade@magneticsource.co.uk", telephone:"+44 7856 262726", availableLanguage:"English" } } : undefined;
  const meta = seo || routeMeta;
  return <div className="store-app"><SEOHead title={meta.title} description={meta.description} path={meta.path || path} image={meta.image} noIndex={noIndex} schema={meta.schema || organization} /><SiteHeader /><main>{children}</main><SiteFooter /><ConsentNotice /></div>;
}
