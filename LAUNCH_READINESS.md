# Magnetic Source — Launch Readiness

**Status:** Vercel-ready codebase; owner configuration and compliance checks remain before a public commercial launch.

## Completed in the codebase

| Checklist area | Completed work |
| --- | --- |
| Content and navigation | Public pages, support links, calls to action, working internal routes, branded 404 page, privacy, terms, and delivery/returns working drafts are in place. |
| Images and accessibility | A crisp SVG favicon is included. Product, cart, checkout, and editorial images use descriptive alt text; below-the-fold imagery is lazy loaded. |
| SEO and sharing | Page titles, descriptions, canonical URLs, Open Graph, Twitter card defaults, structured organization/product data, `robots.txt`, and a sitemap are present. |
| Performance | Vite production output is minified. Fonts use `display=swap`; key imagery is prioritised and non-critical imagery is lazy loaded. |
| Responsive and usable UI | Mobile, tablet, desktop, catalogue, contact, and branded 404 routes were visually checked. The mobile navigation, visible focus styles, labels, and 44px-or-better primary controls are retained. |
| Forms and security | Contact and no-payment enquiry forms use native validation, length limits, honeypots, visible errors, consent, and no payment fields. Supabase row-level policies protect catalogue administration. |
| Source control and hosting | The public GitHub repository, Vercel rewrite configuration, production build command, and GitHub update helper are ready. |

## Owner actions before Vercel deployment

| Priority | Action | Where |
| --- | --- | --- |
| Required | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel. | Vercel → Project Settings → Environment Variables |
| Required | Set `VITE_SITE_URL` to the final Vercel or custom-domain URL, then redeploy. | Vercel → Project Settings → Environment Variables |
| Required | Create the first Supabase Auth user and promote that profile to `admin`. | See `SUPABASE_SETUP.md` |
| Required before accepting live sales | Replace the displayed email, phone, address, delivery/returns details, and working legal drafts with approved business information. | Website content and Supabase/admin workflow |
| Required before live enquiries | Connect the contact form to an approved inbox or CRM with server-side rate limiting and spam protection. | Backend or form-provider integration |
| Required for production SEO | Update `robots.txt` and `sitemap.xml` with the final custom-domain URL, then submit the sitemap in Google Search Console. | Repository and Google Search Console |
| Recommended | Choose an analytics provider, update the privacy notice, and enable tracking only after cookie-consent requirements are confirmed. | Vercel and website settings |
| Recommended | Test the deployed site in Chrome, Firefox, Safari, and Edge; verify custom-domain redirects and social-share previews. | Final Vercel URL |

## Launch boundary

The current checkout is a **no-payment trade enquiry**. Do not enable payment capture, automated fulfilment, or live customer-order acceptance until commercial terms, privacy documentation, delivery procedures, and supplier/product data are approved.
