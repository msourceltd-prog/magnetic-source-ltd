# Magnetic Source Wholesale Catalogue Model

**Design direction:** *Trade Ledger, Recut* — a premium, information-rich wholesale interface with the speed and clarity of a trade desk. It is informed by the owner-supplied reference's public browsing structure but uses Magnetic Source branding, original copy, original styling, and only authorized product data and imagery.

## Category Model

The existing schema deliberately stores a single category slug per product. To avoid a migration, primary departments remain rows in `categories`; detailed ranges can be represented through the existing `tags` field and the search index. This preserves the backend, API, admin tooling, and free-tier footprint.

| Primary category | Example controlled tags / sub-ranges | Add category only when verified products exist |
| --- | --- | --- |
| Sweets & Confectionery | Kids & novelty, pre-pack, share bags, snacks, seasonal | Yes |
| Toys & Games | Creative play, games & jigsaws, figures & playsets, outdoor play, soft toys | Yes |
| Health & Beauty | Personal care, bath & body, hair care, health essentials | Yes |
| Household | Cleaning, kitchen, storage, home care | Yes |
| Stationery | Writing, paper, art & craft, school | Yes |
| Gifts | Gift sets, novelty, seasonal, home accessories | Yes |
| Food & Drinks | Beverages, snacks, pantry, impulse | Yes |

No category should be populated with unrelated products merely to make the navigation look full. Unverified departments remain absent until a source provides valid records.

## Product Card Contract

Every visible product card and detail page will load the following existing database values dynamically:

| Field | Display treatment | Validation rule |
| --- | --- | --- |
| `image` | Clean square product frame; no generic placeholder in an imported record | Exact product match and authorized use required. |
| `name` | Two- to three-line product title | Exact owner-approved name. |
| `description` | One concise factual sentence on card; full factual copy on detail page | Supplied or authorized source facts only. |
| `price` | Prominent GBP price labelled **ex VAT** | Owner-approved selling price; never inferred from a competitor login price. |
| `sku` | Compact mono label | Unique source product code or Magnetic Source code. |
| `pack` | Compact mono label | Exact case/pack quantity where supplied. |
| `availability` | Optional restrained stock statement | Current source data only; otherwise a neutral availability policy. |
| `tags` | Controlled department / range labels | Category-relevant terms only. |

## Interface Model

The desktop shop has a clear category banner, an accessible left-hand category and price rail, a practical product count and sorting line, and a three-column product field. The mobile shop collapses the rail into a full-height filter sheet while retaining search, sort, card imagery, price, and add-to-basket actions above the fold.

The visual system retains warm paper, Source Cobalt, graphite ink, editorial headlines, practical sans-serif controls, and mono specification labels. Product images sit on clean neutral frames rather than on reused category photographs. Badges are reserved for verified status such as `New` or `Offer`; every unverified claim is omitted.

## Price Policy

All replacement records will display **GBP per listed pack, ex VAT** unless the owner supplies a different explicit selling-price policy. The price should be a normal visible currency figure in the database and storefront. The source reference's `Login to view prices` gate will not be reproduced.

> A public RRP does not establish the wholesale or selling price for Magnetic Source. Each imported `price` must come from the owner or an approved commercial source.
