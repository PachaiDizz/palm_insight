# PalmInsight — Code Review & Fixes

**Project:** `C:\Users\PachaiDizzer\palm-insight`  
**Stack:** Next.js 16, Tailwind CSS v4, Supabase, React Query, Framer Motion, TypeScript

---

## ✅ Already Fixed (Done)

### Fix #1 — Inline Styles → Tailwind Classes
Converted hardcoded `style={{ }}` props to Tailwind utility classes for better maintainability and dark mode support.

| File | Changes |
|------|---------|
| `globals.css` | Added `.light` class with full CSS variable definitions; consolidated under Tailwind `@layer base`; fixed default theme from "dark" (which had no light-mode variables) to proper dual-theme setup |
| `components/Sidebar.tsx` | Converted inline width/border/bg-color/text-color styles to Tailwind classes (`w-[72px]`, `bg-[var(--bg-card)]`, etc.) |
| `components/DashboardLayout.tsx` | Removed single inline `backgroundColor` style |
| `onboarding/PlantationForm.tsx` | Fixed hardcoded border color → `var(--border-default)`; bg color → Tailwind class |
| `onboarding/TeamLeaderCard.tsx` | Replaced hardcoded `#0d150d` with Tailwind `bg-[#0d150d]` |
| `daily-entries/page.tsx` | Stat cards now use `bg-[var(--bg-card)]` class; table headers dynamic via `.map()`; status badges use CSS variables |

### Fix #2 — Duplicate Toast & FilterPanel in team/page.tsx
- Removed duplicate inline toast implementation (was rendered twice)
- Added proper `<Toast>` component usage at bottom of return JSX
- Imported and used `Toast from "@/components/ui/Toast"` consistently

### Fix #3 — Unused Imports / Dead Code
- **team/page.tsx:** Removed unused `EditEntryModal` import
- **reports/page.tsx:** Removed unused `months = ["January", ...]` constant array (defined but not needed inline)

### Fix #4 — Dashboard Plantation Selector Dropdown on Mobile
- Fixed z-index stacking issue by using bracket notation: `z-[9999]` instead of `style={{ zIndex: 9999 }}`
- Prevents Tailwind's default z-index layering from breaking dropdown positioning

### Fix #5 — Table Overflow Issues (Mobile)
- **team/page.tsx:** Changed inline `minWidth: "800px"` → `min-w-[600px]` class for responsive behavior on phones/tablets
- Added responsive background class to table wrapper (`bg-[var(--bg-elevated)]/50`)

---

## 🔴 Still Needs Fixing (Priority Order)

### 🔴 Critical — Remaining Inline Styles in Components

The following files still have scattered inline styles that should be converted:

| File | Issue |
|------|-------|
| `daily-entries/page.tsx` | Table rows/tbody still use many inline style props for cell padding, text colors |
| `app/reports/page.tsx` | Chart tooltip `contentStyle`, stat card borders still have hardcoded colors |
| `components/team/EntryForm.tsx` | Heavy inline styles on form inputs, labels, toggle switches |
| `components/team/EditEntryModal.tsx` | Inline input styles throughout modal |
| `components/team/LeaderOrgChart.tsx` | Card widths (`width: "420px"`, `width: "400px"`), bg colors inline |
| `app/settings/page.tsx` | Some inline border/background styles on cards |

**Recommendation:** Batch convert remaining files using the same pattern — replace each inline style with a matching Tailwind utility class. Start with the most visually impactful ones (EntryForm, LeaderOrgChart).

---

### 🔴 Critical — Dark Mode Consistency
- `.light` class is now defined in `globals.css`, but some components still hardcode dark-only colors like `"#f87171"` instead of `var(--accent-red)` which may not render correctly in light mode.
- **Action:** Audit all hardcoded hex color values (`#xxxxxx`) and replace with `var(--xxx)` CSS variables where available.

---

### 🟠 High — Performance: Raw Supabase Queries (Not Using React Query)

Several pages call Supabase directly in `useEffect` instead of using the cached hooks from `queries.ts`:

| File | Current | Should Use |
|------|---------|------------|
| `app/dashboard/page.tsx` | Direct `supabase.from("...").select()` in useEffect | `usePlantations()`, `useTeamLeaders()` |
| `app/reports/page.tsx` | Direct Supabase queries for entries/plantations | Use React Query hooks or add new ones |
| `app/team/page.tsx` | Direct Supabase calls throughout TeamsContent | Reuse `queries.ts` hooks where possible |

**Action:** Add missing query hooks to `lib/queries.ts`:
- `usePlantationDetails(plantationId)` — fetches plantation info + management details
- `useTeamLeaderEntries(leaderId)` — fetches entries for a single leader with stats

---

### 🟠 High — Framer Motion Bundle Size
Every page imports the full `framer-motion` library (`import { motion } from "framer-motion"`), adding ~50KB per chunk. Only 3 components actually need it (EntryForm, BlockSelector, LeaderOrgChart, PlantationForm).

**Options:**
1. Lazy-load framer-motion: separate Client Components that use `motion` and tree-shake unused imports on other pages
2. Replace with CSS transitions where possible for non-essential animations

---

### 🟡 Medium — Responsive Table Columns (Daily Entries)
The daily entries table has 9 columns which feels cramped on mobile even after the overflow fix. Consider:
- Hiding "Notes" column below `lg` breakpoint via responsive class
- Adding a "View Details" button per row instead of showing all data inline

---

### 🟡 Medium — Decorative Blobs Visual Noise
Multiple stat cards and entry forms have decorative blur blobs (`opacity-20 rounded-full blur-xl`) that fade inconsistently. Either:
- Standardize blob positioning/sizes across the app
- Remove them for a cleaner look

---

### 🟢 Low — Loading States / Error Handling
- Dashboard page shows spinner indefinitely if `checking` never resolves (no timeout)
- Same pattern in team/page.tsx — no timeout on initial load checks
- Settings import has no file validation before parsing JSON

---

## 📋 Quick Reference: Tailwind Class Patterns Used

| Old Style | New Tailwind Pattern |
|-----------|---------------------|
| `style={{ backgroundColor: "var(--bg-card)" }}` | `bg-[var(--bg-card)]` |
| `style={{ borderColor: "var(--border-default)" }}` | `border-[var(--border-default)]` or just `border` (inherits) |
| `style={{ color: "#10b981" }}` | `text-[#10b981]` |
| `style={{ width: "240px" }}` | `w-[240px]` |
| `className="..." style={{ backgroundColor: "var(--accent-green-light)" }}` | `bg-[var(--accent-green-light)] className="..."` |

---

## 🎯 Next Session — Recommended Order

1. Convert remaining inline styles in EntryForm.tsx, LeaderOrgChart.tsx (biggest visual impact)
2. Replace raw Supabase queries with React Query hooks for dashboard + reports pages
3. Audit hardcoded hex colors → CSS variables for dark mode consistency
4. Add responsive table column hiding for daily entries page
5. Reduce Framer Motion bundle size via lazy loading
