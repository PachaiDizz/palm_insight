# PalmInsight — UI Review & Improvement Roadmap

**Project:** PalmInsight (palm oil plantation productivity tracker)  
**Stack:** Next.js 16, Tailwind CSS v4, Supabase, React Query, Framer Motion, TypeScript  
**Last updated:** 2026-07-10

This document captures a full design/UI review and a prioritized list of implementations. Use it as a backlog reference when polishing the product.

---

## Table of contents

1. [Overall verdict](#overall-verdict)
2. [What already works well](#what-already-works-well)
3. [Friction points & gaps](#friction-points--gaps)
4. [Scorecard](#scorecard)
5. [Improvement roadmap](#improvement-roadmap)
   - [Tier 1 — High impact](#tier-1--high-impact-do-soon)
   - [Tier 2 — Product polish](#tier-2--solid-product-polish)
   - [Tier 3 — Structure & maintainability](#tier-3--structure--maintainability)
6. [Suggested sprint order](#suggested-implementation-order-23-sprints)
7. [Top 5 only](#if-you-only-do-five-things)
8. [What not to prioritize](#what-not-to-prioritize-yet)
9. [Quick wins checklist](#quick-wins-checklist)
10. [Related docs](#related-docs)

---

## Overall verdict

PalmInsight has a **coherent, product-minded aesthetic** — dark amber harvest tones, mobile-first shell, and real design-token thinking. It does not look like a generic dashboard template.

The main gap is **consistency and completion**: tokens vs hardcodes, light mode, brand assets, and reducing per-page style invention — not a full redesign.

**Overall: ~8/10** for a domain-specific SaaS at this stage.

---

## What already works well

### Brand & color system

- Amber (`#f59e0b` / `#d97706`) on near-black (`#0b0d13`) is a smart harvest / palm-oil choice — warmer and more distinctive than default “green agri.”
- Dual token layers work well:
  - Shadcn-style HSL tokens (`--primary`, `--card`, etc.)
  - App-specific hex vars (`--bg-base`, `--accent-primary`, chart/status tokens)
- Strong semantic choices:
  - `--status-work` / `--status-no-work`
  - Chart palette: bunches = amber, tons = blue
  - Z-index scale variables (`--z-overlay`, `--z-dropdown`, `--z-nav`, `--z-modal`)
  - Amber-tinted page headers instead of generic indigo banners

### Typography

- **Cabinet Grotesk** (display) + **Inter** (body) is a solid pairing.
- Utility classes: `.hero-headline`, `.page-title`, `.section-heading`, `.card-title`.
- Self-hosted via `next/font/local` — correct for PWA / offline reliability.

### Landing page

Strongest visual surface in the product:

- Scroll-aware glass nav
- Staggered Framer Motion entrances
- Product mock window (traffic lights + fake dashboard)
- Clear Malaysia positioning (“Built for Malaysian Palm Oil Estates”)
- Clear CTA path: free → register → dashboard

### App shell (mobile + desktop)

- Desktop sidebar + bottom tab bar for field phone use
- Safe-area padding (`env(safe-area-inset-bottom)`)
- Shared UI: `StatCard`, `Badge`, `PageHeader`, skeletons
- `.card-glow` + light-mode overrides for depth

### Theme architecture

- `ThemeContext` + `.light` / `.dark` CSS variables
- localStorage persistence (`palm-insight-theme`)
- `prefers-color-scheme` fallback
- Theme toggle in Settings with ARIA labels

### Scripts & tooling

- `scripts/generate-icons.mjs` (sharp → multi-size PWA icons)
- PWA: manifest, service worker, install banner
- Modern stack fit for purpose (Next 16, Tailwind 4, Recharts, Zod, Supabase)

---

## Friction points & gaps

### 1. Token system is half-adopted

CSS variables are defined well, but hardcoded values remain:

| Pattern | Where (examples) |
|--------|-------------------|
| `#f59e0b`, `#d97706` gradients | Auth, Sidebar, GuidedTour, Export modal |
| `text-amber-500`, `bg-amber-500` | AuthProvider, PwaInstallBanner, ProtectedRoute |
| Heavy `style={{ color: "var(--...)" }}` | Dashboard, Auth, Team forms |

**Impact:** Light mode looks “almost right”; accent changes require hunting hex strings.

### 2. Light mode is secondary

Dark is the design home. Light tokens exist, but leftovers remain:

- Dark-only overlays: `hover:bg-white/5`, `rgba(255,255,255,0.3)`
- Card glow / shadows designed for dark first
- Some accents don’t flip with theme

Treat light as a deliberate second design pass, not only a CSS flip.

### 3. Theme flash (FOUC)

`ThemeProvider` defaults to `"dark"`, then reads localStorage in `useEffect`. Light-preferring users see a dark flash.

### 4. Inline styles vs design system

Shared components exist (`StatCard`, `Badge`), but pages still redeclare input/button styles. Need primitives: `Button`, `Input`, `Card`, `Modal`.

### 5. Icon / brand color drift

- App UI: **amber** harvest
- `generate-icons.mjs`: **emerald green** leaf (`#10b981` on `#0f1a0f`)

Favicon / PWA icons and in-app logo tell two brand stories.

### 6. Navigation completeness

- Sidebar / tabs: Dashboard, Plantations, Teams, Reports, Settings
- **Daily Entries** exists as a route but is not first-class in main nav
- When sidebar is **collapsed**, NotificationBell is hidden (`!collapsed` only)

### 7. Sidebar collapse control

Collapse chevron uses absolute positioning; verify it always pins cleanly when layout reflows.

### 8. Motion

Used well overall, but:

- No `prefers-reduced-motion` support
- Dead animation in BottomTabBar: `scale: 1 → 1`
- Full page transitions may feel heavy on low-end field phones

### 9. Accessibility

**Good:** skip link, `aria-current`, many `aria-label`s, ~44px nav hit targets.

**Gaps:**

- Focus rings inconsistent
- Modals need focus trap + Escape (verify everywhere)
- Chart contrast in light mode
- Reduced-motion not respected

### 10. Scripts surface

- `package.json` only has `dev`, `build`, `start`, `lint`
- Icon generation not wired as an npm script
- Duplicate `generate-icons.js` + `.mjs`

### 11. Dashboard visual density

Greeting banner + Today’s Pulse + plantation summary + month selector + 4 stats + chart + recent entries all compete at similar weight. Field use should favor **Today + Log CTA** first.

### 12. Micro-inconsistencies

| Issue | Detail |
|-------|--------|
| Landing footer hover | `hover:text-[var(--text-muted)]` on already-muted links |
| Auth logo gradient | Same color twice (`#f59e0b` → `#f59e0b`) |
| Z-index | `--z-modal: 9999` breaks the clean 40/50/100 scale |
| Style mix | Mix of `style={{}}` and `className` with CSS vars on same components |

---

## Scorecard

| Area | Score | Note |
|------|-------|------|
| Visual identity | 8.5/10 | Amber dark harvest feel is distinctive and on-brief |
| Design tokens | 8/10 | Strong foundation; incomplete adoption |
| Landing / marketing | 9/10 | Best-looking part of the product |
| App UI consistency | 7/10 | Shared components help; pages still diverge |
| Light theme | 6/10 | Exists, not fully loved |
| Mobile / PWA | 8.5/10 | Bottom tabs + safe areas + install banner |
| Motion / polish | 7.5/10 | Nice motion; reduced-motion + mobile cost missing |
| Accessibility | 6.5/10 | Basics present; needs depth |
| Scripts / tooling | 7/10 | Solid icon gen; brand mismatch; thin npm scripts |
| Colors (semantic use) | 8/10 | Chart/status semantics are clear |
| **Overall** | **~8/10** | Above average for indie / early product |

---

## Improvement roadmap

### Tier 1 — High impact, do soon

#### 1. Finish design-token adoption

**What:** Stop hardcoding amber hex / Tailwind amber utilities. Route everything through CSS vars or shared components.

**Implement:**

- Shared `Button` (primary / secondary / ghost / danger)
- Shared `Input` / `Select` / `Textarea` (label, error, icon slots)
- Shared `Modal` shell (overlay, focus trap, Escape, `z-modal`)
- Grep-and-replace remaining hex and `text-amber-*` / `bg-amber-*`

**Why:** One place to change brand color; light mode works; less copy-paste.

---

#### 2. Fix theme flash (FOUC)

**What:** Apply `light` / `dark` on `<html>` **before** React hydrates.

**Implement** (inline script in `layout.tsx` `<head>`):

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('palm-insight-theme');
      if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(t);
    } catch (e) {}
  })();
</script>
```

Keep `ThemeContext` in sync with that class.

**Why:** Light-mode users stop seeing a dark flash every load.

---

#### 3. Align brand assets (icons ↔ UI)

**What:** Icon generator uses emerald; app UI is amber.

**Implement:**

- Update `scripts/generate-icons.mjs` to amber brand (`#f59e0b` / `#d97706` on `#0b0d13`)
- Regenerate icons under `public/icons/`
- Wire npm script: `"icons": "node scripts/generate-icons.mjs"`
- Remove unused duplicate `generate-icons.js` if applicable

**Why:** Install icon, splash, and in-app logo feel like one product.

---

#### 4. Primary workflow in navigation

**What:** Daily Entries is easy to miss; collapsed sidebar hides notifications.

**Implement (pick one for entries):**

- **A:** Add “Entries” to sidebar + bottom tabs (e.g. between Teams and Reports), or  
- **B:** Make Teams the only log path; deep-link Daily Entries from Dashboard / Reports (“View all entries”)

**Also:** Show `NotificationBell` when sidebar is collapsed (icon-only).

**Why:** Clearer field workflow; notifications always reachable.

---

#### 5. Dashboard hierarchy for field use

**What:** Too many equal-weight blocks.

**Implement:**

1. **Today first:** Pulse + prominent “Log today’s entries” CTA  
2. Month selector + monthly stats secondary  
3. Chart smaller or collapsed by default on mobile  
4. Recent entries compact + “See all”

**Why:** One-thumb outdoor use matches supervisor reality.

---

### Tier 2 — Solid product polish

#### 6. Use React Query consistently

**What:** Dashboard / Reports / Team still query Supabase in `useEffect` while `lib/queries.ts` exists.

**Implement:**

- Hooks: plantations, team leaders, monthly stats, entries
- Invalidate on create/update entry
- Shared loading/error with existing skeletons

**Why:** Faster navigation, fewer duplicate fetches, less flicker.

---

#### 7. Accessibility pass

**Implement:**

- Global `@media (prefers-reduced-motion: reduce)` for Framer Motion + CSS animations
- Visible `focus-visible` rings using `--ring` / accent
- Modal focus trap + Escape + restore focus
- Status via Badge pattern everywhere (not color alone)
- Chart tooltip / axis contrast in **light** mode

**Why:** Field tablets, older phones, keyboard users, baseline compliance.

---

#### 8. Light mode as a real second skin

**Implement:**

- Replace `hover:bg-white/5`, white-only rgba with `var(--hover-subtle)` / `var(--icon-inactive)`
- Re-check Auth card shadows, card-glow, header blobs on white
- Optional: stronger form borders for outdoor / sunny readability

**Why:** Settings theme toggle becomes trustworthy.

---

#### 9. Motion cleanup

**Implement:**

- Remove dead BottomTabBar scale animation
- Page transitions: opacity-only on mobile, or shorter duration
- Landing FadeIn: keep; respect reduced motion

**Why:** Less jank on mid-range Android phones.

---

### Tier 3 — Structure & maintainability

#### 10. Thin pages, fat components

**What:** Large pages mix data + layout + UI.

**Implement:** Extract e.g. `DashboardHeader`, `TodayPulse`, `MonthlyStatsGrid`, `TrendChart`. Pages = composition + data wiring only.

**Why:** Easier reviews; reuse on Reports / Daily Entries.

---

#### 11. Form validation with Zod end-to-end

**What:** Zod/schemas exist; many forms still hand-roll checks.

**Implement:**

- Shared validation for entry form (bunches, tons, lots, workers, etc.)
- Consistent error UI next to `Input`
- One pattern: validate on submit **or** disable until valid

**Why:** Fewer bad rows; better data quality.

---

#### 12. npm scripts & hygiene

```json
{
  "icons": "node scripts/generate-icons.mjs",
  "lint": "eslint",
  "typecheck": "tsc --noEmit"
}
```

Optional later: Playwright smoke (login → dashboard → log entry).

---

#### 13. Small UI fixes (quick wins)

| Item | Fix |
|------|-----|
| Landing footer links | Hover → `--text-primary` |
| Auth logo gradient | Real two-stop (`#d97706` → `#f59e0b`) |
| Z-index scale | Modal ~`200`/`300`, not `9999`; use token everywhere |
| Empty / error states | Reuse `EmptyState` on all list pages |
| Offline page | Match tokens + clear “retry / go home” |

---

## Suggested implementation order (2–3 sprints)

| Order | Work | Outcome |
|------:|------|---------|
| 1 | FOUC script + token `Button` / `Input` | Instant polish + foundation |
| 2 | Hex purge + light mode leftovers | Theme reliability |
| 3 | Icon rebrand + npm `icons` | Brand coherence |
| 4 | Nav (Entries + collapsed bell) | UX clarity |
| 5 | Dashboard hierarchy + Log Today CTA | Field usability |
| 6 | React Query on dashboard / team | Performance |
| 7 | a11y + reduced motion | Quality bar |
| 8 | Page splits + Zod forms | Maintainability |

---

## If you only do five things

1. **Button + Input + stop hardcoding amber**
2. **FOUC fix**
3. **Regenerate amber PWA icons**
4. **Nav for daily logging + collapsed notification bell**
5. **Dashboard: Today first + Log CTA**

Those five raise perceived quality without a redesign.

---

## What not to prioritize yet

- New color palette / full rebrand (current identity is on-point)
- Heavy UI library (e.g. full Shadcn) unless you want a11y primitives for free — optional
- Fancy 3D / heavy illustration on landing — current mock window is enough
- Micro-animations everywhere — motion is already good enough

---

## Quick wins checklist

Copy into issues or track progress with `[x]`.

### Design system

- [ ] Add `Button` primitive (primary / secondary / ghost / danger)
- [ ] Add `Input` / `Select` / `Textarea` primitives
- [ ] Add shared `Modal` (focus trap, Escape, z-token)
- [ ] Replace hardcoded `#f59e0b` / `#d97706` with CSS vars
- [ ] Replace `text-amber-*` / `bg-amber-*` with tokens
- [ ] Normalize z-index scale (drop `9999` for modal)

### Theme

- [ ] FOUC prevention script in root layout
- [ ] Audit light mode for white-only overlays
- [ ] Re-check Auth, headers, card-glow in light mode

### Brand & assets

- [ ] Amber PWA icons in `generate-icons.mjs`
- [ ] Regenerate `public/icons/*`
- [ ] Add `"icons"` npm script
- [ ] Remove unused icon script duplicate

### Navigation & UX

- [ ] Promote Daily Entries **or** deep-link strategy from Teams/Dashboard
- [ ] NotificationBell visible when sidebar collapsed
- [ ] Dashboard: Today pulse + Log CTA first
- [ ] Landing footer hover → primary text
- [ ] Auth gradient real two-stop

### Motion & a11y

- [ ] `prefers-reduced-motion` global rule
- [ ] Remove dead BottomTabBar scale animation
- [ ] Softer page transitions on mobile
- [ ] Consistent `focus-visible` rings
- [ ] Modal focus trap + Escape everywhere

### Data / code structure

- [ ] Dashboard uses React Query hooks
- [ ] Team / Reports use shared queries where possible
- [ ] Extract dashboard subcomponents
- [ ] Zod validation on entry forms
- [ ] `typecheck` npm script

---

## Related docs

| File | Purpose |
|------|---------|
| `CODEREVIEW.md` | Earlier code review notes (inline styles, React Query, dark mode consistency) |
| `SESSION_RECAP.md` | Session notes (if present) |
| `src/app/globals.css` | Design tokens (dark + light) |
| `src/components/ThemeContext.tsx` | Theme state + localStorage |
| `scripts/generate-icons.mjs` | PWA icon generator |

---

## Notes for implementers

- Prefer **CSS variables** from `globals.css` over new hex values.
- Dark-first is intentional; light mode should still be correct, not just inverted.
- Field supervisors are a primary audience — prioritize mobile bottom nav, large taps, and “today’s work” over dense analytics.
- When adding UI, check both **dark** and **light** before merge.
- Keep Malaysia locale touches (`en-MY` numbers/dates) consistent.

---

*Generated from a design/UI review of the PalmInsight codebase. Update this file as items are completed or scope changes.*
