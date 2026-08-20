# Magnetic Source Multi-Category Model

## Database-Compatible Department Map

The existing `categories` table remains the source of top-level navigation. Each product continues to use its current `category`, `tags`, `slug`, `price`, `sku`, `pack`, `description`, `image`, and `featured` fields. No schema migration, new service, storage bucket, or API change is required.

| Category name | Slug | Product sources mapped into it | Tag usage |
| --- | --- | --- | --- |
| Health & Beauty | `health-beauty` | Toiletries, cosmetic beauty, medicines, first aid, baby, vitamins | Subdepartment, brand, product type |
| Stationery & Party | `stationery-party` | Writing, office, cards, wrap, postal, party | Subdepartment, event, brand |
| Toys & Gifts | `toys-gifts` | Games, construction, creative play, soft toys, gifts | Subdepartment, age/use, brand |
| Charging & Electrical | `charging-electrical` | Audio, batteries, chargers, cables, digital accessories | Product type, compatibility, brand |
| Sweets & Snacks | `sweets-snacks` | Confectionery, drinks, snacks, kids sweets, seasonal sweets | Product type, diet, brand |
| Household & Pet | `household-pet` | Cleaning, kitchen, household, camping, pet and leisure | Subdepartment, use, brand |
| Seasonal & Christmas | `seasonal-christmas` | Advent, cards, bags/wrap, gifts, toys, festive food | Season, event, subdepartment |
| Clearance | `clearance` | Valid discounted products from all departments | `Clearance`, original department, discount state |

`New` is a dynamic tag and sort state, not a duplicate category. `Brands` is a tag/search filter, not a category. This preserves a simple category tape and prevents hundreds of redundant rows.

## Import Field Contract

| Existing product field | Required import value | Public display rule |
| --- | --- | --- |
| `name` | Exact authorized product name | Always shown |
| `category` | One slug from the department map | Used for navigation and filters |
| `image` | Exact matching authorized product image URL | Always shown; no fallback placeholders allowed in the new import |
| `description` | Authorized product copy, or factual title-and-pack fallback only when absent | Shown on card and detail page |
| `price` | Authenticated/authorized Harrison’s pack price in GBP | Always shown as **ex VAT** |
| `sku` | Harrison’s product code | Shown as product reference |
| `pack` | Harrison’s pack quantity, formatted `Pack of N` | Shown on card and detail page |
| `tags` | Department label, approved subdepartment/brand tags, `Supplier price` | Used for discovery; not a stock channel |
| `availability` | `Availability on request` for compatibility only | Never rendered publicly |

## Mandatory Stock and Price Policy

> **No stock quantities are imported or rendered.** Source values such as `5 available`, `100+ available`, `Only 2 available`, and `Out of stock` are discarded. The current component changes already suppress the compatibility availability field on product cards and detail pages.

> **Prices must be actual per-pack Harrison’s trade prices excluding VAT.** The source public pages do not expose them, so price values can only enter the Magnetic Source catalogue after owner-authorized account access or a supplier-issued price feed is available.

## Source-Scoped Import Principle

Only data that arrives through the owner-authorized Harrison’s source may be imported. Any unavailable category or price remains unimported rather than being filled with estimates, random images, generic descriptions, or duplicate products.
