/**
 * Trade Ledger, Recut: utility-first navigation with Source Cobalt category
 * tape, dynamic live departments, and persistent basket/search access.
 */
import { FormEvent, MouseEvent, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { isPriceHidden } from "@/data/catalog";

const utilityLinks = [
  ["Contact", "/contact"],
  ["About", "/about"],
  ["Delivery & returns", "/delivery-returns"],
  ["Trade account", "/trade-account"],
] as const;

const mainLinks = [
  ["Browse catalogue", "/shop"],
  ["New lines", "/shop?sort=new"],
  ["Departments", "/shop"],
  ["Your basket", "/cart"],
] as const;

export default function SiteHeader() {
  const { categories, products } = useCatalog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { items, itemCount, subtotal } = useCart();
  const quoteRequired = items.some(isPriceHidden);

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

  return <>
    <div className="utility-strip">
      <div className="trade-shell utility-inner">
        <p>Independent UK trade supply · Practical wholesale catalogue</p>
        <nav aria-label="Utility navigation" className="utility-nav">
          {utilityLinks.map(([label, href]) => <a key={label} href={href} onClick={(event) => followInternal(event, href)}>{label}</a>)}
        </nav>
      </div>
    </div>

    <header className="site-header">
      <div className="trade-shell header-grid">
        <a href="/" className="brand-lockup" aria-label="Magnetic Source home" onClick={(event) => followInternal(event, "/")}>
          <img src="/manus-storage/magnetic-source-field-monogram_408a230c.png" alt="Magnetic Source Ltd magnetic field logo" className="brand-mark" width={64} height={64} loading="eager" fetchPriority="high" decoding="async" />
          <span className="brand-type"><b>MAGNETIC</b><span>SOURCE LTD</span></span>
        </a>

        <form className="search-field" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">Search catalogue</label>
          <input id="site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, reference or pack type" />
          <button type="submit" aria-label="Search catalogue"><Search size={20} strokeWidth={2.2} /></button>
        </form>

        <div className="header-actions">
          <a href="/shop" className="quick-order" onClick={(event) => followInternal(event, "/shop")}><span>Quick order</span><b>Browse catalogue</b></a>
          <a href="/cart" className="basket-button" aria-label={`View cart with ${itemCount} items`} onClick={(event) => followInternal(event, "/cart")}>
            <ShoppingBag size={21} /><span><em>{itemCount} items</em><b>{quoteRequired ? "Quote required" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(subtotal)}</b></span>
          </a>
        </div>
        <button className="mobile-menu-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={25} /> : <Menu size={25} />}<span>Menu</span>
        </button>
      </div>
      <nav className="primary-nav trade-shell" aria-label="Primary navigation">
        {mainLinks.map(([label, href]) => <a key={label} href={href} onClick={(event) => followInternal(event, href)}>{label}</a>)}
      </nav>
      <nav className="category-tape" aria-label="Product categories">
        <div className="trade-shell category-tape-inner">
          {categories.map((category) => { const href = `/shop?category=${category.slug}`; return <a key={category.slug} href={href} className="category-tape-link" onClick={(event) => followInternal(event, href)}><span>{category.name}</span><ChevronDown size={13} /></a>; })}
        </div>
      </nav>
    </header>

    {mobileOpen && <div id="mobile-navigation" className="mobile-nav-panel">
      <form className="search-field mobile-search" role="search" onSubmit={(event) => { submitSearch(event); setMobileOpen(false); }}>
        <label className="sr-only" htmlFor="mobile-site-search">Search catalogue</label>
        <input id="mobile-site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
        <button type="submit" aria-label="Search catalogue"><Search size={19} /></button>
      </form>
      <div className="mobile-nav-links">
        {mainLinks.map(([label, href]) => <a key={label} href={href} onClick={(event) => followInternal(event, href)}>{label}</a>)}
      </div>
      <p className="mobile-nav-label">Browse by department</p>
      <div className="mobile-category-links">
        {categories.map((category) => { const href = `/shop?category=${category.slug}`; return <a key={category.slug} href={href} onClick={(event) => followInternal(event, href)}>{category.name}<ChevronDown size={15} /></a>; })}
      </div>
    </div>}
  </>;
}
