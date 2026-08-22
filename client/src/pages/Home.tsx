/**
 * Trade Ledger, Recut: an asymmetric editorial home built around a trade-desk
 * browsing rhythm, warm paper space, Source Cobalt navigation, dynamic live
 * departments, a restrained rotating wholesale visual field, and a customer-login
 * pricing access policy.
 */
import { ArrowRight, ChevronRight, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import HomeCollectionCarousel from "@/components/HomeCollectionCarousel";
import { useCatalog } from "@/contexts/CatalogContext";

const heroSlides = [
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/bydqoXXLZqEZstwD.jpg", label: "Wholesale packing supplies" },
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/GttUoRTVYguFzBlE.jpeg", label: "Wholesale warehouse interior" },
  { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663870447287/iJutMmvQCbHMVuva.jpg", label: "Wholesale stock boxes" },
];

export default function Home() {
  const { categories, products } = useCatalog();
  const bestSellers = products.filter((product) => product.tags.includes("Best seller"));
  const newArrivals = products.filter((product) => product.tags.includes("New arrival"));
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroTimerReset, setHeroTimerReset] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length), 4000);
    return () => window.clearInterval(timer);
  }, [activeHeroSlide, heroTimerReset]);

  const selectHeroSlide = (index: number) => {
    setActiveHeroSlide(index);
    setHeroTimerReset((current) => current + 1);
  };

  return <StoreLayout>
    <section className="hero-section" aria-roledescription="carousel" aria-label="Magnetic Source wholesale supply">
      <div className="hero-image" aria-hidden="true">
        {heroSlides.map((slide, index) => <img className={`hero-slide${index === activeHeroSlide ? " is-active" : ""}`} key={slide.src} src={slide.src} alt="" width="2000" height="1200" fetchPriority={index === 0 ? "high" : "auto"} loading={index === 0 ? "eager" : "lazy"} decoding="async" />)}
      </div>
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
      <div className="hero-slide-controls" aria-label="Choose hero image">
        {heroSlides.map((slide, index) => <button type="button" className={index === activeHeroSlide ? "is-active" : ""} key={slide.src} onClick={() => selectHeroSlide(index)} aria-label={`Show ${slide.label} image`} aria-pressed={index === activeHeroSlide}><span className="sr-only">{slide.label}</span></button>)}
      </div>
    </section>

    <HomeCollectionCarousel id="home-new-arrivals" title="New arrivals" evidence="Latest catalogue additions from the current wholesale range, updated through the live product records." products={newArrivals} />
    <HomeCollectionCarousel id="home-best-sellers" title="Best sellers" evidence="A current selection of proven product lines, shown with live pack and reference details." products={bestSellers} />

    <section className="trade-shell category-intro section-space">
      <div><p className="eyebrow">Choose by need</p><h2>A working edit,<br />not an endless list.</h2></div>
      <p>Start with the departments most useful to smaller retailers, independent sellers and practical everyday displays. Each route holds clear pack, product reference, matching image and plain-language product information.</p>
    </section>

    <section className="statement-band"><div className="trade-shell"><PackageCheck size={32} /><p>Curated for the retailer who wants sourcing to feel <em>considered</em>, not complicated.</p><Link href="/contact">Contact the trade desk <ArrowRight size={17} /></Link></div></section>
  </StoreLayout>;
}
