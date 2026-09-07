# Deploying BuildTrack

Database is already on **Supabase**. The app deploys as a **single Render service**
that serves both the Express API and the built React app from one URL (same-origin,
so login cookies just work). This is the fastest, most reliable path.

---

## Deploy (single service on Render) — ~5 minutes

1. Go to **https://dashboard.render.com** → **New** → **Blueprint**.
2. Connect GitHub and pick **Clarkyyy10/BuildTrack**. Render reads `render.yaml`
   and proposes a web service named `buildtrack`.
3. Fill in the environment variables it marks as required:
   - `SUPABASE_DB_HOST` = `aws-0-ap-southeast-1.pooler.supabase.com`
   - `SUPABASE_DB_USER` = `postgres.prrranhyzpgxnxaexjvo`
   - `SUPABASE_DB_PASSWORD` = your Supabase database password
   - (`JWT_SECRET` is auto-generated; `SUPABASE_DB_PORT=5432`, `SUPABASE_DB_NAME=postgres`,
     `NODE_ENV=production` are preset)
4. Click **Apply / Create**. Render runs:
   - build: `npm install --include=dev && npm run build`  (builds server + client)
   - start: `npm run start --workspace server`  (serves API + SPA)
5. When live, open the service URL (e.g. `https://buildtrack.onrender.com`).
   - `…/api/health` → `{"ok":true}`
   - the root URL loads the app; sign in with your account.

That's it — reachable from any device, all data in Supabase.

### Notes
- The database schema/seed were applied locally (`npm run db:reset`). The deployed
  server does not migrate on boot. To reset demo data, run `npm run db:reset` locally.
- Free Render services sleep when idle; the first request after a nap is slow (cold start).
- Secrets live only in Render's environment — never in the repo (`server/.env` is gitignored).

---

## Alternative: split hosting (Vercel frontend + Render backend)

If you prefer the frontend on Vercel, the repo also includes `vercel.json` which
builds `client/` and proxies `/api/*` to your backend. In that setup:
1. Deploy the backend on Render (as above).
2. Edit `vercel.json` → replace the placeholder host in the `/api` rewrite with your
   Render URL, commit, push.
3. Import the repo in Vercel (framework: Other). It builds `client/dist` and proxies
   `/api` to the backend, keeping the browser same-origin.

The single-service Render deploy above is simpler and recommended unless you
specifically want Vercel's CDN for the frontend.
