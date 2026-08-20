# Bulk Wholesale Sweets Replacement Plan

## Scope Prepared for Final Approval

The verified import package contains **1,707 Sweets & Confectionery products** from the owner-authorized Bulk Wholesale Sweets source. Every prepared record has a unique SKU, unique slug, unique matching image URL, factual description, visible GBP price, and a category of `sweets-confectionery`. All prepared images returned a successful image response during validation.

| Requirement | Prepared result |
| --- | --- |
| Product images | 1,707 unique, reachable product image URLs; no placeholder records. |
| Product prices | 1,707 visible supplier-listed GBP prices; labelled **ex VAT**. |
| Descriptions | 1,321 supplier descriptions; 386 factual title-and-pack descriptions where supplier copy was blank. |
| Product codes | Unique source SKU retained where supplied; source ID used only where the source SKU was blank. |
| Pack information | Derived only from product title / supplied variant weight where available. |
| Stock quantities | Not retained as a supplier count and not rendered publicly. |
| Category | One clean `Sweets & Confectionery` category; no duplicate category structure. |
| Existing data backup | `/home/ubuntu/magnetic-source-catalogue-backups/catalogue-before-bulk-sweets-2026-08-20.json` — 13 categories and 420 products. |

## Safe Replacement Sequence

The non-executed replacement script imports the new category and all 1,707 verified products **before** deleting any existing product rows. It then verifies the new product count. Only after that check passes does it delete the 420 backed-up old products and their 13 old categories. This prevents an empty catalogue if the new import fails.

The script never touches `profiles`, Supabase Auth, `demo_orders`, `demo_order_items`, storage objects, environment variables, Cloudflare settings, or application architecture. It requires a fresh server-only Supabase service-role credential supplied at the moment of execution; it must never be placed in frontend code or Cloudflare public variables.

> **Final approval required:** Running the replacement deletes the old 420 product rows and 13 old category rows. It will leave one category — Sweets & Confectionery — containing 1,707 verified product rows. No other departments can be added until the owner provides an authorized source for them.

## Prepared Source Files

The source files are kept outside the deployed web project to prevent unnecessary deployment size:

| File | Purpose |
| --- | --- |
| `/home/ubuntu/bulk-wholesale-sweets-source/products-normalized.json` | Validated source record set with source verification fields. |
| `/home/ubuntu/bulk-wholesale-sweets-source/products-import.json` | Existing-Supabase-schema product import payload. |
| `/home/ubuntu/bulk-wholesale-sweets-source/categories-import.json` | Single category import payload. |
| `/home/ubuntu/bulk-wholesale-sweets-source/source-verification-manifest.json` | Source URL and source-record traceability. |
| `/home/ubuntu/bulk-wholesale-sweets-source/import-readiness-report.json` | Completeness, duplicate, stock-leak, price, image, and category checks. |
| `/home/ubuntu/bulk-wholesale-sweets-source/image-delivery-report.json` | Reachability test for all 1,707 image URLs. |
