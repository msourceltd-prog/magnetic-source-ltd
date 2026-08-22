/**
 * Trade Ledger, Recut: a clear trade-contact demo with visible validation, a
 * low-friction honeypot, registered-company details, and a stable direct-entry
 * anchor for shared support navigation.
 */
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import StoreLayout from "@/components/StoreLayout";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [lastSubmit, setLastSubmit] = useState(0);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (String(form.get("website") || "")) { setSent(true); return; }
    if (Date.now() - lastSubmit < 30_000) { setError("Please wait a moment before sending another enquiry."); return; }
    if (String(form.get("message") || "").trim().length < 20) { setError("Please include at least 20 characters so the trade desk has enough context."); return; }
    setError("");
    setLastSubmit(Date.now());
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const topic = String(form.get("topic") || "Trade enquiry").trim();
    const message = String(form.get("message") || "").trim();
    const subject = `Trade enquiry: ${topic}`;
    const body = [`Name: ${name}`, `Email: ${email}`, company ? `Company: ${company}` : "", "", message].filter(Boolean).join("\n");
    window.location.href = `mailto:info@magneticsource.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  return <StoreLayout><section id="contact-trade-desk" className="contact-hero"><div className="trade-shell"><div><p className="eyebrow">Contact the trade desk</p><h1>Talk to Magnetic Source</h1><p>For product information, delivery questions or a trade account conversation, speak directly with our UK trade desk. We will help you identify the most relevant next step for your enquiry.</p></div><aside><Mail size={22} /><a href="mailto:info@magneticsource.uk">info@magneticsource.uk</a><Phone size={22} /><a href="tel:+447856262726">+44 7856 262726</a><MapPin size={22} /><span>Flat 1, Saviours House, 15 Newport Road, Hayes, England, UB4 8FR</span><span className="contact-legal">Company No. 15466397 · VAT No. GB469 1754 52</span></aside></div></section><section className="trade-shell contact-layout section-space"><div className="contact-intro"><p className="eyebrow">A clear next step</p><h2>Send the details that matter.</h2><p>Tell us what you are looking for, the departments you are considering and any delivery requirements. Submitting this form opens a pre-addressed email to the trade desk with your details included.</p><div className="contact-note"><CheckCircle2 size={19} /> Prefer a direct conversation? Email or call the trade desk using the details above.</div></div><form className="contact-form" onSubmit={submit}>{sent ? <div className="contact-success" role="status"><CheckCircle2 size={32} /><h2>Your email draft is ready.</h2><p>Your email application has opened with your enquiry addressed to the Magnetic Source trade desk. Send it when you are happy with the details.</p><button type="button" className="button-secondary" onClick={() => setSent(false)}>Prepare another enquiry</button></div> : <><input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" /><div className="form-grid"><label>Full name<input required maxLength={100} name="name" autoComplete="name" /></label><label>Email address<input required maxLength={254} name="email" type="email" autoComplete="email" /></label><label>Company (optional)<input maxLength={120} name="company" autoComplete="organization" /></label><label>Topic<select name="topic" defaultValue="range"><option value="range">Product range</option><option value="delivery">Delivery enquiry</option><option value="trade">Trade account</option><option value="other">Other trade enquiry</option></select></label><label className="span-2">Your message<textarea required minLength={20} maxLength={2000} name="message" rows={5} /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button-primary">Prepare email enquiry <ArrowRight size={17} /></button></>}</form></section></StoreLayout>;
}
