/**
 * Focused administrator controls for catalogue additions and homepage curation.
 * Existing Supabase Auth and role checks protect every write operation.
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Images, Loader2, LogOut, PackagePlus, Pencil, Search, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Link } from "wouter";
import StoreLayout from "@/components/StoreLayout";
import { SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/catalogRuntime";
import { defaultHomepageSettings, HOMEPAGE_SETTINGS_CATEGORY_SLUG, normalizeHomepageSettings, parseHomepageSettings, serializeHomepageSettings, type HomepageSettings } from "@/lib/homepageAdmin";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type AdminProduct = { id: number; slug: string; name: string; category: string; price: number; sku: string; availability: string; pack: string; description: string | null; image: string; tags: string[]; featured: boolean };
type AdminCategory = { id: number; name: string; slug: string; summary: string | null };
type ProductDraft = { name: string; slug: string; category: string; price: string; sku: string; pack: string; description: string; image: string };

const blankProduct: ProductDraft = { name: "", slug: "", category: "", price: "0", sku: "", pack: "", description: "", image: "" };
const makeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Admin() {
  if (!supabaseConfigured) return <AdminConnectionRequired />;
  return <AdminDesk />;
}

function AdminConnectionRequired() {
  return <StoreLayout><section className="admin-gate"><div className="admin-gate-card"><ShieldCheck size={42} /><p className="eyebrow">Secure admin area</p><h1>Connect Supabase to unlock the desk.</h1><p>This frontend is ready for protected product management, but it cannot create an administrator or write catalogue data until Supabase is configured.</p><Link href="/about" className="button-primary">Back to the storefront <ChevronRight size={17} /></Link></div></section></StoreLayout>;
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
  return <StoreLayout><section className="admin-gate"><form className="admin-login-card" onSubmit={submit}><ShieldCheck size={40} /><p className="eyebrow">Magnetic Source admin</p><h1>Sign in to manage the catalogue.</h1><label>Email address<input required type="email" name="email" autoComplete="email" /></label><label>Password<input required type="password" name="password" autoComplete="current-password" /></label>{error && <p className="admin-error">{error}</p>}<button className="button-primary" disabled={loading} type="submit">{loading ? "Signing in…" : "Secure sign in"} <ChevronRight size={17} /></button></form></section></StoreLayout>;
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<"products" | "homepage">("products");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(blankProduct);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(defaultHomepageSettings);
  const [productSearch, setProductSearch] = useState("");
  const categoryNameFor = (slug: string) => categories.find((category) => category.slug === slug)?.name || slug;
  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 60), [productSearch, products]);

  const load = async () => {
    setLoading(true); setError("");
    const [productResult, categoryResult] = await Promise.all([
      supabase!.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("created_at", { ascending: false }),
      supabase!.from("categories").select("id,name,slug,summary").order("name"),
    ]);
    if (productResult.error || categoryResult.error) setError([productResult.error, categoryResult.error].find(Boolean)?.message || "The admin page could not load its records.");
    const allCategories = (categoryResult.data || []) as AdminCategory[];
    const settingsRecord = allCategories.find((category) => category.slug === HOMEPAGE_SETTINGS_CATEGORY_SLUG);
    if (settingsRecord) {
      setHomepageSettings(parseHomepageSettings(settingsRecord.summary));
    } else {
      const settings = defaultHomepageSettings();
      const { error: settingsError } = await supabase!.from("categories").insert({ name: "Homepage settings", slug: HOMEPAGE_SETTINGS_CATEGORY_SLUG, summary: serializeHomepageSettings(settings) });
      if (settingsError) setError(settingsError.message);
      else setHomepageSettings(settings);
    }
    setProducts((productResult.data || []) as AdminProduct[]);
    setCategories(allCategories.filter((category) => category.slug !== HOMEPAGE_SETTINGS_CATEGORY_SLUG));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError("");
    if (!categories.some((category) => category.slug === productDraft.category)) { setError("Choose a category before saving the product."); return; }
    const price = Math.max(0, Number(productDraft.price) || 0);
    const existingCollectionTags = editing?.tags.filter((tag) => tag === "Best seller" || tag === "New arrival") || [];
    const payload = {
      name: productDraft.name.trim(), slug: makeSlug(productDraft.slug || productDraft.name), category: productDraft.category,
      price, sku: productDraft.sku.trim(), availability: "Availability to confirm", pack: productDraft.pack.trim(), description: productDraft.description.trim(), image: productDraft.image.trim(),
      tags: ["Catalogue line", ...(price > 0 ? [] : ["Price hidden"]), ...existingCollectionTags], featured: false,
    };
    const result = editing ? await supabase!.from("products").update(payload).eq("id", editing.id).select("id") : await supabase!.from("products").insert(payload).select("id");
    if (result.error) setError(result.error.message);
    else if (!result.data?.length) setError("The product was not saved. Refresh and try again.");
    else { setMessage(editing ? "Product updated in its category." : "Product added to its category."); setEditing(null); setProductDraft(blankProduct); void load(); }
  };

  const editProduct = (product: AdminProduct) => { setEditing(product); setProductDraft({ ...product, price: String(product.price), description: product.description || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const removeProduct = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete “${name}”? This cannot be undone.`)) return;
    setMessage(""); setError("");
    const { data, error: removeError } = await supabase!.from("products").delete().eq("id", id).select("id,name");
    if (removeError) { setError(`Product was not deleted: ${removeError.message}`); return; }
    if (!data?.length) { setError("The product was not deleted. Refresh and try again."); return; }
    setProducts((current) => current.filter((product) => product.id !== id));
    setMessage(`Product deleted: ${data[0].name}.`);
  };
  const uploadProductImage = async (file: File) => {
    if (!isSupportedImage(file)) { setError("Use a PNG, JPEG, or WebP image smaller than 5 MB."); return; }
    setMessage("Uploading product image…"); setError("");
    const name = `products/${Date.now()}-${makeSlug(file.name)}`;
    const { error: uploadError } = await supabase!.storage.from("product-images").upload(name, file, { upsert: false, contentType: file.type });
    if (uploadError) { setError(uploadError.message); setMessage(""); return; }
    const { data } = supabase!.storage.from("product-images").getPublicUrl(name);
    setProductDraft((draft) => ({ ...draft, image: data.publicUrl }));
    setMessage("Product image uploaded. Save the product to keep it.");
  };
  const saveHomepageSettings = async () => {
    setMessage(""); setError("");
    if (homepageSettings.heroSlides.some((slide) => !slide.src.trim() || !slide.label.trim())) { setError("Add an image and a short description for all three hero images."); return; }
    const settings = normalizeHomepageSettings(homepageSettings);
    const { error: saveError } = await supabase!.from("categories").update({ summary: serializeHomepageSettings(settings) }).eq("slug", HOMEPAGE_SETTINGS_CATEGORY_SLUG);
    if (saveError) setError(saveError.message);
    else { setHomepageSettings(settings); setMessage("Homepage hero images saved. Refresh the homepage to view the changes."); }
  };
  const uploadHeroImage = async (file: File, index: number) => {
    if (!isSupportedImage(file)) { setError("Use a PNG, JPEG, or WebP image smaller than 5 MB."); return; }
    setMessage("Uploading hero image…"); setError("");
    const name = `homepage/${Date.now()}-${makeSlug(file.name)}`;
    const { error: uploadError } = await supabase!.storage.from("product-images").upload(name, file, { upsert: false, contentType: file.type });
    if (uploadError) { setError(uploadError.message); setMessage(""); return; }
    const { data } = supabase!.storage.from("product-images").getPublicUrl(name);
    setHomepageSettings((current) => ({ ...current, heroSlides: current.heroSlides.map((slide, slideIndex) => slideIndex === index ? { ...slide, src: data.publicUrl } : slide) }));
    setMessage("Hero image uploaded. Press Save hero images to publish it.");
  };
  const updateHeroSlide = (index: number, field: "src" | "label", value: string) => setHomepageSettings((current) => ({ ...current, heroSlides: current.heroSlides.map((slide, slideIndex) => slideIndex === index ? { ...slide, [field]: value } : slide) }));
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
    <section className="admin-header"><div className="trade-shell"><div><p className="eyebrow light">Magnetic Source / Admin</p><h1>Manage your products & homepage.</h1><span>Add products into the right category, change the three homepage images, or choose homepage collections.</span></div><button type="button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div></section>
    <section className="trade-shell admin-shell section-space">
      <nav className="admin-tabs simple-admin-tabs"><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><PackagePlus size={17} /> Products</button><button className={tab === "homepage" ? "active" : ""} onClick={() => setTab("homepage")}><Images size={17} /> Homepage</button></nav>
      {message && <p className="admin-message"><CheckCircle2 size={16} /> {message}</p>}
      {error && <p className="admin-error"><X size={16} /> {error}</p>}
      {loading ? <div className="admin-loading"><Loader2 size={24} /> Loading admin controls…</div> : tab === "products" ? <ProductsManager categories={categories} editing={editing} productDraft={productDraft} visibleProducts={visibleProducts} productSearch={productSearch} categoryNameFor={categoryNameFor} onSearch={setProductSearch} onDraftChange={setProductDraft} onSave={saveProduct} onCancel={() => { setEditing(null); setProductDraft(blankProduct); }} onUploadImage={uploadProductImage} onEdit={editProduct} onDelete={removeProduct} /> : <HomepageManager settings={homepageSettings} products={products} onUpdateSlide={updateHeroSlide} onUploadHero={uploadHeroImage} onSaveHero={saveHomepageSettings} onToggleCollection={toggleHomepageCollection} />}
    </section>
  </StoreLayout>;
}

function ProductsManager({ categories, editing, productDraft, visibleProducts, productSearch, categoryNameFor, onSearch, onDraftChange, onSave, onCancel, onUploadImage, onEdit, onDelete }: { categories: AdminCategory[]; editing: AdminProduct | null; productDraft: ProductDraft; visibleProducts: AdminProduct[]; productSearch: string; categoryNameFor: (slug: string) => string; onSearch: (value: string) => void; onDraftChange: (draft: ProductDraft) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; onUploadImage: (file: File) => void; onEdit: (product: AdminProduct) => void; onDelete: (id: number, name: string) => void }) {
  return <section className="admin-content products-admin">
    <div className="admin-product-editor simple-product-editor"><form className="admin-product-form" onSubmit={onSave}><div className="admin-form-heading"><div><p className="eyebrow">{editing ? "Edit product" : "Add new product"}</p><h2>{editing ? editing.name : "Add a product to a category."}</h2><p>Select the category first, then save. The product will appear directly in that category on the website.</p></div>{editing && <button type="button" className="admin-cancel" onClick={onCancel}>Cancel</button>}</div><div className="form-grid"><label>Product name<input required value={productDraft.name} onChange={(event) => onDraftChange({ ...productDraft, name: event.target.value, slug: productDraft.slug || makeSlug(event.target.value) })} /></label><label className="admin-category-field">Category <span className="admin-required">Required</span><select required value={productDraft.category} onChange={(event) => onDraftChange({ ...productDraft, category: event.target.value })}><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select><small>This decides where the product will show on the website.</small></label><label>Pack size<input required value={productDraft.pack} onChange={(event) => onDraftChange({ ...productDraft, pack: event.target.value })} /></label><label>Reference code<input required value={productDraft.sku} onChange={(event) => onDraftChange({ ...productDraft, sku: event.target.value })} /></label><label>Price ex VAT <span className="admin-optional">Optional</span><input min="0" step="0.01" type="number" value={productDraft.price} onChange={(event) => onDraftChange({ ...productDraft, price: event.target.value })} /></label><label className="span-2">Description <span className="admin-optional">Optional</span><textarea rows={3} value={productDraft.description} onChange={(event) => onDraftChange({ ...productDraft, description: event.target.value })} /></label><label className="span-2">Product image<input value={productDraft.image} onChange={(event) => onDraftChange({ ...productDraft, image: event.target.value })} placeholder="Upload an image below or paste an approved image link" /></label></div><div className="admin-image-upload"><label><Upload size={17} /> Upload product image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUploadImage(event.target.files[0])} /></label>{productDraft.image && <img src={productDraft.image} alt="Product preview" />}</div><button className="button-primary" type="submit">{editing ? "Save product changes" : "Save product to category"} <ChevronRight size={17} /></button></form></div>
    <div className="admin-list simple-product-list"><div className="admin-list-heading"><div><p className="eyebrow">Existing products</p><span>Search, edit, or remove a product.</span></div><label className="admin-list-search"><Search size={15} /><input value={productSearch} onChange={(event) => onSearch(event.target.value)} placeholder="Search product or reference" /></label></div>{visibleProducts.length ? visibleProducts.map((product) => <article key={product.id} className="admin-product-row"><img src={product.image || "/product-image-pending.svg"} alt="" /><div><b>{product.name}</b><span className="admin-row-category">{categoryNameFor(product.category)}</span><span>Reference {product.sku} · {product.pack}</span></div><button type="button" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button><button type="button" onClick={() => void onDelete(product.id, product.name)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></article>) : <p className="admin-empty">No products match your search.</p>}</div>
  </section>;
}

function HomepageManager({ settings, products, onUpdateSlide, onUploadHero, onSaveHero, onToggleCollection }: { settings: HomepageSettings; products: AdminProduct[]; onUpdateSlide: (index: number, field: "src" | "label", value: string) => void; onUploadHero: (file: File, index: number) => void; onSaveHero: () => void; onToggleCollection: (product: AdminProduct, tag: "Best seller" | "New arrival") => void }) {
  return <section className="admin-content homepage-admin"><div className="admin-homepage-heading"><div><p className="eyebrow">Homepage controls</p><h2>Change hero images & collections.</h2><p>Choose three hero images. They will keep changing automatically every four seconds on the public homepage.</p></div><button className="button-primary" type="button" onClick={onSaveHero}>Save hero images <ChevronRight size={17} /></button></div><section className="hero-admin-panel"><div className="admin-section-label"><Images size={18} /><div><b>Three homepage images</b><span>Upload a seasonal image or paste an approved image link for each position.</span></div></div><div className="hero-admin-grid">{settings.heroSlides.map((slide, index) => <article className="hero-admin-card" key={index}><div className="hero-admin-preview">{slide.src ? <img src={slide.src} alt={`Hero image ${index + 1} preview`} /> : <span>Hero {index + 1}</span>}</div><p className="eyebrow">Hero image {index + 1}</p><label>Image URL<input value={slide.src} onChange={(event) => onUpdateSlide(index, "src", event.target.value)} placeholder="Upload an image or paste a URL" /></label><label>Short description<input value={slide.label} onChange={(event) => onUpdateSlide(index, "label", event.target.value)} placeholder="e.g. Christmas wholesale range" /></label><label className="hero-upload"><Upload size={15} /> Upload image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUploadHero(event.target.files[0], index)} /></label></article>)}</div></section><section className="collection-workflow"><div className="collection-workflow-heading"><Sparkles size={20} /><div><p className="eyebrow">Homepage product sections</p><h3>Choose products in two simple steps.</h3><span>Use one box for Best Sellers and one box for New Arrivals. A product can appear in one section at a time.</span></div></div><div className="collection-workflow-grid"><CollectionManager title="Best Sellers" tag="Best seller" description="Use this for proven popular products you want to show first on the homepage." products={products} onToggle={onToggleCollection} /><CollectionManager title="New Arrivals" tag="New arrival" description="Use this for recently added products you want customers to notice as new." products={products} onToggle={onToggleCollection} /></div></section></section>;
}

function CollectionManager({ title, tag, description, products, onToggle }: { title: string; tag: "Best seller" | "New arrival"; description: string; products: AdminProduct[]; onToggle: (product: AdminProduct, tag: "Best seller" | "New arrival") => void }) {
  const [query, setQuery] = useState("");
  const selected = products.filter((product) => product.tags.includes(tag));
  const available = products.filter((product) => !product.tags.includes(tag) && `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);
  const otherTag = tag === "Best seller" ? "New arrival" : "Best seller";
  const addLabel = `Add to ${title}`;
  const removeLabel = `Remove from ${title}`;
  return <section className={`collection-manager ${tag === "Best seller" ? "best-seller-manager" : "new-arrival-manager"}`}><header><p className="eyebrow">{title === "Best Sellers" ? "Step 1" : "Step 2"}</p><h3>{title}</h3><p>{description}</p></header><div className="collection-add-zone"><b>Find a product to add</b><label className="homepage-product-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product name or reference" /></label><div className="collection-choice-list">{available.map((product) => <article key={product.id}><img src={product.image || SUPPLIER_IMAGE_PLACEHOLDER} alt="" /><div><b>{product.name}</b><span>{product.sku} · {product.pack}{product.tags.includes(otherTag) ? ` · currently in ${otherTag === "Best seller" ? "Best Sellers" : "New Arrivals"}` : ""}</span></div><button type="button" onClick={() => void onToggle(product, tag)}>{addLabel}</button></article>)}</div></div><div className="collection-current-zone"><b>Products currently shown in {title}</b>{selected.length ? <div className="collection-choice-list">{selected.map((product) => <article key={product.id}><img src={product.image || SUPPLIER_IMAGE_PLACEHOLDER} alt="" /><div><b>{product.name}</b><span>{product.sku} · {product.pack}</span></div><button type="button" className="remove" onClick={() => void onToggle(product, tag)}>{removeLabel}</button></article>)}</div> : <p>No products have been selected yet.</p>}</div></section>;
}

function isSupportedImage(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024;
}
