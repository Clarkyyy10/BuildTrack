# BuildTrack — Implementation Plan

Each task is incremental and builds on the previous. Requirement references point back to `requirements.md`. Check off tasks as they are completed. Tests are only added where explicitly noted and only if requested.

---

## Phase A — Foundation & Backend Core

- [x] 1. Finalize project scaffolding
  - Verify/complete root workspace, `server/` and `client/` package.json + tsconfig, `.gitignore`, `.env.example`, README stub.
  - Install dependencies for both workspaces.
  - _Requirements: 18, 19 (project baseline)_

- [x] 2. Database connection & schema
  - Implement `db/connection.ts` (better-sqlite3 singleton, `foreign_keys=ON`, WAL).
  - Author `db/schema.sql` with all tables, constraints, and indexes from the design.
  - Implement `db/migrate.ts` (apply schema, `--reset` support).
  - _Requirements: 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 17_

- [x] 3. Core libraries
  - `lib/ids.ts` (USR-/PRJ-/CMP-###### generators), `lib/password.ts` (scrypt hash/verify), `lib/jwt.ts` (sign/verify with `sid`), `lib/errors.ts` (AppError + codes), `lib/audit.ts` (writeAudit within txn), `lib/tree.ts` (subtree fetch + cycle check).
  - _Requirements: 1, 2, 6.5, 14, 18_

- [x] 4. App bootstrap & middleware
  - `config.ts`, `index.ts` (express, cookie-parser, cors w/ credentials, json, route mount, central error handler).
  - `middleware/auth.ts` (requireAuth), `middleware/validate.ts` (zod), `middleware/error.ts`.
  - _Requirements: 18, 19.5_

- [x] 5. Authentication & sessions
  - Routes: signup, login (generic errors), logout, recover (identical response), `GET /me`, `PATCH /me`, `GET /users?query=`.
  - Session records for revocation + login history.
  - _Requirements: 1, 2, 18.2, 18.5_

- [x] 6. Permission model & middleware
  - `services/permissions.ts` role→permission matrix; `middleware/permissions.ts` `requirePermission(perm)` resolving membership for the route's project.
  - _Requirements: 4, 18.1, 18.6_

## Phase B — Projects, Membership, Tree

- [x] 7. Projects & membership
  - Projects CRUD (list scoped to memberships; create grants PM role; template pre-population), members list/role-change/remove, all audited.
  - _Requirements: 3, 4_

- [x] 8. Invitations
  - Send (pending), list mine, accept (creates membership in txn), decline, cancel, expiry handling.
  - _Requirements: 5_

- [x] 9. Project Breakdown tree API
  - Full-tree fetch, create, edit/rename, move (cycle-checked), reorder siblings, delete (cascade). Audited.
  - _Requirements: 6, 7_

## Phase C — Component Detail Domains

- [x] 10. Progress & roll-up
  - `services/progress.ts` (budget_weighted default + alternatives), `PATCH progress`, component summary endpoint, project-level roll-up.
  - _Requirements: 7, 8_

- [x] 11. Materials & transactional inventory
  - Material CRUD per component; transactions (receive/use/waste/transfer/adjustment) with derived stock, negative-stock guard, transfer as single event; per-material totals (needed/used/today/remaining). Audited.
  - _Requirements: 9_
  - _Note: recommend unit tests for stock derivation + negative guard (add only if requested)._

- [x] 12. Budget & expenses
  - Approved budget change as separate logged event; expenses CRUD; computed remaining/percent/over-under + category breakdown. Audited.
  - _Requirements: 10_
  - _Note: recommend unit test for "expense does not change approved budget" (add only if requested)._

- [x] 13. Schedule
  - Component schedule fields + activities CRUD; list/timeline data; current-phase computation. Audited; may notify.
  - _Requirements: 11_

- [x] 14. Personnel
  - Assign/remove personnel per component (member or non-member), lead flag, dates. Audited; may notify.
  - _Requirements: 12_

- [x] 15. Daily records
  - Create/list/filter daily records; distinct from audit log. Audited; may notify.
  - _Requirements: 13_

## Phase D — Accountability & Cross-cutting

- [x] 16. Activity log & global history
  - Project activity feed (append-only, permitted members); global cross-project history endpoint.
  - _Requirements: 14_

- [x] 17. Notifications
  - Emit on triggers (invitation, accepted, schedule change, low stock, budget warning, progress, member add/remove, daily record); list + mark-read; permission-scoped.
  - _Requirements: 15_

- [x] 18. Reports
  - Progress, Material, Budget, Personnel, Daily Activity, Activity/Audit report endpoints computed from current data, permission-scoped.
  - _Requirements: 16_

- [x] 19. Settings
  - `GET/PATCH /settings` for all groups; persisted per user.
  - _Requirements: 17_

- [x] 20. Seed data
  - Implement `db/seed.ts` reproducing the mockup (Riverside Residence → floors/rooms → Living Room with materials/transactions, budget/expenses, schedule, personnel, daily record) + demo user.
  - _Requirements: 3, 6, 9, 10, 11, 12, 13 (demonstration)_

## Phase E — Frontend

- [x] 21. Frontend scaffold & design system
  - Vite app, `styles/tokens.css` (Sora, neutral surfaces, accent, semantic status, spacing/radii), base components (Button, Card, Table, Tabs, StatusPill, EmptyState, ErrorState), theme/density from settings.
  - _Requirements: 19_

- [x] 22. API client, auth context & routing
  - `lib/api.ts` typed fetch (credentials), `lib/auth.tsx` context, router with protected routes; Login/Signup pages.
  - _Requirements: 1, 18_

- [x] 23. App shell & global nav
  - Minimal sidebar (Home, Projects, Notifications, Invitations, Profile, Settings), responsive behavior; minimal Home page.
  - _Requirements: 3.6, 19.2, 19.3_

- [x] 24. Projects list
  - Search/filter/sort/create-from-template; project cards with role/status/progress.
  - _Requirements: 3_

- [x] 25. Project workspace & breakdown tree UI
  - Overview + tabbed workspace; `Tree` component (expand/collapse, move/reorder/nest, keyboard + mobile), component navigation.
  - _Requirements: 6, 7, 19.3_

- [x] 26. Component detail views
  - Shared tabs: Overview (summary + progress), Materials table + transactions, Budget summary + breakdown, Schedule list/timeline + current phase, Personnel list, Daily records/usage log, Activity feed; contextual actions; empty/error states.
  - _Requirements: 7, 8, 9, 10, 11, 12, 13, 14, 19.5, 19.6_

- [x] 27. Cross-cutting pages
  - Notifications, Invitations (accept/decline), Profile, Settings (all groups incl. accessibility), Reports within workspace, global History.
  - _Requirements: 14, 15, 16, 17_

## Phase F — Integration & Verification

- [x] 28. Wire up, build & verify end-to-end
  - Run migrate + seed; start server + client; typecheck/build both; walk the flow Login → Projects → Tree → Part → Details; fix issues; confirm server-side permission denials and negative-stock/budget-change invariants hold.
  - _Requirements: all (integration)_
