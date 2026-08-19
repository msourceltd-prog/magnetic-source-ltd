/**
 * Trade Ledger, Recut: realistic contact, delivery, and order-review steps
 * that deliberately collect no payment details and submit nothing externally.
 */
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP } from "@/data/catalog";
import { useCart } from "@/contexts/CartContext";
import { saveDemoOrder } from "@/lib/demoOrders";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    setSubmitted(true);
    const reference = `MS-DEMO-${String(Math.floor(100000 + Math.random() * 899999))}`;
    const fields = new FormData(event.currentTarget);
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
    clearCart();
    navigate(`/order-confirmation?ref=${reference}&stored=${result.persisted ? "database" : "local"}`);
  };
  if (!items.length && !submitted) return <StoreLayout><section className="cart-empty checkout-empty"><p className="eyebrow">No items to review</p><h1>Your basket is clear.</h1><p>Add a sample catalogue line before opening the demo checkout.</p><Link href="/shop" className="button-primary">Browse the edit <ArrowRight size={17} /></Link></section></StoreLayout>;
  return <StoreLayout><section className="checkout-header"><div className="trade-shell"><div><p className="eyebrow">Demo checkout</p><h1>Confirm the practical details.</h1></div><p><LockKeyhole size={16} /> No payment fields or live order submission.</p></div></section>
    <section className="trade-shell checkout-layout section-space"><form className="checkout-form" onSubmit={submit}><div className="checkout-step"><div className="checkout-step-number">01</div><div><h2>Contact details</h2><p>For a realistic approval-flow preview only. These details stay in this browser and are not submitted.</p><div className="form-grid"><label>First name<input required name="firstName" autoComplete="given-name" /></label><label>Last name<input required name="lastName" autoComplete="family-name" /></label><label className="span-2">Email address<input required type="email" name="email" autoComplete="email" /></label><label className="span-2">Company (optional)<input name="company" autoComplete="organization" /></label></div></div></div>
      <div className="checkout-step"><div className="checkout-step-number">02</div><div><h2>Delivery details</h2><p>Addresses are used only to demonstrate field completion and order review.</p><div className="form-grid"><label className="span-2">Address line 1<input required name="address1" autoComplete="address-line1" /></label><label className="span-2">Address line 2 (optional)<input name="address2" autoComplete="address-line2" /></label><label>Town or city<input required name="city" autoComplete="address-level2" /></label><label>Postcode<input required name="postcode" autoComplete="postal-code" /></label></div><div className="delivery-choice"><Truck size={19} /><div><b>Standard UK delivery estimate</b><span>Delivery pricing is intentionally shown only as an estimate in this demo.</span></div><strong>To confirm</strong></div></div></div>
      <div className="checkout-step"><div className="checkout-step-number">03</div><div><h2>Payment</h2><p>Payment collection is not enabled. The confirmation action creates a visible demo order reference only.</p><div className="payment-disabled"><CheckCircle2 size={20} /><span>No payment method required for this approval demo.</span></div></div></div>
      <button className="button-primary submit-order" disabled={submitted} type="submit">{submitted ? "Creating confirmation…" : "Place demo order"} <ArrowRight size={17} /></button></form>
      <aside className="checkout-summary"><p className="eyebrow">Order review</p>{items.map((item) => <div className="checkout-item" key={item.id}><img src={item.image} alt="" /><div><b>{item.name}</b><span>{item.quantity} × {formatGBP(item.price)}</span></div><strong>{formatGBP(item.price * item.quantity)}</strong></div>)}<div className="checkout-total"><span>Items subtotal</span><b>{formatGBP(subtotal)}</b></div><div className="checkout-total estimated"><span>Estimated total</span><strong>{formatGBP(subtotal)}</strong></div><p>All prices in GBP (£). Delivery and payment remain unprocessed.</p></aside>
    </section>
  </StoreLayout>;
}
