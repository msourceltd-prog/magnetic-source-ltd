/**
 * Trade Ledger, Recut: transparent local basket with operational quantities,
 * account-gated pricing and a clear hand-off to a no-payment order review.
 */
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, hasCustomerPrice, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { signedIn, openLogin } = useCustomerAuth();
  const allPricesPublished = items.length > 0 && items.every(hasCustomerPrice);
  return <StoreLayout><section className="page-banner cart-banner"><div className="trade-shell"><div><p className="eyebrow">Your basket</p><h1>Review your selected lines.</h1><p>{signedIn ? "Adjust pack quantities while the current customer price list is being prepared." : "Sign in to unlock customer price access and continue with your selected lines."}</p></div></div></section>
    <section className="trade-shell cart-layout section-space">
      {items.length ? <><div className="cart-lines">{items.map((item) => { const publishedPrice = hasCustomerPrice(item); return <article className="cart-line" key={item.id}><Link href={`/product/${item.slug}`} className="cart-line-image"><img src={item.image} alt={item.image === SUPPLIER_IMAGE_PLACEHOLDER ? `Supplier image pending for ${item.name}` : `Product image for ${item.name}`} loading="lazy" decoding="async" /></Link><div className="cart-line-copy"><span className="eyebrow">Reference {item.sku}</span><Link href={`/product/${item.slug}`}><h2>{item.name}</h2></Link><p>{item.pack}</p></div><div className="cart-line-quantity"><span className="line-label">Quantity</span><div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div></div><div className="cart-line-price"><span className="line-label">Customer price</span><b>{signedIn ? publishedPrice ? formatGBP(item.price * item.quantity) : "Pricing pending" : "Login required"}</b><small>{signedIn ? publishedPrice ? `${formatGBP(item.price)} per pack · ex VAT` : "Price list will be published shortly" : "Login to see prices"}</small></div><button className="remove-line" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={17} /></button></article>; })}</div>
        <aside className="cart-summary"><p className="eyebrow">Order review</p><div><span>Product quantities</span><b>{items.reduce((count, item) => count + item.quantity, 0)} packs</b></div><div><span>Delivery</span><b>Reviewed at order stage</b></div><div className="cart-total"><span>Customer pricing</span><strong>{signedIn ? allPricesPublished ? `${formatGBP(subtotal)} ex VAT` : "Pricing pending" : "Login required"}</strong></div><p className="cart-demo-note">{signedIn ? allPricesPublished ? "Customer prices are shown before order review. No payment is collected online." : "The current customer price list is being prepared. No payment is collected online." : "Sign in to unlock customer price access and continue to order review."}</p>{signedIn ? <Link href="/checkout" className="button-primary">Continue to order review <ArrowRight size={17} /></Link> : <button type="button" className="button-primary" onClick={openLogin}>Login to see prices <ArrowRight size={17} /></button>}<Link href="/shop" className="back-to-shop">Continue shopping</Link></aside></> : <div className="cart-empty"><ShoppingBag size={31} /><p className="eyebrow">Your basket is clear</p><h2>Start with something useful.</h2><p>Browse the catalogue, then return here to review pack quantities before submitting an order request.</p><Link href="/shop" className="button-primary">Browse the catalogue <ArrowRight size={17} /></Link></div>}
    </section>
  </StoreLayout>;
}
