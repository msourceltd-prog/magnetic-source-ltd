/**
 * Trade Ledger, Recut: an original product proof page with a matching image,
 * factual description, SKU, pack and related lines; quote-required records
 * hide their internal compatibility value from every public price surface.
 */
import { useState } from "react";
import { ArrowLeft, ArrowRight, Minus, PackageCheck, Plus, ShoppingBag, Truck } from "lucide-react";
import { useRoute } from "wouter";
import ProductCard from "@/components/ProductCard";
import { MAGNETIC_SOURCE_URL } from "@/components/SEOHead";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, isPriceHidden, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const { products } = useCatalog();
  const product = products.find((candidate) => candidate.slug === (params?.slug || ""));
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  if (!product) return <StoreLayout><section className="product-not-found trade-shell"><h1>That line is no longer in this edit.</h1><a href="/shop" className="button-primary">Return to catalogue <ArrowRight size={17} /></a></section></StoreLayout>;
  const related = products.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 4);
  const priceHidden = isPriceHidden(product);
  const base = MAGNETIC_SOURCE_URL;
  const productSchema = { "@context":"https://schema.org", "@graph":[{ "@type":"Product", name:product.name, description:product.description, ...(product.image !== SUPPLIER_IMAGE_PLACEHOLDER ? { image:product.image } : {}), ...(!priceHidden ? { offers:{ "@type":"Offer", priceCurrency:"GBP", price:product.price.toFixed(2), priceSpecification:{ "@type":"UnitPriceSpecification", priceCurrency:"GBP", price:product.price.toFixed(2), valueAddedTaxIncluded:false }, url:`${base}/product/${product.slug}` } } : {}) },{ "@type":"BreadcrumbList", itemListElement:[{ "@type":"ListItem", position:1, name:"Home", item:base },{ "@type":"ListItem", position:2, name:"Shop", item:`${base}/shop` },{ "@type":"ListItem", position:3, name:product.name, item:`${base}/product/${product.slug}` }] }] };
  return <StoreLayout seo={{ title: `Wholesale ${product.name} | Magnetic Source`, description: `Magnetic Source wholesale product: ${product.name}. ${product.description} Pack format: ${product.pack}; product reference: ${product.sku}.`, path: `/product/${product.slug}`, image: product.image, schema: productSchema }}>
    <div className="trade-shell product-breadcrumb"><a href="/shop"><ArrowLeft size={14} /> Shop the edit</a><span>/</span><span>{product.name}</span></div>
    <section className="trade-shell product-detail">
      <div className="product-detail-image">{product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <><div className="product-detail-placeholder" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="detail-placeholder-mark" aria-hidden="true" /></div><span className="detail-image-pending">Image pending</span></> : <img src={product.image} alt={`Product image of ${product.name}, ${product.pack}, SKU ${product.sku}`} fetchPriority="high" decoding="async" />}<span className="image-corner large" /></div>
      <div className="product-detail-copy">
        <div className="detail-kicker"><span>{product.tags[0] || "Catalogue line"}</span></div>
        <p className="eyebrow">{product.category.replaceAll("-", " ")}</p>
        <h1>{product.name}</h1>
        <p className="detail-price">{priceHidden ? "Price on request" : formatGBP(product.price)} <small>{priceHidden ? `Trade quote before order · ${product.pack}` : `${product.priceBasis} · ${product.pack}`}</small></p>
        <p className="detail-description">{product.description}</p>
        <dl className="detail-specs"><div><dt>Category</dt><dd>{product.category.replaceAll("-", " ")}</dd></div><div><dt>Product reference</dt><dd>{product.sku}</dd></div><div><dt>Pack format</dt><dd>{product.pack}</dd></div><div><dt>Price</dt><dd>{priceHidden ? "Price on request" : product.priceBasis}</dd></div><div><dt>Ordering</dt><dd>{priceHidden ? "Add required pack quantity to enquiry" : "Add the required pack quantity to basket"}</dd></div><div><dt>Delivery</dt><dd>Trade delivery details confirmed after enquiry</dd></div></dl>
        <div className="detail-add-row"><div className="quantity-control"><button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div><button type="button" className="detail-add" onClick={() => addItem(product, quantity)}><ShoppingBag size={18} /> Add {quantity > 1 ? `${quantity} packs to enquiry` : priceHidden ? "to enquiry" : "to basket"}</button></div>
        <div className="detail-notes"><span><PackageCheck size={18} /> Pack format and internal reference shown before enquiry.</span><span><Truck size={18} /> Trade enquiries are submitted without payment collection.</span></div>
      </div>
    </section>
    <section className="related-lines section-space"><div className="trade-shell section-heading"><div><p className="eyebrow">Keep browsing</p><h2>Related working lines.</h2></div><a href={`/shop?category=${product.category}`} className="text-link">All in this department <ArrowRight size={16} /></a></div><div className="trade-shell product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
  </StoreLayout>;
}
