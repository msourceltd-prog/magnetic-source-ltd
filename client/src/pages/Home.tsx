/**
 * Trade Ledger, Recut: an asymmetric editorial home built around a trade-desk
 * browsing rhythm, warm paper space, Source Cobalt navigation, and original imagery.
 */
import { ArrowRight, Box, ChevronRight, PackageCheck, Search, Truck } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";

export default function Home() {
  const { categories, products } = useCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 8);
  return <StoreLayout>
    <section className="hero-section">
      <div className="hero-image"><img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=82" alt="Stacked trade cartons in a warehouse" fetchPriority="high" decoding="async" /></div>
      <div className="trade-shell hero-layout">
        <aside className="hero-rail" aria-label="Department shortcuts">
          <span className="eyebrow">Browse the source</span>
          {categories.slice(0, 6).map((category, index) => <Link key={category.slug} href={`/shop?category=${category.slug}`}><b>{String(index + 1).padStart(2, "0")}</b>{category.name}<ChevronRight size={15} /></Link>)}
          <Link href="/shop" className="hero-rail-all">All departments <ArrowRight size={15} /></Link>
        </aside>
        <div className="hero-copy">
          <p className="eyebrow">UK trade supply · curated for everyday retail</p>
          <h1>Stock your<br /><em>next best-seller.</em></h1>
          <p className="hero-description">A practical source for compact, useful lines that earn their place on the shelf, in the parcel and on the marketplace listing.</p>
          <div className="hero-actions"><Link href="/shop" className="button-primary">Shop the edit <ArrowRight size={18} /></Link><Link href="/shop?tag=marketplace" className="text-link">For marketplace sellers <ArrowRight size={16} /></Link></div>
          <div className="hero-metrics"><span><b>{products.length}</b> sample lines</span><span><b>{categories.length}</b> departments</span><span><b>GBP</b> pricing shown</span></div>
        </div>
      </div>
      <div className="hero-footnote"><div className="trade-shell"><span>Approval demo catalogue</span><span>Original content · No live payment</span></div></div>
    </section>

    <section className="trade-shell category-intro section-space">
      <div><p className="eyebrow">Choose by need</p><h2>A working edit,<br />not an endless list.</h2></div>
      <p>Start with the departments most useful to smaller retailers, independent sellers and practical everyday displays. Each route holds clear pack, price and availability information.</p>
    </section>

    <section className="trade-shell department-grid">
      <Link href="/shop?category=home-utility" className="department-feature feature-home"><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=78" alt="Organised home storage products" loading="lazy" decoding="async" /><div><span className="eyebrow">01 / Home & utility</span><h3>Everyday usefulness, neatly packaged.</h3><span className="department-cta">Explore lines <ArrowRight size={16} /></span></div></Link>
      <Link href="/shop?category=diy-hardware" className="department-feature feature-diy"><img src="https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1100&q=78" alt="Workshop supplies on a work surface" loading="lazy" decoding="async" /><div><span className="eyebrow">02 / DIY & hardware</span><h3>Small fixes,<br />strong shelf logic.</h3><span className="department-cta">Explore lines <ArrowRight size={16} /></span></div></Link>
      <div className="department-list-card">
        <p className="eyebrow">More departments</p>
        {categories.slice(2).map((category) => <Link key={category.slug} href={`/shop?category=${category.slug}`}><span>{category.name}</span><ArrowRight size={16} /></Link>)}
      </div>
    </section>

    <section className="featured-section section-space">
      <div className="trade-shell section-heading"><div><p className="eyebrow">Selected lines</p><h2>Useful from first glance.</h2></div><Link href="/shop" className="text-link">See the full catalogue <ArrowRight size={16} /></Link></div>
      <div className="trade-shell product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    </section>

    <section className="trade-shell sourcing-band section-space">
      <div className="sourcing-image"><img src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80" alt="Parcels and shipping supplies prepared for dispatch" loading="lazy" decoding="async" /></div>
      <div className="sourcing-copy"><p className="eyebrow">Built for the practical part</p><h2>Clear lines. Quietly ready to move.</h2><p>Product cards carry the information a reseller needs before adding to a basket: trade price, pack format, SKU, availability and a plain-language product description.</p><Link href="/about" className="button-secondary">How Magnetic Source works <ArrowRight size={17} /></Link></div>
      <div className="sourcing-points"><div><Search size={22} /><b>Search the detail</b><p>Find an item by product name, SKU or pack type.</p></div><div><Box size={22} /><b>Build a basket</b><p>Adjust quantities before continuing to a no-payment demo checkout.</p></div><div><Truck size={22} /><b>Plan delivery</b><p>Review delivery and returns information in plain English.</p></div></div>
    </section>

    <section className="statement-band"><div className="trade-shell"><PackageCheck size={32} /><p>Curated for the retailer who wants stock to feel <em>considered</em>, not complicated.</p><Link href="/contact">Open a trade conversation <ArrowRight size={17} /></Link></div></section>
  </StoreLayout>;
}
