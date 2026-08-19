# Cloudflare Deployment

This project is a Vite single-page application. The included `wrangler.jsonc` tells Cloudflare Workers to publish `dist/public` and return `index.html` for product and other client-side routes.

## Fix applied for the failed build

Cloudflare reported that it could not find a valid Vite `plugins` array. The Vite config now contains an explicit inline `plugins: [...]` array, which allows Cloudflare’s Vite setup to read and extend the configuration when needed.

## Redeploy

1. In Cloudflare, open **Workers & Pages → magnetic-sourceltd → Deployments**.
2. Click **Retry deployment** after GitHub finishes syncing this change.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Worker or Pages **Settings → Variables** area, then deploy again.

No secret access token, database password, or service-role key belongs in Cloudflare’s public browser environment.
