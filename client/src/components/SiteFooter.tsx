/**
 * Trade Ledger, Recut: an operational, paper-and-ink footer that closes each
 * page with professional registered-company details and useful support routes.
 */
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

const footerGroups = [
  { title: "Support", links: [["About Magnetic Source", "/about"], ["Trade account", "/trade-account"], ["Delivery & returns", "/delivery-returns"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="trade-shell footer-top">
      <section className="footer-statement">
        <span className="eyebrow light">Magnetic Source Ltd</span>
        <h2>Useful stock,<br />clearly sourced.</h2>
        <p>Practical catalogue lines, clear product information and a no-payment trade enquiry journey.</p>
        <Link href="/contact" className="footer-contact-link">Speak to the trade desk <ArrowUpRight size={17} /></Link>
      </section>
      <div className="footer-browse-spacer" aria-hidden="true" />
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
        <span className="footer-demo-note">For catalogue and trade-account enquiries.</span>
      </section>
    </div>
    <div className="trade-shell footer-bottom">
      <span>© {new Date().getFullYear()} Magnetic Source Ltd</span>
      <span>Registered in England and Wales.</span>
      <span>GBP (£) · UK trade supply</span>
    </div>
  </footer>;
}
