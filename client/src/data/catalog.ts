/**
 * Trade Ledger, Recut: fallback catalogue data for the Magnetic Source
 * wholesale interface. The price-free compact catalogue uses an explicit
 * quote-required display rule while retaining a schema-safe numeric value.
 */
export type Category = {
  name: string;
  slug: string;
  summary: string;
  accent: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  availability: "Availability to confirm";
  pack: string;
  description: string;
  image: string;
  tags: string[];
  featured: boolean;
  priceBasis: "Indicative price · ex VAT" | "Supplier unit price · ex VAT" | "Supplier listed price · ex VAT" | "Price on request";
  brand: null;
};

import qualitySpecs from "./catalogue-quality-specs.json";
import gemPersonalCareSpecs from "./gem-personal-care-specs.json";

export const categories: Category[] = [
  { name: "Home & Utility", slug: "home-utility", summary: "Useful home lines with dependable everyday appeal.", accent: "Warm goods" },
  { name: "DIY & Hardware", slug: "diy-hardware", summary: "Small fixings, tools and practical project supplies.", accent: "Trade essentials" },
  { name: "Stationery", slug: "stationery", summary: "Compact desk, school and paper-goods staples.", accent: "Everyday margin" },
  { name: "Personal Care", slug: "personal-care", summary: "Considered personal essentials for daily routines.", accent: "Routine ready" },
  { name: "Kitchen & Dining", slug: "kitchen-dining", summary: "Useful kitchen lines selected for repeat purchase.", accent: "Household core" },
  { name: "Pets", slug: "pets", summary: "Small pet-care solutions and practical accessories.", accent: "Pet section" },
  { name: "Seasonal", slug: "seasonal", summary: "Flexible lines for seasonal stories and gifting moments.", accent: "Seasonal edit" },
  { name: "Gifts & Gadgets", slug: "gifts-gadgets", summary: "Compact giftable items with point-of-sale potential.", accent: "Impulse friendly" },
  { name: "Baby & Family", slug: "baby-family", summary: "Practical family essentials selected for everyday use.", accent: "Family lines" },
  { name: "Electrical Accessories", slug: "electrical-accessories", summary: "Compact power, cable and desk accessories with clear utility.", accent: "Powered basics" },
  { name: "Household & Cleaning", slug: "household-cleaning", summary: "Useful cleaning and household organisation lines for regular purchase.", accent: "Home upkeep" },
  { name: "Medical & First Aid", slug: "medical-first-aid", summary: "Simple, non-prescription everyday care and preparation essentials.", accent: "Care ready" },
  { name: "Party & Events", slug: "party-events", summary: "Easy-to-merchandise celebration and gathering supplies.", accent: "Event edit" },
];

const categoryImages: Record<string, string> = {
  "baby-family": "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1000&q=80",
  "diy-hardware": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
  "electrical-accessories": "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1000&q=80",
  "gifts-gadgets": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1000&q=80",
  "home-utility": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
  "household-cleaning": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1000&q=80",
  "kitchen-dining": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
  "medical-first-aid": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1000&q=80",
  "party-events": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
  "personal-care": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80",
  pets: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1000&q=80",
  seasonal: "https://images.unsplash.com/photo-1453306458620-5bbef13a5bca?auto=format&fit=crop&w=1000&q=80",
  stationery: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=80",
};

export const SUPPLIER_IMAGE_PLACEHOLDER = "/product-image-pending.svg";

type CatalogueSpec = {
  name: string;
  category: string;
  price: number;
  pack: string;
  description: string;
  sku?: string;
  priceBasis?: Product["priceBasis"];
};

const catalogueSpecs: CatalogueSpec[] = [
  ...(qualitySpecs as CatalogueSpec[]).filter((spec) => spec.category !== "personal-care"),
  ...(gemPersonalCareSpecs as CatalogueSpec[]),
];
const categoryCode = (slug: string) => slug.split("-").map((part) => part[0]).join("").toUpperCase();
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const products: Product[] = catalogueSpecs.map((spec, index) => ({
  id: index + 1,
  slug: `${slugify(spec.name)}-${index + 1}`,
  name: spec.name,
  category: spec.category,
  price: spec.price,
  sku: spec.sku || `MS-${categoryCode(spec.category)}-${String(2001 + index).padStart(4, "0")}`,
  availability: "Availability to confirm",
  pack: spec.pack,
  description: spec.description,
  image: SUPPLIER_IMAGE_PLACEHOLDER,
  tags: ["Catalogue line"],
  featured: false,
  priceBasis: spec.priceBasis || "Indicative price · ex VAT",
  brand: null,
}));

export const formatGBP = (value: number) => new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
}).format(value);

export const isPriceHidden = (product: Pick<Product, "tags" | "priceBasis">) => product.priceBasis === "Price on request" || product.tags.includes("Price hidden");

export function productBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function categoryBySlug(slug?: string) {
  return categories.find((category) => category.slug === slug);
}
