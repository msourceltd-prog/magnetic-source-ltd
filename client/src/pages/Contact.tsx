/**
 * Trade Ledger, Recut: a clear trade-contact demo with visible validation and
 * a low-friction honeypot, ready for a reviewed server-side contact provider.
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
    setSent(true);
  };
  return <StoreLayout><section className="contact-hero"><div className="trade-shell"><div><p className="eyebrow">Contact the trade desk</p><h1>Let’s make the source useful.</h1><p>Ask about the range, trade accounts or product information. This form currently confirms your enquiry in the browser while a live support workflow is selected.</p></div><aside><Mail size={22} /><span>trade@magneticsource.co.uk</span><Phone size={22} /><span>020 3988 2160</span><MapPin size={22} /><span>United Kingdom</span></aside></div></section><section className="trade-shell contact-layout section-space"><div className="contact-intro"><p className="eyebrow">A clear next step</p><h2>Start with the detail that matters.</h2><p>For a live launch, connect this form to the approved trade-desk inbox or customer-management workflow and add server-side spam protection.</p><div className="contact-note"><CheckCircle2 size={19} /> This form uses clear client-side validation and does not send a live email yet.</div></div><form className="contact-form" onSubmit={submit}>{sent ? <div className="contact-success" role="status"><CheckCircle2 size={32} /><h2>Enquiry details checked.</h2><p>No email has been sent yet. A live support provider must be connected before this form is used for customer communications.</p><button type="button" className="button-secondary" onClick={() => setSent(false)}>Start another enquiry</button></div> : <><input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" /><div className="form-grid"><label>Full name<input required maxLength={100} name="name" autoComplete="name" /></label><label>Email address<input required maxLength={254} name="email" type="email" autoComplete="email" /></label><label>Company (optional)<input maxLength={120} name="company" autoComplete="organization" /></label><label>Topic<select name="topic" defaultValue="range"><option value="range">Product range</option><option value="brand">Brand approval</option><option value="trade">Trade account</option><option value="other">Something else</option></select></label><label className="span-2">Your message<textarea required minLength={20} maxLength={2000} name="message" rows={5} /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button-primary">Confirm enquiry details <ArrowRight size={17} /></button></>}</form></section></StoreLayout>;
}
