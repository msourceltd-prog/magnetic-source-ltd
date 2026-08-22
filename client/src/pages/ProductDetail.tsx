/**
 * Trade Ledger, Recut: an original product proof page with a matching image,
 * factual description, SKU, pack and related lines; direct URLs wait for the
 * live catalogue before deciding whether a product is unavailable.
 */
import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Minus, PackageCheck, Plus, ShoppingBag, Truck } from "lucide-react";
import { Link, useRoute } from "wouter";
import ProductCard from "@/components/ProductCard";
import { MAGNETIC_SOURCE_URL } from "@/components/SEOHead";
import StoreLayout from "@/components/StoreLayout";
import { formatGBP, hasCustomerPrice, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const { products, loading } = useCatalog();
  const product = products.find((candidate) => candidate.slug === (params?.slug || ""));
  const { addItem } = useCart();
  const { signedIn, openLogin } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  if (loading) return <StoreLayout><section className="product-not-found trade-shell" aria-live="polite"><p className="eyebrow">Loading catalogue line</p><h1>Loading product details.</h1></section></StoreLayout>;
  if (!product) return <StoreLayout><section className="product-not-found trade-shell"><h1>That line is no longer in this edit.</h1><Link href="/shop" className="button-primary">Return to catalogue <ArrowRight size={17} /></Link></section></StoreLayout>;
  const related = products.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 4);
  const base = MAGNETIC_SOURCE_URL;
  const realDescription = product.description?.trim() || "";
  const publishedPrice = hasCustomerPrice(product);
  const collectionLabel = product.category === "clearance" ? product.tags[0] || "Clearance" : product.category.replaceAll("-", " ");
  const collectionHref = product.category === "clearance" ? product.tags[0] === "New arrival" ? "/shop?category=new-arrivals" : "/shop?category=best-sellers" : `/shop?category=${product.category}`;
  const productSchema = { "@context":"https://schema.org", "@graph":[{ "@type":"Product", name:product.name, ...(realDescription ? { description:realDescription } : {}), ...(product.image !== SUPPLIER_IMAGE_PLACEHOLDER ? { image:product.image } : {}) },{ "@type":"BreadcrumbList", itemListElement:[{ "@type":"ListItem", position:1, name:"Home", item:base },{ "@type":"ListItem", position:2, name:"Shop", item:`${base}/shop` },{ "@type":"ListItem", position:3, name:product.name, item:`${base}/product/${product.slug}` }] }] };
  return <StoreLayout seo={{ title: `Wholesale ${product.name} | Magnetic Source`, description: `Magnetic Source wholesale product: ${product.name}.${realDescription ? ` ${realDescription}` : ""} Pack format: ${product.pack}; product reference: ${product.sku}.`, path: `/product/${product.slug}`, image: product.image, schema: productSchema }}>
    <div className="trade-shell product-breadcrumb"><Link href="/shop"><ArrowLeft size={14} /> Shop the edit</Link><span>/</span><span>{product.name}</span></div>
    <section className="trade-shell product-detail">
      <div className="product-detail-image">{product.image === SUPPLIER_IMAGE_PLACEHOLDER ? <><div className="product-detail-placeholder" role="img" aria-label={`Supplier image pending for ${product.name}`}><span className="detail-placeholder-mark" aria-hidden="true" /></div><span className="detail-image-pending">Image pending</span></> : <img src={product.image} alt={`Product image of ${product.name}, ${product.pack}, SKU ${product.sku}`} fetchPriority="high" decoding="async" />}<span className="image-corner large" /></div>
      <div className="product-detail-copy">
        <div className="detail-kicker"><span>{product.tags[0] || "Catalogue line"}</span></div>
        <p className="eyebrow">{collectionLabel}</p>
        <h1>{product.name}</h1>
        <div className="detail-price">{signedIn ? publishedPrice ? <><strong>{formatGBP(product.price)}</strong><small>{product.priceBasis} · {product.pack}</small></> : <><strong>Pricing update pending</strong><small>Your customer price will appear here once the latest price list is published · {product.pack}</small></> : <button type="button" className="price-access-button detail-price-access" onClick={openLogin}><LockKeyhole size={17} /> Login to see price</button>}</div>
        {realDescription ? <p className="detail-description">{realDescription}</p> : null}
        <dl className="detail-specs"><div><dt>Collection</dt><dd>{collectionLabel}</dd></div><div><dt>Product reference</dt><dd>{product.sku}</dd></div><div><dt>Pack format</dt><dd>{product.pack}</dd></div><div><dt>Price access</dt><dd>{signedIn ? publishedPrice ? product.priceBasis : "Pricing update pending" : "Login required"}</dd></div><div><dt>Ordering</dt><dd>{signedIn ? "Add the required pack quantity to basket" : "Sign in to add items to basket"}</dd></div><div><dt>Delivery</dt><dd>Delivery options are reviewed at order stage</dd></div></dl>
        <div className="detail-add-row"><div className="quantity-control"><button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div><button type="button" className="detail-add" onClick={() => { if (!signedIn) { openLogin(); return; } addItem(product, quantity); }}><ShoppingBag size={18} /> {signedIn ? `Add ${quantity > 1 ? `${quantity} packs` : "to basket"}` : "Login to add"}</button></div>
        <div className="detail-notes"><span><PackageCheck size={18} /> Pack format and product reference are shown on every line.</span><span><Truck size={18} /> Delivery options are reviewed during order processing.</span></div>
      </div>
    </section>
    <section className="related-lines section-space"><div className="trade-shell section-heading"><div><p className="eyebrow">Keep browsing</p><h2>Related working lines.</h2></div><Link href={collectionHref} className="text-link">All in this collection <ArrowRight size={16} /></Link></div><div className="trade-shell product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
  </StoreLayout>;
}
