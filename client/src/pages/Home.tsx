/**
 * Trade Ledger, Recut: an asymmetric editorial home built around a trade-desk
 * browsing rhythm, warm paper space, Source Cobalt navigation, dynamic live
 * departments, and a no-price, no-stock quote-required catalogue policy.
 */
import { ArrowRight, ChevronRight, PackageCheck } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/contexts/CatalogContext";

export default function Home() {
  const { categories, products } = useCatalog();
  const featured = products.slice(0, 8);
  return <StoreLayout>
    <section className="hero-section">
      <div className="hero-image" aria-hidden="true"><img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=2000&q=82" alt="" width="2000" height="1200" fetchPriority="high" decoding="async" /></div>
      <div className="trade-shell hero-layout">
        <aside className="hero-rail" aria-label="Department shortcuts">
          <span className="eyebrow">Browse the source</span>
          {categories.slice(0, 6).map((category, index) => <Link key={category.slug} href={`/shop?category=${category.slug}`}><b>{String(index + 1).padStart(2, "0")}</b>{category.name}<ChevronRight size={15} /></Link>)}
          <Link href="/shop" className="hero-rail-all">All departments <ArrowRight size={15} /></Link>
        </aside>
        <div className="hero-copy">
          <p className="eyebrow">UK trade supply · curated for everyday retail</p>
          <h1>UK wholesale catalogue for your<br /><em>next best-seller.</em></h1>
          <p className="hero-description">A practical source for compact, useful lines that earn their place on the shelf, in the parcel and on the marketplace listing.</p>
        </div>
      </div>
    </section>

    <section className="trade-shell category-intro section-space">
      <div><p className="eyebrow">Choose by need</p><h2>A working edit,<br />not an endless list.</h2></div>
      <p>Start with the departments most useful to smaller retailers, independent sellers and practical everyday displays. Each route holds clear pack, product reference, matching image and plain-language product information.</p>
    </section>

    <section className="featured-section section-space">
      <div className="trade-shell section-heading"><div><p className="eyebrow">Selected lines</p><h2>Useful from first glance.</h2></div><Link href="/shop" className="text-link">See the full catalogue <ArrowRight size={16} /></Link></div>
      <div className="trade-shell product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    </section>

    <section className="statement-band"><div className="trade-shell"><PackageCheck size={32} /><p>Curated for the retailer who wants sourcing to feel <em>considered</em>, not complicated.</p><Link href="/contact">Open a trade conversation <ArrowRight size={17} /></Link></div></section>
  </StoreLayout>;
}
