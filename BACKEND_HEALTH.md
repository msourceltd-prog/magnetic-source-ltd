# Backend Health — Magnetic Source

**Audit status:** repaired and verified on the connected Supabase project.

| Area | Status | Result |
| --- | --- | --- |
| Public catalogue reads | Ready | The browser-safe Supabase path reads 13 categories and 420 products, including 127 source-backed Personal Care records. |
| Catalogue data controls | Ready | Product availability remains confirmation-based; supplier-photo placeholders use one working public SVG path. |
| No-payment enquiries | Repaired | A transactional `create_demo_order_with_items` database function is installed, preventing a saved enquiry without its item rows. No test customer records were created. |
| Product image storage | Repaired | The public `product-images` bucket exists with admin-only create, update, and delete policies. |
| Admin protection | Ready, owner action pending | The browser now checks the authenticated user’s `admin` profile role before showing the dashboard. There are currently no profile records, so the owner must create the first Supabase Auth user and promote it to `admin`. |
| Cloudflare environment | Owner action pending | The local preview has the two public Supabase values. Cloudflare must also have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no access token or service-role key belongs there. |

## Owner actions

Create a Supabase Auth user, set that profile’s role to `admin`, and sign in at `/admin`. Then add only approved supplier images through the repaired `product-images` bucket. Before production use, confirm that the two public Supabase values are present in Cloudflare and revoke the temporary management token used for the repairs.
