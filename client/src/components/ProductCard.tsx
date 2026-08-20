/**
 * Trade Ledger, Recut: an original premium trade card that prioritizes the
 * exact product image, factual description, SKU and pack; quote-required lines
 * never expose an internal zero value as a public price.
 */
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { type Product, formatGBP, isPriceHidden, SUPPLIER_IMAGE_PLACEHOLDER } from "@/data/catalog";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const priceHidden = isPriceHidden(product);
  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
    <Link href={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
      {product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <div className="product-image-wrap product-image-pending" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="pending-image-mark" aria-hidden="true" /><span className="pending-image-copy">Image pending</span><span className="image-corner" /></div> : <div className="product-image-wrap"><img src={product.image} alt={product.name} loading="lazy" decoding="async" /><span className="product-image-label">View product</span><span className="image-corner" /></div>}
    </Link>
    <div className="product-card-body">
      <div className="product-card-topline"><span>{product.tags[0] || "Catalogue line"}</span></div>
      <Link href={`/product/${product.slug}`} className="product-name-link"><h3>{product.name}</h3><ArrowUpRight size={16} /></Link>
      <p className="product-card-description">{product.description}</p>
      <div className="product-ledger"><span>{product.pack}</span><span>{product.sku}</span></div>
      <div className="product-card-bottom">
        <div><strong>{priceHidden ? "Price on request" : formatGBP(product.price)}</strong><small>{priceHidden ? "Trade quote before order" : product.priceBasis}</small></div>
        <button type="button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to an enquiry`}><ShoppingBag size={18} /><span>{priceHidden ? "Enquire" : "Add"}</span></button>
      </div>
    </div>
  </article>;
}
