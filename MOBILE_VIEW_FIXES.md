# Mobile View Fixes — 2025-07-14

Comprehensive mobile responsiveness improvements across the entire PalmInsight app.

---

## Layout & Navigation

- **DashboardLayout** — Added PalmInsight logo/name to mobile header for brand context
- **PageHeader** — Now stacks title and actions vertically on mobile (`flex-col sm:flex-row`) with responsive text sizes (`text-2xl sm:text-3xl`)

---

## Dashboard (`/dashboard`)

- **Today Pulse** — Stats use `justify-around` on mobile for even spacing; text sizes scale down (`text-lg sm:text-2xl`)
- **Recent entries** — Compact number format on mobile (e.g. "123" + "1.23t" instead of full labels)
- **No-entries notice** — Stacks properly on small screens with `min-w-0` for text truncation

---

## Team / View Details (`/team`)

> This was the primary "messy" area the user flagged.

- **Leader info header card** — Stacks name + block/rancangan/peringkat tags vertically on mobile; icon and text scale down
- **Month navigation + date range filter** — Inputs and buttons stack vertically on mobile (`flex-col sm:flex-row`)
- **Detail entries mobile cards** — Changed from cramped 3-column `grid-cols-3` to clean 2-column label-value layout (`grid-cols-2 gap-x-4`)
- **Add Entry filter section** — Date input and filter button stack vertically on mobile
- **Add Leader button** — Full-width on mobile (`w-full sm:w-auto`)
- **Org chart leader cards** — Buttons stack vertically (`flex-col sm:flex-row`); stat cards use smaller padding/text on mobile

---

## Daily Entries (`/daily-entries`)

- **Page padding** — Changed from `p-6` to `p-4 sm:p-6`
- **Action buttons (Import/Export)** — Wrap properly with `flex-wrap`
- **Filters** — Stack vertically on mobile (`flex-col sm:flex-row`)
- **Mobile cards** — 2-column label-value layout instead of 3-column; labels on left, values on right
- **Bulk actions bar** — Stacks on mobile with `flex-col sm:flex-row`

---

## Plantations (`/plantations`)

- **Plantation cards** — `flex-col sm:flex-row` layout (info on top, actions below on mobile)
- **Management Details grid** — Changes from 4-col to `grid-cols-2 sm:grid-cols-4`
- **Modal** — Slides up from bottom on mobile (`items-end sm:items-center`); form inputs use single-column layout
- **Team leader input fields** — Stack vertically on mobile (`flex-col sm:flex-row`)
- **Edit/Delete buttons** — Fixed touch target size with `min-h-[36px] min-w-[36px]`

---

## Reports (`/reports`)

- **Export buttons** — Responsive sizing with shorter labels on mobile ("Export" instead of "Export Monthly")
- **Month/Year/Plantation filters** — Stack vertically on mobile
- **Mobile cards** — 2-column label-value layout matching other pages

---

## Settings (`/settings`)

- **Account section** — Name/email/password rows stack icon+label above input on mobile
- **Password section** — `ml-13` indent only applies on sm+ (`sm:ml-13`)
- **All card sections** — Responsive padding `p-4 sm:p-5`
- **Data management buttons** — Proper touch targets with `min-h-[40px]` and `shrink-0`

---

## Entry Form (`/team` → Add Entry)

- **Header** — Icon, title, undo/redo, and close button use responsive sizing; saved badge hidden on very small screens
- **Action buttons** — Stack with submit button first on mobile (`order-1 sm:order-2`)
- **Form padding** — Reduced on mobile (`p-4 sm:p-6`)
- **3-column input grid** — Tighter gap on mobile (`gap-2 sm:gap-3`)

---

## LeaderOrgChart

- **Block card** — Responsive padding (`p-5 sm:p-8`) and text sizes
- **Leader cards** — Responsive icon sizes (`w-11 h-11 sm:w-14 sm:h-14`); stat cards use smaller text/padding on mobile
- **Add Entry / View Details buttons** — Stack vertically on mobile

---

## Modals

### EditEntryModal
- Responsive spacing (`space-y-3 sm:space-y-4`)
- Action buttons stack vertically on mobile

### BijiRelaiModal
- Header uses responsive icon/text sizes with `min-w-0` for truncation
- Action buttons stack vertically
- History header uses responsive padding and text sizes
- Mobile cards use responsive padding

---

## Map (`/map`)

- **Controls** — Responsive positioning (`top-3 right-3 sm:top-4 sm:right-4`); max-width prevents overflow on small screens
- **Date label** — Hidden on mobile (`hidden sm:inline`) since date picker is sufficient

---

## Global CSS (`globals.css`)

Added mobile-friendly utility rules:
```css
@media (max-width: 639px) {
  button, a, input[type="checkbox"], input[type="radio"], select {
    min-height: 36px;
  }
  .card-glow {
    border-radius: 1rem;
  }
}
```

---

## Files Modified

1. `src/components/ui/PageHeader.tsx`
2. `src/components/DashboardLayout.tsx`
3. `src/app/dashboard/page.tsx`
4. `src/app/daily-entries/page.tsx`
5. `src/app/team/page.tsx`
6. `src/app/plantations/page.tsx`
7. `src/app/reports/page.tsx`
8. `src/app/settings/page.tsx`
9. `src/components/team/EntryForm.tsx`
10. `src/components/team/LeaderOrgChart.tsx`
11. `src/components/team/EditEntryModal.tsx`
12. `src/components/team/BijiRelaiModal.tsx`
13. `src/components/team/EmptyLeaderState.tsx`
14. `src/components/team/FilterPanel.tsx`
15. `src/components/map/MapControls.tsx`
16. `src/components/map/MapClient.tsx`
17. `src/app/globals.css`
