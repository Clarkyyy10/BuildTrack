# BuildTrack — Roles, Permissions & Membership

## 1. User Identity

Every user has a permanent unique **User ID** (e.g. `USR-000587`) — names are never treated as unique identifiers. If two people share a name, the system must require explicit selection by ID rather than guessing.

User ID is referenced across: Profile, Project Membership, Invitations, Personnel, Audit history, Notifications, Permissions. It **cannot be changed**.

---

## 2. Project Roles (proposed)

- Project Manager
- Site Engineer
- Architect
- Contractor
- Viewer

*(Exact permission matrix to be finalized separately.)*

### Candidate Permissions
- View project
- Edit project
- Manage budget
- Manage materials
- Manage schedule
- Manage personnel
- Invite members
- View activity history
- Create daily records
- Update progress

---

## 3. Membership Chain

```
User → Project Membership → Project → Project Components → Project Data
```

Permissions are enforced **server-side** at every level — a hidden button is not access control.

---

## 4. Project Invitations

```
Search User → Select User ID → Choose Proposed Role
   → Send Invitation → User Accepts/Declines → Membership Created
```

**Invitation states:** Pending, Accepted, Declined, Expired, Cancelled.

Only an **Accepted** invitation creates project membership and access.

---

## 5. Personnel vs. Membership

- **Project Membership** = system-level access (login, permissions, roles like Project Manager/Viewer).
- **Personnel** = on-site assignment to a specific component/trade (e.g. Electrician, Helper, Site Engineer) — tracked per component, not necessarily tied 1:1 to a system role.
