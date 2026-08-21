/**
 * Trade Ledger, Recut: an operational, paper-and-ink footer that closes each
 * page with professional registered-company details and useful support routes.
 */
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

const footerGroups = [
  { title: "Support", links: [["About Magnetic Source", "/about"], ["Trade account", "/trade-account"], ["Delivery & returns", "/delivery-returns"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
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
    <path d="M46 53c-5-2-9-5-12-10" fill="none" stroke="var(--brand-text)" strokeLinecap="round" strokeWidth="2.4" />
    <circle cx="32" cy="32" r="5" fill="var(--brand-text)" />
  </svg>;
}

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="trade-shell footer-top">
      <section className="footer-statement">
        <div className="footer-brand-lockup"><FooterBrandMark /><span className="eyebrow light">Magnetic<br />Source Ltd</span></div>
        <h2>Useful stock,<br />clearly sourced.</h2>
        <p>Practical catalogue lines, clear product information and a no-payment trade enquiry journey.</p>
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
      </section>
    </div>
  </footer>;
}
