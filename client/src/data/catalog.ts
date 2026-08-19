/**
 * Trade Ledger, Recut: original sample-catalogue data for the Magnetic Source
 * approval demo. Products are intentionally generic and contain no copied
 * supplier catalogue data, imagery, or naming.
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
  previousPrice?: number;
  sku: string;
  availability: "In stock" | "Limited stock";
  pack: string;
  description: string;
  image: string;
  tags: string[];
  featured: boolean;
};

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

const productImages = [
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
];

const productTemplates = [
  ["Modular Storage Caddy", "home-utility", 4.5, "Pack of 6", "A neat, durable caddy for drawers, shelves and utility cupboards."],
  ["Microfibre Cloth Set", "home-utility", 2.95, "Pack of 12", "Soft, absorbent everyday cloths selected for practical repeat purchase."],
  ["Brass Finish Utility Hook", "diy-hardware", 3.25, "Pack of 8", "Compact wall hooks with a tidy finish for home organisation projects."],
  ["Precision Driver Kit", "diy-hardware", 6.5, "Pack of 4", "A compact screwdriving kit designed for smaller household fixes."],
  ["Soft Cover Note Book", "stationery", 2.45, "Pack of 10", "A simple lined notebook with tactile cover and useful shelf presence."],
  ["Fine Point Pen Pair", "stationery", 1.8, "Pack of 12", "Reliable daily-writing pens presented in a compact counter-ready pack."],
  ["Travel Care Case", "personal-care", 3.75, "Pack of 6", "A compact case for organising personal essentials away from home."],
  ["Reusable Cotton Pads", "personal-care", 2.8, "Pack of 10", "A soft reusable accessory for considered daily-care routines."],
  ["Silicone Prep Bowl", "kitchen-dining", 3.15, "Pack of 6", "Flexible, useful prep bowls in a space-saving stackable format."],
  ["Bamboo Peg Set", "kitchen-dining", 2.25, "Pack of 12", "A natural-material household staple for drying and organising."],
  ["Pocket Pet Brush", "pets", 2.95, "Pack of 6", "A compact pet grooming accessory with a simple useful form."],
  ["Treat Storage Tin", "pets", 4.25, "Pack of 4", "A tidy storage tin for pet treats, suited to home and gift displays."],
  ["Paper Party Fan Set", "seasonal", 2.65, "Pack of 8", "A lightweight, compact seasonal decoration for easy merchandising."],
  ["Mini LED Clip Light", "seasonal", 3.95, "Pack of 6", "A compact ambient accent suitable for seasonal display stories."],
  ["Cable Tidy Kit", "gifts-gadgets", 2.75, "Pack of 10", "Small practical cable organisers with a clear everyday use case."],
  ["Desktop Focus Timer", "gifts-gadgets", 5.5, "Pack of 4", "A compact desk companion for workspaces, study corners and gifting."],
  ["Easy Grip Snack Pot", "baby-family", 3.45, "Pack of 6", "A compact lidded snack pot designed for simple family routines."],
  ["Soft Touch Bib Clip", "baby-family", 2.35, "Pack of 10", "A lightweight everyday accessory with an easy, practical purpose."],
  ["Braided Charge Lead", "electrical-accessories", 3.95, "Pack of 6", "A compact charging and cable-management line for daily desk use."],
  ["Multi-Port Desk Hub", "electrical-accessories", 7.25, "Pack of 4", "A tidy multi-port accessory chosen for home-office and travel displays."],
  ["Refillable Spray Bottle", "household-cleaning", 2.65, "Pack of 8", "A simple reusable household bottle with clear practical utility."],
  ["Scrub Pad Bundle", "household-cleaning", 2.95, "Pack of 12", "Textured cleaning pads suited to kitchen and home-upkeep displays."],
  ["Compact Care Pouch", "medical-first-aid", 4.15, "Pack of 4", "A small organiser pouch intended for non-prescription everyday essentials."],
  ["Travel Plaster Tin", "medical-first-aid", 3.35, "Pack of 6", "A compact tin-format line selected for practical travel preparation."],
  ["Table Confetti Pack", "party-events", 2.45, "Pack of 10", "A lightweight event detail for accessible celebration displays."],
  ["Reusable Party Cup Set", "party-events", 3.85, "Pack of 6", "A useful, easy-to-store set suited to casual events and gatherings."],
  ["Fold Flat Storage Box", "home-utility", 3.85, "Pack of 4", "A collapsible storage line with clear home-organisation value."],
  ["Measuring Tape Keyring", "diy-hardware", 2.55, "Pack of 12", "A small practical hardware accessory with an obvious use case."],
  ["Weekly Desk Pad", "stationery", 3.25, "Pack of 8", "A clear weekly planning pad that keeps its purpose visible at a glance."],
  ["Insulated Lunch Pouch", "personal-care", 4.95, "Pack of 4", "A compact daily-use pouch selected for practical routine and travel use."],
  ["Clip Seal Bag Set", "kitchen-dining", 2.95, "Pack of 10", "Reusable sealing clips for straightforward kitchen organisation."],
  ["Pocket Treat Scoop", "pets", 2.55, "Pack of 8", "A small serving accessory designed for everyday pet-care routines."],
] as const;

const categoryCode = (slug: string) => slug.split("-").map((part) => part[0]).join("").toUpperCase();

const seriesNames = ["", "Core", "Compact", "Everyday", "Utility", "Stockroom", "Trade", "Shelf"];

export const products: Product[] = Array.from({ length: 240 }, (_, index) => {
  const template = productTemplates[index % productTemplates.length];
  const run = Math.floor(index / productTemplates.length) + 1;
  const [name, category, basePrice, pack, description] = template;
  const price = Number((basePrice + ((run * 3) % 7) * 0.25).toFixed(2));
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${run}`;
  return {
    id: index + 1,
    slug,
    name: run === 1 ? name : `${seriesNames[run] || "Trade"} ${name}`,
    category,
    price,
    previousPrice: index % 9 === 0 ? Number((price + 1.2).toFixed(2)) : undefined,
    sku: `MS-${categoryCode(category)}-${String(1001 + index).padStart(4, "0")}`,
    availability: index % 11 === 0 ? "Limited stock" : "In stock",
    pack,
    description,
    image: productImages[index % productImages.length],
    tags: index % 5 === 0 ? ["Featured", "Marketplace-ready"] : ["Trade edit"],
    featured: index < 16,
  };
});

export const formatGBP = (value: number) => new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
}).format(value);

export function productBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function categoryBySlug(slug?: string) {
  return categories.find((category) => category.slug === slug);
}
