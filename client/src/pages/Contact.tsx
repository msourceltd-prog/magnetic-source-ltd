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
      setError("We could not send this message right now. Please refresh the page and try again.");
      return;
    }

    const message = String(form.get("message") || "").trim();
    if (message.length < 20) {
      setError("Please include a little more detail so we can help.");
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
      setError("We could not send this message right now. Please email or call us directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <StoreLayout>
      <section className="contact-hero">
        <div className="trade-shell">
          <div>
            <h1>Contact Magnetic Source</h1>
            <p>For product information, delivery questions or account support, get in touch with our UK team. We will help you find the right next step for your business.</p>
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
          <p className="eyebrow">Contact Magnetic Source</p>
          <h2>How can we help?</h2>
          <p>Tell us what you are looking for and include any product, quantity or delivery details that may help. We will review your message and come back to you by email.</p>
          <div className="contact-note"><CheckCircle2 size={19} /><span><b>Prefer a direct conversation?</b> Email or call us using the details above.</span></div>
        </div>

        <form className="contact-form" onSubmit={submit}>
          {sent ? (
            <div className="contact-success" role="status">
              <CheckCircle2 size={32} />
              <h2>Thank you — we have received your message.</h2>
              <p>We will reply using the email address you provided.</p>
              <button type="button" className="button-secondary" onClick={() => { setSent(false); setError(""); }}>Send another message</button>
            </div>
          ) : (
            <>
              <input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
              <div className="contact-form-heading">
                <div>
                  <p className="eyebrow">Send a message</p>
                  <h2>Tell us what you need</h2>
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
                <p><CheckCircle2 size={16} /> Your message is sent directly to Magnetic Source.</p>
              </div>
            </>
          )}
        </form>
      </section>
    </StoreLayout>
  );
}
