/**
 * Trade Ledger, Recut: a product proof page—practical imagery, SKU, pack,
 * availability, quantity and related lines without reviews or false urgency.
 */
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, PackageCheck, Plus, ShoppingBag, Truck } from "lucide-react";
import { Link, useRoute } from "wouter";
import ProductCard from "@/components/ProductCard";
import SEOHead from "@/components/SEOHead";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, SUPPLIER_IMAGE_PLACEHOLDER } from "@/data/catalog";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const { products } = useCatalog();
  const product = products.find((candidate) => candidate.slug === (params?.slug || ""));
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  if (!product) return <StoreLayout><section className="product-not-found trade-shell"><h1>That line is no longer in this edit.</h1><Link href="/shop" className="button-primary">Return to catalogue <ArrowRight size={17} /></Link></section></StoreLayout>;
  const related = products.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 4);
  const base = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
  const productSchema = { "@context":"https://schema.org", "@graph":[{ "@type":"Product", name:product.name, description:product.description, sku:product.sku, image:product.image, offers:{ "@type":"Offer", priceCurrency:"GBP", price:product.price.toFixed(2), availability:product.availability === "In stock" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability", url:`${base}/product/${product.slug}` } },{ "@type":"BreadcrumbList", itemListElement:[{ "@type":"ListItem", position:1, name:"Home", item:base },{ "@type":"ListItem", position:2, name:"Shop", item:`${base}/shop` },{ "@type":"ListItem", position:3, name:product.name, item:`${base}/product/${product.slug}` }] }] };
  return <StoreLayout><SEOHead title={`${product.name} | Magnetic Source Ltd`} description={`${product.description} ${product.pack}, SKU ${product.sku}, priced in GBP.`} path={`/product/${product.slug}`} image={product.image} schema={productSchema} />
    <div className="trade-shell product-breadcrumb"><Link href="/shop"><ArrowLeft size={14} /> Shop the edit</Link><span>/</span><span>{product.name}</span></div>
    <section className="trade-shell product-detail">
      <div className="product-detail-image"><img src={product.image} alt={product.image === SUPPLIER_IMAGE_PLACEHOLDER ? `Supplier image pending for ${product.name}` : `Product image for ${product.name}`} fetchPriority="high" decoding="async" /><span className="image-corner large" /></div>
      <div className="product-detail-copy">
        <div className="detail-kicker"><span>{product.tags[0]}</span><span className={product.availability === "In stock" ? "stock-good" : "stock-limited"}>{product.availability}</span></div>
        <p className="eyebrow">{product.category.replaceAll("-", " ")}</p>
        <h1>{product.name}</h1>
        <p className="detail-price">{formatGBP(product.price)} <small>per unit · {product.pack}</small></p>
        <p className="detail-description">{product.description} Each product includes the key information a retail buyer needs before adding it to a basket.</p>
        <dl className="detail-specs"><div><dt>SKU</dt><dd>{product.sku}</dd></div><div><dt>Availability</dt><dd><Check size={14} /> {product.availability}</dd></div><div><dt>Pack format</dt><dd>{product.pack}</dd></div><div><dt>Dispatch</dt><dd>Trade delivery details confirmed after enquiry</dd></div></dl>
        <div className="detail-add-row"><div className="quantity-control"><button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div><button type="button" className="detail-add" onClick={() => addItem(product, quantity)}><ShoppingBag size={18} /> Add {quantity > 1 ? `${quantity} units` : "to basket"}</button></div>
        <div className="detail-notes"><span><PackageCheck size={18} /> Pack and SKU information shown before checkout.</span><span><Truck size={18} /> Trade enquiries are submitted without payment collection.</span></div>
      </div>
    </section>
    <section className="related-lines section-space"><div className="trade-shell section-heading"><div><p className="eyebrow">Keep browsing</p><h2>Related working lines.</h2></div><Link href={`/shop?category=${product.category}`} className="text-link">All in this department <ArrowRight size={16} /></Link></div><div className="trade-shell product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
  </StoreLayout>;
}
