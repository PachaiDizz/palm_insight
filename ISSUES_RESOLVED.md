# Issues Resolved — PalmInsight

## Issue 23: No TypeScript Strict Null Checks on Supabase Results
- **Files**: `src/lib/queries.ts`, `src/lib/schemas.ts` (new)
- **Fix**: Created Zod schemas (`PlantationSchema`, `TeamLeaderSchema`, `DailyEntrySchema`, `DailyEntryWithRelationsSchema`) for runtime validation. Replaced all unsafe `as Type` assertions with `Schema.array().parse(data ?? [])` in every query function and React Query hook.

## Issue 24: `AuthProvider` `fetchProfile` Called in `useEffect` Without Dependency
- **Files**: `src/components/AuthProvider.tsx`
- **Fix**: Wrapped `fetchProfile` in `useCallback` with `[user]` as dependency, added `fetchProfile` to the `useEffect` dependency array.

## Issue 25: `hasEntriesToday` Variable Name Misleading
- **Files**: `src/app/dashboard/page.tsx`
- **Fix**: Renamed `hasEntriesToday` to `hasMonthEntries` at both definition and usage.

## Issue 26: `useNotifications` Called in Both `Sidebar` and `DashboardLayout`
- **Files**: `src/components/Sidebar.tsx`, `src/components/DashboardLayout.tsx`
- **Fix**: Lifted notification state to `DashboardLayout` and passed it down to `Sidebar` as props. Removed duplicate `useNotifications` call from `Sidebar`.

## Issue 27: PWA Manifest `background_color` Mismatch
- **Files**: `public/manifest.json`
- **Fix**: Changed `background_color` from `#0f1a0f` to `#0b0d13` to match CSS `--bg-base`.

## Issue 28: No `themeColor` Meta Tag for Mobile Browsers
- **Status**: No changes needed — `theme_color` was already consistent (`#10b981`) between manifest and viewport. The background_color mismatch was fixed in Issue 27.

## Issue 29: `postcss.config.mjs` Not Reviewed
- **Status**: No changes needed — config already uses `@tailwindcss/postcss` (correct for Tailwind CSS 4).

## Issue 30: No Test Files
- **Files**: `vitest.config.ts` (new), `src/__tests__/setup.ts` (new), `src/__tests__/date.test.ts` (new), `src/__tests__/schemas.test.ts` (new), `src/__tests__/queries.test.ts` (new), `package.json`
- **Fix**: Set up Vitest with jsdom environment. Created 20 unit tests covering date utilities, Zod schema validation, and `computeLeaderStats`. Added `test` and `test:watch` scripts.
