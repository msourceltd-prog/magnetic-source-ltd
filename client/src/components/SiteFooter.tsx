/**
 * Trade Ledger brand shelf: a Gem Imports-inspired, continuously moving row of
 * factual, verified catalogue brands replaces the static footer grid while retaining
 * Magnetic Source's cobalt, operational control language and support footer.
 */
import { ArrowUpRight, ChevronLeft, ChevronRight, Mail, MapPin, Pause, Phone, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import "@/styles/our-brands-carousel.css";

const footerGroups = [
  { title: "Support", links: [["About Us", "/about"], ["Trade Account", "/trade-account"], ["Delivery & Returns", "/delivery-returns"], ["Contact Us", "/contact"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"]] },
];

const featuredBrands = [
  { name: "Baylis & Harding", category: "Health & Beauty", tone: "baylis" },
  { name: "Bubble T", category: "Beauty gifts", tone: "bubble" },
  { name: "Little Learners", category: "Baby & Kids", tone: "little" },
  { name: "Sure", category: "Personal care", tone: "sure" },
  { name: "Face Facts", category: "Health & Beauty", tone: "face" },
  { name: "Haribo", category: "Sweets & Snacks", tone: "haribo" },
  { name: "Chupa Chups", category: "Beauty & gifting", tone: "chupa" },
  { name: "Good Boy", category: "Pet care", tone: "good" },
  { name: "Nylabone", category: "Pet care", tone: "nyla" },
  { name: "Pokémon", category: "Toys & Gifts", tone: "pokemon" },
  { name: "Rosewood", category: "Pet care", tone: "rosewood" },
  { name: "Umbro", category: "Health & Beauty", tone: "umbro" },
];

function FooterBrandMark() {
  return <svg className="footer-brand-mark" viewBox="0 0 64 64" role="img" aria-labelledby="footer-brand-mark-title" focusable="false">
    <title id="footer-brand-mark-title">Magnetic Source field mark</title>
    <rect x="2" y="2" width="60" height="60" rx="8" fill="var(--brand-surface)" stroke="var(--brand-primary)" strokeWidth="2" />
    <path d="M12 18 26 29 21 34 8 23Z" fill="var(--brand-primary)" />
    <path d="m52 18 4 5-13 11-5-5Z" fill="var(--brand-primary)" />
    <path d="m12 46-4-5 13-11 5 5Z" fill="var(--brand-primary)" />
    <path d="m52 46-14-11 5-5 13 11Z" fill="var(--brand-primary)" />
    <path d="M18 11c5 2 9 5 12 10" fill="none" stroke="var(--brand-text)" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M46 11c-5 2-9 5-12 10" fill="none" stroke="var(--brand-text)" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M18 53c5-2 9-5 12-10" fill="none" stroke="var(--brand-text)" strokeLinecap="round" strokeWidth="2.4" />
    <path d="M46 53c5-2 9-5 12-10" fill="none" stroke="var(--brand-text)" strokeLinecap="round" strokeWidth="2.4" />
  </svg>;
}

function OurBrandsShelf() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const isPaused = isManualPaused || isInteracting;

  useEffect(() => {
    const moveShelf = (time: number) => {
      const viewport = viewportRef.current;
      const previousFrame = lastFrameRef.current ?? time;
      const elapsed = Math.min(time - previousFrame, 64);
      lastFrameRef.current = time;
      if (viewport && !isPaused) {
        const seam = viewport.scrollWidth / 2;
        viewport.scrollLeft += elapsed * 0.028;
        if (viewport.scrollLeft >= seam) viewport.scrollLeft = 0;
      }
      frameRef.current = window.requestAnimationFrame(moveShelf);
    };
    frameRef.current = window.requestAnimationFrame(moveShelf);
    return () => { if (frameRef.current) window.cancelAnimationFrame(frameRef.current); };
  }, [isPaused]);

  const moveShelfBy = (direction: "back" | "forward") => {
    setIsManualPaused(true);
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: (direction === "forward" ? 1 : -1) * Math.max(viewport.clientWidth * 0.72, 300), behavior: "smooth" });
  };

  return <section className="our-brands" aria-labelledby="our-brands-title">
    <div className="trade-shell">
      <div className="our-brands-heading">
        <div>
          <span className="eyebrow">Represented in our catalogue · 54 verified brands</span>
          <h2 id="our-brands-title">Our brands,<br /><em>in motion.</em></h2>
        </div>
        <p className="our-brands-heading-copy">Browse a selection of named brands available across the Magnetic Source catalogue. Every tile opens a matching product search.</p>
      </div>
      <div className="brand-shelf-rule" aria-hidden="true">Browse the brand shelf</div>
    </div>
    <div className="our-brands-viewport" ref={viewportRef} onMouseEnter={() => setIsInteracting(true)} onMouseLeave={() => setIsInteracting(false)} onFocusCapture={() => setIsInteracting(true)} onBlurCapture={() => setIsInteracting(false)} onTouchStart={() => setIsInteracting(true)} onTouchEnd={() => setIsInteracting(false)}>
      <div className="our-brands-track">
        {[...featuredBrands, ...featuredBrands].map((brand, index) => <Link className={`our-brand-tile our-brand-tile--${brand.tone}`} href={`/shop?q=${encodeURIComponent(brand.name)}`} key={`${brand.name}-${index}`} tabIndex={index >= featuredBrands.length ? -1 : 0} aria-hidden={index >= featuredBrands.length}>
          <span className="our-brand-tile-topline"><span>{String((index % featuredBrands.length) + 1).padStart(2, "0")}</span><ArrowUpRight size={16} aria-hidden="true" /></span>
          <span><strong>{brand.name}</strong><small>{brand.category}</small></span>
        </Link>)}
      </div>
    </div>
    <div className="trade-shell our-brands-footer">
      <p className="our-brands-status">{isPaused ? "Shelf paused — move at your own pace" : "Shelf in motion — pause to take a closer look"}</p>
      <div className="our-brands-controls" aria-label="Our brands shelf controls">
        <button type="button" onClick={() => setIsManualPaused((paused) => !paused)} aria-label={isManualPaused ? "Play automatic brand shelf" : "Pause automatic brand shelf"}>{isManualPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}<span>{isManualPaused ? "Play" : "Pause"}</span></button>
        <button type="button" onClick={() => moveShelfBy("back")} aria-label="Show previous brands"><ChevronLeft size={19} aria-hidden="true" /></button>
        <button type="button" onClick={() => moveShelfBy("forward")} aria-label="Show next brands"><ChevronRight size={19} aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}

export default function SiteFooter() {
  useEffect(() => {
    const warmFooterRoutes = () => { void import("@/pages/InfoPage"); void import("@/pages/Contact"); };
    const timer = window.setTimeout(warmFooterRoutes, 900);
    return () => window.clearTimeout(timer);
  }, []);

  return <footer className="site-footer">
    <OurBrandsShelf />
    <div className="trade-shell footer-top">
      <section className="footer-statement">
        <div className="footer-brand-lockup"><FooterBrandMark /><span className="eyebrow light">Magnetic<br />Source Ltd</span></div>
        <h2>Useful stock,<br />clearly sourced.</h2>
        <p>Practical catalogue lines, clear product information and customer price access through a secure login.</p>
      </section>
      {footerGroups.map((group) => <section className="footer-links" key={group.title}>
        <h3>{group.title}</h3>
        {group.links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </section>)}
      <section className="footer-details">
        <h3>Trade desk</h3>
        <p><Mail size={15} /> <a href="mailto:info@magneticsource.uk">info@magneticsource.uk</a></p>
        <p><Phone size={15} /> <a href="tel:+447856262726">+44 7856 262726</a></p>
        <p className="footer-address"><MapPin size={15} /> Flat 1, Saviours House, 15 Newport Road, Hayes, England, UB4 8FR</p>
        <p className="footer-legal">Company No. 15466397 · VAT No. GB469 1754 52</p>
        <div className="footer-payment-methods" aria-label="Accepted payment methods: Mastercard, PayPal, Visa, and American Express">
          <span className="payment-mark payment-mastercard" aria-label="Mastercard"><span className="payment-circle payment-circle-red" /><span className="payment-circle payment-circle-gold" /></span>
          <span className="payment-mark payment-paypal" aria-label="PayPal">Pay<span>Pal</span></span>
          <span className="payment-mark payment-visa" aria-label="Visa">VISA</span>
          <span className="payment-mark payment-amex" aria-label="American Express">AMERICAN<br />EXPRESS</span>
        </div>
      </section>
    </div>
  </footer>;
}
