# Price-Free Catalogue Model

The existing `products.price` field is a non-null numeric column, and historic order items also require a numeric unit price. No schema change is required or permitted for the compact catalogue refresh. Every replacement product will therefore retain the safe numeric value `0.00` in storage while carrying a `Price hidden` tag.

The storefront will treat that tag as an explicit display rule: it will show **Price on request** rather than a currency amount, exclude that product from price-range sorting and filtering, and route the shopper to a no-payment enquiry flow. No public stock or availability information is stored or rendered. This retains the existing tables, orders, auth, RLS, API calls, and free-tier footprint.

| Concern | Price-free compact catalogue handling |
| --- | --- |
| `products.price` non-null field | Store `0.00` only as a database compatibility value; never present it as a price. |
| Product card and detail page | Display **Price on request** and factual product information only. |
| Basket and order enquiry | Treat products as quote-required; do not represent a zero value as a quoted trade price. |
| Existing orders and users | Leave untouched. |
| Stock display | Do not import or show stock values. |
