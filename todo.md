# Catalogue Expansion Follow-up

- [x] Review the supplied reference’s public category structure and identify compatible original product-type additions.
- [x] Expand the original static approval-demo catalogue without reusing reference names, descriptions, SKUs, pricing, or images.
- [x] Reuse existing remote sample imagery rather than uploading additional Supabase Storage assets.
- [x] Verify the expanded count, shop search, category filters, product routes, and production build.
- [ ] Keep Supabase database rows unchanged until the owner deliberately connects an approved live data source.

## Supabase Transfer

- [x] Confirm the linked Supabase project and inspect current tables without changing existing data.
- [x] Create only the minimal catalogue, category, profile, order, and image-storage schema required by the storefront.
- [x] Import the 13 original categories and 240 original approval-demo product records.
- [x] Add frontend environment values and switch public catalogue reads to Supabase with a static fallback.
- [x] Verify row counts, public product reads, secure admin policies, and the production build.

> The authenticated SQL editor is open, but its automated editor submission did not register the pasted query. The reviewed schema is ready in `supabase/schema.sql` for manual execution in the already-open editor.

> The dashboard editor still reports an empty-query error even for `select 1;`. A Supabase Personal Access Token or direct database password is now required for an automated, supported migration route.

## GitHub and Vercel Deployment

- [x] Add Vercel routing and build configuration for the static single-page application.
- [x] Document the two public Supabase environment variables required by Vercel.
- [x] Push the deployment-ready project to a private GitHub repository.
- [x] Verify the production build and provide the exact Vercel import steps.

## GitHub Update Script

- [x] Confirm the repository remote and clean working-tree baseline.
- [x] Add a safe one-command script for committing and pushing project changes.
- [x] Test the script’s no-change behavior and document the command.

## Repository Visibility

- [x] Obtain explicit confirmation before making the private repository public.
- [x] Change GitHub repository visibility and verify it remains ready for Vercel import.

## Website Launch Checklist

- [x] Audit supplied launch items against current content, SEO, images, forms, privacy, and Vercel deployment needs.
- [x] Apply practical pre-launch hardening for media loading, metadata, accessibility, validation, and consent.
- [x] Test responsive layouts, route behavior, customer flows, and production build output.
- [x] Create a clear completed-versus-owner-action launch checklist for Vercel, custom domain, analytics, Search Console, and the first admin login.
- [x] Push launch-readiness changes to the public GitHub repository.

## Cloudflare Deployment Fix

- [x] Inspect Vite configuration and determine the required Cloudflare static-site settings.
- [x] Add the required plugin-array compatibility fix and Cloudflare build configuration.
- [x] Run a production build and push the deployment fix to GitHub.
- [x] Provide the one-step Cloudflare redeploy instruction.

## Catalogue Count Copy

- [x] Remove visible “sample catalogue lines” count wording from public storefront pages.
- [x] Verify the revised copy and push it to GitHub for Cloudflare redeployment.

## Backend Status Check

- [x] Inspect the Supabase client, local environment, and Cloudflare public-variable requirements.
- [x] Verify public categories/products and the demo-order data path using the configured Supabase project.
- [ ] Confirm the protected admin path and report any remaining live-deployment steps.

## Supplier-Ready Catalogue Quality

- [x] Inspect all existing categories, live product records, category pages, filtering, search, and product-detail routing.
- [x] Audit every existing product against its assigned category, description, image, SKU, pack format, and availability.
- [x] Define natural product coverage targets for the current category structure without adding unrelated or misleading products.
- [x] Correct inaccurate category mappings and replace non-specific product records with realistic generic UK trade catalogue content.
- [x] Add only category-appropriate products and matching professional images where category coverage is genuinely weak.
- [x] Test every category page, several product details per category, search, filtering, and cross-category exclusion.
- [x] Preserve the existing storefront design, Supabase schema, admin protection, and Cloudflare configuration.
- [x] Produce the requested final category/product quality report and synchronize approved changes to GitHub.

## Product Image Correction

- [x] Audit every current product-image assignment for duplicate use and product/category mismatch.
- [x] Replace repeated generic category photos with a neutral supplier-photo placeholder until approved visuals are available.
- [x] Update both static fallback and live Supabase image fields without changing categories, product details, design, or deployment setup.
- [x] Verify placeholder rendering on category cards and product-detail pages, then synchronize the fix to GitHub.

## Neutral Image Placeholder

- [x] Replace all current repeated and mismatched product-image URLs with a neutral supplier-photo placeholder.
- [x] Preserve product category, name, price, SKU, pack format, description, design, Supabase structure, and Cloudflare configuration.
- [x] Verify placeholder rendering, push the update to GitHub, and prepare the `/admin` upload path for real supplier images.

## Approval-Ready Wholesale Catalogue Upgrade

- [x] Complete the supplied requirement audit, including the remaining instruction pages and current live data/database fields.
- [x] Research multiple legitimate UK public wholesale sources for category conventions, pack formats, and indicative market pricing without copying protected content.
- [x] Define canonical categories, reasonable subcategories, verified-field rules, and an unambiguous ex-VAT pricing model.
- [x] Add only approved transparent product fields; do not invent brands, EANs, supplier relationships, stock quantities, prior prices, or manufacturer claims.
- [x] Improve product cards and details with clear price basis, VAT status, availability, brand/identifier blank states, and supplier-photo status.
- [x] Improve search, filters, sort controls, and load-more or pagination behavior using strict category relevance.
- [x] Keep the approved neutral supplier-photo placeholders until legitimate supplier image assets are provided.
- [x] Validate all categories, representative search terms, product details, and live Supabase records before GitHub synchronization.

## GitHub and Cloudflare Release Check

- [x] Confirm the public GitHub repository points to the latest approval-ready catalogue commit.
- [x] Confirm the Cloudflare static-site configuration remains present in the synced repository.
- [x] Provide the owner-led Cloudflare retry-deployment step and the essential post-deployment checks.

## Supplier Photo Placeholder Presentation

- [x] Audit the repeated placeholder treatment across cards, product details, basket, checkout, and admin.
- [x] Refine the placeholder to be quieter on product cards while retaining an explicit supplier-image status on product details and admin.
- [x] Verify the refined catalogue rendering and document the controlled supplier-photo upload process.
- [x] Push the visual correction to GitHub for Cloudflare deployment.

## Verified Supplier Catalogue Import

- [x] Receive an approved supplier catalogue, current price list, API, or permitted product-link source.
- [x] Verify product names, brands, images, pack formats, GBP price basis, availability, EANs, and image-use rights from the approved source.
- [x] Map only verified records to the existing category structure and label price/VAT basis exactly as supplied.
- [x] Import approved data into Supabase, validate the live website, and synchronize the verified catalogue to GitHub.

## Gem Imports Personal Care Import

- [x] Capture verified Gem Imports Personal Care names, product codes, pack details, GBP prices, and availability indicators from the owner-provided source.
- [x] Keep supplier images as placeholders until explicit reuse permission or owned supplier assets are provided.
- [x] Map source records to Personal Care only, preserve original source values, and label the price basis accurately.
- [x] Import validated records into Supabase, verify Personal Care search/detail pages, and synchronize the approved update to GitHub.

## Final GitHub and Cloudflare Check

- [x] Verify the current GitHub remote and clean working tree include the latest Personal Care release.
- [x] Confirm the Cloudflare static-site configuration is present and the public Supabase variables are the only required frontend values.
- [x] Provide the owner-led retry-deployment and post-deployment checks.

## Backend Health Audit

- [x] Verify public Supabase access to categories, all product records, and source-backed Personal Care records.
- [x] Verify the no-payment enquiry/order persistence path and its failure fallback.
- [x] Verify admin authentication, role policy, image-placeholder handling, and storage prerequisites.
- [x] Verify Cloudflare public environment requirements, then fix any safe code or configuration issue found.

## Harrison’s-Style Wholesale Redesign

- [x] Reconcile the attachment’s replacement-catalogue requirements with the current schema, free-tier constraints, price-source rules, image rights, and destructive-data safeguards.
- [x] Inspect the provided Harrison’s Direct reference and record only transferable UX, category, navigation, product-card, and mobile patterns.
- [x] Audit the existing Supabase catalogue, categories, and storage use before any replacement planning.
- [x] Define an original premium design and a strict category mapping that excludes unrelated reference products.
- [ ] Obtain authorized product names, public GBP prices, and image rights for every replacement record; do not fabricate login-only prices.
- [ ] Build the reference-informed category and product-browsing experience without copying branding, code, images, or text.
- [ ] Export a backup and prepare a reviewed replacement dataset before any old products are deleted.
- [ ] Obtain a final explicit confirmation immediately before deleting old product records.
- [ ] Import approved replacements, validate live results, and synchronize the change to GitHub.

## Bulk Wholesale Sweets Source

- [x] Inspect the owner-provided Bulk Wholesale Sweets source, including its public product information, categories, and reuse terms.
- [x] Record the owner's confirmation that Bulk Wholesale Sweets has granted Magnetic Source permission to use its product images, descriptions, and prices.
- [x] Prepare 1,707 verified Sweets & Confectionery replacement records from the owner-authorized source, with unique SKU/slug/image values, visible ex-VAT GBP prices, factual descriptions, and no supplier stock quantities; do not treat a sweets-only source as coverage for unrelated departments.
- [x] Remove public stock-count display from product cards and detail pages while keeping the existing database structure unchanged; verify the dynamic catalogue card field order and production build.
- [x] Back up the existing 13-category, 420-product catalogue and prepare the guarded 1,707-product Sweets & Confectionery import plan.
- [ ] Obtain explicit final confirmation immediately before deleting any existing catalogue row.

## Harrison’s Direct Multi-Category Catalogue

- [x] Record the owner's confirmation that Harrison’s Direct authorizes Magnetic Source to use the required product data, images, descriptions, and prices.
- [x] Set the catalogue limit to 40 verified products in each of eight clean categories, for a compact 320-product free-tier-safe target.
- [x] Audit the full Harrison’s Direct department hierarchy, public product fields, and access required for visible product prices.
- [x] Define a clean multi-category import mapping that shows visible GBP prices but never public stock counts such as “5 available”.
- [x] Retrieve and map the 310-source-category hierarchy to eight verified department roots; Clearance has 39 live valid source products, so it will remain at 39 rather than add a duplicate product.
- [x] Extract 319 authorized public records: 40 products in each of seven matched departments and all 39 valid Clearance products, with exact primary images, name, SKU, and pack information; exclude every source stock, availability, and price value.
- [x] Validate the compact catalogue: 319 confirmed unique matching images, complete required product fields, unique SKU and slug values, and no public stock or price data in the import dataset.
- [x] Refine the premium stock-free multi-category interface: dynamic live departments, no legacy hard-coded department link, and no public stock language.
- [ ] Resume the compact source extraction only when the public Harrison’s pages are stable, or replace it with an owner-provided authorized product feed.
- [ ] Keep all public-source product prices unset until an authorized per-pack trade-price source is supplied; do not delete the existing database catalogue before that point.
- [ ] Obtain the authorized multi-category price feed or authenticated price access required to verify every visible GBP product price.
- [ ] Prepare and validate Harrison’s Direct replacement records only after the available price source is verified.
- [ ] Back up the current catalogue and obtain another explicit final confirmation before replacing the old database catalogue rows.

## Price-Free Compact Catalogue

- [x] Record the owner’s instruction to leave prices out completely; no price will be invented or publicly displayed.
- [x] Confirm the existing product and order data model can represent price-free catalogue entries without affecting users, authentication, orders, or backend architecture; store schema-safe `0.00` internally with a `Price hidden` tag and never display it as a price.
- [x] Update catalogue, product detail, basket, checkout, structured data, and header presentation to hide price and stock display for the compact replacement dataset; type check and production build pass.
- [x] Prepare the schema-compatible price-free import files: eight categories and 319 products with matching images, factual descriptions, SKU, pack data, `Price hidden` tags, no public stock terms, and no duplicate SKU, slug, or image values.
- [x] Back up the current 13-category, 420-product catalogue and prepare a locked replacement transaction that imports and validates all eight new categories and 319 price-free products before deleting old catalogue rows.
- [x] Obtain final deletion approval immediately before executing the locked price-free replacement transaction.
- [x] Import and validate the price-free compact catalogue: 8 live categories, 319 live products, 319 matching unique images, hidden numeric values, and no imported public stock terms.
- [x] Push the approved price-free catalogue checkpoint to the public GitHub `main` branch.

## Cloudflare Manual Static Deployment

- [x] Confirm the current Cloudflare Worker uses the manual static-file uploader rather than a connected GitHub deployment.
- [x] Prepare and verify the latest Cloudflare static-upload folder and ZIP archive; it contains only the production HTML, CSS, JavaScript, and public static files, with no source, `.env`, or service-role files.
- [ ] Guide the owner through uploading the correct build folder and verify the resulting live Cloudflare site.
- [x] Diagnose the initial manual upload: the homepage serves the latest assets, but `/shop` and product URLs return 404 because the static uploader has no SPA fallback.
- [x] Create a corrected hash-route static package, verify root, shop, category, and product navigation locally, and regenerate the Cloudflare upload ZIP.
- [ ] Re-upload the corrected static package and verify the live root, shop, category, and product routes.
- [x] Diagnose the second upload: Cloudflare serves the new root HTML but returns 404 for nested `assets/` files from the folder upload.
- [x] Prepare and verify a flat static upload package with root-level `app.js` and `app.css` references; it contains no nested assets, source files, environment files, or service credentials.
- [x] Re-upload the flat package and verify live root assets plus hash-routed shop, Toys & Gifts category, and product-detail pages; all now display the new price-free catalogue without stock counts.

## Cloudflare GitHub Automatic Deployment

- [ ] Inspect the working Cloudflare Worker for available GitHub connection and build configuration options.
- [ ] Confirm the target public repository, `main` branch, and safe deployment settings before making the connection.
- [ ] Obtain final owner confirmation before authorizing Cloudflare access to GitHub or modifying the deployment connection.
- [ ] Validate the resulting automatic deployment path and document the future update flow.

## Cloudflare Admin Configuration Repair

- [x] Diagnose the live Admin page failure: the current static build does not expose its required public Supabase configuration to the Admin route.
- [x] Build and verify a corrected self-contained static deployment file with the public Supabase URL and anon key embedded, no service-role key, no linked application assets, and a locally verified Admin sign-in route.
- [ ] Re-upload the corrected package and verify the live Admin page reaches login and product-management controls.
- [x] Confirm the current Cloudflare uploader corrupts linked root-level bundles too: the live `app.js` is not the uploaded production bundle and lacks both required public Supabase values.
- [ ] Create a self-contained HTML deployment file that inlines the verified production JavaScript and CSS, leaving no linked application bundle for the uploader to omit or replace.
- [x] Diagnose the latest self-contained-file failure: an original external application script tag remained alongside the inline bundle.
- [x] Correct the generator to remove every external application CSS and JavaScript asset tag before the final re-upload; verify one inline module bootstrap and no external application asset links.

## Registered Company Details

- [x] Replace all public business detail locations with the owner-provided registered address, company number, VAT number, and `+44 7856 262726` contact number.
- [x] Regenerate and verify the self-contained Cloudflare upload file after the business-detail update, with all registered details and public Supabase configuration present but no server credential.

## Utility Navigation Refinement

- [x] Replace the heavy black top utility-bar treatment with a professional website-consistent warm-paper treatment, retaining the existing utility links.
- [x] Verify desktop and mobile presentation and regenerate the self-contained Cloudflare deployment file.
- [ ] Synchronize the refined utility navigation to GitHub and upload the refreshed deployment file to Cloudflare.

## Header Transition Cleanup

- [x] Remove the dotted white decorative rule below the category tape and verify the clean hero transition.

## Homepage Operational Explainer Removal

- [x] Remove the homepage section containing the Dubai image, the “Built for the practical part” and “Clear lines” copy, and the “How Magnetic Source works” call-to-action; verify the surrounding homepage flow remains balanced.

## Homepage Approval and Department Feature Removal

- [x] Remove the black Approval demo catalogue strip and the two-image department feature section with Home & Utility, DIY & Hardware, and Explore lines copy; verify the homepage now transitions cleanly into selected products.

## Baby & Kids Department Replacement

- [ ] Replace only the Charging & Electrical category and its 40 products with 40 approved-source Baby & Kids products after backup and final confirmation.
- [x] Apply a clean white product-image frame with centred, uncropped products across the complete catalogue and product-detail pages; remove diagonal image-corner decoration and verify the preferred professional presentation on live catalogue examples.
- [x] Prepare and validate 40 Baby & Kids products from the approved Wholesale Baby source, with unique SKU, slug, exact matching image, factual description, and pack information; do not retain source stock or price values.
- [x] Back up the current 40 Charging & Electrical records and prepare a locked transaction that validates all 40 Baby & Kids records before deleting only the target category and products.
- [x] Obtain final confirmation immediately before running the targeted category replacement.
- [x] Replace Charging & Electrical with Baby & Kids and validate the live catalogue: 8 categories, 319 products, 40 Baby & Kids records, no duplicate SKU/slug/image values, no stock leaks, and price-on-request display.
