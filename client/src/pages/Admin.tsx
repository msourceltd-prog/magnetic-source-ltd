/**
 * Trade Ledger, Recut: Admin keeps category ownership and permanent actions explicit.
 * Description is optional and must contain real copy only; pack format is never repeated.
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ImagePlus, Images, Loader2, LogOut, PackagePlus, Pencil, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import ProductCard from "@/components/ProductCard";
import { type Product, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { defaultHomepageSettings, HOMEPAGE_SETTINGS_CATEGORY_SLUG, normalizeHomepageSettings, parseHomepageSettings, serializeHomepageSettings, type HomepageSettings } from "@/lib/homepageAdmin";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type AdminProduct = { id: number; slug: string; name: string; category: string; price: number; sku: string; availability: string; pack: string; description: string | null; image: string; tags: string[]; featured: boolean };
type AdminCategory = { id: number; name: string; slug: string; summary: string | null };
type AdminOrder = { id: string; order_reference: string; customer_name: string; customer_email: string; subtotal: number; status: string; created_at: string };
type ProductDraft = { name: string; slug: string; category: string; price: string; sku: string; availability: string; pack: string; description: string; image: string; tags: string; featured: boolean };

const blankProduct: ProductDraft = { name: "", slug: "", category: "", price: "0", sku: "", availability: "Availability to confirm", pack: "", description: "", image: "", tags: "Catalogue line, Price hidden", featured: false };
const makeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Admin() {
  if (!supabaseConfigured) return <AdminConnectionRequired />;
  return <AdminDesk />;
}

function AdminConnectionRequired() {
  return <StoreLayout><section className="admin-gate"><div className="admin-gate-card"><ShieldCheck size={42} /><p className="eyebrow">Secure admin area</p><h1>Connect Supabase to unlock the desk.</h1><p>This frontend is ready for Supabase Auth and protected product management, but it cannot create an administrator or write product data until the public project URL and anon key are configured.</p><Link href="/about" className="button-primary">Back to the storefront <ChevronRight size={17} /></Link></div></section></StoreLayout>;
}

function AdminDesk() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  const readRole = async (userId?: string) => {
    if (!userId) { setIsAdmin(false); setRoleReady(true); return; }
    const { data } = await supabase!.from("profiles").select("role").eq("id", userId).maybeSingle();
    setIsAdmin(data?.role === "admin");
    setRoleReady(true);
  };

  useEffect(() => {
    let mounted = true;
    supabase!.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.session));
      setSessionReady(true);
      void readRole(data.session?.user.id);
    });
    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(Boolean(session));
      setRoleReady(false);
      void readRole(session?.user.id);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  if (!sessionReady) return <StoreLayout><section className="admin-loading"><Loader2 size={25} /> Preparing the secure desk…</section></StoreLayout>;
  if (!signedIn) return <AdminLogin error={error} setError={setError} />;
  if (!roleReady) return <StoreLayout><section className="admin-loading"><Loader2 size={25} /> Checking access…</section></StoreLayout>;
  if (!isAdmin) return <StoreLayout><section className="admin-gate"><div className="admin-gate-card"><ShieldCheck size={42} /><p className="eyebrow">Admin access required</p><h1>Your account is not an administrator.</h1><button className="button-primary" type="button" onClick={() => supabase!.auth.signOut()}>Sign out <ChevronRight size={17} /></button></div></section></StoreLayout>;
  return <AdminDashboard onSignOut={() => supabase!.auth.signOut()} />;
}

function AdminLogin({ error, setError }: { error: string; setError: (value: string) => void }) {
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase!.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (authError) setError(authError.message);
    setLoading(false);
  };
  return <StoreLayout><section className="admin-gate"><form className="admin-login-card" onSubmit={submit}><ShieldCheck size={40} /><p className="eyebrow">Magnetic Source admin</p><h1>Sign in to the trade desk.</h1><label>Email address<input required type="email" name="email" autoComplete="email" /></label><label>Password<input required type="password" name="password" autoComplete="current-password" /></label>{error && <p className="admin-error">{error}</p>}<button className="button-primary" disabled={loading} type="submit">{loading ? "Signing in…" : "Secure sign in"} <ChevronRight size={17} /></button></form></section></StoreLayout>;
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<"products" | "categories" | "homepage" | "orders">("products");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(blankProduct);
  const [categoryName, setCategoryName] = useState("");
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(defaultHomepageSettings);
  const counts = useMemo(() => ({ products: products.length, categories: categories.length, orders: orders.length }), [products, categories, orders]);
  const categoryNameFor = (slug: string) => categories.find((category) => category.slug === slug)?.name || slug;
  const previewProduct: Product = useMemo(() => { const price = Math.max(0, Number(productDraft.price) || 0); return { id: -1, slug: productDraft.slug || makeSlug(productDraft.name) || "preview-product", name: productDraft.name || "Product name", category: productDraft.category || "category", price, sku: productDraft.sku || "Reference", availability: "Availability to confirm", pack: productDraft.pack || "Pack size", description: productDraft.description.trim() || null, image: productDraft.image || SUPPLIER_IMAGE_PLACEHOLDER, tags: price > 0 ? [categoryNameFor(productDraft.category) || "Catalogue line"] : [categoryNameFor(productDraft.category) || "Catalogue line", "Price hidden"], featured: false, priceBasis: price > 0 ? "Indicative price · ex VAT" : "Price on request", brand: null }; }, [categories, productDraft]);

  const load = async () => {
    setLoading(true); setError("");
    const [productResult, categoryResult, orderResult] = await Promise.all([
      supabase!.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("created_at", { ascending: false }),
      supabase!.from("categories").select("id,name,slug,summary").order("name"),
      supabase!.from("demo_orders").select("id,order_reference,customer_name,customer_email,subtotal,status,created_at").order("created_at", { ascending: false }),
    ]);
    if (productResult.error || categoryResult.error || orderResult.error) setError([productResult.error, categoryResult.error, orderResult.error].find(Boolean)?.message || "The desk could not load its records.");
    const allCategories = (categoryResult.data || []) as AdminCategory[];
    const settingsRecord = allCategories.find((category) => category.slug === HOMEPAGE_SETTINGS_CATEGORY_SLUG);
    if (settingsRecord) {
      setHomepageSettings(parseHomepageSettings(settingsRecord.summary));
    } else {
      const settings = defaultHomepageSettings();
      const { error: settingsError } = await supabase!.from("categories").insert({
        name: "Homepage settings",
        slug: HOMEPAGE_SETTINGS_CATEGORY_SLUG,
        summary: serializeHomepageSettings(settings),
      });
      if (settingsError) setError(settingsError.message);
      else setHomepageSettings(settings);
    }
    setProducts((productResult.data || []) as AdminProduct[]);
    setCategories(allCategories.filter((category) => category.slug !== HOMEPAGE_SETTINGS_CATEGORY_SLUG));
    setOrders((orderResult.data || []) as AdminOrder[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError("");
    if (!categories.some((category) => category.slug === productDraft.category)) { setError("Choose one existing category before saving this product."); return; }
    const price = Math.max(0, Number(productDraft.price) || 0);
    const payload = { name: productDraft.name.trim(), slug: makeSlug(productDraft.slug || productDraft.name), category: productDraft.category, price, sku: productDraft.sku.trim(), availability: "Availability to confirm", pack: productDraft.pack.trim(), description: productDraft.description.trim(), image: productDraft.image.trim(), tags: price > 0 ? ["Catalogue line"] : ["Catalogue line", "Price hidden"], featured: false };
    const result = editing ? await supabase!.from("products").update(payload).eq("id", editing.id).select("id") : await supabase!.from("products").insert(payload).select("id");
    if (result.error) setError(result.error.message);
    else if (!result.data?.length) setError("The product was not saved. Refresh the admin page and try again.");
    else { setMessage(editing ? "Product updated permanently." : "Product added permanently."); setEditing(null); setProductDraft(blankProduct); void load(); }
  };

  const editProduct = (product: AdminProduct) => { setEditing(product); setProductDraft({ ...product, price: String(product.price), description: product.description || "", tags: product.tags?.join(", ") || "Catalogue line, Price hidden" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const removeProduct = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete “${name}”? This cannot be undone.`)) return;
    setMessage(""); setError("");
    const { data, error: removeError } = await supabase!.from("products").delete().eq("id", id).select("id,name");
    if (removeError) { setError(`Product was not deleted: ${removeError.message}`); return; }
    if (!data?.length) { setError("Product was not deleted. It may no longer exist or your account does not have permission. Refresh and try again."); return; }
    setProducts((current) => current.filter((product) => product.id !== id));
    setMessage(`Product deleted permanently: ${data[0].name}.`);
    void load();
  };
  const uploadImage = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Use a PNG, JPEG, or WebP supplier image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Use a supplier image smaller than 5 MB."); return; }
    setMessage("Uploading image…"); setError("");
    const name = `products/${Date.now()}-${makeSlug(file.name)}`;
    const { error: uploadError } = await supabase!.storage.from("product-images").upload(name, file, { upsert: false, contentType: file.type });
    if (uploadError) { setError(uploadError.message); setMessage(""); return; }
    const { data } = supabase!.storage.from("product-images").getPublicUrl(name);
    setProductDraft((draft) => ({ ...draft, image: data.publicUrl }));
    setMessage("Product image uploaded. Save the product to keep it.");
  };
  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const name = categoryName.trim(); if (!name) return;
    const { error: addError } = await supabase!.from("categories").insert({ name, slug: makeSlug(name), summary: null });
    if (addError) setError(addError.message); else { setCategoryName(""); setMessage("Category added."); void load(); }
  };
  const deleteCategory = async (category: AdminCategory) => {
    if (!window.confirm(`Permanently delete the “${category.name}” category? Categories with products cannot be deleted.`)) return;
    setMessage(""); setError("");
    const { count, error: countError } = await supabase!.from("products").select("id", { count: "exact", head: true }).eq("category", category.slug);
    if (countError) { setError(`Category was not deleted: ${countError.message}`); return; }
    if ((count || 0) > 0) { setError(`Category was not deleted. Move its ${count} product${count === 1 ? "" : "s"} to another category first.`); return; }
    const { data, error: deleteError } = await supabase!.from("categories").delete().eq("id", category.id).select("id,name");
    if (deleteError) { setError(`Category was not deleted: ${deleteError.message}`); return; }
    if (!data?.length) { setError("Category was not deleted. Refresh and try again."); return; }
    setCategories((current) => current.filter((item) => item.id !== category.id));
    setMessage(`Category deleted permanently: ${data[0].name}.`);
    void load();
  };
  const updateOrder = async (id: string, status: string) => {
    const { error: updateError } = await supabase!.from("demo_orders").update({ status }).eq("id", id);
    if (updateError) setError(updateError.message); else { setMessage("Order request status updated."); void load(); }
  };

  const saveHomepageSettings = async () => {
    setMessage(""); setError("");
    const settings = normalizeHomepageSettings(homepageSettings);
    if (settings.heroSlides.some((slide) => !slide.src || !slide.label)) { setError("Add an image URL and a short label for all three hero images."); return; }
    const { error: saveError } = await supabase!.from("categories").update({ summary: serializeHomepageSettings(settings) }).eq("slug", HOMEPAGE_SETTINGS_CATEGORY_SLUG);
    if (saveError) setError(saveError.message);
    else { setHomepageSettings(settings); setMessage("Homepage hero images saved. The public homepage will use them after refresh."); }
  };

  const uploadHeroImage = async (file: File, index: number) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Use a PNG, JPEG, or WebP hero image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Use a hero image smaller than 5 MB."); return; }
    setMessage("Uploading hero image…"); setError("");
    const name = `homepage/${Date.now()}-${makeSlug(file.name)}`;
    const { error: uploadError } = await supabase!.storage.from("product-images").upload(name, file, { upsert: false, contentType: file.type });
    if (uploadError) { setError(uploadError.message); setMessage(""); return; }
    const { data } = supabase!.storage.from("product-images").getPublicUrl(name);
    setHomepageSettings((current) => ({ ...current, heroSlides: current.heroSlides.map((slide, slideIndex) => slideIndex === index ? { ...slide, src: data.publicUrl } : slide) }));
    setMessage("Hero image uploaded. Save homepage changes to publish it.");
  };

  const updateHeroSlide = (index: number, field: "src" | "label", value: string) => {
    setHomepageSettings((current) => ({ ...current, heroSlides: current.heroSlides.map((slide, slideIndex) => slideIndex === index ? { ...slide, [field]: value } : slide) }));
  };

  const toggleHomepageCollection = async (product: AdminProduct, tag: "Best seller" | "New arrival") => {
    setMessage(""); setError("");
    const otherTag = tag === "Best seller" ? "New arrival" : "Best seller";
    const currentlySelected = product.tags.includes(tag);
    const nextTags = product.tags.filter((item) => item !== tag && item !== otherTag);
    if (!currentlySelected) nextTags.push(tag);
    const { error: updateError } = await supabase!.from("products").update({ tags: nextTags }).eq("id", product.id);
    if (updateError) { setError(updateError.message); return; }
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, tags: nextTags } : item));
    setMessage(currentlySelected ? `${product.name} removed from ${tag === "Best seller" ? "Best Sellers" : "New Arrivals"}.` : `${product.name} added to ${tag === "Best seller" ? "Best Sellers" : "New Arrivals"}.`);
  };

  return <StoreLayout>
    <section className="admin-header"><div className="trade-shell"><div><p className="eyebrow light">Magnetic Source / Admin</p><h1>The trade desk.</h1><span>Products, categories and no-payment order request review.</span></div><button type="button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div></section>
    <section className="trade-shell admin-shell section-space">
      <nav className="admin-tabs"><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><PackagePlus size={17} /> Products <b>{counts.products}</b></button><button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")}><ImagePlus size={17} /> Categories <b>{counts.categories}</b></button><button className={tab === "homepage" ? "active" : ""} onClick={() => setTab("homepage")}><Images size={17} /> Homepage</button><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><ShieldCheck size={17} /> Requests <b>{counts.orders}</b></button></nav>
      {message && <p className="admin-message"><CheckCircle2 size={16} /> {message}</p>}
      {error && <p className="admin-error"><X size={16} /> {error}</p>}
      {loading ? <div className="admin-loading"><Loader2 size={24} /> Loading secure records…</div> : tab === "products" ? <section className="admin-content">
        <div className="admin-product-editor">
          <form className="admin-product-form" onSubmit={saveProduct}>
            <div className="admin-form-heading"><div><p className="eyebrow">{editing ? "Edit product" : "New product"}</p><h2>{editing ? editing.name : "Add an approved catalogue line."}</h2></div>{editing && <button type="button" className="admin-cancel" onClick={() => { setEditing(null); setProductDraft(blankProduct); }}>Cancel edit</button>}</div>
            <div className="form-grid">
              <label>Product name<input required value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value, slug: productDraft.slug || makeSlug(event.target.value) })} /></label>
              <label className="admin-category-field">Category <span className="admin-required">Required</span><select required value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })}><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label>
              <label>Pack size<input required value={productDraft.pack} onChange={(event) => setProductDraft({ ...productDraft, pack: event.target.value })} /></label>
              <label>Reference code<input required value={productDraft.sku} onChange={(event) => setProductDraft({ ...productDraft, sku: event.target.value })} /></label>
              <label>Customer price ex VAT <span className="admin-optional">Optional</span><input min="0" step="0.01" type="number" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: event.target.value })} /><small>Enter a real price to make it available to signed-in customers.</small></label>
              <label className="span-2">Description <span className="admin-optional">Optional</span><textarea rows={3} value={productDraft.description} onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })} /><small>Leave empty unless you have a real product description. Do not repeat the pack size.</small></label>
              <label className="span-2">Product image<input value={productDraft.image} onChange={(event) => setProductDraft({ ...productDraft, image: event.target.value })} placeholder="Upload approved supplier image below or paste a permitted URL" /></label>
            </div>
            <div className="admin-image-upload"><label><Upload size={17} /> Upload approved supplier image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && void uploadImage(event.target.files[0])} /></label>{productDraft.image && <img src={productDraft.image} alt="Product upload preview" />}</div>
            <button className="button-primary" type="submit">{editing ? "Save product changes" : "Add product"} <ChevronRight size={17} /></button>
          </form>
          <aside className="admin-product-preview"><div><p className="eyebrow">Live preview</p><h3>Public product card</h3><p>Updates as you fill the form. Check the product image and pack details before publishing.</p></div><ProductCard product={previewProduct} preview /></aside>
        </div>
        <div className="admin-list"><div className="admin-list-heading"><p className="eyebrow">Catalogue lines</p><span>{products.length} records</span></div>{products.length ? products.map((product) => <article key={product.id} className="admin-product-row"><img src={product.image || "/product-image-pending.svg"} alt="" /><div><b>{product.name}</b><span className="admin-row-category">{categoryNameFor(product.category)}</span><span>Reference {product.sku} · {product.pack}</span></div><button type="button" onClick={() => editProduct(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button><button type="button" onClick={() => void removeProduct(product.id, product.name)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></article>) : <p className="admin-empty">No database products yet.</p>}</div>
      </section> : tab === "homepage" ? <HomepageManager settings={homepageSettings} products={products} onUpdateSlide={updateHeroSlide} onUploadHero={uploadHeroImage} onSaveHero={saveHomepageSettings} onToggleCollection={toggleHomepageCollection} /> : tab === "categories" ? <section className="admin-content categories-admin">
        <form className="admin-category-form" onSubmit={addCategory}><p className="eyebrow">Product departments</p><h2>Add a category.</h2><p>Use concise buyer-facing names. Slugs are generated automatically.</p><div><input placeholder="e.g. Home & Utility" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /><button className="button-primary" type="submit">Add category <ChevronRight size={17} /></button></div></form>
        <div className="admin-list"><div className="admin-list-heading"><p className="eyebrow">Categories</p><span>{categories.length} records</span></div>{categories.length ? categories.map((category) => <article key={category.id} className="admin-category-row"><div><b>{category.name}</b><span>/{category.slug}</span></div><button type="button" onClick={() => void deleteCategory(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button></article>) : <p className="admin-empty">No database categories yet.</p>}</div>
      </section> : <section className="admin-content orders-admin"><div className="admin-list"><div className="admin-list-heading"><p className="eyebrow">No-payment order requests</p><span>{orders.length} records</span></div>{orders.length ? orders.map((order) => <article key={order.id} className="admin-order-row"><div><b>{order.order_reference}</b><span>{order.customer_name} · {order.customer_email} · £{Number(order.subtotal).toFixed(2)} ex VAT</span></div><time>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(order.created_at))}</time><select value={order.status} onChange={(event) => void updateOrder(order.id, event.target.value)}><option>New request</option><option>Reviewed</option><option>Archived</option></select></article>) : <p className="admin-empty">No order requests stored yet.</p>}</div></section>}
    </section>
  </StoreLayout>;
}

function HomepageManager({ settings, products, onUpdateSlide, onUploadHero, onSaveHero, onToggleCollection }: { settings: HomepageSettings; products: AdminProduct[]; onUpdateSlide: (index: number, field: "src" | "label", value: string) => void; onUploadHero: (file: File, index: number) => void; onSaveHero: () => void; onToggleCollection: (product: AdminProduct, tag: "Best seller" | "New arrival") => void }) {
  const [query, setQuery] = useState("");
  const visibleProducts = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) || product.sku.toLowerCase().includes(query.toLowerCase())).slice(0, 40);

  return <section className="admin-content homepage-admin">
    <div className="admin-homepage-heading"><div><p className="eyebrow">Homepage controls</p><h2>Hero images & product collections.</h2><p>Your three hero images rotate every four seconds on the public homepage. Save all three together after uploading or changing their image links.</p></div><button className="button-primary" type="button" onClick={onSaveHero}>Save hero images <ChevronRight size={17} /></button></div>
    <section className="hero-admin-panel"><div className="admin-section-label"><Images size={18} /><div><b>Three rotating hero images</b><span>Automatic rotation stays at four seconds.</span></div></div><div className="hero-admin-grid">{settings.heroSlides.map((slide, index) => <article className="hero-admin-card" key={index}><div className="hero-admin-preview">{slide.src ? <img src={slide.src} alt={`Hero image ${index + 1} preview`} /> : <span>Hero {index + 1}</span>}</div><p className="eyebrow">Hero image {index + 1}</p><label>Image URL<input value={slide.src} onChange={(event) => onUpdateSlide(index, "src", event.target.value)} placeholder="Upload an image or paste a URL" /></label><label>Short description<input value={slide.label} onChange={(event) => onUpdateSlide(index, "label", event.target.value)} placeholder="e.g. Christmas wholesale range" /></label><label className="hero-upload"><Upload size={15} /> Upload image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUploadHero(event.target.files[0], index)} /></label></article>)}</div></section>
    <section className="collection-admin-panel"><div className="admin-section-label"><Sparkles size={18} /><div><b>Best Sellers & New Arrivals</b><span>Search a product, then choose one homepage collection. A product can be in one collection at a time.</span></div></div><label className="homepage-product-search">Search products<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product name or reference" /></label><div className="homepage-product-list">{visibleProducts.map((product) => { const best = product.tags.includes("Best seller"); const arrival = product.tags.includes("New arrival"); return <article key={product.id}><img src={product.image || SUPPLIER_IMAGE_PLACEHOLDER} alt="" /><div><b>{product.name}</b><span>{product.sku} · {product.pack}</span></div><div className="homepage-collection-actions"><button type="button" className={best ? "active" : ""} onClick={() => void onToggleCollection(product, "Best seller")}>Best Seller</button><button type="button" className={arrival ? "active" : ""} onClick={() => void onToggleCollection(product, "New arrival")}>New Arrival</button></div></article>; })}</div></section>
  </section>;
}
