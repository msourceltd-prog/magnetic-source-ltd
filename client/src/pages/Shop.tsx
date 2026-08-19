/**
 * Trade Ledger, Recut: reference-inspired browsing rail and category workflow
 * translated into an original, responsive catalogue with useful plain filters.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import ProductCard from "@/components/ProductCard";
import StoreLayout from "@/components/StoreLayout";
import { useCatalog } from "@/contexts/CatalogContext";

const getQuery = (search: string, key: string) => new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get(key) || "";

export default function Shop() {
  const { categories, products } = useCatalog();
  const [location, navigate] = useLocation();
  const searchString = useSearch();
  const initialCategory = getQuery(searchString, "category");
  const initialQuery = getQuery(searchString, "q");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialQuery);
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState(getQuery(searchString, "sort") || "featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeCategoryInfo = categories.find((category) => category.slug === activeCategory);

  useEffect(() => {
    setActiveCategory(getQuery(searchString, "category"));
    setSearch(getQuery(searchString, "q"));
    setSort(getQuery(searchString, "sort") || "featured");
  }, [searchString]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase().trim();
    const pool = products.filter((product) => (!activeCategory || product.category === activeCategory)
      && (!stockOnly || product.availability === "In stock")
      && (!needle || `${product.name} ${product.sku} ${product.pack}`.toLowerCase().includes(needle)));
    return [...pool].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "new" ? b.id - a.id : a.id - b.id);
  }, [activeCategory, search, stockOnly, sort]);

  const chooseCategory = (slug: string) => { setActiveCategory(slug); navigate(slug ? `/shop?category=${slug}` : "/shop"); };
  const reset = () => { setActiveCategory(""); setSearch(""); setStockOnly(false); setSort("featured"); navigate("/shop"); };
  const editResults = filtered.slice(0, 36);

  return <StoreLayout>
    <section className="page-banner"><div className="trade-shell"><div><p className="eyebrow">Home / Shop</p><h1>{activeCategoryInfo?.name || "The trade edit"}</h1><p>{activeCategoryInfo?.summary || "A focused sample catalogue of practical, compact lines for independent retail and marketplace sellers."}</p></div><div className="page-banner-count"><b>{products.length}</b><span>sample catalogue lines</span></div></div></section>
    <div className="trade-shell shop-layout">
      <aside className={`filter-rail ${filtersOpen ? "filter-rail-open" : ""}`}>
        <div className="filter-rail-heading"><span className="eyebrow">Departments</span><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={19} /></button></div>
        <button className={!activeCategory ? "rail-category active" : "rail-category"} type="button" onClick={() => chooseCategory("")}><span>All lines</span><b>{products.length}</b></button>
        {categories.map((category) => <button className={activeCategory === category.slug ? "rail-category active" : "rail-category"} key={category.slug} type="button" onClick={() => chooseCategory(category.slug)}><span>{category.name}</span><ChevronDown size={15} /></button>)}
        <div className="rail-rule" />
        <label className="stock-filter"><input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} /><span>In stock only</span></label>
        <button className="clear-filters" type="button" onClick={reset}>Clear selection</button>
      </aside>
      <section className="catalogue-content">
        <div className="catalogue-tools">
          <div className="catalogue-search"><Search size={19} /><label className="sr-only" htmlFor="catalogue-search">Search catalogue</label><input id="catalogue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" /></div>
          <button type="button" className="filter-toggle" onClick={() => setFiltersOpen(true)}><Filter size={17} /> Filters</button>
          <label className="sort-control"><SlidersHorizontal size={16} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="new">New in</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        </div>
        <div className="catalogue-meta"><span><b>{filtered.length}</b> matching lines · <strong>{editResults.length}</strong> in this trade edit</span><span>All prices in GBP (£)</span></div>
        {filtered.length ? <><div className="catalogue-intro-strip"><span className="eyebrow">Selected for the working edit</span><p>Each line is surfaced with SKU, stock position and pack format before the basket action.</p></div><div className="product-grid catalogue-grid">{editResults.map((product, index) => <Fragment key={product.id}><ProductCard product={product} />{index === 11 && <aside className="catalogue-interrupt"><div><span className="eyebrow light">Trade pick / 01</span><h2>Compact stock.<br />Clear shelf logic.</h2><p>From stationery to home utility, the edit is deliberately paced so buyers can move by use case rather than through an endless feed.</p><Link href="/shop?tag=marketplace" className="catalogue-interrupt-link">Marketplace-ready lines <ChevronDown size={16} /></Link></div><span className="catalogue-interrupt-index">13—18</span></aside>}</Fragment>)}</div>{filtered.length > editResults.length && <div className="catalogue-limit"><span className="eyebrow">End of this preview</span><p>This approval edit shows {editResults.length} of {filtered.length} matching lines. A connected product feed can introduce concise pagination or additional category-led bays at launch.</p></div>}</> : <div className="empty-state"><Search size={30} /><h2>No matching lines found.</h2><p>Try another product term, SKU or department.</p><button type="button" className="button-secondary" onClick={reset}>Reset the catalogue</button></div>}
      </section>
    </div>
  </StoreLayout>;
}
