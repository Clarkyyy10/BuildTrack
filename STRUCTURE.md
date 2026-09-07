# BuildTrack — Structure & Architecture

## 1. Global Navigation (minimal, intentional)

```
BUILDTRACK
🏠 Home
📁 Projects
🔔 Notifications
✉ Invitations
👤 Profile
⚙ Settings
```

**Rule:** No global nav items for Monitoring, Schedule, Budget, Materials, Personnel, Reports, Daily Records, or History — those all live inside the **Project Workspace**. Project filtering only happens inside the Projects section; there is no global project filter following the user around.

---

## 2. Home (not a dashboard)

Extremely clean landing page. No budget charts, material stats, progress charts, Gantt charts, personnel stats, analytics, recent activity feeds, or large card collections. Just a greeting and an entry point into Projects.

---

## 3. Projects

Entry point for: viewing, searching, filtering, sorting, creating, and opening projects, plus seeing role/status/progress per project.

---

## 4. Project Workspace

Once a project is opened:

```
Overview
Breakdown
Schedule
Budget
Materials
Personnel
Daily Records
Activity Log
Reports
```

---

## 5. Project Breakdown (core concept)

One flexible hierarchy tree — not separate trees for physical structure vs. construction trades. Each node can represent a Building, Floor, Area, Room, Phase, Trade, Work, Task, or custom component.

```
Building A
├── Foundation
│   ├── Excavation
│   ├── Footings
│   └── Slab
├── Ground Floor
│   ├── Living Room
│   ├── Kitchen
│   └── Bedroom
├── First Floor
│   ├── Bedroom 1
│   └── Bedroom 2
├── Electrical
│   ├── Wiring
│   ├── Lighting
│   └── Panel
└── Plumbing
```

Supports: create, edit, delete, rename, move, reorder, nest, expand, collapse.

Every component shares the same consistent structure: Overview, Progress, Budget, Materials, Personnel, Schedule, Daily Records, Activity Log.

---

## 6. Recommended User Flow

```
LOGIN → HOME → PROJECTS → SEARCH/FILTER → SELECT PROJECT
  → PROJECT OVERVIEW → PROJECT BREAKDOWN → SELECT COMPONENT
  → COMPONENT DETAILS (Progress, Budget, Materials, Schedule, Personnel, Daily Records, Activity Log)
```

## 7. Core Operational Cycle

```
PLAN → BREAK DOWN → ASSIGN → SCHEDULE → BUDGET → EXECUTE
  → CONSUME MATERIALS → RECORD DAILY ACTIVITY → UPDATE PROGRESS
  → MONITOR → AUDIT
```

---

## 8. Data Architecture

```
USER
 └── PROJECT MEMBERSHIP
        └── PROJECT
               └── PROJECT COMPONENT
                     ├── BUDGET
                     ├── MATERIALS
                     ├── SCHEDULE
                     ├── PERSONNEL
                     └── PROGRESS
                            └── DAILY RECORDS
                                   └── ACTIVITY LOG
```

Permissions must be enforced **server-side** — hiding a UI button is not sufficient access control.

---

## 9. Core Database Entities (recommended, to finalize during implementation)

```
users
projects
project_members
project_invitations

project_components

materials
material_transactions

budgets
budget_allocations
expenses
budget_changes

schedules
schedule_activities

personnel_assignments

daily_records

notifications

audit_logs
```

---

## 10. Full Information Architecture

```
BUILDTRACK
├── HOME
├── PROJECTS
│     ├── Search / Filter / Sort
│     └── PROJECT
│           ├── Overview
│           ├── Breakdown → Components
│           ├── Schedule
│           ├── Budget
│           ├── Materials
│           ├── Personnel
│           ├── Daily Records
│           ├── Activity Log
│           └── Reports
├── NOTIFICATIONS
├── INVITATIONS
├── PROFILE
└── SETTINGS
      ├── Appearance
      ├── Interface
      ├── Navigation
      ├── Personalization
      ├── Notifications
      ├── Privacy
      ├── Security
      ├── Accessibility
      ├── Language & Region
      └── Data & Storage
```
