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
