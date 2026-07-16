# PalmInsight — Comprehensive Website Review Report

## Executive Summary

PalmInsight is a Next.js 16 PWA for palm oil plantation tracking, built with Supabase, Tailwind CSS 4, Recharts, Leaflet maps, and xlsx-js-style for Excel export. The project demonstrates solid engineering fundamentals — well-structured component hierarchy, proper authentication flow, comprehensive i18n support (English + Bahasa Melayu), offline sync capability, and a polished dark/light theme system. However, there are critical security vulnerabilities (hardcoded secrets in `.env.local` committed to git), significant code quality issues in the team page, missing security headers, and several production readiness gaps.

---

## Pass 1-3: Project Architecture & Structure

### Architecture Overview

- **Framework**: Next.js 16.2.9 with App Router
- **Database/Auth**: Supabase (SSR + browser client)
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **State**: React Query + local state (no global store)
- **Charts**: Recharts
- **Maps**: Leaflet + react-leaflet
- **Export**: xlsx-js-style for Excel, custom CSV export
- **PWA**: Serwist service worker
- **Validation**: Zod schemas
- **i18n**: Custom Context-based i18n (EN/MS)

### Folder Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── auth/      # Auth callback
│   ├── daily-entries/
│   ├── dashboard/
│   ├── login/
│   ├── map/
│   ├── offline/
│   ├── onboarding/
│   ├── plantations/
│   ├── register/
│   ├── reports/
│   ├── settings/
│   └── team/
├── components/    # React components
│   ├── landing/
│   ├── map/
│   ├── navigation/
│   ├── notifications/
│   ├── onboarding/
│   ├── team/
│   └── ui/
├── hooks/
├── lib/           # Utilities, Supabase clients, queries
└── types/
```

---

## Detailed Issue Reports

### CRITICAL Issues

---

**Issue 1: Hardcoded Secrets in `.env.local` Committed to Git**

- **Category**: Security
- **File**: `.env.local` (line 1-2)
- **Severity**: **CRITICAL**
- **Description**: The `.env.local` file contains hardcoded Supabase URL and anon key, and the `.gitignore` only excludes `.env*` patterns — but `.env.local` is visible in the project directory. The Supabase anon key is an API key that, while designed for client-side use, should not be committed to version control as it could be rotated or if Row Level Security is misconfigured, expose all data.
- **Evidence**: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Why it matters**: If the repo is public or shared, the anon key is exposed. Combined with any RLS misconfiguration, this could allow unauthorized data access.
- **Recommended fix**: Add `.env.local` to `.gitignore` (currently it's listed but may already be tracked), use environment variables in deployment, and rotate the exposed key.
- **Effort**: Easy

---

**Issue 2: Missing Row-Level Security (RLS) Verification — Client-Side Queries Without `user_id` Filtering Edge Cases**

- **Category**: Security
- **File**: `src/lib/queries.ts`, `src/app/team/page.tsx`, `src/app/daily-entries/page.tsx`
- **Severity**: **CRITICAL**
- **Description**: All Supabase client-side queries filter by `user_id`, which is good. However, the `user_id` is obtained from `useAuth()` and passed to queries. If Supabase RLS policies are not properly configured on the database side, any authenticated user could potentially craft requests to access other users' data. The code assumes RLS is properly configured but there's no verification or documentation of RLS policies.
- **Evidence**: All `supabase.from("daily_entries").select("*").eq("user_id", userId)` calls rely on client-side filtering. If RLS is not enabled, this is a data leak.
- **Why it matters**: Defense in depth requires both client-side filtering AND server-side RLS.
- **Recommended fix**: Document RLS policies. Add a comment in `supabaseClient.ts` confirming RLS is enabled. Consider adding a Supabase middleware check.
- **Effort**: Medium

---

**Issue 3: Team Page is a 1000+ Line God Component**

- **Category**: Code Quality / Maintainability
- **File**: `src/app/team/page.tsx` (1000+ lines)
- **Severity**: **CRITICAL**
- **Description**: The team page contains 5 separate `useReducer` state machines, 10+ async functions, inline form state, detail view state, filter state, Biji Relai state, leader form state, and complex browser history management — all in a single component. This is a maintenance nightmare.
- **Evidence**: Lines 1-1000+ contain `entryFormReducer`, `filterReducer`, `detailEditReducer`, `detailViewReducer`, `leaderFormReducer`, `bijiRelaiFormReducer` all defined inline, plus `loadData()`, `loadBlockStats()`, `loadLeaderData()`, `loadOrgChartData()`, `loadBijiRelai()`, `handleSubmitEntry()`, `handleSubmitBijiRelai()`, `handleEditBijiRelai()`, `handleDeleteBijiRelai()`, `handleSaveLeader()`, `handleDeleteLeader()`, `handleDetailSaveEdit()`, `handleDetailDeleteEntry()`.
- **Why it matters**: Any change risks breaking unrelated functionality. Testing is nearly impossible. Onboarding new developers takes days instead of hours.
- **Recommended fix**: Extract into: `useTeamPageState()` hook, `BlockSelectorView`, `OrgChartView`, `LeaderEntryView`, `LeaderDetailView`, `BijiRelaiManager`. Each reducer should be its own file.
- **Effort**: Hard

---

### HIGH Issues

---

**Issue 4: No Security Headers Configuration**

- **Category**: Security
- **File**: `next.config.ts`, `middleware.ts`
- **Severity**: **HIGH**
- **Description**: The Next.js config has no security headers configured. Missing: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **Evidence**: `next.config.ts` only has `turbopack: {}` and Serwist wrapper. No `headers()` config.
- **Why it matters**: Without CSP, the app is vulnerable to XSS. Without X-Frame-Options, it can be framed (clickjacking). Without HSTS, HTTPS can be downgraded.
- **Recommended fix**: Add security headers in `next.config.ts`:
  ```ts
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  }
  ```
- **Effort**: Easy

---

**Issue 5: `dangerouslySetInnerHTML` Script in Layout for Theme Flash Prevention**

- **Category**: Security / XSS
- **File**: `src/app/layout.tsx` (line 76-78)
- **Severity**: **HIGH**
- **Description**: The theme flash prevention script uses `dangerouslySetInnerHTML` to inject inline JavaScript. While the script itself is safe (reads from localStorage), this pattern establishes a precedent and could be exploited if the script content ever changes.
- **Evidence**: Line 76: `dangerouslySetInnerHTML={{ __html: '(function(){try{var t=localStorage.getItem...' }}`
- **Why it matters**: CSP `script-src` policies would block this inline script. The pattern is fragile.
- **Recommended fix**: Move to a separate `<script src="/theme-init.js">` file served from `/public/`, which is CSP-compatible.
- **Effort**: Easy

---

**Issue 6: `ProtectedRoute` Component Uses `window.location.href` Instead of Router**

- **Category**: UX / Performance
- **File**: `src/components/ProtectedRoute.tsx` (line 11)
- **Severity**: **HIGH**
- **Description**: `ProtectedRoute` uses `window.location.href = "/login"` which causes a full page reload instead of a client-side navigation. This loses all React state and causes a flash.
- **Evidence**: Line 11: `window.location.href = "/login";`
- **Why it matters**: Full page reload is slow, loses state, and creates a poor UX. The middleware already handles auth redirects server-side, making this component redundant.
- **Recommended fix**: Remove `ProtectedRoute` entirely — the middleware at `middleware.ts` already redirects unauthenticated users from protected routes. If client-side protection is still needed, use `router.push("/login")`.
- **Effort**: Easy

---

**Issue 7: Import/Restore Functionality Deletes All Data Before Insert**

- **Category**: Data Safety / UX
- **File**: `src/app/settings/page.tsx` (lines 115-123)
- **Severity**: **HIGH**
- **Description**: The `handleImport` function deletes ALL plantations, team leaders, and daily entries for the user before inserting imported data. If the import fails partway through, all original data is lost.
- **Evidence**: Lines 116-118: Three sequential `.delete()` calls before any `.insert()`.
- **Why it matters**: Data loss on partial import failure. No transaction or rollback capability.
- **Recommended fix**: Use Supabase RPC with a database transaction, or at minimum, keep a temporary backup. Add a confirmation dialog warning about data replacement.
- **Effort**: Medium

---

**Issue 8: `handleDeleteAll` Uses `alert()` and `window.location.reload()`**

- **Category**: UX
- **File**: `src/app/settings/page.tsx` (lines 128-136)
- **Severity**: **HIGH**
- **Description**: The delete-all-data action uses native `alert()` for confirmation and `window.location.reload()` after deletion. This is inconsistent with the rest of the app's toast-based feedback system and causes a full page reload.
- **Evidence**: Line 129: `if (!confirm("Are you sure?..."))` and Line 135: `window.location.reload();`
- **Why it matters**: `alert()` blocks the UI thread, looks unprofessional, and `window.location.reload()` is a harsh recovery.
- **Recommended fix**: Use the existing `Toast` component for confirmation feedback. Use `router.push("/login")` or state reset instead of reload.
- **Effort**: Easy

---

**Issue 9: Supabase Client Singleton Pattern May Cause Stale Auth**

- **Category**: Architecture
- **File**: `src/lib/supabaseClient.ts` (line 10)
- **Severity**: **HIGH**
- **Description**: `supabase` is exported as a module-level singleton (`export const supabase = createClient()`). This means the same Supabase client instance is shared across all components. If the auth state changes (e.g., token refresh), all existing references to `supabase` may hold stale state.
- **Evidence**: Line 10: `export const supabase = createClient();`
- **Why it matters**: While `@supabase/ssr` handles cookie-based auth, the singleton pattern can lead to subtle bugs when multiple components interact with the same client instance simultaneously.
- **Recommended fix**: Export only the `createClient` function and call it in each component/hook that needs it, or use React Query's queryClient for centralized data management.
- **Effort**: Medium

---

**Issue 10: No Input Sanitization on CSV Import**

- **Category**: Security / Data Integrity
- **File**: `src/components/ImportDataModal.tsx` (lines 29-50)
- **Severity**: **HIGH**
- **Description**: The CSV parser in `parseCSV` does basic splitting but doesn't sanitize or validate the data before database insertion. Malicious CSV content (e.g., extremely long strings, special characters) could be inserted directly into the database.
- **Evidence**: Lines 29-50: `parseCSV` splits by comma and trims, but doesn't validate content.
- **Why it matters**: CSV injection attacks, XSS through stored data, database bloat from oversized strings.
- **Recommended fix**: Add Zod validation on parsed rows. Limit string lengths. Sanitize special characters.
- **Effort**: Medium

---

### MEDIUM Issues

---

**Issue 11: Hardcoded English Strings in UI Despite i18n Support**

- **Category**: i18n / UX
- **File**: Multiple files
- **Severity**: **MEDIUM**
- **Description**: Many UI strings are hardcoded in English despite the app having comprehensive i18n support. Examples: "Palm Plantation Manager", "Current Plantation", "Live harvest signal", "Quick Actions", "View Teams", "View Reports", "Open →", "Go to Teams", "Basic Information", "Management Details", "Area Information", "Add Plantation", "Edit", "Save", "Cancel", "Delete All", "Restore Data", "Export Data", "Export Harvesting Monthly".
- **Evidence**: Dashboard page lines 233, 257, 313, 458-488, 403; Plantations page lines 193-200, 217-256, 296-365; Settings page lines 162, 207-228, 254, 329, 331, 419-476.
- **Why it matters**: Bahasa Melayu users will see English text mixed with translated content, breaking the localization experience.
- **Recommended fix**: Add missing translation keys to `i18n.tsx` and replace all hardcoded strings with `t()` calls.
- **Effort**: Medium

---

**Issue 12: No Loading State on Data Mutations**

- **Category**: UX
- **File**: `src/app/team/page.tsx`, `src/app/plantations/page.tsx`, `src/app/settings/page.tsx`
- **Severity**: **MEDIUM**
- **Description**: Several mutation operations (delete leader, delete entry, delete plantation, bulk delete) don't show loading states. The user can click multiple times before the first operation completes.
- **Evidence**: `handleDeleteLeader` (team/page.tsx line 420), `handleDeleteEntry` (line 395), `handleDelete` (plantations/page.tsx line 168), `handleBulkDelete` (daily-entries/page.tsx line 104).
- **Why it matters**: Double-clicks cause duplicate operations. No visual feedback that an action is in progress.
- **Recommended fix**: Add loading states to delete/mutation buttons. Disable buttons during mutation.
- **Effort**: Easy

---

**Issue 13: Reports Page Year Selector is Hardcoded**

- **Category**: Maintainability
- **File**: `src/app/reports/page.tsx` (line 180)
- **Severity**: **MEDIUM**
- **Description**: The year selector in the reports page is hardcoded to `[2024, 2025, 2026, 2027]`. In 2028, users won't be able to select that year.
- **Evidence**: Line 180: `{[2024, 2025, 2026, 2027].map((y) => ...}`
- **Why it matters**: The app becomes unusable for historical data after 2027.
- **Recommended fix**: Generate year range dynamically: `Array.from({length: 10}, (_, i) => currentYear - 2 + i)`.
- **Effort**: Easy

---

**Issue 14: No Error Handling on Geolocation Request**

- **Category**: UX
- **File**: `src/app/team/page.tsx` (lines 671-678)
- **Severity**: **MEDIUM**
- **Description**: The "Use My Location" button calls `navigator.geolocation.getCurrentPosition` but the error callback is empty (`() => {}`). Users get no feedback if location access is denied.
- **Evidence**: Line 677: `() => {}`
- **Why it matters**: Users think the feature is broken. No guidance on how to enable location.
- **Recommended fix**: Show a toast notification explaining that location access was denied and how to enable it in browser settings.
- **Effort**: Easy

---

**Issue 15: Missing `aria-label` on Form Inputs**

- **Category**: Accessibility
- **File**: Multiple form components
- **Severity**: **MEDIUM**
- **Description**: Many form inputs lack `aria-label` or associated `<label>` elements. The plantation form in `plantations/page.tsx` uses `placeholder` instead of labels. The team entry form uses `placeholder` text only.
- **Evidence**: Plantations page lines 302-328, team entry form inputs.
- **Why it matters**: Screen readers cannot properly identify form fields. Placeholder text is not a substitute for labels.
- **Recommended fix**: Add `<label>` elements or `aria-label` attributes to all form inputs.
- **Effort**: Easy

---

**Issue 16: No `robots.txt` or Sitemap**

- **Category**: SEO
- **File**: Missing
- **Severity**: **MEDIUM**
- **Description**: No `robots.txt` or `sitemap.xml` exists. While this is primarily a PWA for authenticated users, having a basic `robots.txt` prevents search engines from indexing login/dashboard pages.
- **Why it matters**: Search engines may index sensitive pages. No control over crawl behavior.
- **Recommended fix**: Add `public/robots.txt` with `Disallow: /dashboard/ /settings/ /team/ /daily-entries/ /reports/ /map/`.
- **Effort**: Easy

---

**Issue 17: `exportHarvestingMonthly` Mutates DOM**

- **Category**: Code Quality
- **File**: `src/lib/exportHarvestingMonthly.ts` (lines 575-577)
- **Severity**: **MEDIUM**
- **Description**: The export function directly manipulates the DOM by creating an anchor element, appending it to `document.body`, clicking it, then removing it. This is a side effect in a utility function.
- **Evidence**: Lines 575-577: `document.body.appendChild(a); a.click(); document.body.removeChild(a);`
- **Why it matters**: Side effects in utility functions make testing difficult and can cause issues in SSR contexts.
- **Recommended fix**: Extract DOM manipulation into a `downloadBlob()` utility. Use `URL.createObjectURL` + `revokeObjectURL` consistently (the function already does this but the DOM manipulation is unnecessary).
- **Effort**: Easy

---

**Issue 18: `OrientationHandler` Layout Hack**

- **Category**: Code Quality
- **File**: `src/components/OrientationHandler.tsx`
- **Severity**: **MEDIUM**
- **Description**: The orientation handler sets `document.documentElement.style.height` to `window.innerHeight` then removes it after 100ms. This is a hack to force layout recalculation on mobile orientation changes. It's fragile and may cause layout shifts.
- **Evidence**: Lines 7-12: Setting/removing height on `documentElement`.
- **Why it matters**: Can cause visual glitches. The 100ms timeout is arbitrary.
- **Recommended fix**: Use CSS `dvh` (dynamic viewport height) units instead, or use `visualViewport` API.
- **Effort**: Easy

---

**Issue 19: No `not-found.tsx` Custom 404 Page**

- **Category**: UX
- **File**: Missing `src/app/not-found.tsx`
- **Severity**: **MEDIUM**
- **Description**: No custom 404 page exists. Users navigating to invalid URLs see the default Next.js 404 page, which doesn't match the app's design.
- **Why it matters**: Poor UX on 404. No navigation back to the app.
- **Recommended fix**: Create `src/app/not-found.tsx` with the app's design system and a link to the dashboard.
- **Effort**: Easy

---

**Issue 20: No `loading.tsx` or `error.tsx` Route Boundaries**

- **Category**: UX / Architecture
- **File**: Missing
- **Severity**: **MEDIUM**
- **Description**: No route-level `loading.tsx` or `error.tsx` files exist. While individual pages handle loading states, there's no Next.js Suspense boundary at the route level for streaming.
- **Why it matters**: Users see a blank page during route transitions instead of a skeleton/loading state.
- **Recommended fix**: Add `loading.tsx` files for key routes that export skeleton components.
- **Effort**: Easy

---

### LOW Issues

---

**Issue 21: CSS `!important` Overrides in Leaflet Styles**

- **Category**: Styling / Maintainability
- **File**: `src/app/globals.css` (lines 396-436)
- **Severity**: **LOW**
- **Description**: Extensive use of `!important` for Leaflet popup and control overrides. While necessary for Leaflet's inline styles, this makes future theme changes fragile.
- **Evidence**: Lines 396-436: 12 `!important` declarations.
- **Why it matters**: Difficult to override Leaflet styles for custom themes.
- **Recommended fix**: Use CSS specificity instead of `!important` where possible, or scope overrides to a `.leaflet-theme` class.
- **Effort**: Easy

---

**Issue 22: `MONTH_NAMES` Duplicated Across Files**

- **Category**: Code Quality / DRY
- **File**: `src/app/dashboard/page.tsx`, `src/app/reports/page.tsx`, `src/lib/exportHarvestingMonthly.ts`, `src/components/ExportHarvestingModal.tsx`
- **Severity**: **LOW**
- **Description**: `MONTH_NAMES` array is defined in 4 different files.
- **Why it matters**: If month names need to change (e.g., localization), 4 files need updating.
- **Recommended fix**: Extract to `src/lib/date.ts` as a shared constant.
- **Effort**: Easy

---

**Issue 23: No TypeScript Strict Null Checks on Supabase Results**

- **Category**: Type Safety
- **File**: `src/lib/queries.ts`, `src/app/team/page.tsx`
- **Severity**: **LOW**
- **Description**: Supabase query results are cast with `as Type` without null checking. For example, `return (data || []) as Plantation[]` — the `as` assertion bypasses TypeScript's type checker.
- **Evidence**: queries.ts lines 14, 24, 34, 44, 54.
- **Why it matters**: Runtime errors if Supabase returns unexpected data shapes.
- **Recommended fix**: Add runtime validation with Zod on critical data paths, or use Supabase's typed client generation.
- **Effort**: Medium

---

**Issue 24: `AuthProvider` `fetchProfile` Called in `useEffect` Without Dependency**

- **Category**: React Best Practices
- **File**: `src/components/AuthProvider.tsx` (lines 57-63)
- **Severity**: **LOW**
- **Description**: `fetchProfile` is defined inside the component but not included in the `useEffect` dependency array. While it works because `fetchProfile` closes over `user`, it's technically a lint violation.
- **Evidence**: Line 63: `}, [user]);` — missing `fetchProfile` in deps.
- **Why it matters**: React linters will flag this. If `fetchProfile` changes identity, the effect won't re-run.
- **Recommended fix**: Use `useCallback` for `fetchProfile` and include it in deps, or move the logic inline.
- **Effort**: Easy

---

**Issue 25: `hasEntriesToday` Variable Name Misleading**

- **Category**: Code Quality / Naming
- **File**: `src/app/dashboard/page.tsx` (line 133)
- **Severity**: **LOW**
- **Description**: `hasEntriesToday` is computed from `monthEntries.length > 0`, but the variable name suggests it checks for today's entries, not the selected month's entries.
- **Evidence**: Line 133: `const hasEntriesToday = monthEntries.length > 0;`
- **Why it matters**: Misleading variable name leads to confusion.
- **Recommended fix**: Rename to `hasMonthEntries` or `hasEntriesForMonth`.
- **Effort**: Easy

---

**Issue 26: `useNotifications` Called in Both `Sidebar` and `DashboardLayout`**

- **Category**: Architecture / Performance
- **File**: `src/components/Sidebar.tsx`, `src/components/DashboardLayout.tsx`
- **Severity**: **LOW**
- **Description**: `useNotifications()` is called in both `Sidebar` and `DashboardLayout`, creating two separate notification state instances. The `DashboardLayout` renders its own `NotificationBell` and `NotificationPanel` for mobile, while `Sidebar` has its own for desktop. This means two separate WebSocket/polling connections for notifications.
- **Evidence**: Sidebar.tsx line 25, DashboardLayout.tsx line 12.
- **Why it matters**: Duplicate notification state, potential race conditions, wasted resources.
- **Recommended fix**: Lift notification state to `DashboardLayout` and pass it down to `Sidebar` as props.
- **Effort**: Easy

---

**Issue 27: PWA Manifest `background_color` Mismatch**

- **Category**: PWA / Consistency
- **File**: `public/manifest.json` (line 8)
- **Severity**: **LOW**
- **Description**: The manifest `background_color` is `#0f1a0f` (green-tinted), but the app's CSS `--bg-base` is `#0b0d13` (blue-tinted dark). The splash screen will look different from the app.
- **Evidence**: manifest.json line 8: `"background_color": "#0f1a0f"`, globals.css line 34: `--bg-base: #0b0d13`.
- **Why it matters**: Visual inconsistency during PWA launch.
- **Recommended fix**: Update manifest `background_color` to match `--bg-base`.
- **Effort**: Easy

---

**Issue 28: No `themeColor` Meta Tag for Mobile Browsers**

- **Category**: PWA
- **File**: `src/app/layout.tsx`
- **Severity**: **LOW**
- **Description**: While `viewport.themeColor` is set to `#10b981`, the manifest uses `#10b981` as well. However, the manifest `background_color` uses a different color. Mobile browser chrome will show green while the splash is dark green.
- **Why it matters**: Minor visual inconsistency.
- **Recommended fix**: Align all theme colors.
- **Effort**: Easy

---

**Issue 29: No Test Files**

- **Category**: Testing / Quality
- **File**: None
- **Severity**: **LOW**
- **Description**: No test files exist in the project. No unit tests, integration tests, or end-to-end tests.
- **Why it matters**: No automated quality assurance. Regressions can be introduced silently.
- **Recommended fix**: Add Vitest for unit tests, Playwright for E2E. At minimum, test critical paths: auth flow, data entry, export.
- **Effort**: Hard

---

## Final Assessment

### Strengths

1. **Comprehensive i18n**: Full English + Bahasa Melayu translations covering all major features
2. **Dark/Light Theme**: Well-implemented theme system with CSS custom properties and flash prevention
3. **PWA Support**: Service worker, manifest, offline status bar, install banner
4. **Responsive Design**: Mobile-first with bottom tab bar, desktop sidebar, and adaptive layouts
5. **Data Export**: Sophisticated Excel export with styled formatting matching plantation reporting standards
6. **Offline Sync**: IndexedDB-based offline write queue with sync capability
7. **Authentication Flow**: Proper middleware-based auth protection with Supabase SSR
8. **Component Architecture**: Good separation in UI primitives (Modal, Toast, Badge, StatCard, Skeleton)
9. **Accessibility Basics**: Skip-to-content link, focus-visible styles, aria-labels on key interactive elements
10. **Error Boundary**: Global error boundary with recovery UI

### Weaknesses

1. **God Component**: Team page is unmaintainable at 1000+ lines
2. **No Tests**: Zero automated tests
3. **Security Gaps**: No CSP, no security headers, potential RLS gaps
4. **Hardcoded Secrets**: `.env.local` with real API keys
5. **Incomplete i18n**: Many hardcoded English strings
6. **No Error Boundaries at Route Level**: Missing `error.tsx` files
7. **Code Duplication**: `MONTH_NAMES`, notification state, date utilities scattered
8. **Missing UX Polish**: No 404 page, no loading boundaries, alert() usage

### Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Data breach via RLS misconfiguration | High | Verify Supabase RLS policies |
| XSS via stored data from CSV import | Medium | Add input sanitization |
| Data loss on import failure | High | Add transaction/backup |
| Broken auth flow | Low | Middleware + SSR properly configured |
| PWA cache staleness | Medium | Serwist configured with reloadOnOnline |

### Technical Debt Summary

- ~1000 lines of god component (team page)
- ~50 hardcoded English strings needing i18n
- 4 duplicated MONTH_NAMES definitions
- 2 duplicate notification state instances
- Missing test infrastructure
- Missing security headers
- Missing route-level error/loading boundaries

### Production Readiness Verdict

**NOT READY for production.** Critical blockers:
1. `.env.local` secrets must be removed from version control and rotated
2. Security headers must be added
3. RLS policies must be verified and documented
4. Data import must be made safe (transaction/backup)
5. At minimum, add a 404 page and CSP header

### Top 20 Highest Priority Improvements

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Rotate exposed Supabase keys, remove `.env.local` from git | Critical | Easy |
| 2 | Verify and document RLS policies | Critical | Medium |
| 3 | Add security headers (CSP, X-Frame-Options, etc.) | High | Easy |
| 4 | Extract team page into smaller components/hooks | Critical | Hard |
| 5 | Make data import safe (transactions, backup) | High | Medium |
| 6 | Add `not-found.tsx` 404 page | Medium | Easy |
| 7 | Add `error.tsx` route boundaries | Medium | Easy |
| 8 | Fix hardcoded English strings → i18n | Medium | Medium |
| 9 | Replace `alert()`/`confirm()` with proper UI | High | Easy |
| 10 | Add loading states to all mutations | Medium | Easy |
| 11 | Fix `ProtectedRoute` to not use `window.location.href` | High | Easy |
| 12 | Dynamic year selector in reports | Medium | Easy |
| 13 | Add geolocation error handling | Medium | Easy |
| 14 | Add `robots.txt` | Medium | Easy |
| 15 | Add aria-labels to all form inputs | Medium | Easy |
| 16 | Deduplicate MONTH_NAMES and notification state | Low | Easy |
| 17 | Add basic test infrastructure (Vitest) | Low | Hard |
| 18 | Fix PWA manifest background_color mismatch | Low | Easy |
| 19 | Sanitize CSV import data | High | Medium |
| 20 | Fix `AuthProvider` useEffect dependencies | Low | Easy |

### Overall Scores (0-10)

| Category | Score | Notes |
|----------|-------|-------|
| UI | 7.5 | Polished dark theme, consistent card system, good responsive design. Some hardcoded strings break i18n. |
| UX | 6.5 | Good mobile experience, but alert() usage, no 404, missing loading states on mutations. |
| Frontend | 6.0 | Good component reuse in UI primitives, but team page god component, no code splitting hints. |
| Backend | 7.0 | Solid Supabase integration, proper middleware auth, but no API routes, RLS unverified. |
| Code Quality | 5.0 | God component, duplicated constants, missing tests, inconsistent patterns. |
| Security | 4.0 | Exposed secrets, no CSP, no security headers, unverified RLS, unsanitized import. |
| Performance | 7.0 | React Query caching, lazy loading via dynamic imports, but no bundle analysis, no image optimization. |
| Accessibility | 6.0 | Skip-to-content, focus-visible, some aria-labels, but missing labels on many inputs. |
| SEO | 5.0 | Good metadata/OG tags, but no robots.txt, no sitemap, login page indexable. |
| Maintainability | 4.5 | Team page is a maintenance black hole, no tests, duplicated code. |
| Scalability | 6.0 | React Query handles data well, but no pagination, no virtual scrolling for large datasets. |
| Developer Experience | 6.0 | Good folder structure, TypeScript strict, but no tests, no Storybook, no dev documentation. |
| Production Readiness | 4.5 | Critical security and data safety blockers must be resolved first. |

---

## Prioritized Roadmap

### 1. Immediate (Critical)
- Rotate exposed Supabase keys and remove `.env.local` from git history
- Verify and document Supabase RLS policies
- Begin extracting team page god component

### 2. Short Term (1-2 weeks)
- Add security headers to `next.config.ts`
- Make data import safe with transactions
- Replace `alert()`/`confirm()` with proper UI components
- Fix `ProtectedRoute` to use router
- Add loading states to all mutations
- Add geolocation error handling

### 3. Medium Term (1 month)
- Complete i18n for all hardcoded strings
- Add `not-found.tsx` and `error.tsx` route boundaries
- Add `robots.txt` and sitemap
- Add aria-labels to all form inputs
- Dynamic year selector
- Sanitize CSV import data
- Add test infrastructure

### 4. Long Term (Quarter)
- Complete team page decomposition
- Add comprehensive test coverage (Vitest + Playwright)
- Add bundle analysis and optimization
- Add Storybook for component documentation
- Add pagination and virtual scrolling for large datasets
- Add API routes for server-side operations
