import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_KEY is unavailable");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const categories = [
  ["Home & Utility", "home-utility", "Useful home lines with dependable everyday appeal."],
  ["DIY & Hardware", "diy-hardware", "Small fixings, tools and practical project supplies."],
  ["Stationery", "stationery", "Compact desk, school and paper-goods staples."],
  ["Personal Care", "personal-care", "Considered personal essentials for daily routines."],
  ["Kitchen & Dining", "kitchen-dining", "Useful kitchen lines selected for repeat purchase."],
  ["Pets", "pets", "Small pet-care solutions and practical accessories."],
  ["Seasonal", "seasonal", "Flexible lines for seasonal stories and gifting moments."],
  ["Gifts & Gadgets", "gifts-gadgets", "Compact giftable items with point-of-sale potential."],
  ["Baby & Family", "baby-family", "Practical family essentials selected for everyday use."],
  ["Electrical Accessories", "electrical-accessories", "Compact power, cable and desk accessories with clear utility."],
  ["Household & Cleaning", "household-cleaning", "Useful cleaning and household organisation lines for regular purchase."],
  ["Medical & First Aid", "medical-first-aid", "Simple, non-prescription everyday care and preparation essentials."],
  ["Party & Events", "party-events", "Easy-to-merchandise celebration and gathering supplies."],
].map(([name, slug, summary]) => ({ name, slug, summary }));

const images = [
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

const templates = [
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
];

const categoryCode = (slug) => slug.split("-").map((part) => part[0]).join("").toUpperCase();
const seriesNames = ["", "Core", "Compact", "Everyday", "Utility", "Stockroom", "Trade", "Shelf"];
const products = Array.from({ length: 240 }, (_, index) => {
  const [baseName, category, basePrice, pack, description] = templates[index % templates.length];
  const run = Math.floor(index / templates.length) + 1;
  const price = Number((basePrice + ((run * 3) % 7) * 0.25).toFixed(2));
  const name = run === 1 ? baseName : `${seriesNames[run] || "Trade"} ${baseName}`;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${run}`;
  return {
    slug,
    name,
    category,
    price,
    sku: `MS-${categoryCode(category)}-${String(1001 + index).padStart(4, "0")}`,
    availability: index % 11 === 0 ? "Limited stock" : "In stock",
    pack,
    description,
    image: images[index % images.length],
    tags: index % 5 === 0 ? ["Featured", "Marketplace-ready"] : ["Trade edit"],
    featured: index < 16,
  };
});

if (process.env.SUPABASE_ACCESS_TOKEN) {
  const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
  const categoryValues = categories.map((category) => `(${quote(category.name)}, ${quote(category.slug)}, ${quote(category.summary)})`).join(",\n");
  const productValues = products.map((product) => `(${quote(product.slug)}, ${quote(product.name)}, ${quote(product.category)}, ${product.price}, ${quote(product.sku)}, ${quote(product.availability)}, ${quote(product.pack)}, ${quote(product.description)}, ${quote(product.image)}, array[${product.tags.map(quote).join(", ")}], ${product.featured})`).join(",\n");
  const query = `begin;
insert into public.categories (name, slug, summary) values
${categoryValues}
on conflict (slug) do update set name = excluded.name, summary = excluded.summary;

insert into public.products (slug, name, category, price, sku, availability, pack, description, image, tags, featured) values
${productValues}
on conflict (sku) do update set slug = excluded.slug, name = excluded.name, category = excluded.category, price = excluded.price, availability = excluded.availability, pack = excluded.pack, description = excluded.description, image = excluded.image, tags = excluded.tags, featured = excluded.featured, updated_at = now();
commit;`;
  const ref = new URL(url).hostname.split(".")[0];
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Catalogue import failed (${response.status}): ${await response.text()}`);
} else {
  const { error: categoryError } = await supabase.from("categories").upsert(categories, { onConflict: "slug" });
  if (categoryError) throw categoryError;
  for (let offset = 0; offset < products.length; offset += 50) {
    const { error } = await supabase.from("products").upsert(products.slice(offset, offset + 50), { onConflict: "sku" });
    if (error) throw error;
  }
}

console.log(JSON.stringify({ importedCategories: categories.length, importedProducts: products.length }, null, 2));
