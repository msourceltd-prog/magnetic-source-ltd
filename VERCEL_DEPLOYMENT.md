# Vercel Launch Steps

The project is configured as a static Vite application. Its Vercel build command is `pnpm build`, its output directory is `dist/public`, and its rewrite rule ensures product links such as `/product/modular-storage-caddy-1` work after a direct visit.

## 1. Import the GitHub repository

In Vercel, select **Add New → Project**, choose the private Magnetic Source repository, and click **Import**. Vercel should detect the included `vercel.json` configuration.

## 2. Add public Supabase values

Before deploying, open **Project Settings → Environment Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use the project URL and public publishable key from Supabase. Do not add the temporary personal access token, a database password, or any service-role key.

## 3. Deploy and create the first administrator

Click **Deploy**. Once your Vercel domain is ready, set `VITE_SITE_URL` to that domain and redeploy. Then create an account in Supabase Auth, promote its profile to `admin` as described in `SUPABASE_SETUP.md`, and sign in at `your-domain.com/admin` to manage live products.
