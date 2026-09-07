# BuildTrack

Project-centered construction information, monitoring, and accountability system.

> Track Every Part. Build With Confidence.

BuildTrack organizes a construction project as one flexible **breakdown tree** where every component (Building → Floor → Room → Trade → Work → Task) carries its own budget, materials, schedule, personnel, progress, daily records, and audit history.

## Stack

- **Database:** Supabase **PostgreSQL** (via the `pg` driver over the IPv4 session pooler)
- **Backend:** Node + Express + TypeScript (ESM), JWT in HTTP-only cookie, server-side permissions
- **Frontend:** React + TypeScript + Vite

## Project layout

```
buildtrack/
├── .kiro/specs/buildtrack/   # requirements.md, design.md, tasks.md
├── server/                   # Express API + SQLite
└── client/                   # React + Vite app
```

## Getting started

```bash
# from the repo root
npm install                # installs server + client (workspaces)

# Configure server/.env with your Supabase Postgres connection:
#   SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_USER,
#   SUPABASE_DB_PASSWORD, SUPABASE_DB_NAME  (see server/.env.example)
# Use the IPv4 session-mode pooler host, e.g.
#   aws-0-<region>.pooler.supabase.com : 5432
#   user: postgres.<project-ref>

npm run db:reset           # apply schema + seed demo data to Supabase
npm run dev                # start API (:4000) and client (:5173)
```

Open http://localhost:5173.

### Demo login

Seeded after `npm run db:reset` (see `server/src/db/seed.ts`).

## Scripts (root)

| Script | Description |
|---|---|
| `npm run dev` | Run server + client together |
| `npm run build` | Build both workspaces |
| `npm run db:migrate` | Apply the database schema |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset schema + reseed |

## Specs

The full requirements, design, and task plan live in `.kiro/specs/buildtrack/`.
