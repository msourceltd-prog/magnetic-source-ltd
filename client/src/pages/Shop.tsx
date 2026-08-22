/**
 * Trade Ledger, Recut: an original premium wholesale browsing field with
 * category navigation, factual product discovery, real imagery and a clear
 * quote-required state. Search indexing is prepared once per catalogue update
 * so category switches and typing remain lightweight on desktop and mobile.
 */
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import ProductCard from "@/components/ProductCard";
import StoreLayout from "@/components/StoreLayout";
import { useCatalog } from "@/contexts/CatalogContext";
import { isPriceHidden } from "@/lib/catalogRuntime";

const getQuery = (search: string, key: string) => new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get(key) || "";
const searchAliases: Record<string, string[]> = { cleaner: ["cleaner", "cleaning"], cleaning: ["cleaning", "cleaner"], microfibre: ["microfibre", "microfiber"], microfiber: ["microfiber", "microfibre"] };
const normalizeSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const curatedCollections = [
  { slug: "best-sellers", name: "Best sellers", summary: "A focused edit of popular lines selected for trade buyers.", tag: "Best seller" },
  { slug: "new-arrivals", name: "New arrivals", summary: "The latest lines added to the Magnetic Source catalogue.", tag: "New arrival" },
] as const;

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
  const [visibleCount, setVisibleCount] = useState(24);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const activeCategoryInfo = categories.find((category) => category.slug === activeCategory);
  const activeCollection = curatedCollections.find((collection) => collection.slug === activeCategory);
  const selectedCategory = activeCategoryInfo?.slug || "";
  const seoPath = selectedCategory ? `/shop?category=${encodeURIComponent(selectedCategory)}` : activeCollection ? `/shop?category=${activeCollection.slug}` : "/shop";
  const seoTitle = activeCategoryInfo ? `${activeCategoryInfo.name} Wholesale Products | Magnetic Source` : activeCollection ? `${activeCollection.name} Wholesale Products | Magnetic Source` : "Wholesale Products & Trade Catalogue | Magnetic Source";
  const seoDescription = activeCategoryInfo ? `Magnetic Source offers ${activeCategoryInfo.name} wholesale products for UK trade buyers, with clear product descriptions, pack details and controlled customer price access.` : activeCollection ? `Browse Magnetic Source ${activeCollection.name.toLowerCase()} for UK trade buyers, with clear product descriptions, pack details and controlled customer price access.` : "Browse Magnetic Source wholesale products for UK trade buyers, with practical retail lines, clear pack details, product references and controlled customer price access.";

  useEffect(() => {
    setActiveCategory(getQuery(searchString, "category"));
    setSearch(getQuery(searchString, "q"));
    setSort(getQuery(searchString, "sort") || "catalogue");
  }, [searchString]);

  const searchableProducts = useMemo(() => products.map((product) => ({
    product,
    searchTerms: new Set(normalizeSearch(`${product.name} ${product.sku} ${product.pack} ${product.description || ""} ${product.category} ${product.tags.join(" ")}`).split(" ").filter(Boolean)),
  })), [products]);

  const filtered = useMemo(() => {
    const searchTerms = normalizeSearch(deferredSearch).split(" ").filter(Boolean);
    const pool = searchableProducts.filter(({ product, searchTerms: searchableTerms }) => {
      const matchesSearch = !searchTerms.length || searchTerms.every((term) => (searchAliases[term] || [term]).some((candidate) => searchableTerms.has(candidate)));
      const hasPublicPrice = !isPriceHidden(product);
      return (!selectedCategory || product.category === selectedCategory)
        && (!activeCollection || product.tags.includes(activeCollection.tag))
        && matchesSearch
      && (priceRange === "all" || hasPublicPrice && (priceRange === "under-5" && product.price < 5 || priceRange === "5-10" && product.price >= 5 && product.price < 10 || priceRange === "10-plus" && product.price >= 10));
    }).map(({ product }) => product);
    return [...pool].sort((a, b) => sort === "price-low" ? Number(isPriceHidden(a)) - Number(isPriceHidden(b)) || a.price - b.price : sort === "price-high" ? Number(isPriceHidden(a)) - Number(isPriceHidden(b)) || b.price - a.price : sort === "new" ? b.id - a.id : a.id - b.id);
  }, [selectedCategory, activeCollection, searchableProducts, deferredSearch, priceRange, sort]);

  const replaceShopQuery = (slug: string, nextSearch = search, nextSort = sort) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextSort !== "catalogue") params.set("sort", nextSort);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/shop?${query}` : "/shop");
  };
  const chooseCategory = (slug: string) => {
    startTransition(() => {
      setActiveCategory(slug);
      setVisibleCount(24);
      setFiltersOpen(false);
    });
    replaceShopQuery(slug);
  };
  const reset = () => { setActiveCategory(""); setSearch(""); setPriceRange("all"); setSort("catalogue"); setVisibleCount(24); setFiltersOpen(false); replaceShopQuery("", "", "catalogue"); };

  useEffect(() => {
    const applyHeaderCategory = (event: Event) => {
      const slug = (event as CustomEvent<{ slug: string }>).detail?.slug || "";
      startTransition(() => {
        setActiveCategory(slug);
        setVisibleCount(24);
        setFiltersOpen(false);
      });
    };
    window.addEventListener("magnetic-source:category-change", applyHeaderCategory);
    return () => window.removeEventListener("magnetic-source:category-change", applyHeaderCategory);
  }, []);
  const editResults = filtered.slice(0, visibleCount);

  return <StoreLayout seo={{ title: seoTitle, description: seoDescription, path: seoPath }}>
    <section className="page-banner"><div className="trade-shell"><div><p className="eyebrow">Home / Shop</p><h1>{activeCategoryInfo ? `${activeCategoryInfo.name} wholesale products` : activeCollection ? `${activeCollection.name} wholesale products` : "Wholesale catalogue for UK trade buyers"}</h1><p>{activeCategoryInfo?.summary || activeCollection?.summary || "A focused wholesale catalogue of practical lines for independent retail and marketplace sellers."}</p></div></div></section>
    <div className="trade-shell shop-layout">
      <aside className={`filter-rail ${filtersOpen ? "filter-rail-open" : ""}`}>
        <div className="filter-rail-heading"><span className="eyebrow">Browse categories</span><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={19} /></button></div>
        <button className={!activeCategory ? "rail-category active" : "rail-category"} type="button" onClick={() => chooseCategory("")}><span>All products</span><ChevronDown size={15} /></button>
        {curatedCollections.map((collection) => <button className={activeCategory === collection.slug ? "rail-category active" : "rail-category"} key={collection.slug} type="button" onClick={() => chooseCategory(collection.slug)}><span>{collection.name}</span><ChevronDown size={15} /></button>)}
        {categories.filter((category) => category.slug !== "clearance").map((category) => <button className={activeCategory === category.slug ? "rail-category active" : "rail-category"} key={category.slug} type="button" onClick={() => chooseCategory(category.slug)}><span>{category.name}</span><ChevronDown size={15} /></button>)}
        <div className="rail-rule" />
        {products.some((product) => !isPriceHidden(product)) && <label className="stock-filter"><span>Price range</span><select value={priceRange} onChange={(event) => { setPriceRange(event.target.value); setVisibleCount(36); }}><option value="all">All prices</option><option value="under-5">Under £5 ex VAT</option><option value="5-10">£5–£10 ex VAT</option><option value="10-plus">£10+ ex VAT</option></select></label>}
      </aside>
      <section className="catalogue-content">
        <div className="catalogue-tools">
          <div className="catalogue-search"><Search size={19} /><label className="sr-only" htmlFor="catalogue-search">Search catalogue</label><input id="catalogue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" /></div>
          <button type="button" className="filter-toggle" onClick={() => setFiltersOpen(true)}><Filter size={17} /> Filters</button>
          <label className="sort-control"><SlidersHorizontal size={16} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="catalogue">Catalogue order</option><option value="new">Newest records</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        </div>
        <div className="catalogue-meta catalogue-meta-spacer" aria-hidden="true" />
        {loading ? <p className="catalogue-loading-note" aria-live="polite">Refreshing catalogue records.</p> : filtered.length ? <><div className="product-grid catalogue-grid">{editResults.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 6} />)}</div>{filtered.length > editResults.length && <div className="catalogue-limit"><span className="eyebrow">More to explore</span><p>Continue browsing category-matched product records.</p><button type="button" className="button-secondary" onClick={() => setVisibleCount((count) => count + 24)}>Load more products</button></div>}</> : <div className="empty-state"><Search size={30} /><h2>No matching products found.</h2><p>Try another product term, product reference or category.</p><button type="button" className="button-secondary" onClick={reset}>Reset the catalogue</button></div>}
      </section>
    </div>
  </StoreLayout>;
}
