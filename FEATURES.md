# BuildTrack — Functional Specification

## 1. Progress Monitoring

Rolls up across levels: `Task → Work → Area → Floor → Building → Project`

**Open decision:** roll-up calculation method not yet finalized. Options:
- Simple average
- Budget-weighted progress
- Work-quantity weighted progress
- Manually assigned component weights

Must be finalized before implementation for consistency.

---

## 2. Materials Management

Materials attach to the specific component where they're used (e.g., `Building A → First Floor → Bedroom 1 → Electrical Wiring → PVC Conduit`).

**Material fields:** name, description, category, quantity, unit, unit cost, total cost, supplier, status, date, component, notes.

### Material Inventory (transactional, not overwritten)
```
Ending Stock = Beginning + Received − Used − Waste
```
Transaction types: **Receive, Use, Waste, Transfer, Adjustment.** Full history is retained rather than overwriting the current quantity.

### Material Transfers
Move materials between components (e.g., Warehouse → Foundation → Ground Floor). Each transfer records: source, destination, material, quantity, user, date/time, reason/notes.

---

## 3. Budget Management

```
Approved Budget → Allocations → Expenses → Remaining Budget
```

**Rule:** adding an expense or material does **not** automatically change the approved budget. A budget change is a separate, logged event:
```
Previous: ₱4,000,000
New: ₱4,200,000
Difference: +₱200,000
Changed by: User ID
Date: Timestamp
Reason: Additional approved work
```

---

## 4. Schedule

Each component can have: start date, expected completion, status, progress, activities (dependencies in future versions).

**Views:** List, Calendar, Timeline, Gantt. MVP should start with a clean list/timeline before a full Gantt view.

---

## 5. Personnel

Assigned to specific components, e.g.:
```
Building A → Electrical → Personnel
  Maria Cruz — Electrician
  Juan Dela Cruz — Helper
  Mark Santos — Site Engineer
```

---

## 6. Daily Site Records

Answers: *"What happened on the construction site today?"*

**Fields:** date, project, component, work completed, materials used, people present, progress, issues, notes.

**Future additions:** photos, weather, safety observations, deliveries.

---

## 7. Activity Log (project-level audit trail)

Automatic, structured record of every change: **WHAT / WHEN / WHO / WHERE / BEFORE–AFTER.**

```
Sept 7, 2026 — 10:42 AM
Clark Santos — Updated Foundation Progress
Component: Building A → Foundation
Previous: 45%   New: 60%
```

### Daily Records vs. Activity Log — not the same thing
| Daily Record | Activity Log |
|---|---|
| What happened on-site | What changed in the system data |
| "Foundation reinforcement completed today" | "Clark changed Foundation progress from 45% to 60%" |

---

## 8. Global History

Cross-project activity feed, accessible outside the project workspace.

| Global History | Project Activity Log |
|---|---|
| Across all projects | One project |
| High-level | Detailed |
| Monitor multiple projects | Audit one project |
| In global navigation | Inside the project |

---

## 9. Notifications

Triggers: project invitation, invitation accepted, schedule changed, material stock low, budget warning, progress update, member added/removed, daily record submitted, other important project updates.

Must respect project membership and permissions.

---

## 10. Project Templates

Starting points only, not restrictions: **Residential, Commercial, Road, Custom/Blank.** After creation, users can freely add/remove/rename/move/reorder/nest/customize components.

---

## 11. Reports

Lives inside the project workspace, not the global nav:
- Project Progress Report
- Material Report
- Budget Report
- Personnel Report
- Daily Activity Report
- Project Activity/Audit Report

---

## 12. Settings (customization center)

```
Appearance | Interface | Navigation | Personalization
Notifications | Privacy | Security | Accessibility
Language & Region | Data & Storage
```

Key controls: theme/accent/font/density (Appearance); sidebar behavior, default project page, table density (Interface); profile/online/last-active visibility (Privacy); password, sessions, login history, future 2FA (Security); font scaling, high contrast, reduced motion, screen-reader support (Accessibility).

---

## 13. Security Architecture

- Password hashing
- Secure, HTTP-only session cookies
- JWT/session security as appropriate
- **Server-side authorization** (not just UI hiding)
- Project membership checks
- Role-based permissions
- Generic authentication errors (no user enumeration)
- Secure password recovery
- Audit history / session management
