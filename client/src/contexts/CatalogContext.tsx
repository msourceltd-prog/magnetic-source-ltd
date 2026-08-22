/**
 * Trade Ledger, Recut: dynamic supplier-backed commerce data is presented in
 * a calm, original trade interface with price, pack and exact-image facts;
 * quote-required records are explicitly marked instead of exposing zero values.
 */
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { currentCategories, SUPPLIER_IMAGE_PLACEHOLDER, type Category, type Product } from "@/lib/catalogRuntime";
import { supabase } from "@/lib/supabase";

type CatalogContextValue = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  usingSupabase: boolean;
};

type RemoteCategory = { id: number; name: string; slug: string; summary: string | null };
type RemoteProduct = Omit<Product, "price" | "id" | "availability" | "priceBasis" | "brand"> & { id: number | string; price: number | string; tags: string[] | null; availability: string | null };

const fallbackCatalog: CatalogContextValue = { categories: currentCategories, products: [], loading: false, usingSupabase: false };
const CatalogContext = createContext<CatalogContextValue>(fallbackCatalog);
const preferredCategoryOrder = ["household-pet", "sweets-snacks", "toys-gifts", "pets", "stationery-party", "health-beauty", "seasonal-christmas", "clearance", "baby-kids"];
const catalogCacheKey = "magnetic-source:catalog:v1";
const catalogCacheMaxAge = 10 * 60 * 1000;

type CachedCatalog = Pick<CatalogContextValue, "categories" | "products"> & { savedAt: number };

function readCachedCatalog(): CatalogContextValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(catalogCacheKey);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedCatalog;
    if (!Array.isArray(cached.categories) || !Array.isArray(cached.products) || Date.now() - cached.savedAt > catalogCacheMaxAge) return null;
    return { categories: cached.categories, products: cached.products, loading: false, usingSupabase: true };
  } catch {
    return null;
  }
}

function writeCachedCatalog(catalog: CatalogContextValue) {
  if (typeof window === "undefined") return;
  try {
    const cached: CachedCatalog = { categories: catalog.categories, products: catalog.products, savedAt: Date.now() };
    window.sessionStorage.setItem(catalogCacheKey, JSON.stringify(cached));
  } catch {
    // A full or unavailable browser storage area must never block catalogue rendering.
  }
}

export function CatalogProvider({ children }: PropsWithChildren) {
  const [catalog, setCatalog] = useState<CatalogContextValue>(() => readCachedCatalog() || (supabase ? { ...fallbackCatalog, categories: currentCategories, products: [], loading: true } : fallbackCatalog));

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const retainCachedCatalog = () => setCatalog((current) => current.products.length ? { ...current, loading: false } : fallbackCatalog);
    const loadCatalog = async () => {
      try {
        const [categoryResult, productResult] = await Promise.all([
          client.from("categories").select("id,name,slug,summary").order("name"),
          client.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("id"),
        ]);
        if (!active) return;
        if (categoryResult.error || productResult.error || !categoryResult.data || !productResult.data) {
          retainCachedCatalog();
          return;
        }
        const remoteCategories = categoryResult.data as RemoteCategory[];
        const orderedCategories = remoteCategories.length
          ? [...remoteCategories]
            .sort((left, right) => {
              const leftOrder = preferredCategoryOrder.indexOf(left.slug);
              const rightOrder = preferredCategoryOrder.indexOf(right.slug);
              return (leftOrder === -1 ? 999 : leftOrder) - (rightOrder === -1 ? 999 : rightOrder) || left.name.localeCompare(right.name);
            })
            .map((category) => ({ name: category.name, slug: category.slug, summary: category.summary || "Trade catalogue category.", accent: "Trade edit" }))
            : currentCategories;
        const liveProducts = (productResult.data as RemoteProduct[]).map((product) => ({
          ...product,
          id: Number(product.id),
          price: Number(product.price),
          description: product.description || null,
          tags: product.tags?.length ? product.tags : ["Catalogue line"],
          image: product.image || SUPPLIER_IMAGE_PLACEHOLDER,
          availability: "Availability to confirm" as const,
          priceBasis: product.tags?.includes("Price hidden")
            ? "Price on request" as const
            : product.category === "sweets-confectionery" || product.tags?.includes("Supplier price")
            ? "Supplier listed price · ex VAT" as const
            : product.sku.startsWith("GEM-")
              ? "Supplier unit price · ex VAT" as const
              : "Indicative price · ex VAT" as const,
          brand: null,
        }));
        const nextCatalog = { categories: orderedCategories, products: liveProducts, loading: false, usingSupabase: true };
        writeCachedCatalog(nextCatalog);
        setCatalog(nextCatalog);
      } catch {
        if (active) retainCachedCatalog();
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, []);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
