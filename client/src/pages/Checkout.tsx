/**
 * Trade Ledger, Recut: protected trade order-review flow with a separately
 * labelled Stripe sandbox action. Test checkout is never presented as live payment.
 */
import { FormEvent, useState } from "react";
import { ArrowRight, CreditCard, FlaskConical, LockKeyhole, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { saveDemoOrder } from "@/lib/demoOrders";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [testCheckoutError, setTestCheckoutError] = useState("");
  const [testCheckoutStarting, setTestCheckoutStarting] = useState(false);
  const { signedIn, openLogin } = useCustomerAuth();
  const testPaymentState = new URLSearchParams(window.location.search).get("test_payment");

  const startTestCheckout = async () => {
    setTestCheckoutStarting(true);
    setTestCheckoutError("");
    try {
      const response = await fetch("/api/stripe/test-checkout", { method: "POST" });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Test checkout could not be started.");
      window.location.assign(result.url);
    } catch (error) {
      setTestCheckoutError(error instanceof Error ? error.message : "Test checkout could not be started.");
      setTestCheckoutStarting(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    const fields = new FormData(event.currentTarget);
    if (String(fields.get("website") || "")) return;
    setSubmitted(true);
    setSubmitError("");
    const reference = `MS-REQ-${String(Math.floor(100000 + Math.random() * 899999))}`;
    try {
      const result = await saveDemoOrder({
        reference,
        firstName: String(fields.get("firstName") || ""),
        lastName: String(fields.get("lastName") || ""),
        email: String(fields.get("email") || ""),
        company: String(fields.get("company") || ""),
        address1: String(fields.get("address1") || ""),
        address2: String(fields.get("address2") || ""),
        city: String(fields.get("city") || ""),
        postcode: String(fields.get("postcode") || ""),
        subtotal,
        items,
      });
      if (!result.persisted) {
        setSubmitError("We could not save your order request. Please try again later or contact the trade desk.");
        setSubmitted(false);
        return;
      }
      clearCart();
      navigate(`/order-confirmation?ref=${reference}`);
    } catch {
      setSubmitError("We could not save your order request. Please try again later or contact the trade desk.");
      setSubmitted(false);
    }
  };

  if (!signedIn) {
    return <StoreLayout><section className="cart-empty checkout-empty"><LockKeyhole size={31} /><p className="eyebrow">Customer login required</p><h1>Login to continue.</h1><p>Sign in to access customer pricing and continue to your order review.</p><button type="button" className="button-primary" onClick={openLogin}>Login to see prices <ArrowRight size={17} /></button></section></StoreLayout>;
  }

  if (!items.length && !submitted) {
    return <StoreLayout><section className="cart-empty checkout-empty"><p className="eyebrow">No items to review</p><h1>Your basket is clear.</h1><p>Add a catalogue line before opening order review.</p><Link href="/shop" className="button-primary">Browse the edit <ArrowRight size={17} /></Link></section></StoreLayout>;
  }

  return <StoreLayout>
    <section className="checkout-header"><div className="trade-shell"><div><p className="eyebrow">Order review</p><h1>Confirm the practical details.</h1></div><p><LockKeyhole size={16} /> Live payment collection is not enabled.</p></div></section>
    <section className="trade-shell checkout-layout section-space">
      <form className="checkout-form" onSubmit={submit}>
        <input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
        <div className="checkout-step"><div className="checkout-step-number">01</div><div><h2>Contact details</h2><p>Your details are stored with this no-payment order request so the trade desk can review it. See the <Link href="/privacy">privacy notice</Link>.</p><div className="form-grid"><label>First name<input required maxLength={100} name="firstName" autoComplete="given-name" /></label><label>Last name<input required maxLength={100} name="lastName" autoComplete="family-name" /></label><label className="span-2">Email address<input required maxLength={254} type="email" name="email" autoComplete="email" /></label><label className="span-2">Company (optional)<input maxLength={120} name="company" autoComplete="organization" /></label></div></div></div>
        <div className="checkout-step"><div className="checkout-step-number">02</div><div><h2>Delivery details</h2><p>Addresses help the trade desk understand delivery requirements. Delivery cost and timing are not calculated on this website.</p><div className="form-grid"><label className="span-2">Address line 1<input required maxLength={160} name="address1" autoComplete="address-line1" /></label><label className="span-2">Address line 2 (optional)<input maxLength={160} name="address2" autoComplete="address-line2" /></label><label>Town or city<input required maxLength={100} name="city" autoComplete="address-level2" /></label><label>Postcode<input required maxLength={16} name="postcode" autoComplete="postal-code" /></label></div><div className="delivery-choice"><Truck size={19} /><div><b>UK delivery review</b><span>Delivery cost and timing are reviewed by the trade desk.</span></div><strong>To review</strong></div></div></div>
        <div className="checkout-step"><div className="checkout-step-number">03</div><div><h2>Test payment</h2><p>This protected test lets you check a card-payment journey. It is not a live customer payment and cannot collect real money.</p>{testPaymentState === "cancelled" && <p className="test-payment-feedback" role="status">Test checkout cancelled. No money was taken.</p>}<div className="test-payment-card"><FlaskConical size={21} aria-hidden="true" /><div><b>Stripe test checkout</b><span>Card test only · £1.00 test amount · no real payment</span></div><button className="button-primary" type="button" onClick={startTestCheckout} disabled={testCheckoutStarting}>{testCheckoutStarting ? "Opening test…" : "Try test card payment"} <CreditCard size={17} /></button></div>{testCheckoutError && <p className="form-error" role="alert">{testCheckoutError}</p>}<label className="checkout-consent"><input required type="checkbox" name="consent" /> I understand this card test does not create a paid order. Sending the form below creates a no-payment order request only.</label></div></div>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button className="button-primary submit-order" disabled={submitted} type="submit">{submitted ? "Saving request…" : "Send order request"} <ArrowRight size={17} /></button>
      </form>
      <aside className="checkout-summary"><p className="eyebrow">Order review</p>{items.map((item) => <div className="checkout-item" key={item.id}><img src={item.image} alt={item.image === SUPPLIER_IMAGE_PLACEHOLDER ? `Supplier image pending for ${item.name}` : `Product image for ${item.name}`} loading="lazy" decoding="async" /><div><b>{item.name}</b><span>{item.quantity} × {item.pack}</span></div><strong>Added</strong></div>)}<div className="checkout-total"><span>Customer price</span><b>Pricing pending</b></div><div className="checkout-total estimated"><span>Payment</span><strong>Test checkout available</strong></div><p>Test card checkout is for demonstration only. Delivery is reviewed before fulfilment.</p></aside>
    </section>
  </StoreLayout>;
}
