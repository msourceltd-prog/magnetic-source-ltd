/**
 * Trade Ledger, Recut: live catalogue data stays orderly and decision-ready,
 * preserving the warm-paper commerce experience even when a safe fallback is used.
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

export function CatalogProvider({ children }: PropsWithChildren) {
  const [catalog, setCatalog] = useState<CatalogContextValue>(fallbackCatalog);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const loadCatalog = async () => {
      const [categoryResult, productResult] = await Promise.all([
        client.from("categories").select("id,name,slug,summary").order("name"),
        client.from("products").select("id,slug,name,category,price,sku,availability,pack,description,image,tags,featured").order("id"),
      ]);
      if (!active || categoryResult.error || productResult.error || !categoryResult.data || !productResult.data) return;
      const remoteCategories = categoryResult.data as RemoteCategory[];
      const remoteCategoryMap = new Map(remoteCategories.map((category) => [category.slug, category]));
      const orderedCategories = [
        ...fallbackCategories.map((fallback) => {
          const remote = remoteCategoryMap.get(fallback.slug);
          return remote ? { name: remote.name, slug: remote.slug, summary: remote.summary || fallback.summary, accent: fallback.accent } : fallback;
        }),
        ...remoteCategories.filter((category) => !fallbackCategories.some((fallback) => fallback.slug === category.slug)).map((category) => ({ name: category.name, slug: category.slug, summary: category.summary || "Trade catalogue category.", accent: "Trade edit" })),
      ];
      const liveProducts = (productResult.data as RemoteProduct[]).map((product) => ({
        ...product,
        id: Number(product.id),
        price: Number(product.price),
        tags: product.tags?.length ? product.tags : ["Catalogue line"],
        image: product.image || fallbackProducts[0].image,
        availability: "Availability to confirm" as const,
        priceBasis: product.sku.startsWith("GEM-") ? "Supplier unit price · ex VAT" as const : "Indicative price · ex VAT" as const,
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
