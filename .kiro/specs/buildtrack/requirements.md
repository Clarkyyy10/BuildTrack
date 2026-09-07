# BuildTrack — Requirements

## Introduction

BuildTrack is a project-centered construction information, monitoring, and accountability system. Its defining idea is a single flexible **Project Breakdown** hierarchy where every component (Building, Floor, Area, Room, Phase, Trade, Work, Task, or custom node) carries its own budget, materials, schedule, personnel, progress, daily records, and audit history. The system favors a calm, professional interface with progressive disclosure — "Projects First. Details When Needed."

This document captures the functional and non-functional requirements for **Phases 1–3** of the roadmap (Foundation, Construction Management, Collaboration & Accountability). V2/V3 features (Gantt, analytics, offline, mobile, procurement, etc.) are explicitly out of scope but must not be architecturally blocked.

Requirements are written as user stories with EARS-style acceptance criteria (WHEN/IF/WHILE … THE SYSTEM SHALL …).

---

## Glossary

- **User ID** — permanent, immutable, unique identifier per user (format `USR-######`). Names are never unique identifiers.
- **Project Membership** — system-level access to a project (login, role, permissions).
- **Project Component** — a node in the Project Breakdown tree.
- **Personnel** — an on-site assignment to a component (role like Electrician/Helper), distinct from membership.
- **Material Transaction** — an immutable inventory event (Receive, Use, Waste, Transfer, Adjustment).
- **Daily Record** — a human account of what happened on-site on a given day.
- **Activity Log** — an automatic, structured audit trail of data changes (what/when/who/where/before–after).

---

## Requirements

### Requirement 1 — Authentication & Sessions

**User Story:** As a construction professional, I want to securely sign up, log in, and stay signed in, so that only authorized people can access project data.

#### Acceptance Criteria
1. WHEN a visitor submits valid signup details (name, email, password) THE SYSTEM SHALL create a user account, assign a permanent immutable User ID in the format `USR-######`, and store the password only as a salted hash.
2. WHEN a user submits valid login credentials THE SYSTEM SHALL establish an authenticated session using a signed, HTTP-only cookie.
3. IF login credentials are invalid THE SYSTEM SHALL return a generic authentication error that does not reveal whether the email exists (no user enumeration).
4. WHEN an authenticated user requests logout THE SYSTEM SHALL invalidate the session cookie.
5. WHILE a request has no valid session THE SYSTEM SHALL reject access to any protected resource with an unauthorized response.
6. WHEN a user requests password recovery for an email THE SYSTEM SHALL respond identically whether or not the email exists, and only enable reset via a time-limited token.
7. THE SYSTEM SHALL never expose password hashes, tokens, or session secrets in any API response.

### Requirement 2 — User Identity & Profile

**User Story:** As a user, I want a stable identity and profile, so that I can be reliably referenced across projects, invitations, and audit history.

#### Acceptance Criteria
1. THE SYSTEM SHALL treat the User ID as immutable; no operation shall change a user's ID after creation.
2. WHEN two users share the same display name THE SYSTEM SHALL require selection by User ID rather than by name in any user-picking flow.
3. WHEN a user updates profile fields (display name, avatar, contact info) THE SYSTEM SHALL persist the changes without altering the User ID.
4. WHERE a user is referenced (membership, invitations, personnel, audit, notifications) THE SYSTEM SHALL reference the User ID.

### Requirement 3 — Projects

**User Story:** As a project manager, I want to create and manage projects, so that construction work is organized into distinct efforts.

#### Acceptance Criteria
1. WHEN an authenticated user creates a project (name, type, location, optional template) THE SYSTEM SHALL persist it, record the creator, and grant the creator the Project Manager role.
2. WHEN a member opens the Projects section THE SYSTEM SHALL list only projects the user is a member of, showing per-project role, status, and overall progress.
3. WHEN a member searches, filters (status, type, role, date), or sorts projects THE SYSTEM SHALL return results scoped to their memberships only.
4. WHEN a permitted member edits project details THE SYSTEM SHALL persist changes and record an activity log entry.
5. IF a project is created from a template (Residential, Commercial, Road) THE SYSTEM SHALL pre-populate a starting breakdown that the user can freely add to, rename, move, reorder, nest, or delete.
6. THE SYSTEM SHALL NOT place Materials, Budget, Schedule, Personnel, Daily Records, Reports, or Activity Log in the global navigation; these SHALL be reachable only within a project workspace.

### Requirement 4 — Project Membership & Roles

**User Story:** As a project manager, I want role-based membership, so that each collaborator has appropriate access.

#### Acceptance Criteria
1. THE SYSTEM SHALL support at least these roles: Project Manager, Site Engineer, Architect, Contractor, Viewer.
2. WHEN any project-scoped action is requested THE SYSTEM SHALL enforce the required permission server-side based on the requester's membership and role.
3. IF a user without a required permission attempts an action THE SYSTEM SHALL deny it with an authorization error regardless of whether the UI exposed the control.
4. WHEN a permitted member changes another member's role THE SYSTEM SHALL persist it and record an activity log entry.
5. WHEN a member is removed from a project THE SYSTEM SHALL revoke their access to that project's data.
6. THE SYSTEM SHALL evaluate permissions along the chain User → Membership → Project → Component → Data.

### Requirement 5 — Project Invitations

**User Story:** As a project manager, I want to invite users by ID and let them accept or decline, so that membership is explicit and consensual.

#### Acceptance Criteria
1. WHEN a permitted member searches for a user and selects a User ID and proposed role THE SYSTEM SHALL create an invitation in the Pending state.
2. THE SYSTEM SHALL support invitation states: Pending, Accepted, Declined, Expired, Cancelled.
3. WHEN an invited user accepts a Pending invitation THE SYSTEM SHALL create project membership with the proposed role and mark the invitation Accepted.
4. WHEN an invited user declines THE SYSTEM SHALL mark the invitation Declined and SHALL NOT create membership.
5. WHEN an inviter cancels a Pending invitation THE SYSTEM SHALL mark it Cancelled and prevent acceptance.
6. IF an invitation passes its expiry THE SYSTEM SHALL treat it as Expired and prevent acceptance.
7. THE SYSTEM SHALL create membership only from an Accepted invitation (no silent access).

### Requirement 6 — Project Breakdown (Component Tree)

**User Story:** As a site engineer, I want one flexible breakdown tree, so that any physical part or trade can be represented and organized freely.

#### Acceptance Criteria
1. THE SYSTEM SHALL model the breakdown as a single hierarchy where each component may have one parent and many children, with no fixed depth limit.
2. THE SYSTEM SHALL allow each component to represent any type (Building, Floor, Area, Room, Phase, Trade, Work, Task, or Custom).
3. WHEN a permitted user creates, renames, edits, or deletes a component THE SYSTEM SHALL persist it and record an activity log entry.
4. WHEN a permitted user moves or nests a component under a new parent THE SYSTEM SHALL update the hierarchy without creating a cycle.
5. IF a move would make a component a descendant of itself THE SYSTEM SHALL reject the operation.
6. WHEN a permitted user reorders sibling components THE SYSTEM SHALL persist the new order.
7. WHEN a component is deleted THE SYSTEM SHALL handle its descendants deterministically (cascade delete) and record the action.
8. WHEN a user expands or collapses nodes THE SYSTEM SHALL present the tree accordingly and remain navigable on small screens.

### Requirement 7 — Consistent Component Structure

**User Story:** As a user, I want every component to expose the same set of detail areas, so that navigation is predictable at any level.

#### Acceptance Criteria
1. THE SYSTEM SHALL expose the same detail areas for every component: Overview, Progress, Budget, Materials, Schedule, Personnel, Daily Records, Activity Log.
2. WHEN a user opens any component THE SYSTEM SHALL show a summary (status, dates, assigned team count, completion) consistent with other components.
3. WHERE data for an area is empty THE SYSTEM SHALL show a guiding empty state describing the next action rather than a bare "no data" message.

### Requirement 8 — Progress Monitoring & Roll-up

**User Story:** As a project manager, I want progress to roll up the tree, so that I can see completion at every level.

#### Acceptance Criteria
1. WHEN progress is updated on a component THE SYSTEM SHALL persist the value (0–100%) and record an activity log entry with previous and new values.
2. THE SYSTEM SHALL compute a parent component's progress from its children using a single configured roll-up method.
3. THE SYSTEM SHALL support a configurable roll-up method with a documented default (default: budget-weighted; alternatives: simple average, work-quantity weighted, manual component weights).
4. WHEN a leaf component has no children THE SYSTEM SHALL use its directly entered progress value.
5. WHEN any descendant progress changes THE SYSTEM SHALL reflect the updated roll-up at all ancestor levels and at the project level.

### Requirement 9 — Materials & Transactional Inventory

**User Story:** As a site engineer, I want materials tracked per component with full transaction history, so that stock is accurate and auditable.

#### Acceptance Criteria
1. WHEN a permitted user adds a material to a component THE SYSTEM SHALL store name, description, category, unit, unit cost, supplier, status, notes, and associate it with that component.
2. THE SYSTEM SHALL record inventory changes only as immutable transactions of type Receive, Use, Waste, Transfer, or Adjustment, never by overwriting a stored quantity.
3. THE SYSTEM SHALL compute current stock as `Beginning + Received − Used − Waste ± Adjustments` and account for Transfers between components.
4. WHEN a Transfer is recorded THE SYSTEM SHALL capture source component, destination component, material, quantity, user, timestamp, and reason, decrementing the source and incrementing the destination.
5. IF a Use, Waste, or Transfer would drive stock below zero THE SYSTEM SHALL reject the transaction with a clear error.
6. WHEN any material transaction is recorded THE SYSTEM SHALL retain full history and record an activity log entry.
7. WHEN a user views a component's materials THE SYSTEM SHALL show, per material, total needed/received, used (including today), and remaining.

### Requirement 10 — Budget Management

**User Story:** As a project manager, I want approved budget, allocations, and expenses tracked separately, so that spending and budget changes stay accountable.

#### Acceptance Criteria
1. THE SYSTEM SHALL track approved budget, allocations, expenses, and remaining budget (`Remaining = Approved − Expenses`) per project and per component.
2. WHEN an expense or a material is added THE SYSTEM SHALL NOT change the approved budget automatically.
3. WHEN a permitted user changes the approved budget THE SYSTEM SHALL record it as a separate budget-change event capturing previous amount, new amount, difference, changed-by User ID, timestamp, and reason.
4. WHEN a permitted user records an expense THE SYSTEM SHALL store amount, category, date, description, component, and creator, and record an activity log entry.
5. WHEN a user views a budget THE SYSTEM SHALL show approved, spent, remaining, percent spent, an over/under indicator, and a category breakdown.

### Requirement 11 — Schedule

**User Story:** As a site engineer, I want each component to have a schedule with activities, so that timing and current phase are visible.

#### Acceptance Criteria
1. WHEN a permitted user sets a component schedule THE SYSTEM SHALL store start date, expected completion, status, and progress.
2. WHEN a permitted user adds a schedule activity THE SYSTEM SHALL store name, start date, end date, and status, associated with the component.
3. WHEN a user views a schedule THE SYSTEM SHALL present activities as a list and a timeline and indicate the current phase for today's date.
4. THE SYSTEM SHALL provide the schedule as list/timeline in the MVP and SHALL NOT require a full Gantt view (Gantt is deferred to V2).
5. WHEN a schedule changes THE SYSTEM SHALL record an activity log entry and MAY trigger a notification.

### Requirement 12 — Personnel Assignment

**User Story:** As a site engineer, I want to assign people to specific components, so that responsibility on-site is clear and distinct from system access.

#### Acceptance Criteria
1. WHEN a permitted user assigns personnel to a component THE SYSTEM SHALL store the person (by User ID where applicable, or name for non-members), on-site role, and dates.
2. THE SYSTEM SHALL treat personnel assignment as independent from project membership (a person may be personnel without matching system role).
3. WHEN a permitted user marks a personnel assignment as lead THE SYSTEM SHALL persist that designation for the component.
4. WHEN personnel are added or removed THE SYSTEM SHALL record an activity log entry and MAY trigger a notification.
5. WHEN a user views a component's personnel THE SYSTEM SHALL list assigned people with role, dates, and lead indicator.

### Requirement 13 — Daily Site Records

**User Story:** As a site engineer, I want to record what happened on-site each day, so that daily activity is documented.

#### Acceptance Criteria
1. WHEN a permitted user creates a daily record THE SYSTEM SHALL store date, project, component, work completed, materials used, people present, progress, issues, and notes.
2. WHEN a user views daily records THE SYSTEM SHALL list them chronologically and allow filtering by component and date.
3. THE SYSTEM SHALL treat a Daily Record (what happened on-site) as distinct from an Activity Log entry (what changed in the data).
4. WHEN a daily record is submitted THE SYSTEM SHALL record an activity log entry and MAY trigger a notification.

### Requirement 14 — Activity Log & Global History

**User Story:** As a project manager, I want an automatic audit trail, so that every change is attributable and reviewable.

#### Acceptance Criteria
1. WHEN any data-changing action occurs THE SYSTEM SHALL automatically record an activity log entry capturing what, when, who (User ID), where (project/component), and before/after values where applicable.
2. THE SYSTEM SHALL make a project's activity log viewable within that project by permitted members.
3. THE SYSTEM SHALL provide a global history feed across all of a user's projects, accessible outside the project workspace.
4. THE SYSTEM SHALL NOT allow activity log entries to be edited or deleted by users (append-only).

### Requirement 15 — Notifications

**User Story:** As a member, I want relevant notifications, so that I stay aware of important project events.

#### Acceptance Criteria
1. WHEN a triggering event occurs (invitation, invitation accepted, schedule change, low material stock, budget warning, progress update, member added/removed, daily record submitted) THE SYSTEM SHALL create a notification for the appropriate recipients.
2. THE SYSTEM SHALL only deliver notifications consistent with the recipient's project membership and permissions.
3. WHEN a user views notifications THE SYSTEM SHALL list them with read/unread status and allow marking as read.

### Requirement 16 — Reports

**User Story:** As a project manager, I want reports within the project, so that I can summarize progress, materials, budget, personnel, and activity.

#### Acceptance Criteria
1. THE SYSTEM SHALL provide, within the project workspace, at least: Project Progress, Material, Budget, Personnel, Daily Activity, and Activity/Audit reports.
2. WHEN a permitted user generates a report THE SYSTEM SHALL compute it from current project data scoped to their permissions.
3. THE SYSTEM SHALL NOT place Reports in the global navigation.

### Requirement 17 — Settings & Customization

**User Story:** As a user, I want to customize my experience, so that the interface fits my needs and accessibility requirements.

#### Acceptance Criteria
1. THE SYSTEM SHALL provide settings groups: Appearance, Interface, Navigation, Personalization, Notifications, Privacy, Security, Accessibility, Language & Region, Data & Storage.
2. WHEN a user changes a setting THE SYSTEM SHALL persist it per user and apply it to their sessions.
3. THE SYSTEM SHALL support Appearance controls (theme, accent, font, density) and Interface controls (sidebar behavior, default project page, table density).
4. THE SYSTEM SHALL support Accessibility controls (font scaling, high contrast, reduced motion, screen-reader support).
5. THE SYSTEM SHALL support Security controls (change password, active sessions, login history) and Privacy controls (profile/online/last-active visibility).

### Requirement 18 — Security & Authorization (Non-Functional)

**User Story:** As a stakeholder, I want strong server-side security, so that data is protected and access is properly controlled.

#### Acceptance Criteria
1. THE SYSTEM SHALL enforce all authorization server-side; hiding a UI control SHALL NOT be treated as access control.
2. THE SYSTEM SHALL hash passwords with a salted, computationally hard algorithm and never store plaintext.
3. THE SYSTEM SHALL use HTTP-only session cookies and apply appropriate CSRF/CORS protections.
4. THE SYSTEM SHALL validate and sanitize all input server-side and use parameterized queries for all database access.
5. THE SYSTEM SHALL return generic authentication errors that prevent user enumeration.
6. THE SYSTEM SHALL check project membership and role permissions on every project-scoped request.

### Requirement 19 — Design, UX & Accessibility (Non-Functional)

**User Story:** As a user, I want a calm, professional, accessible interface, so that complex construction data is easy to work with.

#### Acceptance Criteria
1. THE SYSTEM SHALL present a calm, professional UI using neutral surfaces, one primary accent, semantic status colors, and strong typographic hierarchy (Sora or equivalent).
2. THE SYSTEM SHALL keep the Home page minimal (greeting + entry into Projects) with no global dashboards or analytics.
3. THE SYSTEM SHALL be responsive: sidebar + content on desktop, collapsed sidebar on tablet, compact header + project navigation on mobile, keeping the breakdown tree navigable on small screens.
4. THE SYSTEM SHALL meet accessibility expectations: keyboard navigation, visible focus states, screen-reader support, high contrast, font scaling, reduced motion, adequate touch targets, and status indicators that do not rely on color alone.
5. WHEN an error occurs THE SYSTEM SHALL present a human, actionable message with a recovery action rather than a raw error code.
6. THE SYSTEM SHALL show contextual actions appropriate to the current level (project vs component vs material).

---

## Out of Scope (V2/V3)

Advanced reports, advanced/granular permissions beyond the listed roles, project templates library beyond the basic starters, calendar/Gantt/chart-heavy dashboards, photos, presence/online status, offline sync, mobile app, analytics/forecasting, document management, procurement, equipment management, and external APIs. These SHALL NOT be built now but SHALL NOT be architecturally precluded.
