/**
 * Trade Ledger, Recut: utility-first navigation with Source Cobalt category
 * tape, original Magnetic Source mark, and persistent basket/search access.
 */
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";

const utilityLinks = [
  ["Contact", "/contact"],
  ["About", "/about"],
  ["Delivery & returns", "/delivery-returns"],
  ["Trade account", "/admin"],
] as const;

const mainLinks = [
  ["Shop the edit", "/shop"],
  ["New in", "/shop?sort=new"],
  ["Marketplace ready", "/shop?tag=marketplace"],
  ["Trade essentials", "/shop?category=diy-hardware"],
] as const;

export default function SiteHeader() {
  const { categories, products } = useCatalog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { itemCount, subtotal } = useCart();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  return <>
    <div className="utility-strip">
      <div className="trade-shell utility-inner">
        <p>Independent UK trade supply · Approval demo</p>
        <nav aria-label="Utility navigation" className="utility-nav">
          {utilityLinks.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </nav>
      </div>
    </div>

    <header className="site-header">
      <div className="trade-shell header-grid">
        <Link href="/" className="brand-lockup" aria-label="Magnetic Source home">
          <img src="/favicon.svg" alt="" className="brand-mark" width={64} height={64} decoding="async" />
          <span className="brand-type"><b>MAGNETIC</b><span>SOURCE LTD</span></span>
        </Link>

        <form className="search-field" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">Search catalogue</label>
          <input id="site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU or pack type" />
          <button type="submit" aria-label="Search catalogue"><Search size={20} strokeWidth={2.2} /></button>
        </form>

        <div className="header-actions">
          <Link href="/shop" className="quick-order"><span>Quick order</span><b>Browse {products.length} lines</b></Link>
          <Link href="/cart" className="basket-button" aria-label={`View cart with ${itemCount} items`}>
            <ShoppingBag size={21} /><span><em>{itemCount} items</em><b>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(subtotal)}</b></span>
          </Link>
        </div>
        <button className="mobile-menu-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={25} /> : <Menu size={25} />}<span>Menu</span>
        </button>
      </div>
      <nav className="primary-nav trade-shell" aria-label="Primary navigation">
        {mainLinks.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </nav>
      <nav className="category-tape" aria-label="Product categories">
        <div className="trade-shell category-tape-inner">
          {categories.map((category) => <Link key={category.slug} href={`/shop?category=${category.slug}`} className="category-tape-link"><span>{category.name}</span><ChevronDown size={13} /></Link>)}
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
        {mainLinks.map(([label, href]) => <Link key={label} href={href} onClick={() => setMobileOpen(false)}>{label}</Link>)}
      </div>
      <p className="mobile-nav-label">Browse by department</p>
      <div className="mobile-category-links">
        {categories.map((category) => <Link key={category.slug} href={`/shop?category=${category.slug}`} onClick={() => setMobileOpen(false)}>{category.name}<ChevronDown size={15} /></Link>)}
      </div>
    </div>}
  </>;
}
