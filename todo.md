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
