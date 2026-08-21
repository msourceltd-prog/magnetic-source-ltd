/**
 * Trade Ledger, Recut: an asymmetric editorial home built around a trade-desk
 * browsing rhythm, warm paper space, Source Cobalt navigation, dynamic live
 * departments, and a no-price, no-stock quote-required catalogue policy.
 */
import { ArrowRight, ChevronRight, PackageCheck } from "lucide-react";
import StoreLayout from "@/components/StoreLayout";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";

export default function Home() {
  const { categories, products } = useCatalog();
  const featured = products.slice(0, 8);
  const heroProduct = featured[0];
  return <StoreLayout>
    <section className="hero-section">
      <div className="hero-image"><picture><source media="(max-width: 760px)" srcSet="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=76" /><source media="(max-width: 1200px)" srcSet="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80" /><img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=82" alt="Magnetic Source wholesale trade cartons stored in a UK warehouse" width="2000" height="1333" fetchPriority="high" decoding="async" /></picture></div>
      <div className="trade-shell hero-layout">
        <aside className="hero-rail" aria-label="Department shortcuts">
          <span className="eyebrow">Browse the source</span>
          {categories.slice(0, 6).map((category, index) => <a key={category.slug} href={`/shop?category=${category.slug}`}><b>{String(index + 1).padStart(2, "0")}</b>{category.name}<ChevronRight size={15} /></a>)}
          <a href="/shop" className="hero-rail-all">All departments <ArrowRight size={15} /></a>
        </aside>
        <div className="hero-copy">
          <p className="eyebrow">UK trade supply · curated for everyday retail</p>
          <h1>UK wholesale catalogue for your<br /><em>next best-seller.</em></h1>
          <p className="hero-description">A practical source for compact, useful lines that earn their place on the shelf, in the parcel and on the marketplace listing.</p>
          <div className="hero-actions"><a href="/shop" className="button-primary">Shop the edit <ArrowRight size={18} /></a><a href="/shop?tag=marketplace" className="text-link">For marketplace sellers <ArrowRight size={16} /></a></div>
          <div className="hero-metrics"><span><b>Trade</b> enquiry</span><span><b>{categories.length}</b> departments</span><span><b>Quote</b> on request</span></div>
          {heroProduct && <aside className="hero-product-proof" aria-label="Catalogue product proof">
            <div className="hero-product-image"><img src={heroProduct.image} alt={`Product image of ${heroProduct.name}, ${heroProduct.pack}, SKU ${heroProduct.sku}`} loading="eager" decoding="async" /></div>
            <div><span className="hero-proof-label">Catalogue proof / 01</span><strong>{heroProduct.name}</strong><span>{heroProduct.pack} · {heroProduct.sku}</span><a href={`/product/${heroProduct.slug}`}>View product details <ArrowRight size={14} /></a></div>
          </aside>}
        </div>
      </div>
    </section>

    <section className="trade-shell category-intro section-space">
      <div><p className="eyebrow">Choose by need</p><h2>A working edit,<br />not an endless list.</h2></div>
      <p>Start with the departments most useful to smaller retailers, independent sellers and practical everyday displays. Each route holds clear pack, product reference, matching image and plain-language product information.</p>
    </section>

    <section className="featured-section section-space">
      <div className="trade-shell section-heading"><div><p className="eyebrow">Selected lines</p><h2>Useful from first glance.</h2></div><a href="/shop" className="text-link">See the full catalogue <ArrowRight size={16} /></a></div>
      <div className="trade-shell product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    </section>

    <section className="statement-band"><div className="trade-shell"><PackageCheck size={32} /><p>Curated for the retailer who wants sourcing to feel <em>considered</em>, not complicated.</p><a href="/contact">Open a trade conversation <ArrowRight size={17} /></a></div></section>
  </StoreLayout>;
}
