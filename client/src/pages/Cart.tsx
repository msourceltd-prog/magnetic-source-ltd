/**
 * Trade Ledger, Recut: transparent local basket with operational quantities,
 * subtotal, and a clear hand-off to a no-payment demonstration checkout.
 */
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, SUPPLIER_IMAGE_PLACEHOLDER } from "@/data/catalog";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  return <StoreLayout><section className="page-banner cart-banner"><div className="trade-shell"><div><p className="eyebrow">Trade basket</p><h1>Review your source.</h1><p>Quantities and totals are shown locally. Continue to a no-payment checkout experience when ready.</p></div></div></section>
    <section className="trade-shell cart-layout section-space">
      {items.length ? <><div className="cart-lines">{items.map((item) => <article className="cart-line" key={item.id}><Link href={`/product/${item.slug}`} className="cart-line-image"><img src={item.image} alt={item.image === SUPPLIER_IMAGE_PLACEHOLDER ? `Supplier image pending for ${item.name}` : `Product image for ${item.name}`} loading="lazy" decoding="async" /></Link><div className="cart-line-copy"><span className="eyebrow">{item.sku}</span><Link href={`/product/${item.slug}`}><h2>{item.name}</h2></Link><p>{item.pack} · {item.availability}</p></div><div className="cart-line-quantity"><span className="line-label">Quantity</span><div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div></div><div className="cart-line-price"><span className="line-label">Line total</span><b>{formatGBP(item.price * item.quantity)}</b><small>{formatGBP(item.price)} each</small></div><button className="remove-line" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={17} /></button></article>)}</div>
        <aside className="cart-summary"><p className="eyebrow">Basket total</p><div><span>Items subtotal</span><b>{formatGBP(subtotal)}</b></div><div><span>Delivery estimate</span><b>At checkout</b></div><div className="cart-total"><span>Estimated total</span><strong>{formatGBP(subtotal)}</strong></div><p className="cart-demo-note">This is an approval demo. No payment is collected and no live order is placed.</p><Link href="/checkout" className="button-primary">Continue to checkout <ArrowRight size={17} /></Link><Link href="/shop" className="back-to-shop">Continue shopping</Link></aside></> : <div className="cart-empty"><ShoppingBag size={31} /><p className="eyebrow">Your basket is clear</p><h2>Start with something useful.</h2><p>Browse the edited catalogue, then return here to adjust quantities before a demo checkout.</p><Link href="/shop" className="button-primary">Browse the edit <ArrowRight size={17} /></Link></div>}
    </section>
  </StoreLayout>;
}
