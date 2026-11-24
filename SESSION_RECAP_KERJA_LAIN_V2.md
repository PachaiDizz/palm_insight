# Session Recap — Kerja-Kerja Lain V2 (Options, Membaja, Mencuci)

_Status: complete. All work committed & pushed to `main` (`e22ed6a`)._

## Summary
Reworked the `/kerja-lain` **TAMBAH KERJA** modal (style unchanged: dark theme, amber,
uppercase, tiles, segmented pills, sticky footer, date/time picker). Added a generic saved
options system, removed KUMPULAN/KETUA, extended MEMBAJA and MENCUCI data/models, and
redesigned JADUAL BAJA. Typecheck, targeted lint, 20 tests, and `npm run build` all pass.

## Key changes
### Global
- Removed **KUMPULAN** and **KETUA** everywhere (form, page filters, cards, detail, types,
  zod). Section "LOKASI & KUMPULAN" → **LOKASI** (BLOK only).
- No option field is pre-filled (empty + muted uppercase placeholders). TAJUK stays empty and
  is generated silently on save when blank.
- New **`CreatableCombobox`** (`src/components/kerja-lain/form/CreatableCombobox.tsx`):
  - Tap to open a portal dropdown (fixed positioning, no clipping inside the modal) with a
    search, 44px rows, amber hover, check mark on selected.
  - Typing a new name shows `+ TAMBAH "NAME"` → saves to Supabase immediately, selects it,
    shows **DISIMPAN** toast; inline uppercase error on failure.
  - Values trimmed/uppercased/de-duplicated case-insensitively. Creators can delete their own
    custom options (confirm first).
  - Used for KONTRAKTOR, JENIS BAJA, NAMA BAJA (per row), KAEDAH, NAMA RACUN, JENIS PRUNING,
    BAHAN, MESIN DIGUNAKAN.
- New **`useWorkOptions(category, plantationId)`** + `addOption`/`removeOption` +
  `persistWorkOptions` (`src/lib/workOptions.ts`). Optimistic updates; globals + plantation
  options merged.

### MEMBAJA
- Field order: KONTRAKTOR → BILANGAN PEKERJA → NAMA DRIVER | NO. LORI → **BILANGAN TRIP
  (HARI INI)** → JENIS BAJA → JADUAL BAJA → KELUASAN CHEKAR | KADAR PER POKOK.
- JADUAL BAJA redesign: empty first row (`PILIH NAMA BAJA`), single-border cards via shared
  `RepeatableRowCard`, 44px inputs (padding 14px, focus-only amber border), line 1 = A badge +
  combobox + trash, line 2 = BAG | KG (KG manual, thousands separator), re-lettering, trash
  disabled at 1 row, add-row auto-focus, Enter on last KG adds a row, amber JUMLAH card with
  BAG/KG and TRIP (if >0).
- `details` now includes `trip_count`, nullable `fertilizer_type`; totals computed on save and
  enforced by DB trigger.
- Card chip: `MEMBAJA · 130 BAG · 5,500 KG · 3 TRIP`; subline `KONTRAKTOR: … · LORI: …`.
  Detail drawer shows full JADUAL BAJA + JUMLAH + trip.

### MENCUCI / MERUMPUT
- Added **TEMPOH KERJA** (`first_work_date`, `last_work_date`, date-only picker + amber
  `TEMPOH: … (N HARI)` summary; TAMAT optional, must not precede PERTAMA).
- Added repeatable **PUSINGAN** (`rounds[]`): manual add only, starts empty (`BELUM ADA
  PUSINGAN`), auto-numbered cards, TARIKH MULA | TAMAT, LUAS | BILANGAN PEKERJA, CATATAN,
  soft out-of-tempoh warning, live `JUMLAH PUSINGAN … · JUMLAH LUAS …`.
- `details` shape: `method`, `area_ha`, `chemical_name`, `chemical_qty_l`,
  `first_work_date`, `last_work_date`, `rounds[]`, `total_rounds`, `total_round_area_ha`
  (totals computed on save + DB trigger).
- Card chip: `MENCUCI / MERUMPUT · N PUSINGAN · 24 NOV - 12 DIS`; detail drawer shows period +
  pusingan timeline.

### Other types
- PRUNING uses a creatable JENIS PRUNING combobox; BAIKI JALAN uses creatable BAHAN + MESIN.

## Files
- New: `work_options_setup.sql`, `src/lib/workOptions.ts`,
  `src/components/kerja-lain/form/{CreatableCombobox,DateField,RepeatableRowCard}.tsx`,
  `src/components/kerja-lain/fields/PusinganList.tsx`.
- Removed: `src/components/kerja-lain/form/CreatableInput.tsx`.
- Updated: `JobFormDrawer`, `FertilizerTable`, `MembajaFields`, `MencuciFields`,
  `PruningFields`, `BaikiJalanFields`, `fields/types.ts`, `jobMeta`, `JobCard`,
  `JobDetailDrawer`, `app/kerja-lain/page.tsx`, `lib/schemas.ts`, `types/index.ts`.

## IMPORTANT — Database setup still required
Run in the Supabase SQL editor (idempotent, in this order), then hard-refresh the PWA:

1. **`work_options_setup.sql`** — creates `work_options` (+ RLS, seeds, realtime), drops
   `other_works.group_name` / `leader_name`, ensures `details` jsonb, adds the MENCUCI totals
   trigger.
2. **`other_works_membaja_totals.sql`** — MEMBAJA totals trigger (if not already applied).

## Verified
- `npm run typecheck`
- `npx eslint src/components/kerja-lain src/lib/workOptions.ts src/lib/schemas.ts
  src/types/index.ts src/app/kerja-lain` (clean)
- `npm run test` — 20 passing
- `npm run build`

## Note
Old MENCUCI records used `area_hectare`/`chemical_qty_liter`; new code reads
`area_ha`/`chemical_qty_l`. Existing rows may show blank for those fields (no data migration
was applied).
