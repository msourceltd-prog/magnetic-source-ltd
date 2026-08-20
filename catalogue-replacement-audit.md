# Catalogue Replacement Audit

**Audit date:** 20 August 2026  
**Scope:** Read-only inspection of the existing Magnetic Source catalogue implementation before any deletion or import.

## Confirmed Current State

| Resource | Current state | Replacement impact |
| --- | --- | --- |
| `profiles` | 0 profile rows; role-based admin policy is present | Must not be modified by catalogue work. |
| `categories` | 13 rows | These are catalogue-only records and may be replaced only after a backup and explicit final approval. |
| `products` | 420 rows across 13 categories | These are catalogue-only records and may be replaced only after a backup and explicit final approval. |
| `demo_orders` | 0 rows | Must be preserved. |
| `demo_order_items` | 0 rows | Must be preserved. |
| Supabase Auth | Separate `auth.users` relation referenced by `profiles` | Must not be modified. |
| Product images | All 420 current product `image` fields point to `/product-image-pending.svg` | There are no matching product photos in current product records to retain. Real image URLs/assets require verification and usage authorization. |
| Cloudflare | Existing static SPA configuration points to `dist/public` with SPA fallback | Must not be changed. |

## Current Catalogue Distribution

| Category slug | Products |
| --- | ---: |
| `personal-care` | 127 |
| `home-utility` | 30 |
| `household-cleaning` | 29 |
| `diy-hardware` | 28 |
| `kitchen-dining` | 28 |
| `stationery` | 26 |
| `pets` | 24 |
| `gifts-gadgets` | 22 |
| `medical-first-aid` | 22 |
| `party-events` | 22 |
| `seasonal` | 22 |
| `baby-family` | 20 |
| `electrical-accessories` | 20 |

## Existing Dynamic Data Contract

The public storefront queries `categories` and `products` directly through the existing browser-safe Supabase client. Each product uses the following database fields: `slug`, `name`, `category`, `price`, `sku`, `availability`, `pack`, `description`, `image`, `tags`, and `featured`. The product page, search, sorting, filters, cart, admin dashboard, and no-payment order process depend on this contract.

The redesign can therefore preserve the database structure and replace only row-level catalogue content. No new database, external paid API, backend rewrite, authentication change, environment variable change, or Cloudflare configuration change is necessary for the frontend redesign itself.

## Free-Tier Constraints and Gate

The current product catalogue stores only a lightweight image-path string per product. Replacing those with externally hosted, authorized images has no Supabase Storage upload cost. Uploading a full product-photo catalogue into the existing bucket would consume Supabase Storage and must be budgeted and verified first.

The read-only client inspection did not list a `product-images` bucket, while a managed database query could not run because this web project does not have a managed database connection configured. This does not affect read-only product rows, but it means storage objects must not be assumed available for a bulk image import without owner-authorized access and a fresh validation.

> **Destructive-data gate:** Back up `categories` and `products`, validate an owner-approved replacement dataset, and obtain final explicit confirmation immediately before deleting the existing catalogue rows. Preserve `profiles`, Supabase Auth, `demo_orders`, `demo_order_items`, storage configuration, environment variables, and Cloudflare configuration.
