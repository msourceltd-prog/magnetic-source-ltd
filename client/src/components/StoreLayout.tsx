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

export default function StoreLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const path = location.split("?")[0] || "/";
  const meta = {
    "/": { title:"Magnetic Source Ltd | UK Trade Supply", description:"Magnetic Source Ltd is a curated UK trade source for practical, dependable retail stock. Explore our original approval-demo catalogue." },
    "/shop": { title:"Shop the Trade Edit | Magnetic Source Ltd", description:"Browse a curated UK trade edit of practical, compact retail lines with GBP pricing, SKU, pack format and availability." },
    "/about": { title:"About Magnetic Source Ltd | UK Trade Supply", description:"Learn how Magnetic Source Ltd is designed to make practical retail sourcing clearer for smaller retailers and marketplace sellers." },
    "/contact": { title:"Contact Magnetic Source Ltd | Trade Desk", description:"Contact the Magnetic Source trade desk about the planned range, brand approval process and future trade-account journey." },
    "/delivery-returns": { title:"Delivery & Returns | Magnetic Source Ltd", description:"Review the intended delivery and returns information architecture for the Magnetic Source approval-demo storefront." },
    "/privacy": { title:"Privacy | Magnetic Source Ltd", description:"Read the Magnetic Source working privacy notice covering browser storage, enquiries and launch data handling." },
    "/terms": { title:"Terms | Magnetic Source Ltd", description:"Review the working website and catalogue terms for Magnetic Source Ltd." },
    "/cart": { title:"Basket | Magnetic Source Ltd", description:"Review your selected Magnetic Source catalogue lines before continuing." },
    "/checkout": { title:"Checkout | Magnetic Source Ltd", description:"Review your Magnetic Source enquiry details and selected catalogue lines." },
    "/order-confirmation": { title:"Order confirmation | Magnetic Source Ltd", description:"Your Magnetic Source catalogue enquiry has been recorded." },
  }[path] || { title:"Magnetic Source Ltd | UK Trade Supply", description:"A curated UK trade source for practical, dependable retail stock." };
  const noIndex = ["/admin","/cart","/checkout","/order-confirmation"].includes(path);
  const organization = path === "/" ? { "@context":"https://schema.org", "@type":"Organization", name:"Magnetic Source Ltd", url:(import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin, description:"A curated UK trade source for practical, dependable retail stock.", logo:`${(import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin}/favicon.svg`, contactPoint:{ "@type":"ContactPoint", contactType:"sales", email:"trade@magneticsource.co.uk", availableLanguage:"English" } } : undefined;
  return <div className="store-app"><SEOHead title={meta.title} description={meta.description} path={path} noIndex={noIndex} schema={organization} /><SiteHeader /><main>{children}</main><SiteFooter /><ConsentNotice /></div>;
}
