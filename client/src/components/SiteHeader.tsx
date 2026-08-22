/**
 * Trade Ledger, Recut: utility-first navigation with a Source Cobalt category
 * tape; the selected department uses a lighter cobalt without an underline,
 * and the Shop route is warmed for fast client-side department switching.
 */
import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BadgeCheck, ChevronDown, Headphones, LogOut, Menu, Search, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { hasCustomerPrice } from "@/lib/catalogRuntime";

const mobileMenuLinks = [
  ["Browse catalogue", "/shop"],
  ["New lines", "/shop?sort=new"],
  ["Departments", "/shop"],
  ["Your basket", "/cart"],
] as const;

const serviceBenefits = [
  { icon: Truck, label: "Free delivery on orders over £200 ex VAT" },
  { icon: BadgeCheck, label: "Everyday low pricing" },
  { icon: Headphones, label: "Fast and friendly service" },
  { icon: ShoppingBag, label: "No minimum order quantity" },
] as const;

function MagneticFieldMark() {
  return <svg className="brand-mark" viewBox="0 0 64 64" role="img" aria-labelledby="brand-mark-title" focusable="false">
    <title id="brand-mark-title">Magnetic Source field mark</title>
    <rect x="2" y="2" width="60" height="60" rx="8" fill="#f8f5ee" stroke="#124c9c" strokeWidth="2" />
    <path d="M12 18 26 29 21 34 8 23Z" fill="#124c9c" />
    <path d="m52 18 4 5-13 11-5-5Z" fill="#124c9c" />
    <path d="m12 46-4-5 13-11 5 5Z" fill="#124c9c" />
    <path d="m52 46-14-11 5-5 13 11Z" fill="#124c9c" />
    <path d="M18 11c5 2 9 5 12 10" fill="none" stroke="#1a1e22" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M46 11c-5 2-9 5-12 10" fill="none" stroke="#1a1e22" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M18 53c5-2 9-5 12-10" fill="none" stroke="#1a1e22" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M46 53c-5-2-9-5-12-10" fill="none" stroke="#1a1e22" strokeLinecap="round" strokeWidth="2.4" />
  </svg>;
}

export default function SiteHeader() {
  const { categories, products } = useCatalog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [location, navigate] = useLocation();
  const { items, itemCount, subtotal } = useCart();
  const { signedIn, openLogin, signOut } = useCustomerAuth();
  const [activeCategorySlug, setActiveCategorySlug] = useState(() => new URLSearchParams(window.location.search).get("category"));

  useEffect(() => {
    const syncActiveCategory = () => setActiveCategorySlug(new URLSearchParams(window.location.search).get("category"));
    syncActiveCategory();
    window.addEventListener("popstate", syncActiveCategory);
    window.addEventListener("magnetic-source:category-change", syncActiveCategory);
    return () => {
      window.removeEventListener("popstate", syncActiveCategory);
      window.removeEventListener("magnetic-source:category-change", syncActiveCategory);
    };
  }, [location]);

  useEffect(() => {
    const warmShopRoute = () => { void import("@/pages/Shop"); };
    const timer = window.setTimeout(warmShopRoute, 650);
    return () => window.clearTimeout(timer);
  }, []);

  const followInternal = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMobileOpen(false);
    navigate(href);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  const followCategory = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    const href = `/shop?category=${slug}`;
    setActiveCategorySlug(slug);
    if ((location.split("?")[0].replace(/\/+$/, "") || "/") === "/shop") {
      event.preventDefault();
      window.history.replaceState(null, "", href);
      window.dispatchEvent(new CustomEvent("magnetic-source:category-change", { detail: { slug } }));
      setMobileOpen(false);
      return;
    }
    followInternal(event, href);
  };

  return <>
    <header className="site-header">
      <div className="trade-shell header-grid">
        <a href="/" className="brand-lockup" aria-label="Magnetic Source home" onClick={(event) => followInternal(event, "/")}>
          <MagneticFieldMark />
          <span className="brand-type"><b>MAGNETIC</b><span>SOURCE LTD</span></span>
        </a>

        <form className="search-field" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">Search catalogue</label>
          <input id="site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, reference or pack type" />
          <button type="submit" aria-label="Search catalogue"><Search size={20} strokeWidth={2.2} /></button>
        </form>

        <div className="header-actions">
          {signedIn ? <button type="button" className="account-button account-button-signed-in" onClick={() => void signOut()}><span>Customer account</span><b><LogOut size={13} /> Sign out</b></button> : <button type="button" className="account-button" onClick={openLogin}><span>Customer access</span><b>Login to see prices</b></button>}
          <a href="/cart" className="basket-button" aria-label={`View cart with ${itemCount} items`} onClick={(event) => followInternal(event, "/cart")}>
            <ShoppingBag size={21} /><span><em>{itemCount} items</em><b>{signedIn ? items.length && items.every(hasCustomerPrice) ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(subtotal) : "Pricing pending" : "Login to see prices"}</b></span>
          </a>
        </div>
        <button className="mobile-menu-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={25} /> : <Menu size={25} />}<span>Menu</span>
        </button>
      </div>
      <nav className="category-tape" aria-label="Product categories">
        <div className="trade-shell category-tape-inner">
          {categories.filter((category) => category.slug !== "clearance").map((category) => {
            const href = `/shop?category=${category.slug}`;
            const isActive = activeCategorySlug === category.slug;
            return <a key={category.slug} href={href} className={`category-tape-link${isActive ? " active" : ""}`} aria-current={isActive ? "page" : undefined} onClick={(event) => followCategory(event, category.slug)}><span>{category.name}</span><ChevronDown size={13} /></a>;
          })}
        </div>
      </nav>
      <aside className="service-benefits-strip" aria-label="Magnetic Source service benefits">
        <div className="trade-shell service-benefits-inner">
          {serviceBenefits.map(({ icon: Icon, label }) => <div className="service-benefit" key={label}><span className="service-benefit-icon"><Icon size={16} strokeWidth={2.4} /></span><span>{label}</span></div>)}
        </div>
      </aside>
    </header>

    {mobileOpen && <div id="mobile-navigation" className="mobile-nav-panel">
      <form className="search-field mobile-search" role="search" onSubmit={(event) => { submitSearch(event); setMobileOpen(false); }}>
        <label className="sr-only" htmlFor="mobile-site-search">Search catalogue</label>
        <input id="mobile-site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
        <button type="submit" aria-label="Search catalogue"><Search size={19} /></button>
      </form>
      <div className="mobile-nav-links">
        {mobileMenuLinks.map(([label, href]) => <a key={label} href={href} onClick={(event) => followInternal(event, href)}>{label}</a>)}
      </div>
      {signedIn ? <button type="button" className="mobile-account-button" onClick={() => { void signOut(); setMobileOpen(false); }}><LogOut size={15} /> Sign out</button> : <button type="button" className="mobile-account-button" onClick={() => { openLogin(); setMobileOpen(false); }}>Login to see prices</button>}
      <p className="mobile-nav-label">Browse by department</p>
      <div className="mobile-category-links">
        {categories.filter((category) => category.slug !== "clearance").map((category) => {
          const href = `/shop?category=${category.slug}`;
          return <a key={category.slug} href={href} onClick={(event) => followCategory(event, category.slug)}>{category.name}<ChevronDown size={15} /></a>;
        })}
      </div>
    </div>}
  </>;
}
