/**
 * Trade Ledger, Recut: lightweight runtime product contracts and display helpers.
 * Keeping them separate prevents the legacy sample catalogue from entering public bundles.
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
  description: string | null;
  image: string;
  tags: string[];
  featured: boolean;
  priceBasis: "Indicative price · ex VAT" | "Supplier unit price · ex VAT" | "Supplier listed price · ex VAT" | "Price on request";
  brand: null;
};

export const SUPPLIER_IMAGE_PLACEHOLDER = "/product-image-pending.svg";

export const currentCategories: Category[] = [
  { name: "Household", slug: "household-pet", summary: "Practical household lines for everyday retail.", accent: "Trade edit" },
  { name: "Sweets & Snacks", slug: "sweets-snacks", summary: "Confectionery and snack lines for independent retail.", accent: "Trade edit" },
  { name: "Toys & Gifts", slug: "toys-gifts", summary: "Giftable and playful lines for everyday retail.", accent: "Trade edit" },
  { name: "Pets", slug: "pets", summary: "Pet care, accessories and everyday animal essentials for retail.", accent: "Trade edit" },
  { name: "Stationery", slug: "stationery-party", summary: "Practical stationery and display lines for everyday retail.", accent: "Trade edit" },
  { name: "Health & Beauty", slug: "health-beauty", summary: "Health and beauty essentials for retail buyers.", accent: "Trade edit" },
  { name: "Seasonal & Christmas", slug: "seasonal-christmas", summary: "Seasonal retail lines and Christmas essentials.", accent: "Trade edit" },
  { name: "Clearance", slug: "clearance", summary: "Selected clearance lines for trade buyers.", accent: "Trade edit" },
  { name: "Baby & Kids", slug: "baby-kids", summary: "Baby care, nursery essentials and children’s lines.", accent: "Trade edit" },
];

export const formatGBP = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
export const isPriceHidden = (product: Pick<Product, "tags" | "priceBasis">) => product.priceBasis === "Price on request" || product.tags.includes("Price hidden");
export const hasCustomerPrice = (product: Pick<Product, "price" | "tags" | "priceBasis">) => product.price > 0 && !isPriceHidden(product);
