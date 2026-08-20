/**
 * Trade Ledger, Recut: dynamic supplier-backed commerce data is presented in
 * a calm, original trade interface with price, pack and exact-image facts;
 * quote-required records are explicitly marked instead of exposing zero values.
 */
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { categories as fallbackCategories, products as fallbackProducts, type Category, type Product } from "@/data/catalog";
import { supabase } from "@/lib/supabase";

type CatalogContextValue = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  usingSupabase: boolean;
};

type RemoteCategory = { id: number; name: string; slug: string; summary: string | null };
type RemoteProduct = Omit<Product, "price" | "id" | "availability" | "priceBasis" | "brand"> & { id: number | string; price: number | string; tags: string[] | null; availability: string | null };

const fallbackCatalog: CatalogContextValue = { categories: fallbackCategories, products: fallbackProducts, loading: false, usingSupabase: false };
const CatalogContext = createContext<CatalogContextValue>(fallbackCatalog);
const preferredCategoryOrder = ["household-pet", "sweets-snacks", "charging-electrical", "toys-gifts", "stationery-party", "health-beauty", "seasonal-christmas", "clearance"];

export function CatalogProvider({ children }: PropsWithChildren) {
  const [catalog, setCatalog] = useState<CatalogContextValue>(() => supabase ? { ...fallbackCatalog, categories: [], products: [], loading: true } : fallbackCatalog);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const loadCatalog = async () => {
      const [categoryResult, productResult] = await Promise.all([
        client.from("categories").select("id,name,slug,summary").order("name"),
        client.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("id"),
      ]);
      if (!active) return;
      if (categoryResult.error || productResult.error || !categoryResult.data || !productResult.data) {
        setCatalog(fallbackCatalog);
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
        : fallbackCategories;
      const liveProducts = (productResult.data as RemoteProduct[]).map((product) => ({
        ...product,
        id: Number(product.id),
        price: Number(product.price),
        tags: product.tags?.length ? product.tags : ["Catalogue line"],
        image: product.image || fallbackProducts[0].image,
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
      setCatalog({ categories: orderedCategories, products: liveProducts, loading: false, usingSupabase: true });
    };
    void loadCatalog();
    return () => { active = false; };
  }, []);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
