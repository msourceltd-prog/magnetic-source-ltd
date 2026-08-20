# Cloudflare Static Routing Audit

The initial manual static upload served the new root `index.html` but returned HTTP 404 for `/shop` and product-detail client routes. This confirms the deployment is serving static assets without a single-page-application fallback.

Cloudflare’s static-assets documentation identifies **Single Page Application** mode as the supported way to serve `index.html` automatically for client-side routes. The next owner action should therefore use the Worker dashboard’s **Advanced settings → Not found handling → Single-page application** option, rather than creating copied HTML files for every potential route.[1]

For the existing dashboard-only uploader, the production build has also been changed to use **hash-safe internal URLs**. Navigation now stays under the deployed root asset, for example `/#/shop` and `/#/product/...`, so the Worker no longer needs a server-side SPA fallback for normal navigation. The final static upload archive has been regenerated after this change and its shop, product, and category routes were checked locally.

## Reference

[1] [Cloudflare Workers: Single Page Application routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
