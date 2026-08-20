# Bulk Wholesale Sweets Source Audit

**Audit date:** 20 August 2026  
**Source supplied by owner:** [Bulk Wholesale Sweets — Wholesale Sweets](https://www.bulkwholesalesweets.co.uk/collections/wholesale-sweets)

## Public Catalogue Findings

The collection is a **Sweets-only** source. It publicly presents a broad confectionery selection with brand and availability filters, individual product names, product images, visible sale prices, and stock statements such as `178 In Stock` or `Sold Out`. Prices are stated as excluding VAT in its public terms.[1]

For a later, authorized import, the source could inform a **Sweets & Confectionery** department, with controlled tag groups such as confectionery type, weight/pack format, brand, and promotion status. It cannot provide genuine products for unrelated departments such as Toys & Games, Household, Stationery, Health & Beauty, Gifts, or Food & Drinks.

## Required Stock-Display Rule

Magnetic Source must not display supplier inventory numbers. Its public card and detail UI should show no quantity such as `178 In Stock`, `Only 3 Left`, or `Sold Out`. The existing `availability` database field can remain unchanged for compatibility, but the revised public product-card and detail components must omit it.

## Content-Reuse Restriction

The supplier's public terms explicitly state:

> “All content on this site such as images, logos and text is property of www.bulkwholesalesweets.co.uk. If any of it is reproduced, changed or altered in any way, we will not hesitate to instruct legal representation to act on our behalf.” [1]

Therefore, this public website is **not an authorized source for copying product images, descriptions, or other catalogue content into Magnetic Source**. Its visible prices, names, category signals, and public availability are research observations only; they must not be imported or republished without written supplier authorization. The owner must provide a product feed, image-license approval, reseller agreement, or another authorized supplier source before an accurate image-backed replacement catalogue can be prepared.

## References

1. [Bulk Wholesale Sweets — Terms & Conditions](https://www.bulkwholesalesweets.co.uk/policies/terms-of-service)
2. [Bulk Wholesale Sweets — Wholesale Sweets Collection](https://www.bulkwholesalesweets.co.uk/collections/wholesale-sweets)
