# BuildTrack — Design Guidelines

## 1. Design Direction

The interface should feel: **Professional + Simple + Calm + Reliable**

**Avoid:** excessive colors, huge dashboards, too many cards, overloaded navigation, unnecessary animations, complicated forms, tiny text, too many buttons, information overload.

**Use:** spacious layouts, clear hierarchy, strong typography, neutral surfaces, subtle borders, consistent spacing, rounded-but-professional components, clear status indicators, progressive disclosure, contextual actions.

---

## 2. Visual System

### Typography
- Primary interface font: **Sora** (or equivalent, if continuing the established typography direction)
- Use typographic hierarchy (size/weight variation) rather than excessive font weights

### Color
- Neutral background
- White surfaces
- Dark charcoal text
- Muted secondary text
- One primary BuildTrack accent color
- Semantic status colors (success/warning/error/info)
- Color should communicate meaning, not just decorate

---

## 3. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| Desktop | Sidebar + Main Content |
| Tablet | Collapsed Sidebar + Main Content |
| Mobile | Compact Header → Project Navigation → Content |

The Project Breakdown tree must remain easy to navigate even on small screens.

---

## 4. Accessibility

- Keyboard navigation
- Visible focus states
- Screen-reader support
- High contrast mode
- Font scaling
- Reduced motion
- Large controls / touch targets
- Clear labels
- Status indicators that don't rely on color alone
- Accessible tables and forms

---

## 5. Empty States

Tell the user what to do next, not just that there's nothing there.

**Bad:** "No data."
**Good:**
> **No materials have been added yet.**
> Add your first material to begin tracking project inventory.
> `[ + Add Material ]`

---

## 6. Error States

Human, actionable messaging.

**Bad:** "Error 500."
**Good:**
> **We couldn't save this material.**
> Please check the information and try again.
> `[ Try Again ]`

---

## 7. Contextual Actions

Actions shown depend on where the user is in the hierarchy — this keeps the interface clean.

**Project level:**
```
+ Add Component
+ Invite Member
+ Add Schedule
+ Add Budget
```

**Component level:**
```
+ Add Material
+ Record Usage
+ Update Progress
+ Add Activity
+ Add Expense
```

**Material level:**
```
Receive Stock
Record Usage
Transfer
Adjust Stock
```

---

## 8. Reference Layouts

**Home:**
```
Good afternoon, Clark.
Welcome back to BuildTrack.
Your construction projects are waiting for you.
          [ Explore Projects → ]
```

**Projects list:**
```
My Projects                         + New Project
🔍 Search projects...
[ Status ] [ Project Type ] [ Role ] [ Date ]
────────────────────────────────────────
Riverside Residential Building
Residential • Antipolo
Progress     68%
Status       Active
                         [ Open Project → ]
```

**Project Overview:**
```
Riverside Residential Building
Residential · Antipolo, Rizal · Active
────────────────────────────
Progress: 68%
Approved Budget: ₱4,200,000
Spent: ₱2,860,000
Remaining: ₱1,340,000
────────────────────────────
Project Breakdown: Building A → Foundation → Ground Floor → First Floor → Electrical
```
