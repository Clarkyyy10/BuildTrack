# BuildTrack — Design System

> Design source of truth. This documents the system as it is actually
> implemented in `client/src/styles/tokens.css`, `global.css`, `animations.css`,
> and the shared primitives in `client/src/components/ui.tsx`. Keep this file in
> sync with those files, not the other way around.

## 1. Mode & direction

BuildTrack is an authenticated product application — an **Operate**-mode
surface. The user is always mid-task (tracking a build, editing a budget,
reviewing schedule). That sets the priorities:

- **Scanability, consistency, and standard affordances outrank expression.**
  The tool should disappear into the task.
- **Earned familiarity.** A category-fluent user (PM, site engineer, architect,
  contractor) should trust every control on sight. No invented affordances for
  standard tasks.
- **Brand lives in precise details**, not decoration: the terracotta accent, the
  warm-concrete neutrals, the technical typeface, themed browser surfaces.

Personality: **professional, calm, reliable, engineering-grade.**

## 2. Identity

- **Accent — terracotta / burnt orange.** Industrial and construction-appropriate
  (hi-vis, safety signage), and deliberately *not* the default indigo/violet of
  generic SaaS. Used only for primary actions, current selection, links,
  progress fills, and state indicators — never decoration.
- **Neutrals — warm concrete.** Warm off-white backgrounds and warm greys, not
  cold slate. This is a large part of what makes the palette feel intentional.
- **Type — IBM Plex.** One family carries everything (Plex Sans for UI, Plex Mono
  for IDs/measurements). Self-hosted via `@fontsource` (no render-blocking CDN).

## 3. Color tokens

Semantic colors live in distinct hue lanes (green / amber / red / blue) so
nothing collides with the terracotta accent. All contrast targets meet WCAG AA
(body text ≥4.5:1).

### Light
| Token | Value | Role |
|---|---|---|
| `--bg` | `#f5f4f1` | App background (warm concrete) |
| `--surface` | `#ffffff` | Cards, content surfaces |
| `--surface-2` | `#f2f0ec` | Recessed fills, table headers, hover |
| `--panel` | `#efece7` | Sidebar / top bar (distinct neutral layer) |
| `--panel-border` | `#e2ddd4` | Panel edges |
| `--border` | `#e7e3db` | Hairline borders |
| `--border-strong` | `#d5cfc4` | Inputs, scrollbar thumb |
| `--text` | `#1c1a17` | Primary ink (warm near-black) |
| `--text-secondary` | `#57534e` | Secondary text |
| `--text-muted` | `#9c968b` | Muted / metadata |
| `--accent` | `#c2410c` | Terracotta accent (5.2:1 on white) |
| `--accent-hover` | `#9a3412` | Accent hover |
| `--accent-soft` | `#fdefe7` | Accent tint (active nav, unread, selection) |
| `--accent-border` | `#f4c6ab` | Accent-tinted borders |
| `--on-accent` | `#ffffff` | Text/icons on accent fills |
| `--success` | `#15803d` | Success |
| `--warning` | `#a16207` | Warning (mustard, distinct from accent) |
| `--error` | `#b42318` | Error |
| `--info` | `#1d4ed8` | Information |

Each semantic color has a `*-soft` tint for pill/callout backgrounds.

**User-selectable accent.** The accent is themeable per user via `data-accent`
on `:root` (persisted in settings). Terracotta is the default; the curated
presets are terracotta, amber, forest, teal, blue, violet, rose, and graphite.
Each preset ships a light and a dark variant with an accessible `--on-accent`,
so any choice stays AA-compliant. Theme also supports `light`, `dark`, and
`system` (follows the OS, live). Users pick both in Settings → Appearance.

### Dark (warm charcoal, not black)
Key deltas: `--bg #16130f`, `--surface #1e1a15`, `--panel #1a1611`,
`--text #ece6dc`. The accent brightens to `#fb7f45` for legibility on dark
surfaces, and **`--on-accent` becomes `#1b120c`** — near-black text on the bright
orange fill (6.6:1), the hi-vis look done accessibly.

Theming also supports `data-contrast="high"`, `data-density="compact"`, and
`data-motion="reduced"` at the `:root` level.

## 4. Typography

- **One family**, fixed `rem` scale (not fluid/clamped — product UI is viewed at
  consistent DPI). Base 16px, scaled by `--font-scale`.
- Steps: `h1 1.6rem` · `h2 1.25rem` · `h3 1.02rem` · `h4 0.9rem`, weight 600,
  tracking `-0.02em`. Tight ratio (~1.2) to avoid noise across many type
  elements. Headings shrink one step at ≤900/720px.
- Body line-height 1.5; prose measure 65–75ch. Data/tables may run denser.
- Numeric data uses `font-variant-numeric: tabular-nums`.

## 5. Spacing, radii, elevation

- **Spacing scale:** `--sp-1..7` = 4 / 8 / 12 / 16 / 24 / 32 / 48px. Use the
  scale, not arbitrary values. Tight within a group, generous between groups,
  more space above a heading than below it.
- **Radii:** `--radius-sm 8px` (buttons, inputs, small controls) · `--radius 12px`
  (cards) · `--radius-lg 16px` (modals). Pills (999px) only for small controls.
- **Elevation is declared once — border OR shadow, never both** (no "ghost
  card"). Surfaces use a 1px border. Shadow (`--shadow`) is reserved for overlays
  (modals) and hover-lift. Shadows carry offset + soft blur, tinted to the warm
  ink hue.

## 6. Components (shared primitives)

All in `client/src/components/ui.tsx`. Pages must compose these rather than
re-styling one-offs, so the product stays one coherent surface.

- **Button** — `primary` (accent fill + `--on-accent`), `secondary` (bordered
  surface), `ghost`, `danger`. Every variant ships hover / active / disabled;
  focus via global `:focus-visible`. Solid variants brighten + lift; light
  variants shift surface on hover.
- **Card** — border-only elevation; `interactive` adds hover-lift + shadow.
- **StatusPill** — dot **plus** text label; never color-only (a11y).
- **ProgressBar**, **Stat** — tabular numerals, accent fill.
- **EmptyState / ErrorState** — lead with an icon circle; state the next action.
- **Skeleton / ListSkeleton / RowsSkeleton** — content-shaped loading. Prefer
  these over a centered spinner for lists, feeds, and panels. `Spinner` is only
  for brief full-page route loads.
- **Modal** — `position: fixed`, backdrop padding, escapes container clipping.

**Every interactive component covers: default, hover, focus, active, disabled,
loading, error** where applicable.

## 7. Browser surfaces

Themed from the palette, not left as UA defaults (the cheapest signal a page was
actually built): `::selection`, `caret-color`, native `accent-color` for
checkboxes/radios/ranges, and custom scrollbars (thin, palette-tinted, both
WebKit and Firefox). Focus ring is a 2px accent outline with offset.

## 8. Motion

- 150–250ms on most transitions; motion conveys state (hover, selection, reveal,
  loading), never decoration. No orchestrated page-load sequences.
- Honors both the in-app `data-motion="reduced"` setting and the OS-level
  `prefers-reduced-motion` media query.

## 9. Responsive behavior

| Breakpoint | Layout |
|---|---|
| Desktop | Sidebar (panel neutral) + main content, max 1200px |
| Tablet (≤860px) | Sidebar collapses to an off-canvas drawer + top bar |
| Mobile | Compact top bar → drawer nav → full-width content |

Responsive behavior is **structural** (collapse sidebar, scrollable tables,
breakpoint columns), not fluid typography. No horizontal overflow: `overflow-x`
is guarded, flex children carry `min-width: 0`, wide tables scroll inside their
card with a sticky header. The breakdown tree stays navigable on small screens.

## 10. Accessibility

Keyboard navigation, visible focus, semantic HTML, accessible labels, logical tab
order, adequate touch targets, high-contrast mode, font scaling, reduced motion,
and status that never relies on color alone (StatusPill dot + label).

## 11. Content patterns

**Empty states** teach the next action, not "no data":

> **No materials have been added yet.**
> Add your first material to begin tracking project inventory.
> `[ + Add material ]`

**Error states** name the problem and the recovery:

> **We couldn't save this material.**
> Please check the information and try again.
> `[ Try again ]`

**UX copy:** the product's own plain language; controls name their action; no
em-dashes in visible copy.

## 12. Contextual actions

Actions depend on where the user is in the hierarchy, which keeps each screen
clean:

- **Project:** Add component · Invite member · Add schedule · Add budget
- **Component:** Add material · Record usage · Update progress · Add activity · Add expense
- **Material:** Receive stock · Record usage · Transfer · Adjust stock

## 13. Anti-patterns (do not reintroduce)

- Default indigo/violet accent, or cold slate neutrals.
- Ghost cards (border under a wide shadow); pick one elevation.
- Colored `border-left/right` above 1px on cards, list items, or alerts.
- Gradient text; emphasis comes from weight/size.
- Random multi-color palettes for data viz — stay within the accent + semantic
  lanes (schedule bars use accent with opacity steps).
- Centered spinners inside content panels — use skeletons.
- Kicker/eyebrow labels above headings; unthemed browser defaults; emoji or
  unicode glyphs standing in for the drawn icon set.
