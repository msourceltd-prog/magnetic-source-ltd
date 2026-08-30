/**
 * Reference-matched brand logo shelf: a single heading and official Gem Imports
 * brand tiles for the ranges supplied by Magnetic Source.
 */
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import "@/styles/our-brands-carousel.css";

const footerGroups = [
  { title: "Support", links: [["About Us", "/about"], ["Trade Account", "/trade-account"], ["Delivery & Returns", "/delivery-returns"], ["Contact Us", "/contact"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"]] },
];

const featuredBrands = [
  { name: "The Best Dad", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/best_dad.webp?_t=26512153" },
  { name: "Bloc", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/bloc.png?_t=262413481" },
  { name: "Bright Night", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/bright_night.webp?_t=2651215317" },
  { name: "Christmas Celebrations", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/christmas.jpg?_t=2475161321" },
  { name: "Cooke & Miller", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/cooke_and_miller.jpg?_t=2211239471" },
  { name: "Damp Be Gone", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/damp_be_gone.jpg?_t=2211239152" },
  { name: "DentaGlo", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/dentaglo.jpg?_t=22112394719" },
  { name: "Drink Up", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/drink_up.jpg?_t=2212214461" },
  { name: "Ember", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/ember_small.jpg?_t=2252716181" },
  { name: "Exercell", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/exercell.png?_t=262413482" },
  { name: "Fitstyle", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/fitstyle.webp?_t=257312118" },
  { name: "Forever Beautiful", image: "https://www.gemimports.co.uk/gemimportsltd/i/brnd/forever_beautiful_brand_tile_285x222.webp?_t=25227524" },
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
  return <section className="our-brands" aria-labelledby="our-brands-title">
    <div className="trade-shell our-brands-heading">
      <h2 id="our-brands-title">SHOP OUR BRANDS</h2>
    </div>
    <div className="our-brands-viewport">
      <div className="our-brands-track" aria-label="Brands available in the Magnetic Source catalogue">
        {[...featuredBrands, ...featuredBrands].map((brand, index) => <Link
          className="our-brand-card"
          href={`/shop?q=${encodeURIComponent(brand.name)}`}
          key={`${brand.name}-${index}`}
          tabIndex={index >= featuredBrands.length ? -1 : 0}
          aria-hidden={index >= featuredBrands.length}
        >
          <img src={brand.image} alt={`${brand.name} products available from Magnetic Source`} loading="lazy" />
        </Link>)}
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
