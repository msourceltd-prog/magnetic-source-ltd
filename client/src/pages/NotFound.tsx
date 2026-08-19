import { Button } from "@/components/ui/button";
import { ArrowRight, SearchX } from "lucide-react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import StoreLayout from "@/components/StoreLayout";

export default function NotFound() {
  return <StoreLayout><SEOHead title="Page not found | Magnetic Source Ltd" description="The requested Magnetic Source page could not be found." path="/404" noIndex /><section className="trade-not-found"><div className="trade-not-found-card"><p className="eyebrow">Catalogue reference / 404</p><SearchX size={32} aria-hidden="true" /><h1>Not in this edit.</h1><p>The page you requested is unavailable or may have moved. Return to the catalogue to find a working line.</p><div className="trade-not-found-actions"><Link href="/shop" className="button-primary">Shop the edit <ArrowRight size={17} /></Link><Link href="/" className="text-link">Return home <ArrowRight size={16} /></Link></div></div></section></StoreLayout>;
}
