# Session Recap — PalmInsight Fixes

## 1. Light Theme Readability Fix

**Problem:** Entire app had hardcoded dark-theme colors (`text-white`, `rgba(255,255,255,...)`, dark gradients) that didn't adapt when light theme was activated. Text was unreadable on phone.

**Fix:**
- Added theme-aware CSS variables (`--text-on-gradient`, `--bg-header`, `--bg-nav`, `--icon-inactive`, `--hover-subtle`, etc.) to `globals.css` for both `.dark` and `.light` modes
- Created utility classes: `.text-theme`, `.text-theme-muted`, `.text-theme-secondary`
- Added global input/select color overrides to respect theme
- Replaced hardcoded `text-white` → `text-theme` across all 20+ component and page files
- Replaced hardcoded inline colors (`rgba(255,255,255,0.8)` → `var(--text-secondary)`, etc.)
- Fixed BottomTabBar to use theme variables instead of hardcoded `#0b0d13`
- Fixed Skeleton shimmer colors to use theme variables

**Files changed:** `globals.css`, `BottomTabBar.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, `DashboardLayout.tsx`, `dashboard/page.tsx`, `team/page.tsx`, `plantations/page.tsx`, `reports/page.tsx`, `settings/page.tsx`, `daily-entries/page.tsx`, `login/register pages`, `onboarding pages`, `EntryForm.tsx`, `FilterPanel.tsx`, `AddLeaderModal.tsx`, `EditEntryModal.tsx`, `BlockSelector.tsx`, `LeaderOrgChart.tsx`, `EmptyLeaderState.tsx`, `NotificationPanel.tsx`, `NotificationCard.tsx`, `GuidedTour.tsx`, `AuthPage.tsx`, `Toast.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `PwaInstallBanner.tsx`, `offline/page.tsx`

---

## 2. Tons Formatting & No-Work Tons

**Problem:** Entering 6.50 displayed as 6.5 (trailing zeros lost). Tons field was hidden on "No Work" days, but transport can still deliver fruit.

**Fix:**
- Changed tons inputs from `type="number"` to `type="text"` with `inputMode="decimal"` to preserve trailing zeros
- Added `Number(value).toFixed(2)` formatting for all tons display across all pages
- Added tons field for "No Work" status in both EntryForm and EditEntryModal with helper text
- Updated data saving/loading to handle tons for all work statuses

**Files changed:** `EntryForm.tsx`, `EditEntryModal.tsx`, `team/page.tsx`, `reports/page.tsx`, `daily-entries/page.tsx`, `dashboard/page.tsx`

---

## 3. Notification Panel Positioning

**Problem:** Panel rendered outside visible screen area — clipped by sidebar on desktop, overflowing on mobile.

**Fix:**
- **Desktop:** Changed from `right: 0` (opens left into sidebar → clipped) to `left: 100%; margin-left: 8px` (opens right into content area). Added `overflow-visible` to sidebar `<aside>` and header `<div>` to prevent clipping. Width capped with `min(360px, calc(100vw - 32px))`.
- **Mobile (<768px):** Converts to bottom sheet (`position: fixed; bottom: 0`) with dark backdrop, handle bar, slide-up animation, and body scroll lock.
- z-index raised to 9999.

**Files changed:** `NotificationPanel.tsx`, `Sidebar.tsx`

---

## 4. Dashboard Monthly Filter

**Problem:** Dashboard showed only today's data. Stats didn't match entered data because query filtered by `date = CURRENT_DATE`.

**Fix:**
- Added month/year selector with `‹` / `›` navigation arrows
- Renamed "Today's Overview" → "Monthly Overview"
- Stats now query by monthly date range (`gte(date, startDate)` and `lte(date, endDate)`)
- Filtered by selected `plantation_id` (not all plantations)
- Added "Today Pulse" line below Plantation Details: `Today: [X] bunches · [X] ton · [X] teams logged`
- Chart renamed "Weekly Trend" → "Monthly Trend" showing daily data for full month
- Recent Entries filtered by selected month and plantation

**Files changed:** `dashboard/page.tsx`

---

## 5. Timezone Bug in getMonthRange

**Problem:** `new Date(year, month+1, 0).toISOString().split("T")[0]` converted to UTC, shifting end date back by 1 day in UTC+X timezones. Last day of month was excluded from queries.

**Fix:** Changed to `new Date(year, month+1, 0).getDate()` which stays in local time.

**Files changed:** `dashboard/page.tsx`

---

## 6. String Concatenation Bug in Stats

**Problem:** Supabase returns numeric columns as strings. JavaScript `+` operator does string concatenation when one operand is a string: `"0.5" + "123.18" = "0.5123.18"` instead of `123.68`.

**Fix:** Added `Number()` wrapping to all `reduce()` sum operations across 6 files.

**Files changed:** `dashboard/page.tsx`, `team/page.tsx`, `reports/page.tsx`, `daily-entries/page.tsx`, `lib/queries.ts`, `notifications/notificationHelpers.ts`

---

## 7. Tons from No-Work Days

**Problem:** "Transported" (tons) only counted from work days, but transport still delivers fruit on no_work days.

**Fix:** Changed all stats calculations so:
- **Tons** = summed from ALL entries (work + no_work)
- **Bunches** = work entries only
- **Backlogs** = work entries only

Applied to: dashboard monthly stats, today pulse, monthly trend chart, team leader stats, detail view stats, reports stats, daily chart, daily-entries stats, `computeLeaderStats()`.

**Files changed:** `dashboard/page.tsx`, `team/page.tsx`, `reports/page.tsx`, `daily-entries/page.tsx`, `lib/queries.ts`
