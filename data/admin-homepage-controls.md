# Existing Admin Login: Homepage Controls

The existing `/admin` Supabase-admin login now contains a **Homepage** tab. No new user account, customer-facing route, or public login was added.

## Client controls

| Control | Result on the public homepage |
|---|---|
| Three hero-image cards | The admin can upload a PNG, JPEG, or WebP image, or paste an approved image URL, for each of the three hero positions. Each image has a short internal description. |
| Save hero images | The three saved images replace the homepage hero images after the public homepage is refreshed. The established four-second automatic rotation and manual selector remain unchanged. |
| Best Seller button | Adds or removes the selected product from the Best Sellers carousel. |
| New Arrival button | Adds or removes the selected product from the New Arrivals carousel. Selecting one collection removes the other collection tag for that product, so a product remains in one featured collection at a time. |

## Storage and access

Hero choices use a protected configuration record created by the existing administrator inside the already-admin-managed Supabase `categories` data path. Uploaded images use the current public `product-images` bucket under a `homepage/` folder. Only an authenticated profile with the existing `admin` role can create or edit these settings; ordinary visitors can only read the resulting public homepage image choices.

## Verification

The implementation passed TypeScript checking, twelve unit tests, the production build, and Cloudflare Worker bundling. Desktop and mobile checks confirmed the public homepage still renders the three-image hero and the existing `/admin` login remains responsive. The Cloudflare-published Admin chunk was checked for the new `Homepage controls` module text after deployment commit `534d5dc`.
