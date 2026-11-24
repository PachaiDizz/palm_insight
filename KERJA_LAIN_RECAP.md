# Recap — KERJA-KERJA LAIN (Other Works)

**Feature:** A new "Kerja-Kerja Lain" (non-harvest work) module with a dashboard
summary card and a dedicated `/kerja-lain` page.

**Commit:** `704c7e2` — `add Kerja-Kerja Lain (other works) feature with dashboard card and /kerja-lain page`

---

## 1. Database — `other_works_schema.sql`

Run this in the **Supabase SQL editor** (required before the feature works).

Table `public.other_works`:

| column         | type                                             |
|----------------|--------------------------------------------------|
| id             | uuid PK (gen_random_uuid)                         |
| plantation_id  | uuid → plantations(id) on delete cascade          |
| block_id       | uuid (nullable; reserved)                         |
| team_id        | uuid → team_leaders(id) on delete set null        |
| type           | text check: racun_rumpai / baja / pangkas / baiki_jalan / parit / lain_lain |
| title          | text                                             |
| status         | text check: scheduled / running / completed / cancelled |
| progress       | int 0–100 (default 0)                            |
| workers        | int (default 0) — added for the UI                |
| started_at     | timestamptz (nullable)                            |
| ended_at       | timestamptz (nullable)                            |
| notes          | text (nullable)                                   |
| created_by     | uuid → auth.users(id) default auth.uid()          |
| created_at     | timestamptz default now()                         |

- Indexes on plantation, status, started_at, created_by.
- **RLS enabled** with select/insert/update/delete policies scoped to
  `plantations.user_id = auth.uid()`.
- Realtime publication: `alter publication supabase_realtime add table public.other_works;`
- Optional seed data is included (commented out).

> Note: in this app a plantation row **is** a block, so `plantation_id` carries the
> block association; `block_id` is kept nullable for future multi-block support.

---

## 2. Types & validation

- `src/types/index.ts` — `OtherWork`, `OtherWorkStatus`, `OtherWorkType`.
- `src/lib/schemas.ts` — `OtherWorkSchema` (runtime parse), `OTHER_WORK_TYPES`,
  `OTHER_WORK_STATUSES`, `otherWorkFormSchema` (form validation).

---

## 3. Data layer — `src/lib/otherWorks.ts`

- `fetchOtherWorks(plantationId)` — select with joins `team_leaders(name)`,
  `plantations(block, rancangan)`, ordered by started_at/created_at.
- `useOtherWorks(userId, plantationId)` — React Query (`staleTime 15s`,
  keep-previous) + **Supabase Realtime** subscription (invalidates on change).
- `fetchOtherWorkCounts` / `useOtherWorkCounts` — returns
  `{ running, completed, total }` (0 when empty), scoped to the selected month
  (by `created_at`).
- Helpers: `toLocalInput`, `fromLocalInput`, `formatDateTime`, `formatDuration`,
  `jobDateKey`, `groupJobsByDate` (Hari Ini / Semalam / Minggu Ini / Lebih Awal).

---

## 4. Components

| File | Purpose |
|------|---------|
| `src/components/kerja-lain/jobMeta.ts` | Job type labels + icons (lucide) |
| `src/components/kerja-lain/JobStatusChip.tsx` | Status pill; pulsing dot for running |
| `src/components/kerja-lain/JobCard.tsx` | Job card: icon, title, chip, block/team, workers, start time, duration/elapsed, progress bar (running), notes, edit |
| `src/components/kerja-lain/JobFormDrawer.tsx` | Add/Edit form (uses existing `Modal` → bottom sheet on mobile), Zod validated |
| `src/components/dashboard/OtherWorksCard.tsx` | Dashboard summary card |

### OtherWorksCard
- Full-width card placed **between Monthly Overview and Monthly Trend** on the dashboard.
- Briefcase icon in amber tinted circle, title "KERJA-KERJA LAIN".
- 3 mini stats: Sedang Berjalan / Selesai / Jumlah Kerja (0 when empty).
- "Lihat Semua →" on the right; the **whole card is a link** to `/kerja-lain`,
  with hover lift + low-opacity amber border.
- Zero state: still shown with `0 / 0 / 0` + muted "Tiada kerja direkodkan bulan ini".
- Respects the dashboard's month selector + current plantation/block.

---

## 5. Page — `src/app/kerja-lain/page.tsx` (+ `loading.tsx`)

- Header: back arrow → `/dashboard`, title "KERJA-KERJA LAIN", plantation/block
  subtitle (selector if multiple blocks), amber "+ Tambah Kerja".
- Tabs: **Sedang Berjalan** (count badge + pulsing green dot), **Selesai** (history),
  **Semua**.
- Filters (Selesai & Semua): job type, team, date range (from/to).
- Responsive grid: 1 col mobile / 2 tablet / 3 desktop.
- History tab grouped by date (Hari Ini / Semalam / Minggu Ini / Lebih Awal).
- Empty states:
  - no records at all → icon + "Tiada kerja direkodkan" + "+ Tambah Kerja"
  - running → "Tiada kerja sedang berjalan"
  - completed → "Belum ada sejarah kerja"
  - filtered → "Tiada kerja sepadan dengan tapisan"
- Skeleton loaders while loading; Supabase Realtime updates without refresh.
- Route added to `middleware` protected paths.

---

## 6. Wiring / integration

- `src/app/dashboard/page.tsx` — imports and renders `<OtherWorksCard>` with
  `user.id`, `selectedPlantation.id`, `selectedYear`, `selectedMonth`.
- `src/lib/supabaseMiddleware.ts` — added `/kerja-lain` to `protectedPaths`.

---

## 7. Verification

- `npm run typecheck` — pass
- `npm run test` — 20/20 pass
- `npm run build` — pass; `/kerja-lain` route generated
- `npx eslint` on all new files — clean

---

## 8. Membaja — Trip Baja (fertilizer trips per day)

Added a per-day trip log for **Membaja** (`baja`) jobs: how many trips the
fertilizer went out from the store each day.

**Database — `membaja_trips_schema.sql`**
- Table `public.other_work_trips`: `id, other_work_id → other_works(id) cascade,
  plantation_id → plantations(id) cascade, date, trips, quantity_tons, store,
  notes, created_by, created_at`.
- Indexes on other_work_id / plantation_id / date / created_by.
- RLS scoped to `plantations.user_id = auth.uid()` (select/insert/update/delete).
- Realtime publication enabled.

**Data / UI**
- `src/lib/bajaTrips.ts` — `fetchBajaTrips`, `useBajaTrips` (Realtime),
  `summarizeTrips` (total trips / tons / days), `formatTripDate`.
- `src/components/kerja-lain/BajaTripsDrawer.tsx` — drawer (Modal) showing a
  summary (Jumlah Trip / Jumlah Tan / Hari), the daily trip list (date, trips,
  tonnage, store, notes, delete), and an add form (date, trips, quantity, store,
  notes).
- `JobCard` shows an **"Urus Trip Baja"** button on `baja` jobs that opens the
  drawer; wired through `src/app/kerja-lain/page.tsx`.

---

## 9. Go-live checklist

1. Fresh install: run `other_works_schema.sql` → `membaja_trips_schema.sql`.
   Existing install (already created `other_works`): run `other_works_v2_upgrade.sql`
   (adds details/group/leader/worker_count + migrates type values) then
   `membaja_trips_schema.sql`.
2. Render auto-deploys from `main` (verify in Render → Events).
3. Hard-refresh the PWA once after deploy.

---

## 10. Premium "Tambah Kerja" form redesign (v2)

**Categories (new `OtherWorkType` values):** `mencuci_merumput`, `membaja`,
`pruning`, `cuci_parit`, `baiki_jalan`, `lain_lain` (old values auto-migrated).

**Modal UX (`JobFormDrawer.tsx`)**
- All text uppercase (CSS `text-transform` + values uppercased before save).
- Sections: MAKLUMAT ASAS, LOKASI & KUMPULAN, BUTIRAN KERJA (dynamic), MASA, CATATAN.
- JENIS KERJA = icon tile grid (2 cols mobile / 3 desktop) with amber selected state + check.
- STATUS = segmented pill control (colour per status).
- BILANGAN PEKERJA = stepper; KEMAJUAN % = slider with live badge (only when running).
- Custom dark date+time picker (`form/DateTimeField.tsx`) — no native widget.
- Creatable Kumpulan / Ketua inputs (`form/CreatableInput.tsx`): free text, suggestions
  from prior Kerja-Kerja Lain entries, "+ Tambah Baru". Not tied to harvest teams.
- Tajuk Kerja is optional and auto-suggests e.g. `MEMBAJA - BLOK 04 - 24 NOV 2026`;
  final title uppercased and auto-used if left empty.
- Sticky footer BATAL / TAMBAH KERJA; full-height bottom sheet on mobile
  (`Modal` gained optional `footer` + `mobileFull`, backward compatible).

**Dynamic fields per type** (`src/components/kerja-lain/fields/*`): each type has its own
component with numeric unit-suffix inputs + segmented controls; values reset on type change.

**Data**
- `other_works` gains `details jsonb`, `group_name text`, `leader_name text`,
  `worker_count integer` (SQL: `other_works_v2_upgrade.sql`, base schema updated).
- Zod: `otherWorkDetailsSchema` discriminated union validates `details` per type;
  `OtherWorkSchema` updated.
- `fetchOtherWorks` no longer joins `team_leaders`.

**Job cards** show uppercase detail chips (e.g. `MEMBAJA · NPK · 120 KG · 124 POKOK`),
group/leader, worker count, and the Membaja "Urus Trip Baja" button.

## 11. Membaja v2 — JADUAL BAJA (contractor + fertilizer table)

MEMBAJA only. Old qty/luas/pokok fields replaced. Stored in `other_works.details`:
```
{ contractor, driver_name, lorry_no, fertilizer_type,
  items: [{ label, name, bags, kg }], total_bags, total_kg,
  chekar_area_ha, blocks: [id], rate_per_palm_kg }
```
- `MembajaFields` + reusable `FertilizerTable` (rows A/B/C…, auto-relabel on delete,
  live JUMLAH, mobile stacked cards, KG thousands display).
- `total_bags`/`total_kg` are recomputed from `items` on save (client totals ignored).
- Contractor & Jenis Baja are creatable inputs (Jenis default FELDA COMPACT).
- Blocks support multi-select (`details.blocks`); NaN-safe defaults to primary block.
- Zod `otherWorkDetailsSchema` membaja member updated (validates items per-row).
- Jobs cards show `MEMBAJA · <FERT> · <bags> BAG · <kg> KG` + `KONTRAKTOR · LORI` subline.
- New `JobDetailDrawer` (Eye button) shows the full JADUAL BAJA + summary + time range.
- No new SQL needed (uses existing `details` jsonb).

## Notes / future
- Delete action for jobs is not implemented (add/edit only) — add if needed.
- Dashboard counts are month-scoped by `created_at`.
- `block_id` reserved for future multi-block modeling.
- Legacy `team_id` column kept but unused by this feature.
