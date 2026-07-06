# PalmInsight — Session Recap

## 1. Skeleton Loaders (Replace Blank Loading States)

### Problem
Pages showed blank/empty content or spinners while data loaded from Supabase. No visual feedback about what content was coming.

### Changes Made

**`src/components/ui/Skeleton.tsx`** — Complete rewrite:
- Added shimmer animation via CSS keyframes (`skeleton-shimmer`, 1.5s infinite)
- Added `FadeIn` wrapper component for smooth opacity 0→1 transition (300ms)
- New skeleton components:
  - `StatCardSkeleton` — matches dashboard stat card dimensions
  - `PlantationCardSkeleton` — matches plantation card label-value layout
  - `LeaderCardSkeleton` — matches org chart leader card dimensions
  - `BlockCardSkeleton` — matches team block card layout
  - `ChartSkeleton` — rectangle matching chart height (300px default)
  - `TableSkeleton` — rows/columns matching data tables
  - `DashboardSkeleton` — full-page skeleton combining all dashboard elements

**`src/app/globals.css`** — Added keyframe animations:
- `skeleton-shimmer` — background-position animation for shimmer effect
- `skeleton-fade-in` — opacity + translateY for content fade-in

**`src/app/dashboard/page.tsx`**:
- Replaced spinner loading state with `DashboardSkeleton` + `FadeIn`

**`src/app/plantations/page.tsx`**:
- Added `loading` state variable
- Shows `PlantationCardSkeleton` × 3 during load
- Real content wrapped in `{!loading && (...)}`

**`src/app/team/page.tsx`**:
- Suspense fallback now shows `BlockCardSkeleton` × 4 grid instead of spinner

**`src/app/reports/page.tsx`**:
- Added `loading` state variable
- Shows `StatCardSkeleton` × 6, `ChartSkeleton` × 2, `TableSkeleton` during load
- Real content wrapped in `{!loading && (...)}`

**`src/app/daily-entries/page.tsx`**:
- Replaced spinner with `StatCardSkeleton` × 5 + `TableSkeleton`

### Animation Specs
- Shimmer: `linear-gradient(90deg, #1a2a1a 25%, #243324 50%, #1a2a1a 75%)`, background-size 200%, animates from 200% to -200% over 1.5s
- Content fade-in: opacity 0→1 + translateY 8px→0 over 300ms ease-out

---

## 2. Responsive Mobile Layout

### Problem
The app was desktop-only. Sidebar was always visible, no hamburger menu, no responsive grids, and touch targets were too small for mobile use.

### Changes Made

**`src/components/Sidebar.tsx`** — Complete rewrite for responsive behavior:
- Desktop (≥1024px): sidebar visible as fixed left panel
- Mobile (<1024px): sidebar hidden by default, slides in from left as drawer
- Hamburger button ☰ fixed at top-left on mobile
- Overlay backdrop behind open sidebar on mobile, tap to close
- Drawer slides in with `translateX(-100%)` → `translateX(0)` transition 300ms easeOut
- Close button (X) inside drawer header on mobile
- All nav links have `min-h-[44px]` touch targets
- Route changes auto-close mobile sidebar

**`src/components/DashboardLayout.tsx`** — Mobile header with hamburger:
- Added mobile header bar visible only on `<1024px` with hamburger menu button
- Hamburger button has `min-h-[44px] min-w-[44px]` touch target
- Manages `mobileOpen` state for sidebar drawer
- Passes state to Sidebar component

**`src/app/dashboard/page.tsx`** — Responsive dashboard:
- Header: `flex-col` on mobile, `flex-row` on `sm:`
- Greeting text: `text-xl sm:text-2xl lg:text-3xl`
- Stat cards: 2 columns on all sizes, reduced padding on mobile
- Stat card values: `text-xl sm:text-3xl`
- Stat labels: `text-[10px] sm:text-xs`
- Quick actions: full width on mobile, 2 columns on `sm:`
- Recent entries: reduced padding, hidden tonnage on mobile
- All sections: `mb-4 sm:mb-6` spacing

**`src/components/team/BlockSelector.tsx`** — Responsive block cards:
- Grid: `grid-cols-1 sm:grid-cols-2` (1 col mobile, 2 col desktop)
- Card padding: `p-4 sm:p-5`
- Touch target: `min-h-[44px]`

**`src/components/team/LeaderOrgChart.tsx`** — Responsive org chart:
- Cards stack vertically on mobile (`flex-col`), side-by-side on `md:` (`md:flex-row`)
- Card width: `max-w-full md:max-w-[420px]`
- Card padding: `p-4 sm:p-8`
- Stats grid: `gap-2 sm:gap-4`, text `text-xs sm:text-sm`
- Connector lines hidden on mobile (cards stack without needing connectors)
- Vertical stubs hidden on mobile
- Buttons: `min-h-[44px]`, text `text-xs sm:text-sm`

**`src/components/team/EntryForm.tsx`** — Mobile-friendly form:
- Action buttons: `flex-col` on mobile, `flex-row` on `sm:`
- All buttons: `min-h-[44px]` touch targets
- Work/No Work toggle buttons: `min-h-[44px]`

**`src/components/ui/Skeleton.tsx`** — Responsive skeletons:
- `PlantationCardSkeleton`: responsive grid `grid-cols-2 sm:grid-cols-3`
- `LeaderCardSkeleton`: `max-w-full md:max-w-[420px]`, padding `p-4 sm:p-8`
- `DashboardSkeleton`: responsive header, stat cards, quick actions
- Recent entries skeleton: hidden tonnage on mobile

**`src/app/plantations/page.tsx`** — Mobile padding:
- Page padding: `p-4 sm:p-6`

**`src/app/reports/page.tsx`** — Mobile padding:
- Page padding: `p-4 sm:p-6`

**`src/app/settings/page.tsx`** — Mobile padding:
- Page padding: `p-4 sm:p-6`

**`src/app/daily-entries/page.tsx`** — Mobile padding:
- Page padding: `p-4 sm:p-6`

**`src/app/team/page.tsx`** — Mobile responsive:
- Header: `flex-col sm:flex-row`, text `text-2xl sm:text-3xl`
- Detail stat cards: `p-3 sm:p-5`, values `text-xl sm:text-3xl`
- Avg stats: `grid-cols-1 sm:grid-cols-3`

### Touch Target Standards
- All interactive elements: minimum 44px height/width
- Nav links, buttons, toggles all meet WCAG touch target requirements

### Mobile Breakpoints Used
- Default (mobile): < 640px
- `sm`: ≥ 640px (tablets)
- `md`: ≥ 768px (larger tablets / small desktop)
- `lg`: ≥ 1024px (desktop — sidebar visible)

---

## 3. Favicon & Dynamic Page Titles

### Favicon

**`public/favicon.svg`** — New SVG favicon:
- Green circle (#059669) with a palm leaf shape
- Uses `#d1fae5` (light green) for the leaf body
- Simple, recognizable at small sizes

**`src/app/layout.tsx`** — Updated metadata:
- Added `icons: { icon: "/favicon.svg" }` to root metadata config

### Dynamic Page Titles

Created co-located `metadata.ts` files for each client-component route (can't export metadata from "use client" pages directly):

| Route | File | Title |
|-------|------|-------|
| `/dashboard` | `src/app/dashboard/metadata.ts` | Dashboard \| PalmInsight |
| `/plantations` | `src/app/plantations/metadata.ts` | Plantations \| PalmInsight |
| `/team` | `src/app/team/metadata.ts` | Team Management \| PalmInsight |
| `/reports` | `src/app/reports/metadata.ts` | Reports \| PalmInsight |
| `/settings` | `src/app/settings/metadata.ts` | Settings \| PalmInsight |
| `/login` | `src/app/login/metadata.ts` | Login \| PalmInsight |
| `/register` | `src/app/register/metadata.ts` | Register \| PalmInsight |
| `/onboarding/plantation` | `src/app/onboarding/plantation/metadata.ts` | Setup Plantation \| PalmInsight |
| `/onboarding/teams` | `src/app/onboarding/teams/metadata.ts` | Setup Team \| PalmInsight |

The root layout's `template: "%s | PalmInsight"` pattern automatically appends "| PalmInsight" to all child page titles.
