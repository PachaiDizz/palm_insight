# Session Recap — Kerja-Kerja Lain (MEMBAJA) — PAUSED

_Status: paused, safe to resume later. All work committed & pushed to `main`._

## Where we are
The **Kerja-Kerja Lain** feature is built (dashboard card + `/kerja-lain` page),
the **TAMBAH KERJA** modal is the premium uppercase form, and **MEMBAJA** now has
the contractor + repeatable **JADUAL BAJA** with a just-fixed overflow (stacked
mini-card layout). Typecheck, lint (new files), 20 tests, and `npm run build` all pass.

## Commits this session (newest first)
- `51edae1` fix membranja jadual baja overflow: stacked mini-card layout, min-w-0, both totals visible
- `90d317c` membaja: clean jadual baja redesign, move worker stepper, remove group/leader/blocks, silent title, server totals trigger
- `a7a67ba` membaja: contractor/driver/lorry + repeatable JADUAL BAJA with live totals, detail drawer
- `ff740cf` surface save/load errors and add one-shot other_works setup SQL
- `f885bdc` redesign Kerja-Kerja Lain form: uppercase premium UI, custom controls, dynamic per-type fields, details schema
- `5599ca8` add Membaja daily fertilizer trip tracking (other_work_trips)
- `48700bb` docs: add Kerja-Kerja Lain feature recap
- `704c7e2` add Kerja-Kerja Lain (other works) feature with dashboard card and /kerja-lain page

## IMPORTANT — Database setup still required
If data isn't saving, the Supabase tables/columns aren't set up yet. Run in Supabase
SQL editor (idempotent, in this order):

1. **`SETUP_other_works.sql`** — creates/upgrades `other_works` (+ `details`,
   `group_name`, `leader_name`, `worker_count`), creates `other_work_trips`, enables
   RLS, adds Realtime, reloads schema cache. (This is the main one.)
2. **`other_works_membaja_totals.sql`** — trigger that recomputes `total_bags`/`total_kg`
   from `details.items` on the server.

Then hard-refresh the app once.

## Feature overview (for context when resuming)
- **Dashboard card** (`components/dashboard/OtherWorksCard.tsx`): placed between Monthly
  Overview and Monthly Trend; 3 mini stats; "Lihat Semua →"; zero state; respects month+block.
- **Page** (`app/kerja-lain/page.tsx`): header + back arrow, tabs (Sedang Berjalan / Selesai /
  Semua), filters (type/group/date), grouped history, empty states, skeletons, Realtime.
  Data error banner if table missing.
- **Form** (`components/kerja-lain/JobFormDrawer.tsx`): uppercase, sections (Maklumat Asas /
  Lokasi & Kumpulan / Butiran Kerja / Masa / Catatan), icon-tile JENIS KERJA, status
  segmented pills, worker stepper, progress slider (running), custom DateTimeField,
  sticky footer, full-height mobile sheet.
- **Types**: `mencuci_merumput | membaja | pruning | cuci_parit | baiki_jalan | lain_lain`.
- **Per-type field groups**: `components/kerja-lain/fields/*`.
- **MEMBAJA details** (`other_works.details`):
  `{ contractor, worker_count, driver_name, lorry_no, fertilizer_type, items[], total_bags,
    total_kg, chekar_area_ha, rate_per_palm_kg }`.
  - Form order: Kontraktor → Bilangan Pekerja → Driver → No. Lori → Jenis Baja (default
    FELDA COMPACT) → **Jadual Baja** → Keluasan Chekar + Kadar Per Pokok.
  - No KUMPULAN/KETUA/BLOK DILIPUTI for MEMBAJA (single BLOK from LOKASI only).
  - Tajuk optional; silently generated on save if blank.
  - `total_bags`/`total_kg` recomputed from `items` (client) and enforced by DB trigger.
- **Jadual Baja** (`components/kerja-lain/form/FertilizerTable.tsx`): stacked mini-card per
  row at all widths (no fixed px, all `min-w-0`, `overflow-hidden`), round amber A/B/C badge,
  per-row creatable NAMA BAJA (datalist), BAG/KG 44px with inline suffix + thousands on KG,
  add-row auto-focus, Enter-on-last-KG adds row, live **JUMLAH** card with both totals.
- **Card & detail**: `JobCard` chips `MEMBAJA · <FERT> · <bags> BAG · <kg> KG` + `KONTRAKTOR · LORI`
  subline; `JobDetailDrawer` (Eye) shows full JADUAL BAJA + summary + time range.
- **Trips** (`BajaTripsDrawer`, `other_work_trips`): optional per-day fertilizer trips from store.

## Pending / next session
1. ✅ Run the two SQL files above (if not already) → then confirm save works.
2. Verify JADUAL BAJA at **320 / 375 / 480 px**: no horizontal scrollbar, BAG & KG fully
   visible, JUMLAH shows both totals. (Layout is built to fit; needs a visual check on device.)
3. Hard-refresh PWA after each deploy (service worker caches).
4. Possible future improvements (not started): persistent app shell via `app/(app)/layout.tsx`
   route group; verify Supabase RLS; security headers review (see `summary.md`).

## How to resume
- Start dev: `npm run dev` → test `/kerja-lain` (add a MEMBAJA job).
- Checks: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- Key files: `app/kerja-lain/page.tsx`, `components/kerja-lain/{JobFormDrawer,JobCard,
  JobDetailDrawer,BajaTripsDrawer}.tsx`, `components/kerja-lain/fields/MembajaFields.tsx`,
  `components/kerja-lain/form/{FertilizerTable,controls,DateTimeField,CreatableInput}.tsx`,
  `lib/{otherWorks,bajaTrips,schemas}.ts`, `types/index.ts`, and the `*.sql` files at repo root.
- Deploy: push to `main` → Render auto-deploys (verify in Render → Events).

_See also: `KERJA_LAIN_RECAP.md` for the earlier feature/review notes._
