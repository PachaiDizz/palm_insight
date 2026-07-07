# Session Recap — July 7, 2026

## PWA Support (Completed)

Implemented full Progressive Web App support for field workers.

### Files Created
- `public/manifest.json` — PWA manifest with all icon sizes, standalone display, portrait orientation
- `public/icons/icon-{72..512}.png` — 8 maskable icon sizes generated via sharp (dark green bg + palm leaf)
- `scripts/generate-icons.mjs` — Node script to regenerate icons from SVG template
- `src/sw.ts` — Serwist service worker with runtime caching (Supabase NetworkFirst, static CacheFirst, images CacheFirst)
- `src/app/offline/page.tsx` — Offline fallback page with wifi-off illustration and retry button
- `src/components/PwaInstallBanner.tsx` — Slide-up install prompt using `beforeinstallprompt` event, tracked via localStorage

### Files Modified
- `next.config.ts` — Configured `@serwist/next` for service worker generation
- `src/app/layout.tsx` — Added manifest link, appleWebApp meta, theme-color, apple-touch-icon
- `src/app/globals.css` — Added `slide-up` animation for install banner
- `.gitignore` — Added generated SW files (`public/sw.js`, `public/workbox-*.js`)
- `package.json` — Updated build script to `next build --webpack` for serwist compatibility

### Key Decisions
- Used `@serwist/next` instead of `next-pwa` (next-pwa conflicts with Next.js 16 Turbopack)
- Build requires `--webpack` flag since serwist doesn't support Turbopack yet
- Icons generated with sharp — dark green circle (#0f1a0f) with emerald palm leaf (#10b981)

---

## Notification System (Completed)

Comprehensive notification system for plantation supervisors.

### Files Created
- `scripts/notifications_migration.sql` — SQL to create notifications table with RLS and index
- `src/types/index.ts` — Added `Notification`, `NotificationType`, `NotificationPrefs` types
- `src/components/notifications/notificationHelpers.ts` — Trigger logic for 3 notification types + browser push + localStorage prefs
- `src/components/notifications/useNotifications.ts` — Hook for fetching, Supabase realtime subscription, mark read, dismiss
- `src/components/notifications/NotificationBell.tsx` — Bell icon with red unread badge (dot 1-9, "9+" for 10+)
- `src/components/notifications/NotificationCard.tsx` — Individual notification with type icon, color, action button, dismiss
- `src/components/notifications/NotificationPanel.tsx` — Dropdown panel with header, mark-all-read, scrollable list

### Files Modified
- `src/components/Sidebar.tsx` — Added NotificationBell + panel in header (desktop)
- `src/components/DashboardLayout.tsx` — Added mobile notification bell in top-right header row
- `src/app/settings/page.tsx` — Added Notifications section with 3 toggle switches + browser push permission flow

### Notification Types
1. **Daily Harvest Reminder** — Fires after 10AM if no entries logged today
2. **Low Productivity Alert** — Fires when a leader's weekly tonnage is 40%+ below their 4-week average
3. **Check-in Reminder** — Fires when a leader hasn't logged data in 3+ days

### Database
- Table: `public.notifications` (created via migration SQL)
- RLS: Users can only manage their own notifications
- Index: `(user_id, is_read, created_at DESC)`

---

## Favicon Fix (Completed)

- Replaced `public/favicon.svg` with simpler palm leaf design (emerald green on transparent)
- Layout already referenced it correctly — no 404 after restart
