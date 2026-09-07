# Deploying BuildTrack

BuildTrack is two pieces:
- **Frontend** — static React/Vite build (host on **Vercel**)
- **Backend** — Express API (host on **Render**, runs as a normal Node server)
- **Database** — already on **Supabase** Postgres

The frontend calls the backend through a Vercel **rewrite** (`/api/*` → backend),
so the browser stays same-origin and login cookies work with no CORS changes.

---

## 1. Deploy the backend (Render)

1. Go to Render → **New** → **Blueprint**, and select this GitHub repo.
   Render reads `render.yaml` and creates the `buildtrack-api` web service.
2. Set the environment variables it asks for (marked `sync: false`):
   - `SUPABASE_DB_HOST` — e.g. `aws-0-ap-southeast-1.pooler.supabase.com`
   - `SUPABASE_DB_USER` — e.g. `postgres.<your-project-ref>`
   - `SUPABASE_DB_PASSWORD` — your Supabase database password
   - `CLIENT_ORIGIN` — your Vercel URL (you'll have it after step 2; you can update it after)
   - (`JWT_SECRET` is auto-generated; `SUPABASE_DB_PORT=5432`, `SUPABASE_DB_NAME=postgres` are preset)
3. Deploy. When it's live, note the URL, e.g. `https://buildtrack-api.onrender.com`.
   Verify: open `https://buildtrack-api.onrender.com/api/health` → `{"ok":true}`.

## 2. Point the frontend at the backend

Edit **`vercel.json`** and replace the placeholder host in the `/api` rewrite
with your Render URL:

```json
{ "source": "/api/(.*)", "destination": "https://buildtrack-api.onrender.com/api/$1" }
```

Commit and push.

## 3. Deploy the frontend (Vercel)

1. Vercel → **New Project** → import this repo.
2. Framework preset: **Other** (the included `vercel.json` sets the build command
   `npm run build --workspace client` and output `client/dist`).
3. Deploy. Open the Vercel URL and sign in — the app talks to the backend via `/api`.
4. Back in Render, set `CLIENT_ORIGIN` to your Vercel URL and redeploy (for CORS on
   any direct calls).

---

## Notes

- **Migrations/seed** are run locally against Supabase (`npm run db:reset`); the
  deployed server does not run them on boot.
- The backend uses the Supabase **session-mode pooler** (port 5432), which suits a
  persistent Node server like Render.
- Secrets live only in each host's environment — never in the repo (`server/.env`
  is gitignored).
- Free Render web services sleep when idle; the first request after a nap can be slow.
