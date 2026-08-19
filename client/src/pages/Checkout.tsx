/**
 * Trade Ledger, Recut: a no-payment trade enquiry flow that stores a clearly
 * disclosed demo order only after valid details and consent are provided.
 */
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, SUPPLIER_IMAGE_PLACEHOLDER } from "@/data/catalog";
import { useCart } from "@/contexts/CartContext";
import { saveDemoOrder } from "@/lib/demoOrders";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    const fields = new FormData(event.currentTarget);
    if (String(fields.get("website") || "")) return;
    setSubmitted(true);
    setSubmitError("");
    const reference = `MS-DEMO-${String(Math.floor(100000 + Math.random() * 899999))}`;
    try {
      const result = await saveDemoOrder({ reference, firstName: String(fields.get("firstName") || ""), lastName: String(fields.get("lastName") || ""), email: String(fields.get("email") || ""), company: String(fields.get("company") || ""), address1: String(fields.get("address1") || ""), address2: String(fields.get("address2") || ""), city: String(fields.get("city") || ""), postcode: String(fields.get("postcode") || ""), subtotal, items });
      if (!result.persisted) { setSubmitError("We could not save your enquiry. Please try again later or contact the trade desk."); setSubmitted(false); return; }
      clearCart();
      navigate(`/order-confirmation?ref=${reference}&stored=database`);
    } catch { setSubmitError("We could not save your enquiry. Please try again later or contact the trade desk."); setSubmitted(false); }
  };
  if (!items.length && !submitted) return <StoreLayout><section className="cart-empty checkout-empty"><p className="eyebrow">No items to review</p><h1>Your basket is clear.</h1><p>Add a catalogue line before opening the trade enquiry checkout.</p><Link href="/shop" className="button-primary">Browse the edit <ArrowRight size={17} /></Link></section></StoreLayout>;
  return <StoreLayout><section className="checkout-header"><div className="trade-shell"><div><p className="eyebrow">Trade enquiry checkout</p><h1>Confirm the practical details.</h1></div><p><LockKeyhole size={16} /> No payment fields or live payment collection.</p></div></section><section className="trade-shell checkout-layout section-space"><form className="checkout-form" onSubmit={submit}><input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" /><div className="checkout-step"><div className="checkout-step-number">01</div><div><h2>Contact details</h2><p>Your details are stored with this no-payment trade enquiry so the trade desk can review it. See the <Link href="/privacy">privacy notice</Link>.</p><div className="form-grid"><label>First name<input required maxLength={100} name="firstName" autoComplete="given-name" /></label><label>Last name<input required maxLength={100} name="lastName" autoComplete="family-name" /></label><label className="span-2">Email address<input required maxLength={254} type="email" name="email" autoComplete="email" /></label><label className="span-2">Company (optional)<input maxLength={120} name="company" autoComplete="organization" /></label></div></div></div><div className="checkout-step"><div className="checkout-step-number">02</div><div><h2>Delivery details</h2><p>Addresses help the trade desk understand delivery requirements. Delivery cost and timing are not calculated on this website.</p><div className="form-grid"><label className="span-2">Address line 1<input required maxLength={160} name="address1" autoComplete="address-line1" /></label><label className="span-2">Address line 2 (optional)<input maxLength={160} name="address2" autoComplete="address-line2" /></label><label>Town or city<input required maxLength={100} name="city" autoComplete="address-level2" /></label><label>Postcode<input required maxLength={16} name="postcode" autoComplete="postal-code" /></label></div><div className="delivery-choice"><Truck size={19} /><div><b>UK delivery enquiry</b><span>Delivery cost and timing are confirmed by the trade desk.</span></div><strong>To confirm</strong></div></div></div><div className="checkout-step"><div className="checkout-step-number">03</div><div><h2>Payment</h2><p>Payment collection is not enabled. Sending this form creates a no-payment trade enquiry only.</p><div className="payment-disabled"><CheckCircle2 size={20} /><span>No payment method is requested.</span></div><label className="checkout-consent"><input required type="checkbox" name="consent" /> I understand this is a no-payment trade enquiry and I have read the <Link href="/privacy">privacy notice</Link>.</label></div></div>{submitError && <p className="form-error" role="alert">{submitError}</p>}<button className="button-primary submit-order" disabled={submitted} type="submit">{submitted ? "Saving enquiry…" : "Send trade enquiry"} <ArrowRight size={17} /></button></form><aside className="checkout-summary"><p className="eyebrow">Order review</p>{items.map((item) => <div className="checkout-item" key={item.id}><img src={item.image} alt={item.image === SUPPLIER_IMAGE_PLACEHOLDER ? `Supplier image pending for ${item.name}` : `Product image for ${item.name}`} loading="lazy" decoding="async" /><div><b>{item.name}</b><span>{item.quantity} × {formatGBP(item.price)}</span></div><strong>{formatGBP(item.price * item.quantity)}</strong></div>)}<div className="checkout-total"><span>Items subtotal</span><b>{formatGBP(subtotal)}</b></div><div className="checkout-total estimated"><span>Estimated total</span><strong>{formatGBP(subtotal)}</strong></div><p>All prices are shown in GBP (£). Payment and delivery remain unprocessed.</p></aside></section></StoreLayout>;
}
