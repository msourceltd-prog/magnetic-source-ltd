/**
 * Trade Ledger, Recut: proof-led product card with ledger metadata and
 * decisive one-click basket action—no ratings or fabricated social proof.
 */
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { type Product, formatGBP } from "@/data/catalog";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
    <Link href={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
      <div className="product-image-wrap"><img src={product.image} alt={`Product display for ${product.name}`} loading="lazy" decoding="async" /><span className="product-image-label">Product evidence</span><span className="image-corner" /></div>
    </Link>
    <div className="product-card-body">
      <div className="product-card-topline"><span>{product.tags[0]}</span><span className={product.availability === "In stock" ? "stock-good" : "stock-limited"}>{product.availability}</span></div>
      <Link href={`/product/${product.slug}`} className="product-name-link"><h3>{product.name}</h3><ArrowUpRight size={16} /></Link>
      <div className="product-ledger"><span>{product.pack}</span><span>{product.sku}</span></div>
      <div className="product-card-bottom">
        <div><strong>{formatGBP(product.price)}</strong>{product.previousPrice && <del>{formatGBP(product.previousPrice)}</del>}<small>per unit</small></div>
        <button type="button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to cart`}><ShoppingBag size={18} /><span>Add</span></button>
      </div>
    </div>
  </article>;
}
