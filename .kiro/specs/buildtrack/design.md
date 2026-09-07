# BuildTrack — Design

## Overview

BuildTrack is a full-stack, project-centered construction management system. This design implements Requirements 1–19 for Phases 1–3. The architecture centers on a single self-referencing **Project Breakdown** tree, an immutable **transaction/audit** model for materials and budget, and **server-side authorization** on every project-scoped request.

Design priorities, in order: (1) correctness and accountability (immutable ledgers, append-only audit), (2) server-side security, (3) a calm, accessible UI, (4) portability of the data layer to PostgreSQL later.

---

## Architecture

### High-level

```
┌───────────────────────────┐        HTTPS / JSON         ┌───────────────────────────┐
│  Client (React + Vite)    │  ───────────────────────►   │  API (Express + TS)       │
│  - Design system (Sora)   │   HTTP-only cookie (JWT)     │  - Auth & sessions        │
│  - Routing / views        │  ◄───────────────────────   │  - Permission middleware  │
│  - API client (fetch)     │                             │  - Domain services        │
└───────────────────────────┘                             │  - Audit + notifications  │
                                                           └─────────────┬─────────────┘
                                                                         │ better-sqlite3
                                                                         ▼
                                                           ┌───────────────────────────┐
                                                           │  SQLite (WAL) — buildtrack.db │
                                                           │  schema.sql + migrations     │
                                                           └───────────────────────────┘
```

### Stack rationale

- **SQLite via Node's built-in `node:sqlite` (`DatabaseSync`)** — a real relational engine with foreign keys, transactions, recursive CTEs (ideal for the breakdown tree and stock roll-ups) and **zero native compilation** on Windows (no `node-gyp`/Visual Studio toolchain needed, unlike `better-sqlite3`). Synchronous API keeps transaction logic simple and race-free. The module is currently marked experimental in Node 24 (emits a harmless startup warning). SQL is kept standard so a later PostgreSQL migration is mechanical (types, `AUTOINCREMENT`→`SERIAL`, booleans).
- **Express + TypeScript (ESM)** — small, explicit, well-understood; middleware model fits per-request permission checks.
- **JWT in HTTP-only cookie** — stateless auth with a server-side session record for revocation and login history (Req 1, 17.5, 18.3).
- **React + Vite + TypeScript** — fast dev loop; component model matches the "consistent component structure" (Req 7).
- **Zod** — one validation layer shared for request bodies (Req 18.4).

### Repository layout

```
buildtrack/
├── package.json                 # npm workspaces (server, client), dev orchestration
├── .kiro/specs/buildtrack/      # requirements.md, design.md, tasks.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # app bootstrap, middleware, route mounting
│       ├── config.ts            # env, secrets, constants
│       ├── db/
│       │   ├── connection.ts    # better-sqlite3 singleton, PRAGMAs
│       │   ├── schema.sql       # full DDL
│       │   ├── migrate.ts       # apply schema / --reset
│       │   └── seed.ts          # mockup-matching demo data
│       ├── lib/
│       │   ├── ids.ts           # USR-###### / PRJ- / CMP- generators
│       │   ├── password.ts      # scrypt hash/verify
│       │   ├── jwt.ts           # sign/verify session tokens
│       │   ├── audit.ts         # writeAudit() helper
│       │   ├── errors.ts        # AppError + typed error codes
│       │   └── tree.ts          # recursive CTE helpers, cycle checks
│       ├── middleware/
│       │   ├── auth.ts          # requireAuth (reads cookie)
│       │   ├── permissions.ts   # requirePermission(project, perm)
│       │   ├── validate.ts      # zod body/query validation
│       │   └── error.ts         # central error handler → human JSON
│       ├── services/            # domain logic (materials ledger, budget, rollup)
│       └── routes/              # auth, users, projects, members, invitations,
│                                # components, materials, budget, schedule,
│                                # personnel, dailyRecords, activity, notifications,
│                                # reports, settings
└── client/
    ├── package.json
    ├── vite.config.ts           # dev proxy /api → :4000
    ├── index.html
    └── src/
        ├── main.tsx, App.tsx, router.tsx
        ├── styles/tokens.css    # design tokens (color, type, spacing)
        ├── lib/api.ts           # typed fetch client
        ├── lib/auth.tsx         # auth context/hook
        ├── components/          # Button, Card, Table, Tabs, Tree, StatusPill, EmptyState, ...
        └── pages/               # Home, Login, Signup, Projects, ProjectWorkspace,
                                  # Notifications, Invitations, Profile, Settings
```

---

## Data Model

### Entity-relationship (logical)

```
users ─1:N─ sessions
users ─1:N─ project_members ─N:1─ projects
users ─1:N─ project_invitations (invitee & inviter) ─N:1─ projects
projects ─1:N─ project_components ─self─ (parent_id)               [Req 6]
project_components ─1:N─ materials ─1:N─ material_transactions      [Req 9]
project_components ─1:N─ budget_changes                             [Req 10]
project_components ─1:N─ expenses                                   [Req 10]
project_components ─1:N─ schedule_activities                        [Req 11]
project_components ─1:N─ personnel_assignments                      [Req 12]
project_components ─1:N─ daily_records                              [Req 13]
projects ─1:N─ audit_logs (component nullable)                      [Req 14]
users ─1:N─ notifications ─N:1─ projects                            [Req 15]
users ─1:1─ user_settings                                           [Req 17]
```

### Design decisions per entity

**users** (Req 1, 2)
- `id TEXT PK` in `USR-######` format, generated from a sequence; immutable.
- `email` unique (case-insensitive), `password_hash`, `password_salt`, `display_name`, `avatar_url`, `created_at`.
- No plaintext password ever stored.

**sessions** (Req 1, 17.5)
- `id`, `user_id`, `issued_at`, `expires_at`, `revoked_at`, `user_agent`, `ip`. Enables logout/revocation and login history. JWT carries `sid` referencing this row.

**projects** (Req 3)
- `id TEXT PK` `PRJ-######`, `name`, `type` (residential/commercial/road/custom), `location`, `status` (planning/active/on_hold/completed), `progress_method` (default `budget_weighted`), `created_by`, timestamps.

**project_members** (Req 4)
- `(project_id, user_id)` unique; `role` enum (project_manager, site_engineer, architect, contractor, viewer); `added_by`, `created_at`. Role → permission set resolved in code (see Permission Model).

**project_invitations** (Req 5)
- `id`, `project_id`, `invitee_user_id`, `inviter_user_id`, `proposed_role`, `state` (pending/accepted/declined/expired/cancelled), `expires_at`, timestamps. Membership is created **only** on accept, inside a transaction.

**project_components** (Req 6, 7, 8) — the tree
- `id TEXT PK` `CMP-######`, `project_id`, `parent_id` (nullable, self-FK, `ON DELETE CASCADE` → Req 6.7), `name`, `component_type` (building/floor/area/room/phase/trade/work/task/custom), `sort_order`, `status`, `progress` (0–100, direct value for leaves), `start_date`, `end_date`, `weight` (for manual roll-up), timestamps.
- Cycle prevention (Req 6.5) enforced in `lib/tree.ts` via ancestor check before move.

**materials** + **material_transactions** (Req 9)
- `materials`: `id`, `component_id`, `name`, `description`, `category`, `unit`, `unit_cost`, `supplier`, `status`, `total_needed`, `notes`, timestamps. No mutable `quantity` column — current stock is **derived**.
- `material_transactions`: `id`, `material_id`, `type` (receive/use/waste/transfer/adjustment), `quantity` (signed convention documented below), `from_component_id`, `to_component_id`, `reason`, `created_by`, `created_at`. Append-only.
- **Stock derivation:** `current = Σ received − Σ used − Σ waste ± Σ adjustment + Σ transfer_in − Σ transfer_out`. A Transfer writes one logical event referencing source and destination. Negative-stock guard (Req 9.5) runs inside the write transaction.

**budgets model** (Req 10)
- Approved budget lives on `project_components.approved_budget` (per component) and aggregates to project.
- `budget_changes`: append-only log of approved-budget edits (`previous_amount`, `new_amount`, `difference`, `changed_by`, `reason`, `created_at`) — Req 10.3. Adding expenses never mutates approved budget (Req 10.2).
- `expenses`: `id`, `component_id`, `amount`, `category`, `description`, `spent_on`, `created_by`, `created_at`.
- Remaining/percent computed on read.

**schedule_activities** (Req 11)
- `id`, `component_id`, `name`, `start_date`, `end_date`, `status`, `sort_order`. Component-level schedule fields (start/end/status/progress) live on `project_components`. Current phase = activity whose date range includes today.

**personnel_assignments** (Req 12)
- `id`, `component_id`, `user_id` (nullable, for non-member personnel), `person_name`, `site_role`, `is_lead`, `start_date`, `end_date`, `created_by`. Independent of membership.

**daily_records** (Req 13)
- `id`, `project_id`, `component_id`, `record_date`, `work_completed`, `materials_used`, `people_present`, `progress`, `issues`, `notes`, `created_by`, `created_at`.

**audit_logs** (Req 14) — append-only
- `id`, `project_id`, `component_id` (nullable), `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `created_at`. No update/delete API. Project view filters by `project_id`; global history filters by the user's project memberships.

**notifications** (Req 15)
- `id`, `user_id`, `project_id`, `type`, `title`, `body`, `is_read`, `created_at`.

**user_settings** (Req 17)
- `user_id PK`, plus columns/JSON for theme, accent, font, density, sidebar behavior, default project page, table density, privacy flags, accessibility flags (font scale, high contrast, reduced motion), language/region.

### Indexing
- `project_components(project_id, parent_id, sort_order)`, `materials(component_id)`, `material_transactions(material_id)`, `expenses(component_id)`, `audit_logs(project_id, created_at)`, `notifications(user_id, is_read)`, unique `project_members(project_id, user_id)`, unique `users(lower(email))`.

---

## Progress Roll-up (Req 8)

Computed on read via recursive traversal; `progress_method` per project selects the formula:

- **budget_weighted (default):** `parent = Σ(child.progress × child.approved_budget) / Σ(child.approved_budget)`; falls back to simple average if all child budgets are 0.
- **simple_average:** mean of child progress.
- **quantity_weighted:** weight by summed material `total_needed` (proxy for work quantity).
- **manual:** weight by `component.weight`.

Leaves (no children) use their stored `progress`. Ancestors recompute bottom-up. Implemented in `services/progress.ts` using a single recursive CTE to fetch the subtree, then folded in code so the method is easy to unit-test and swap.

---

## API Surface (representative)

All routes are under `/api`. All project-scoped routes pass through `requireAuth` → `requirePermission`. Responses are JSON; errors use the shared shape `{ error: { code, message } }`.

```
Auth & identity
  POST   /api/auth/signup            Req 1
  POST   /api/auth/login             Req 1,18
  POST   /api/auth/logout            Req 1
  POST   /api/auth/recover           Req 1.6
  GET    /api/me                     current user + settings
  PATCH  /api/me                     profile update (not id)        Req 2
  GET    /api/users?query=           search by name → returns IDs   Req 2.2,5.1

Projects & membership
  GET    /api/projects               list my projects (+role/status/progress)  Req 3.2
  POST   /api/projects               create (+template)             Req 3.1,3.5
  GET    /api/projects/:id           overview                       Req 3
  PATCH  /api/projects/:id           edit                           Req 3.4
  GET    /api/projects/:id/members   list                           Req 4
  PATCH  /api/projects/:id/members/:uid   change role               Req 4.4
  DELETE /api/projects/:id/members/:uid   remove                    Req 4.5

Invitations
  POST   /api/projects/:id/invitations           send               Req 5.1
  GET    /api/invitations                         my invitations
  POST   /api/invitations/:iid/accept|decline     respond            Req 5.3,5.4
  POST   /api/projects/:id/invitations/:iid/cancel cancel            Req 5.5

Breakdown tree
  GET    /api/projects/:id/components             full tree          Req 6
  POST   /api/projects/:id/components             create             Req 6.3
  PATCH  /api/components/:cid                      rename/edit        Req 6.3
  POST   /api/components/:cid/move                 reparent (cycle-checked) Req 6.4,6.5
  POST   /api/components/:cid/reorder              sibling order      Req 6.6
  DELETE /api/components/:cid                      delete (cascade)   Req 6.7

Component detail areas (shared)  — Req 7
  GET    /api/components/:cid                      summary+progress   Req 7,8
  PATCH  /api/components/:cid/progress             update progress    Req 8.1
  GET/POST         .../materials                                     Req 9
  POST   /api/materials/:mid/transactions          receive/use/... (guarded) Req 9
  GET/POST/PATCH   .../budget (approved change), .../expenses        Req 10
  GET/POST         .../schedule (activities)                         Req 11
  GET/POST/DELETE  .../personnel                                     Req 12
  GET/POST         .../daily-records                                 Req 13
  GET              .../activity                                      Req 14.2

Cross-cutting
  GET    /api/history               global activity feed             Req 14.3
  GET    /api/notifications         list; POST /:nid/read            Req 15
  GET    /api/projects/:id/reports/:kind                              Req 16
  GET/PATCH /api/settings                                            Req 17
```

---

## Permission Model (Req 4, 18)

A single source of truth maps role → permission set; middleware checks the permission for the target project.

| Permission            | PM | Site Eng | Architect | Contractor | Viewer |
|-----------------------|----|----------|-----------|------------|--------|
| view_project          | ✓  | ✓        | ✓         | ✓          | ✓      |
| edit_project          | ✓  | ✓        | ✓         |            |        |
| manage_components      | ✓  | ✓        | ✓         |            |        |
| manage_budget         | ✓  |          |           |            |        |
| manage_materials      | ✓  | ✓        |           | ✓          |        |
| manage_schedule       | ✓  | ✓        | ✓         |            |        |
| manage_personnel      | ✓  | ✓        |           |            |        |
| invite_members        | ✓  |          |           |            |        |
| create_daily_record   | ✓  | ✓        |           | ✓          |        |
| update_progress       | ✓  | ✓        | ✓         | ✓          |        |
| view_activity         | ✓  | ✓        | ✓         | ✓          | ✓      |

`requirePermission(perm)` resolves the requester's membership+role for the project in the route params, looks up the matrix, and returns `403` on failure — independent of any UI state (Req 4.3, 18.1). Matrix is centralized so it can be tuned without touching routes.

---

## Frontend Design

### Routing
```
/login, /signup
/                         Home (greeting + Explore Projects)         Req 19.2
/projects                 list/search/filter/sort                    Req 3
/projects/:id             ProjectWorkspace (nested tabs)
   ./overview  ./breakdown  ./schedule  ./budget  ./materials
   ./personnel ./daily-records ./activity ./reports
/projects/:id/c/:cid      Component detail (same tab set)            Req 7
/notifications  /invitations  /profile  /settings
```
Global nav contains only: Home, Projects, Notifications, Invitations, Profile, Settings (Req 3.6, 19.2).

### Design system (DESIGN.md → tokens)
- **Type:** Sora, hierarchy by size/weight.
- **Color:** neutral background, white surfaces, charcoal text, muted secondary, one accent (`--accent`), semantic success/warning/error/info. Status shown with pill + icon/label, never color alone (Req 19.4).
- **Spacing/shape:** generous spacing scale, subtle borders, rounded-but-professional radii.
- **Density & theme** driven by `user_settings` and applied via CSS variables on `:root` (Req 17.3).

### Key components
- `Tree` — expand/collapse, drag-to-reorder/nest, keyboard navigable, works on mobile (Req 6.8, 19.3).
- `ComponentTabs` — the shared Overview/Materials/Budget/Schedule/Personnel/Daily/Activity set (Req 7).
- `BudgetSummary` (approved/spent/remaining/percent/over-under + category breakdown), `MaterialsTable`, `ScheduleTimeline` (list + simple timeline, no Gantt), `PersonnelList`, `DailyUsageLog`, `ActivityFeed`.
- `EmptyState` and `ErrorState` — guiding, actionable copy (Req 19.5, 7.3).
- `ContextualActions` — actions vary by level (Req 19.6).

### Responsive & accessibility
- Desktop sidebar+content; tablet collapsed sidebar; mobile compact header + project nav (Req 19.3).
- Keyboard nav, visible focus rings, ARIA roles on tree/tabs/tables, high-contrast + reduced-motion + font-scale honored from settings (Req 19.4).

---

## Security Design (Req 18)

- **Passwords:** Node `crypto.scrypt` with per-user random salt; constant-time compare. (No native bcrypt dependency needed.)
- **Sessions:** JWT signed with server secret, stored in `HttpOnly`, `SameSite=Lax`, `Secure` (prod) cookie; `sid` claim maps to a `sessions` row for revocation and login history.
- **CSRF/CORS:** dev CORS restricted to the Vite origin with credentials; `SameSite=Lax` cookie mitigates CSRF for the SPA; state-changing requests require the session cookie.
- **Input validation:** Zod schemas on every write route; all SQL uses parameterized statements (Req 18.4).
- **Auth errors:** login and recovery return generic messages; recovery responds identically regardless of email existence (Req 1.3, 1.6, 18.5).
- **Authorization:** every project-scoped route runs `requirePermission` server-side (Req 18.1, 18.6).
- **Audit:** all data-changing services call `writeAudit()` within the same transaction so logs can't drift from data (Req 14).

---

## Error Handling

- Central Express error middleware converts thrown `AppError`s to `{ error: { code, message } }` with a human message and correct status; unexpected errors log server-side and return a generic 500 message (Req 19.5).
- Client surfaces `ErrorState` with a retry action; forms show field-level messages from Zod issues.

---

## Testing Strategy

Per project rules, tests are added only where they protect the accountability-critical invariants, and only if requested. Targeted unit tests are recommended (not auto-added) for: material stock derivation + negative-stock guard (Req 9), budget-change immutability (Req 10.2/10.3), progress roll-up methods (Req 8), and tree move cycle prevention (Req 6.5). Manual verification path: signup → create project from template → build tree → add materials/transactions → record budget/expenses → schedule/personnel → daily record → view activity/rollup.

---

## Data Migration / Portability

Schema uses standard SQL and avoids SQLite-only features except `PRAGMA foreign_keys=ON` and `WAL`. Booleans stored as `INTEGER 0/1`, timestamps as ISO-8601 `TEXT` (UTC). Moving to PostgreSQL later means swapping the driver, adjusting a few type declarations, and replacing ID sequences — no schema redesign.

---

## Seed Data (matches the mockup) — Req context

Demo user (e.g. `USR-000587`, "Clark Santos"), project **Riverside Residence** (Residential, Antipolo, Active), breakdown: Building → 1st/2nd/3rd Floor, Roof, Foundation, Exterior, Electrical, Plumbing, HVAC; 1st Floor → Living Room, Kitchen, Bedroom 1, Bedroom 2, Bathroom. Living Room seeded with materials (Cement, Concrete Mix, Steel Bars, Wood Planks, Paint, Tiles) + transactions, approved budget + expenses (materials/labor/equipment/misc), schedule activities (Demolition…Painting with current phase Electrical), personnel (Juan Dela Cruz–Electrician lead, Maria Santos–Helper, Ramon Reyes–Laborer, Ella Garcia–Apprentice), and a daily material-usage record.
