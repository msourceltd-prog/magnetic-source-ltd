/**
 * Trade Ledger, Recut: a clear trade-contact page with visible validation, a
 * low-friction honeypot and Cloudflare-compatible form delivery.
 */
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import StoreLayout from "@/components/StoreLayout";
import { submitStaticContact } from "@/lib/staticContactDelivery";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (String(form.get("website") || "")) {
      setSent(true);
      return;
    }

    const message = String(form.get("message") || "").trim();
    if (message.length < 20) {
      setError("Please include at least 20 characters so the trade desk has enough context.");
      return;
    }

    setError("");
    setIsSending(true);

    try {
      await submitStaticContact({
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        company: String(form.get("company") || "").trim() || undefined,
        topic: String(form.get("topic") || "range").trim() as "range" | "delivery" | "account" | "other",
        message,
      });
      setSent(true);
    } catch {
      setError("We could not send your enquiry right now. Please call or email the trade desk directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <StoreLayout>
      <section className="contact-hero">
        <div className="trade-shell">
          <div>
            <h1>Talk to Magnetic Source</h1>
            <p>For product information, delivery questions or customer account support, speak directly with our UK trade desk. We will help you identify the most relevant next step.</p>
          </div>
          <aside>
            <Mail size={22} /><a href="mailto:info@magneticsource.uk">info@magneticsource.uk</a>
            <Phone size={22} /><a href="tel:+447856262726">+44 7856 262726</a>
            <MapPin size={22} /><span>Flat 1, Saviours House, 15 Newport Road, Hayes, England, UB4 8FR</span>
            <span className="contact-legal">Company No. 15466397 · VAT No. GB469 1754 52</span>
          </aside>
        </div>
      </section>

      <section className="trade-shell contact-layout section-space">
        <div className="contact-intro">
          <p className="eyebrow">Trade enquiry desk</p>
          <h2>Tell us what your business needs.</h2>
          <p>Share the range, product types or delivery requirements you are considering. A member of the Magnetic Source trade desk will use these details to identify the most relevant next step.</p>
          <div className="contact-note"><CheckCircle2 size={19} /><span><b>Prefer a direct conversation?</b> Email or call the trade desk using the details above.</span></div>
        </div>

        <form className="contact-form" onSubmit={submit}>
          {sent ? (
            <div className="contact-success" role="status">
              <CheckCircle2 size={32} />
              <h2>Your message has been sent.</h2>
              <p>The Magnetic Source trade desk has received your enquiry and can reply directly to your email address.</p>
              <button type="button" className="button-secondary" onClick={() => { setSent(false); setError(""); }}>Send another message</button>
            </div>
          ) : (
            <>
              <input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
              <div className="contact-form-heading">
                <div>
                  <p className="eyebrow">Enquiry details</p>
                  <h2>Start your trade enquiry</h2>
                </div>
                <p><span className="required-mark">*</span> Required fields</p>
              </div>
              <div className="form-grid">
                <label>Full name <span className="required-mark">*</span><input required maxLength={100} name="name" autoComplete="name" placeholder="Your full name" /></label>
                <label>Business email <span className="required-mark">*</span><input required maxLength={254} name="email" type="email" autoComplete="email" placeholder="name@yourbusiness.co.uk" /></label>
                <label>Company (optional)<input maxLength={120} name="company" autoComplete="organization" /></label>
                <label>Enquiry topic <span className="required-mark">*</span><select name="topic" defaultValue="range"><option value="range">Product range</option><option value="delivery">Delivery</option><option value="account">Customer account</option><option value="other">Other support</option></select></label>
                <label className="span-2">How can we help? <span className="required-mark">*</span><textarea required minLength={20} maxLength={2000} name="message" rows={5} placeholder="Please include the product types, quantities or delivery information you need." /></label>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="contact-form-action">
                <button type="submit" className="button-primary" disabled={isSending}>{isSending ? "Sending enquiry…" : <>Send enquiry <ArrowRight size={17} /></>}</button>
                <p><CheckCircle2 size={16} /> Your enquiry is sent directly to the Magnetic Source trade desk.</p>
              </div>
            </>
          )}
        </form>
      </section>
    </StoreLayout>
  );
}
