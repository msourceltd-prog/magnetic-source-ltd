# Harrison’s Direct Multi-Category Audit

**Audit date:** 20 August 2026  
**Authorization basis:** Owner confirmed that Harrison’s Direct authorizes Magnetic Source to use the necessary catalogue data, imagery, descriptions, and prices.

## Public Department Structure

The public shop taxonomy has a deep hierarchy. The principal departments observed are **Health & Beauty**, **Stationery**, **Toys & Gifts**, **Charging**, **Sweets & Snacks**, **Household**, **Christmas**, **Clearance**, and **New**, with specialty groupings such as Licensed Soft Toys and Playmobil. The top navigation additionally exposes Brands and Clearance as discovery routes.[1]

Magnetic Source can preserve its existing single-category database contract by using the following clean department map. Detailed ranges are carried through the existing `tags` array rather than creating hundreds of category rows.

| Magnetic Source category | Harrison’s-aligned source areas | Example controlled tags |
| --- | --- | --- |
| Health & Beauty | Toiletries, cosmetics, first aid, baby, vitamins | Dental, hair care, bath & shower, first aid, baby care |
| Stationery & Party | Writing, paper, cards, gift wrap, party, postal supplies | Pens, notebooks, greeting cards, gift bags, partyware |
| Toys & Gifts | Creative play, games, figures, outdoor, soft toys, gifts | Games & jigsaws, creative play, soft toys, novelty gifts |
| Charging & Electrical | Audio, batteries, charging accessories, digital accessories | Batteries, charging cables, power banks, audio |
| Sweets & Snacks | Confectionery, drinks, snacks, seasonal, kids sweets | Gummies, pre-pack bags, snacks, beverages, seasonal |
| Household & Pet | Cleaning, kitchen, household sundries, camping, pet & leisure | Laundry, kitchen, cleaning, pet treats, pet accessories |
| Seasonal & Christmas | Advent, bags/wrap, cards, Christmas sweets, gifts, toys | Christmas cards, seasonal gifting, advent, festive confectionery |
| Clearance | Discounted valid products from all departments | Clearance |

`New` should be a dynamic tag/filter based on current product records rather than a separate product category. `Brands` should be a search/filter dimension rather than a category table row.

## Product Fields and Stock Rule

Public listing cards disclose product name, product code, pack quantity, status badges, availability quantities, and a price login gate. Product pages may also show public RRP and promotion data. Magnetic Source will carry only verified product name, matching image, factual description, visible price, SKU, pack format, category, and controlled tags. It will **not display or import** supplier inventory counts such as `5 available`, `100+ available`, `Out of stock`, or `Only 3 left`.

The recovered first pages for **Health & Beauty**, **Stationery**, **Toys & Gifts**, and **Charging** each show 30 category-matched product records in their listing order. The public card text consistently contains the product name, product code, pack quantity, product detail URL, a stock message, and a login-only price call-to-action. Only the first four fields are candidates for the compact Magnetic Source source set; the stock and login-only values are excluded.[3]

The corresponding first pages for **Sweets & Snacks**, **Household & Pet**, **Seasonal & Christmas**, and **Clearance** confirm the same product-card field pattern. Seasonal has 59 live source products and Clearance has 39, so the compact selection must preserve the truthful 39-product Clearance maximum instead of creating a duplicate. No stock quantity, percentage-off label, RRP, or source trade-price gate will be transferred.[4]

The public rendered page continues to expose the department narrative and category hierarchy without authentication. The connected-browser DOM export timed out, so product-image mapping will use only the available read-only public image metadata route rather than attempting browser retries or source login.[5]

For the compact source set, each product page’s public Open Graph image was checked with a standard browser request. Where a product page exposed the generic site banner instead of its product image, the public WordPress media endpoint was queried by exact product code and accepted only a media record whose filename, title, alt text, or URL included that same code. This preserves a one-product-to-matching-image rule without accessing trade prices or inventory data.[6]

Eight generic-banner exceptions were corrected from the exact public media records identified by their matching product codes, including `72656F`, `72753A`, `72996L`, `72770B`, `72769X`, `72768U`, `72767R`, and `72766O`. Each replacement image URL carries the same code in its public media filename, so no repeated generic banner remains in the compact source set.[7]

## Price Access Gate

The source publicly replaces trade prices with `Login to view prices`. The public FAQ states that prices and stock are available online to trade-account users, that all prices are shown **per pack** and **excluding VAT**, and that it does not provide a CSV price or product list.[2] Therefore a verified full-category import needs one of the following owner-authorized inputs before any price can be loaded into the public Magnetic Source storefront:

1. An authenticated Harrison’s Direct trade-account session made available for permitted data access; or
2. A written supplier feed, export, or price list containing the authorized product prices.

> Magnetic Source must not invent prices from public RRP or derive them from a competitor margin. All imported visible prices must be sourced from the owner-authorized trade price access.

## References

1. [Harrison’s Direct — Shop](https://www.harrisonsdirect.co.uk/shop/)
2. [Harrison’s Direct — Frequently Asked Questions](https://www.harrisonsdirect.co.uk/faqs/)
3. [Harrison’s Direct — Wholesale Health & Beauty](https://www.harrisonsdirect.co.uk/product-category/health-beauty/)
4. [Harrison’s Direct — Clearance](https://www.harrisonsdirect.co.uk/product-category/clearance/)
