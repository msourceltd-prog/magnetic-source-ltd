/**
 * Trade Ledger, Recut: homepage-only collection rails use Source Cobalt controls,
 * ledger-card product evidence, and the live catalogue tags without creating
 * separate collection destinations or duplicating department navigation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/catalogRuntime";

type HomeCollectionCarouselProps = {
  id: string;
  title: string;
  evidence: string;
  products: Product[];
};

const interleaveByCategory = (products: Product[]) => {
  const groups = new Map<string, Product[]>();
  for (const product of products) groups.set(product.category, [...(groups.get(product.category) ?? []), product]);
  const orderedGroups = Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([, entries]) => entries);
  const ordered: Product[] = [];
  for (let index = 0; ordered.length < products.length; index += 1) {
    for (const entries of orderedGroups) {
      const product = entries[index];
      if (product) ordered.push(product);
    }
  }
  return ordered;
};

export default function HomeCollectionCarousel({ id, title, evidence, products }: HomeCollectionCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canMoveBack, setCanMoveBack] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(false);
  const orderedProducts = useMemo(() => interleaveByCategory(products), [products]);

  const refreshControls = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nextCanMoveBack = viewport.scrollLeft > 4;
    const nextCanMoveForward = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 4;
    setCanMoveBack((current) => current === nextCanMoveBack ? current : nextCanMoveBack);
    setCanMoveForward((current) => current === nextCanMoveForward ? current : nextCanMoveForward);
  }, []);

  useEffect(() => {
    refreshControls();
    window.addEventListener("resize", refreshControls);
    return () => window.removeEventListener("resize", refreshControls);
  }, [products.length, refreshControls]);

  const move = (direction: "back" | "forward") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: (direction === "forward" ? 1 : -1) * Math.max(viewport.clientWidth * 0.88, 320), behavior: "smooth" });
  };

  if (!products.length) return null;

  return <section className="home-collection" aria-labelledby={`${id}-title`}>
    <div className="trade-shell home-collection-heading">
      <div>
        <p className="eyebrow">Live catalogue selection</p>
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{evidence}</p>
      </div>
      <div className="home-collection-controls" aria-label={`${title} carousel controls`}>
        <button type="button" onClick={() => move("back")} disabled={!canMoveBack} aria-label={`Previous ${title.toLowerCase()} products`}><ChevronLeft size={21} /></button>
        <button type="button" onClick={() => move("forward")} disabled={!canMoveForward} aria-label={`Next ${title.toLowerCase()} products`}><ChevronRight size={21} /></button>
      </div>
    </div>
    <div className="trade-shell home-collection-shell">
      <div className="home-collection-viewport" ref={viewportRef} onScroll={refreshControls}>
        {orderedProducts.map((product, index) => <div className="home-collection-card" key={product.id}><ProductCard product={product} compact priority={index < 5} /></div>)}
      </div>
    </div>
  </section>;
}
