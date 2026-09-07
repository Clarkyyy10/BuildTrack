# BuildTrack — Project Overview

**Construction Project Information, Monitoring, and Accountability System**

> **Tagline:** Track Every Part. Build With Confidence.
> **Core UX Principle:** Projects First. Details When Needed.
> **Design Philosophy:** Simple on the surface. Powerful underneath.

---

## 1. What It Is

BuildTrack is a project-centered construction information and monitoring system. Instead of separating information into disconnected modules (budget, materials, schedule, personnel), it connects information to the **specific part of a construction project where it belongs**.

```
Project → Building A → First Floor → Bedroom 1 → Electrical Work
   → Materials → Personnel → Schedule → Progress → Daily Records → Activity History
```

**One-line definition:**
> BuildTrack is a project-centered construction information system where a customizable project breakdown connects construction work with its budget, materials, schedule, personnel, progress, daily activities, and history.

---

## 2. Main Goal

Give construction teams a simple, organized, professional system to:

- Organize projects and break them into manageable components
- Track progress, materials, and budget
- Manage personnel and schedules
- Record daily construction activities
- Collaborate with project members
- Track changes and maintain accountability
- Generate useful reports
- Customize their experience

---

## 3. Target Users

- Project Managers
- Site Engineers
- Architects
- Contractors
- Supervisors
- Construction personnel
- Project members / authorized viewers

Exact permissions depend on **project role and membership** (see `ROLES_AND_PERMISSIONS.md`).

---

## 4. Core Philosophy

1. **Projects First** — the project is the center of the system; no hunting through unrelated modules.
2. **Details When Needed** — progressive disclosure: show what matters first, reveal depth on demand.
3. **Simple on the Surface, Powerful Underneath** — complex construction data without a complicated interface.

---

## 5. The Differentiator

The strongest unique idea is the **Project Breakdown**: one flexible hierarchy tree instead of separate structures for "physical building" vs. "construction trades."

Traditional systems think in flat modules:
```
Projects · Materials · Budget · Schedule · Personnel
```

BuildTrack thinks contextually:
```
PROJECT → WHERE/WHAT PART? → WHAT WORK? → WHAT MATERIALS?
   → WHO? → WHEN? → HOW MUCH? → HOW FAR? → WHAT HAPPENED? → WHO CHANGED IT?
```

This makes construction information **contextual and traceable**.

---

## 6. What BuildTrack Is NOT

Not intended to become a full:
- BIM platform
- ERP / Accounting / Payroll / HR system
- CAD application
- Equipment-management platform

...unless deliberately added later. Its core identity stays: **construction project information, resource monitoring, collaboration, and accountability.**

---

## 7. Roadmap

### Phase 1 — Foundation

**Authentication**
- Login, Signup, Sessions, Profile, Password recovery

**Projects**
- Create, View, Search, Filter, Open, Edit

**Project Breakdown**
- Create / Edit / Delete component
- Nest, Reorder, Expand/Collapse

### Phase 2 — Construction Management

**Component**
- Overview, Progress, Budget, Materials, Schedule, Personnel

**Materials**
- Add, Receive, Use, Waste, Transfer
- Transaction history

**Budget**
- Approved budget, Expenses, Allocations, Remaining budget, Budget changes

### Phase 3 — Collaboration & Accountability

**Personnel**
- Assign / remove members

**Invitations**
- Send, Accept, Decline, Cancel, Expire

**Daily Records**
- Create, View, track daily site activity

**Activity Log**
- Automatic audit events (who/what/when/where/before-after)

**Notifications**
- Project updates, invitations, warnings, member updates

### V2 (Future)

- Advanced reports
- Advanced permissions
- Project templates
- Calendar / Gantt / Charts
- Photos
- Presence / online status
- Advanced customization

### V3 (Future)

- Offline synchronization
- Mobile application
- Advanced analytics / forecasting
- Document management
- Procurement
- Equipment management
- External APIs
- More advanced reporting

**Note:** V2/V3 features must not be allowed to complicate the initial (Phase 1–3) system.

---

## Related Docs
- `STRUCTURE.md` — navigation, information architecture, data model
- `DESIGN.md` — UI/UX direction and visual system
- `FEATURES.md` — detailed functional specs
- `ROLES_AND_PERMISSIONS.md` — roles, permissions, invitations
