/**
 * Trade Ledger, Recut: an original premium trade card that prioritizes the
 * exact product image, factual description, SKU and pack; quote-required lines
 * never expose an internal zero value as a public price.
 */
import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { type Product, formatGBP, isPriceHidden, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";

const featuredBabyKidsFrames = new Set([
  "johnson-s-baby-shampoo-100ml-607t",
  "cottontails-for-mums-disposable-breast-pads-40-s-48758p",
  "tidyz-degradable-nappy-bags-pocket-pack-4-x-25-s-55844e",
  "johnson-s-baby-shampoo-300ml-61614r",
  "johnson-s-baby-powder-natural-200g-64356x",
  "capitol-safety-soothers-pink-2-pack-67227z",
]);

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const priceHidden = isPriceHidden(product);
  const usesFeaturedBabyKidsFrame = product.category === "baby-kids" && featuredBabyKidsFrames.has(product.slug);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
  }, [product.image]);

  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
    <a href={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
      {product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <div className="product-image-wrap product-image-pending" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="pending-image-mark" aria-hidden="true" /><span className="pending-image-copy">Image pending</span><span className="image-corner" /></div> : <div className={`product-image-wrap ${usesFeaturedBabyKidsFrame ? "product-image-wrap-featured-baby" : ""} ${imageReady ? "image-ready" : "image-loading"}`} aria-busy={!imageReady}><img src={product.image} alt={`Product image of ${product.name}, ${product.pack}, SKU ${product.sku}`} loading={compact ? "eager" : "lazy"} fetchPriority={compact ? "high" : "low"} decoding="async" onLoad={() => setImageReady(true)} onError={() => setImageReady(true)} /><span className="product-image-label">View product</span><span className="image-corner" /></div>}
    </a>
    <div className="product-card-body">
      <div className="product-card-topline"><span>{product.tags[0] || "Catalogue line"}</span></div>
      <a href={`/product/${product.slug}`} className="product-name-link"><h3>{product.name}</h3><ArrowUpRight size={16} /></a>
      <p className="product-card-description">{product.description}</p>
      <div className="product-ledger"><span>{product.pack}</span><span>{product.sku}</span></div>
      <div className="product-card-bottom">
        <div><strong>{priceHidden ? "Price on request" : formatGBP(product.price)}</strong><small>{priceHidden ? "Trade quote before order" : product.priceBasis}</small></div>
        <button type="button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to an enquiry`}><ShoppingBag size={18} /><span>{priceHidden ? "Enquire" : "Add"}</span></button>
      </div>
    </div>
  </article>;
}
