# Harrison’s Direct Reference Audit

**Purpose.** This record captures publicly observable wholesale-commerce patterns from the owner-provided reference. It is a design and information-architecture reference only. Magnetic Source will retain its own name, copy, branded assets, product data, pricing policy, and implementation.

## Transferable Structure

The reference uses a three-tier trade header: a small operational strip, a main identity/search/account row, and a high-contrast department navigation band. Under the navigation it places a compact benefit strip. Category pages use a breadcrumb and category introduction, followed by a left filtering column and an adjacent product listing area with result count, sort control, pagination, and a multi-column desktop grid.

| Area | Public pattern observed | Magnetic Source implementation direction |
| --- | --- | --- |
| Trade header | Search, trade-account entry point, basket, prominent departments | Retain Magnetic Source brand and account routes; rebuild hierarchy around clear search, categories, and basket access. |
| Category page | Breadcrumb, short category statement, sidebar taxonomy, sort, result count, product grid | Use a clean category banner plus an accessible desktop sidebar and a mobile filter drawer. |
| Product cards | Product image, freshness or promotion badge, save control, name, SKU, pack quantity, availability, commercial call-to-action | Show name, real image, short description, **visible ex-VAT GBP price**, SKU, and pack quantity; only show stock where the source is verified. |
| Product page | Breadcrumbs, large product visual, compact fact list, delivery information, related products | Present owner-approved product description, price, SKU, pack quantity, and genuine image with related products from the same Magnetic Source category. |
| Responsive behavior | Dense desktop navigation and compact product browsing controls | Collapse filters into a drawer and use a consistent 2-column mobile product grid where readability permits. |

## Reference Category Signals

The public primary navigation highlights: **New**, **Health & Beauty**, **Stationery**, **Toys & Gifts**, **Charging**, **Sweets & Snacks**, **Household**, **Brands**, and **Clearance**. Public category pages then expose deeper department-specific groups, such as kids sweets, pre-pack bags, snacks, and seasonal lines for confectionery, and creative play, games, soft toys, outdoor play, and gifts for toys.

Magnetic Source should adopt only categories that it can supply with validated products. The starting target departments are **Sweets & Confectionery**, **Toys & Games**, **Health & Beauty**, **Household**, **Stationery**, **Gifts**, and **Food & Drinks**. A department should not be created merely to mirror the reference if no approved catalogue products support it.

## Data Fields Observed

Public reference cards disclose product name, product code, pack quantity, current availability, and a trade-price gate. The representative public product page also shows breadcrumb taxonomy, pack quantity, stock, RRP, and product code. It does **not** disclose the trade price.

Magnetic Source requires a different, explicit card contract:

1. Exact owner-approved product name and supplier-authorized image.
2. Short description derived from an authorized source or written from supplied factual specifications.
3. Visible GBP selling price, labelled consistently as either `ex VAT` or `inc VAT`.
4. SKU and pack quantity where available.
5. Availability only when it is supplied by an authorized, current data source.

> A visible selling price cannot be inferred from a login-only competitor trade price. It must be provided by the owner or an approved supplier/retail source, and each image must be authorized for Magnetic Source use.

## Sources

1. [Harrison’s Direct — New](https://www.harrisonsdirect.co.uk/product-category/new/)
2. [Harrison’s Direct — Toxic Waste Apple Popcorn 120g](https://www.harrisonsdirect.co.uk/product/toxic-waste-apple-popcorn-120g/)
3. [Harrison’s Direct — Wholesale Sweets & Snacks](https://www.harrisonsdirect.co.uk/product-category/sweets-snacks/)
4. [Harrison’s Direct — Wholesale Toys & Gifts](https://www.harrisonsdirect.co.uk/product-category/wholesale-toys-gifts/)
