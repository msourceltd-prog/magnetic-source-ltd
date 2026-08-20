/**
 * Trade Ledger, Recut: an original premium wholesale browsing field with
 * category navigation, factual product discovery, real imagery and a clear
 * quote-required state wherever a public price is intentionally hidden.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import ProductCard from "@/components/ProductCard";
import StoreLayout from "@/components/StoreLayout";
import { useCatalog } from "@/contexts/CatalogContext";
import { isPriceHidden } from "@/data/catalog";

const getQuery = (search: string, key: string) => new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get(key) || "";

export default function Shop() {
  const { categories, loading, products } = useCatalog();
  const [location, navigate] = useLocation();
  const searchString = useSearch();
  const initialCategory = getQuery(searchString, "category");
  const initialQuery = getQuery(searchString, "q");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialQuery);
  const [sort, setSort] = useState(getQuery(searchString, "sort") || "catalogue");
  const [priceRange, setPriceRange] = useState("all");
  const [visibleCount, setVisibleCount] = useState(36);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeCategoryInfo = categories.find((category) => category.slug === activeCategory);

  useEffect(() => {
    setActiveCategory(getQuery(searchString, "category"));
    setSearch(getQuery(searchString, "q"));
    setSort(getQuery(searchString, "sort") || "catalogue");
  }, [searchString]);

  const filtered = useMemo(() => {
    const normalizeSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const aliases: Record<string, string[]> = { cleaner: ["cleaner", "cleaning"], cleaning: ["cleaning", "cleaner"], microfibre: ["microfibre", "microfiber"], microfiber: ["microfiber", "microfibre"] };
    const searchTerms = normalizeSearch(search).split(" ").filter(Boolean);
    const pool = products.filter((product) => {
      const searchable = normalizeSearch(`${product.name} ${product.sku} ${product.pack} ${product.description} ${product.category} ${product.tags.join(" ")}`);
      const matchesSearch = !searchTerms.length || searchTerms.every((term) => (aliases[term] || [term]).some((candidate) => searchable.includes(candidate)));
      const hasPublicPrice = !isPriceHidden(product);
      return (!activeCategory || product.category === activeCategory)
        && matchesSearch
      && (priceRange === "all" || hasPublicPrice && (priceRange === "under-5" && product.price < 5 || priceRange === "5-10" && product.price >= 5 && product.price < 10 || priceRange === "10-plus" && product.price >= 10));
    });
    return [...pool].sort((a, b) => sort === "price-low" ? Number(isPriceHidden(a)) - Number(isPriceHidden(b)) || a.price - b.price : sort === "price-high" ? Number(isPriceHidden(a)) - Number(isPriceHidden(b)) || b.price - a.price : sort === "new" ? b.id - a.id : a.id - b.id);
  }, [activeCategory, products, search, priceRange, sort]);

  const chooseCategory = (slug: string) => { setActiveCategory(slug); setVisibleCount(36); navigate(slug ? `/shop?category=${slug}` : "/shop"); };
  const reset = () => { setActiveCategory(""); setSearch(""); setPriceRange("all"); setSort("catalogue"); setVisibleCount(36); navigate("/shop"); };
  const editResults = filtered.slice(0, visibleCount);

  return <StoreLayout>
    <section className="page-banner"><div className="trade-shell"><div><p className="eyebrow">Home / Shop</p><h1>{activeCategoryInfo?.name || "Wholesale catalogue"}</h1><p>{activeCategoryInfo?.summary || "A focused wholesale catalogue of practical lines for independent retail and marketplace sellers."}</p></div></div></section>
    <div className="trade-shell shop-layout">
      <aside className={`filter-rail ${filtersOpen ? "filter-rail-open" : ""}`}>
        <div className="filter-rail-heading"><span className="eyebrow">Browse categories</span><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={19} /></button></div>
        <button className={!activeCategory ? "rail-category active" : "rail-category"} type="button" onClick={() => chooseCategory("")}><span>All products</span><ChevronDown size={15} /></button>
        {categories.map((category) => <button className={activeCategory === category.slug ? "rail-category active" : "rail-category"} key={category.slug} type="button" onClick={() => chooseCategory(category.slug)}><span>{category.name}</span><ChevronDown size={15} /></button>)}
        <div className="rail-rule" />
        {products.some((product) => !isPriceHidden(product)) && <label className="stock-filter"><span>Price range</span><select value={priceRange} onChange={(event) => { setPriceRange(event.target.value); setVisibleCount(36); }}><option value="all">All prices</option><option value="under-5">Under £5 ex VAT</option><option value="5-10">£5–£10 ex VAT</option><option value="10-plus">£10+ ex VAT</option></select></label>}
        <button className="clear-filters" type="button" onClick={reset}>Clear selection</button>
      </aside>
      <section className="catalogue-content">
        <div className="catalogue-tools">
          <div className="catalogue-search"><Search size={19} /><label className="sr-only" htmlFor="catalogue-search">Search catalogue</label><input id="catalogue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" /></div>
          <button type="button" className="filter-toggle" onClick={() => setFiltersOpen(true)}><Filter size={17} /> Filters</button>
          <label className="sort-control"><SlidersHorizontal size={16} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="catalogue">Catalogue order</option><option value="new">Newest records</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        </div>
        <div className="catalogue-meta"><span>{loading ? <><b>Loading</b> verified catalogue</> : <><b>Showing {editResults.length}</b> of {filtered.length} products</>}</span><span>{products.every(isPriceHidden) ? "Trade quotes on request" : "GBP prices · ex VAT"}</span></div>
        {loading ? <div className="empty-state catalogue-loading"><Loader2 size={30} className="animate-spin" /><h2>Loading catalogue lines.</h2><p>Preparing the verified product information for your browse session.</p></div> : filtered.length ? <><div className="catalogue-intro-strip"><span className="eyebrow">Product information</span><p>Every listed line shows its matching image, product reference, pack format and factual description. Trade prices and stock quantities are confirmed only after enquiry.</p></div><div className="product-grid catalogue-grid">{editResults.map((product, index) => <Fragment key={product.id}><ProductCard product={product} />{index === 11 && <aside className="catalogue-interrupt"><div><span className="eyebrow light">Trade collection</span><h2>Clear product facts.<br />Quick wholesale browsing.</h2><p>Search by category, product name, supplier reference or pack format, then add the lines you need to your enquiry.</p><Link href="/shop" className="catalogue-interrupt-link">Browse all products <ChevronDown size={16} /></Link></div><span className="catalogue-interrupt-index">Source</span></aside>}</Fragment>)}</div>{filtered.length > editResults.length && <div className="catalogue-limit"><span className="eyebrow">More to explore</span><p>Continue browsing category-matched product records.</p><button type="button" className="button-secondary" onClick={() => setVisibleCount((count) => count + 36)}>Load more products</button></div>}</> : <div className="empty-state"><Search size={30} /><h2>No matching products found.</h2><p>Try another product term, product reference or category.</p><button type="button" className="button-secondary" onClick={reset}>Reset the catalogue</button></div>}
      </section>
    </div>
  </StoreLayout>;
}
