# Price-Free Catalogue Validation

**Date:** 20 August 2026

The approved replacement completed successfully. The live Supabase catalogue now contains eight categories and 319 products: 40 products in each of Household & Pet, Sweets & Snacks, Charging & Electrical, Toys & Gifts, Stationery & Party, Health & Beauty, Seasonal & Christmas, plus 39 valid Clearance products.

| Validation | Result |
| --- | --- |
| Product count | 319 |
| Category count | 8 |
| Exact matching product images | 319 confirmed; no placeholder or duplicate image URLs |
| Public price policy | All 319 records carry `Price hidden`; the public interface shows **Price on request**, never `£0.00` |
| Public stock policy | No imported source stock, availability count, or stock-status text |
| Protected records | Users, authentication, profiles, existing orders, order items, and storage objects were left untouched |

The live shop now refreshes from Supabase after its catalogue request completes. The product-detail check confirmed the exact image, factual description, product reference, pack format, enquiry quantity control, and price-on-request treatment render together without a public stock quantity.
