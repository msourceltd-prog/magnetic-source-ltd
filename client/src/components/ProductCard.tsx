/**
 * Trade Ledger, Recut: proof-led product card with ledger metadata and
 * decisive one-click basket action—no ratings or fabricated social proof.
 */
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { type Product, formatGBP, SUPPLIER_IMAGE_PLACEHOLDER } from "@/data/catalog";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
    <Link href={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
      {product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <div className="product-image-wrap product-image-pending" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="pending-image-mark" aria-hidden="true" /><span className="pending-image-copy">Image pending</span><span className="image-corner" /></div> : <div className="product-image-wrap"><img src={product.image} alt={`Product display for ${product.name}`} loading="lazy" decoding="async" /><span className="product-image-label">Product evidence</span><span className="image-corner" /></div>}
    </Link>
    <div className="product-card-body">
      <div className="product-card-topline"><span>{product.tags[0]}</span><span className="stock-limited">{product.availability}</span></div>
      <Link href={`/product/${product.slug}`} className="product-name-link"><h3>{product.name}</h3><ArrowUpRight size={16} /></Link>
      <div className="product-ledger"><span>{product.pack}</span><span>{product.sku}</span></div>
      <div className="product-card-bottom">
        <div><strong>{formatGBP(product.price)}</strong><small>{product.priceBasis}<br />{product.pack}</small></div>
        <button type="button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to cart`}><ShoppingBag size={18} /><span>Add</span></button>
      </div>
    </div>
  </article>;
}
