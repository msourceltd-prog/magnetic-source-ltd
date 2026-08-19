import fs from "node:fs";

const url = process.env.SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !accessToken) throw new Error("SUPABASE_URL or SUPABASE_ACCESS_TOKEN is unavailable");

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
];

const categoryImages = {
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
const qualitySpecs = JSON.parse(fs.readFileSync(new URL("../client/src/data/catalogue-quality-specs.json", import.meta.url), "utf8"));
const categoryCode = (slug) => slug.split("-").map((part) => part[0]).join("").toUpperCase();
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const products = qualitySpecs.map((spec, index) => ({
  slug: `${slugify(spec.name)}-${index + 1}`,
  name: spec.name,
  category: spec.category,
  price: spec.price,
  sku: `MS-${categoryCode(spec.category)}-${String(2001 + index).padStart(4, "0")}`,
  availability: index % 13 === 0 ? "Limited stock" : "In stock",
  pack: spec.pack,
  description: spec.description,
  image: categoryImages[spec.category],
  tags: index < 18 ? ["Featured", "Marketplace-ready"] : ["Trade edit"],
  featured: index < 18,
}));

const categoryValues = categories.map(([name, slug, summary]) => `(${quote(name)}, ${quote(slug)}, ${quote(summary)})`).join(",\n");
const productValues = products.map((product) => `(${quote(product.slug)}, ${quote(product.name)}, ${quote(product.category)}, ${product.price}, ${quote(product.sku)}, ${quote(product.availability)}, ${quote(product.pack)}, ${quote(product.description)}, ${quote(product.image)}, array[${product.tags.map(quote).join(", ")}], ${product.featured})`).join(",\n");
const query = `begin;
insert into public.categories (name, slug, summary) values
${categoryValues}
on conflict (slug) do update set name = excluded.name, summary = excluded.summary;
delete from public.products where sku like 'MS-%';
insert into public.products (slug, name, category, price, sku, availability, pack, description, image, tags, featured) values
${productValues};
commit;`;
const ref = new URL(url).hostname.split(".")[0];
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
if (!response.ok) throw new Error(`Catalogue import failed (${response.status}): ${await response.text()}`);
console.log(JSON.stringify({ importedCategories: categories.length, importedProducts: products.length }, null, 2));
