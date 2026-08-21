/**
 * Trade Ledger, Recut: an original premium trade card that prioritizes the
 * exact product image, factual description, SKU and pack; quote-required lines
 * never expose an internal zero value as a public price.
 */
import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { type Product, formatGBP, isPriceHidden, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";

const portraitProductFrames = new Set([
  "johnson-s-baby-shampoo-100ml-607t",
  "cottontails-for-mums-disposable-breast-pads-40-s-48758p",
  "tidyz-degradable-nappy-bags-pocket-pack-4-x-25-s-55844e",
  "johnson-s-baby-shampoo-300ml-61614r",
  "johnson-s-baby-powder-natural-200g-64356x",
  "capitol-safety-soothers-pink-2-pack-67227z",
  "good-boy-duck-stick-15g-72623h",
  "good-boy-chicken-stick-15g-72621b",
  "good-boy-beef-stick-15g-72622e",
  "snoopy-gummies-bag-100g-73111i",
  "hot-wheels-gummies-bag-100g-73110f",
  "barbie-gummies-bag-100g-73109b",
  "christmas-gift-bag-bottle-most-wonderful-22776f",
  "bic-matic-fun-pencils-3-s-65167d",
  "sharpie-fluo-xl-highlighters-assorted-4-pack-65243l",
]);

const compactProductFrames = new Set([
  "good-boy-cheese-please-long-lasting-tasty-chew-60g-72619u",
  "good-boy-soft-fluffy-dog-toy-small-72382w",
  "peppa-pig-surprise-cones-25g-67242u",
  "paw-patrol-surprise-cones-25g-67241r",
  "animigos-funky-friends-tulip-72684o",
  "animigos-funky-friends-succulent-72677s",
  "animigos-funky-friends-daisy-72685r",
  "animigos-funky-friends-bubble-tea-72675m",
  "animigos-funky-friends-taco-72680c",
  "9-round-helium-quality-balloons-20-s-39572j",
  "cedar-sage-address-book-39603h",
  "gift-bag-bottle-highland-cow-39601b",
  "spots-table-cover-120cm-x-180cm-39500u",
  "liberty-garden-mini-jotter-39634z",
  "palmolive-shower-gel-elixir-rose-250ml-73140u",
  "palmolive-shower-gel-elixir-orchid-250ml-73141x",
  "denman-d81s-small-style-and-shine-brush-original-72782m",
  "grow-with-peppa-baby-head-to-toe-wash-350ml-72708q",
  "grow-with-peppa-baby-bath-foam-350ml-72711a",
  "christmas-gift-bag-small-whimsical-woodland-22780s",
  "christmas-gift-bag-small-most-wonderful-22772t",
  "christmas-gift-bag-medium-nordic-noel-22777i",
  "christmas-gift-bag-medium-whimsical-woodland-22781v",
  "pokemon-10-colour-pen-39170n",
  "pokemon-pen-set-3-s-39169j",
  "child-face-mask-princess-54049h",
  "metanium-everyday-barrier-ointment-40g-67204g",
  "huggies-pure-baby-wipes-plastic-free-48-s-70408s",
  "johnson-s-baby-powder-natural-100g-64355u",
  "nuk-first-choice-day-night-soother-2-pack-6-18m-girls-72593m",
  "nuk-first-choice-day-night-soother-2-pack-0-6m-girls-72591g",
]);

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const priceHidden = isPriceHidden(product);
  const productFrameClass = portraitProductFrames.has(product.slug)
    ? "product-image-wrap-featured-portrait"
    : compactProductFrames.has(product.slug)
      ? "product-image-wrap-featured-compact"
      : "";
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
  }, [product.image]);

  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
    <a href={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
      {product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <div className="product-image-wrap product-image-pending" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="pending-image-mark" aria-hidden="true" /><span className="pending-image-copy">Image pending</span><span className="image-corner" /></div> : <div className={`product-image-wrap ${productFrameClass} ${imageReady ? "image-ready" : "image-loading"}`} aria-busy={!imageReady}><img src={product.image} alt={`Product image of ${product.name}, ${product.pack}, SKU ${product.sku}`} loading={compact ? "eager" : "lazy"} fetchPriority={compact ? "high" : "low"} decoding="async" onLoad={() => setImageReady(true)} onError={() => setImageReady(true)} /><span className="product-image-label">View product</span><span className="image-corner" /></div>}
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
