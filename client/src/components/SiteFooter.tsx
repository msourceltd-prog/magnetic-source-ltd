/**
 * Trade Ledger, Recut: an operational, paper-and-ink footer that closes each
 * page with useful support routes rather than generic promotional filler.
 */
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

const footerGroups = [
  { title: "Browse", links: [["Wholesale catalogue", "/shop"], ["Latest records", "/shop?sort=new"], ["Catalogue lines", "/shop"], ["Trade essentials", "/shop?category=diy-hardware"]] },
  { title: "Support", links: [["Delivery & returns", "/delivery-returns"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
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
      {footerGroups.map((group) => <section className="footer-links" key={group.title}>
        <h3>{group.title}</h3>
        {group.links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </section>)}
      <section className="footer-details">
        <h3>Trade desk</h3>
        <p><Mail size={15} /> trade@magneticsource.co.uk</p>
        <p><Phone size={15} /> 020 3988 2160</p>
        <p><MapPin size={15} /> United Kingdom</p>
        <span className="footer-demo-note">For catalogue and trade-account enquiries.</span>
      </section>
    </div>
    <div className="trade-shell footer-bottom">
      <span>© {new Date().getFullYear()} Magnetic Source Ltd</span>
      <span>Made for practical retail.</span>
      <span>GBP (£) · UK trade supply</span>
    </div>
  </footer>;
}
