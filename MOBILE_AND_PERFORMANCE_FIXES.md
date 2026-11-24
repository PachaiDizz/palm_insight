# Session Recap — Mobile Responsiveness & Loading Performance

**Scope:** Make the mobile view (tested on iPhone 11 Pro, ~375x812) more responsive and
polished, and fix the sluggish/unsmooth loading experience.

**Commits pushed to `main` (GitHub → Render auto-deploy):**
- `78a48f9` — improve mobile responsiveness, safe-area layout, and loading performance
- `6ffc045` — fix page scroll lock with bounded app shell height

---

## 1. Mobile Layout & Responsiveness

### Root sizing (biggest "fit-to-screen" culprit)
- **Problem:** `globals.css` set `html { font-size: clamp(13px, 1.2vw, 16px) }`. On a
  ~375px phone this resolved to **13px**, shrinking every rem-based size (padding, text,
  spacing) and making the whole UI feel cramped.
- **Fix:** Locked root to `16px` + `-webkit-text-size-adjust: 100%` / `text-size-adjust: 100%`.
  Fluid sizing is now handled per-element with responsive utilities.

### Touch targets
- **Problem:** A global rule forced `min-height: 44px; min-width: 44px` on **all** `a` and
  `button` elements — stretching inline links and risking horizontal overflow.
- **Fix:** Removed `min-width`; dropped `a` from the global rule; kept `min-height: 44px` for
  `button` / `[role="button"]`. Mobile block keeps a 36px floor for form controls only.

### Media sizing
- **Problem:** `img, video, canvas, svg { height: auto }` overrode intrinsic sizing used by
  Recharts and Leaflet.
- **Fix:** `img { max-width:100%; height:auto }`; `video, canvas, svg { max-width:100% }`
  (no forced height).

### Mobile header (`DashboardLayout`)
- Respects the notch/status bar: `padding-top: calc(0.5rem + env(safe-area-inset-top))`.
- Sticky top bar with solid `--bg-nav` background.
- Added a **Map** shortcut icon (needed because Map was removed from the bottom bar).

### Bottom tab bar (`BottomTabBar`)
- Reduced **6 → 5** primary tabs (Home, Blocks, Teams, Entries, Reports). Map moved to the
  header. Six items were cramped at ~62px each on a 375px screen; five gives ~75px each.
- **Fixed safe-area bug:** bar used `height: 64px` *and* bottom safe-area padding, which
  subtracted from the icon area on notched iPhones. Now the safe area is **added** to the
  bar (`padding-top: 6px; padding-bottom: calc(6px + env(safe-area-inset-bottom))`).
- `main` bottom padding matched to `calc(60px + env(safe-area-inset-bottom))`.

### App shell sizing
- Use `100dvh` (dynamic viewport height) instead of `100vh` so mobile browser chrome /
  standalone PWA doesn't cut content.

---

## 2. Loading Performance / Smoothness

### Page transitions (`PageTransition`)
- **Problem:** Used framer-motion `<AnimatePresence mode="wait">`, which kept the old page
  mounted through its exit animation (~150ms) before mounting the new route — a visible blank
  gap on every navigation, on top of data fetching.
- **Fix:** Plain keyed wrapper with a fast CSS **opacity-only** 180ms fade. New page mounts
  immediately. Framer-motion removed from the app shell (smaller bundle).
- Kept opacity-only (no transform) so it never creates a containing block for
  `position: fixed` overlays (notification sheet, modals).

### React Query caching (`Providers`, `queries.ts`)
- Added defaults: `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: false`, `retry: 1`.
  Prevents re-fetch + loading flash on every tab navigation.
- Added `placeholderData: (prev) => prev` to month-based queries (dashboard month/recent,
  reports) so switching months never blanks the grid.

### Auth hydration (`AuthProvider`)
- Now calls `supabase.auth.getSession()` on mount to hydrate immediately, instead of only
  waiting for the first `onAuthStateChange` event — faster cold start.

### Notifications (`useNotifications`)
- **Problem:** Heavy `runAllChecks()` (several sequential queries) re-ran on every navigation
  because `DashboardLayout` remounts per page and the guard was a per-instance ref.
- **Fix:** Module-level throttle — runs at most once per **5 minutes** per browser session.

### Dashboard (`dashboard/page.tsx`)
- **Problem:** Sequential onboarding waterfall (`hasCompletedOnboarding` → `getAllPlantations`)
  blocked render every visit.
- **Fix:** Uses cached `usePlantations()` from React Query; `checking` is now
  `!user || plantationsLoading`.
- Selected plantation is **derived** (`useMemo`) instead of synced via an effect — no extra
  render pass, and stays valid as data loads/changes.
- Guided-tour trigger simplified to a single effect keyed on load state + plantation count.

---

## 3. Scroll Lock Fix (`6ffc045`)

- **Problem:** After the shell was set to `min-h-[100dvh]`, `<main>` had `overflow-y-auto`
  but its flex parent had **no bounded height**, so the scroll container never became
  scrollable — the browser page appeared unable to scroll.
- **Fix:** Bounded app-shell pattern:
  - Outer: `flex h-[100dvh] overflow-hidden`
  - Right column: `flex-1 flex flex-col min-w-0 min-h-0`
  - `<main>`: `flex-1 min-h-0 overflow-y-auto overscroll-contain`
  - Sidebar `h-screen` → `h-full`
- **Extra catch:** Removed `backdrop-blur` from the mobile header — `backdrop-filter`
  creates a containing block for `position: fixed`, which would have broken the notification
  bottom-sheet rendered inside the header. Solid `--bg-nav` used instead.

---

## Files Changed
- `src/app/globals.css`
- `src/app/dashboard/page.tsx`
- `src/components/DashboardLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/PageTransition.tsx`
- `src/components/Providers.tsx`
- `src/components/AuthProvider.tsx`
- `src/components/navigation/BottomTabBar.tsx`
- `src/components/notifications/useNotifications.ts`
- `src/lib/queries.ts`

---

## Verification
- `npm run typecheck` — passes
- `npm run test` — 20/20 pass
- `npm run build` — passes (all routes generated)
- Lint: repo already has ~70+ pre-existing React-Compiler errors (mostly `any`,
  `set-state-in-effect`); no meaningful new issues introduced.

## Status / Next
- Pushed to `origin/main`; Render auto-deploys on push (verify in Render → Events).
- After deploy, hard-refresh once (PWA service worker caches the old shell).
- **Deferred to later:** native mobile app setup (user noted "Later will be set up for
  mobile").
- **Potential future win:** move the shell into `app/(app)/layout.tsx` route group so the
  sidebar/header/notification socket persist across navigation (eliminates full page
  remounts entirely).
