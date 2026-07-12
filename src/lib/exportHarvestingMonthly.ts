import * as XLSX from "xlsx-js-style";
import { supabase } from "./supabaseClient";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Extract the calendar day (1-31) from a date string that may be either
// "YYYY-MM-DD" (DATE column) or "YYYY-MM-DDTHH:MM:SS.sssZ" (TIMESTAMP column).
function dayOf(entryDate: string | null | undefined): number {
  if (!entryDate) return NaN;
  const m = String(entryDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return parseInt(m[3], 10);
  const d = new Date(entryDate);
  return isNaN(d.getTime()) ? NaN : d.getDate();
}

// ----- Thin border (every data cell gets this on all 4 sides) -----
const thin = { style: "thin" as const, color: { argb: "FF000000" } };
const allBorders = { top: thin, bottom: thin, left: thin, right: thin };

// ----- Number formats -----
const FMT_INT = "0";   // workers / bunches
const FMT_TON = "0.00"; // tons

// ----- Column indices (0-based) -----
// A=0 B=1 C=2 D=3 E=4 ... AI=34 AJ=35 AK=36 AL=37 AM=38 AN=39
const dayCol = (d: number) => 4 + (d - 1);

// ----- Fixed row indices (0-based) -----
const R_TITLE = 3;
const R_SUB = 4;
const R_BULAN = 7;
const R_INFO1 = 9;
const R_INFO2 = 10;
const R_INFO3 = 11;
const R_HASILHDR = 13;
const R_HEADER = 14;
const R_LEADER_START = 15;
const ROWS_PER_LEADER = 6;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function merge(r1: number, c1: number, r2: number, c2: number): XLSX.Range {
  return { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } };
}

function leaderFirstRow(i: number) {
  return R_LEADER_START + i * ROWS_PER_LEADER;
}

function leaderLastRow(i: number) {
  return R_LEADER_START + i * ROWS_PER_LEADER + (ROWS_PER_LEADER - 1);
}

export interface HarvestingData {
  rancanganName: string;
  blockName: string;
  blockPlantation: any;
  leaders: any[];
  entriesByLeader: Record<string, Record<number, any>>;
  bijiRelaiData: any[];
  days: number;
  monthName: string;
  year: number;
  month: number;
}

export function buildHarvestingMonthlyWorksheet(data: HarvestingData): XLSX.WorkSheet {
  const { rancanganName, blockName, blockPlantation, leaders, entriesByLeader, bijiRelaiData, days } = data;

  // =====================================================================
  // Phase 1: Build the 2D data array (rows × cols) with values
  // xlsx-js-style requires aoa_to_sheet — manual ws[addr] = {t,v} is ignored
  // =====================================================================
  const NUM_COLS = 40; // A through AN
  const N = leaders.length;

  // We'll extend rows as needed; start with placeholder rows
  // The actual row count depends on leaders count
  const lastSigRow = R_LEADER_START + N * ROWS_PER_LEADER + 7; // last signature row
  const totalRows = lastSigRow + 1;

  // Initialize empty 2D array
  const rows: (string | number | null)[][] = [];
  for (let r = 0; r < totalRows; r++) {
    rows.push(new Array(NUM_COLS).fill(null));
  }

  // -- Title (Row 4, col V = 21)
  rows[R_TITLE][21] = "HARVESTING MONTHLY";

  // -- Subtitle (Row 5, col V = 21)
  rows[R_SUB][21] = rancanganName + " — BLOCK " + blockName;

  // -- BULAN (Row 8)
  rows[R_BULAN][21] = "BULAN";
  rows[R_BULAN][23] = data.monthName + " " + data.year;

  // -- Info lines (Rows 10-12)
  const infoLines = [
    {
      r: R_INFO1,
      label: "Rancangan/Peringkat",
      value: (blockPlantation?.rancangan || "-") + (blockPlantation?.peringkat ? " / " + blockPlantation.peringkat : ""),
      mid: "Kontraktor Checkroll (Nama)",
      right: "Mekanisasi",
      suffix: ": TIADA",
    },
    {
      r: R_INFO2,
      label: "Penyelia",
      value: blockPlantation?.penyelia || "-",
      mid: "Kumpulan Menuai",
      right: "Bil. Mekanisasi",
      suffix: ": TIADA",
    },
    {
      r: R_INFO3,
      label: "Mandor",
      value: blockPlantation?.mandor || "-",
      mid: "Lori",
      right: "Bil Pekerja",
      suffix: ":",
    },
  ];
  for (const ln of infoLines) {
    rows[ln.r][1] = ln.label;   // B
    rows[ln.r][3] = ":";        // D
    rows[ln.r][14] = ln.mid;    // O
    rows[ln.r][17] = ":";       // R
    rows[ln.r][26] = ln.right;  // AA
    rows[ln.r][28] = ln.suffix; // AC
  }

  // -- Hasil (M/t) header (Row 14)
  rows[R_HASILHDR][35] = "Hasil (M /t)";   // AJ
  rows[R_HASILHDR][39] = "Jum.Pusingan";    // AN

  // -- Main header (Row 15)
  rows[R_HEADER][0] = "BIL";
  rows[R_HEADER][1] = "Peringkat / Blok";
  rows[R_HEADER][2] = "Zon";
  rows[R_HEADER][3] = "Luas (Hek)";
  for (let d = 1; d <= 31; d++) rows[R_HEADER][dayCol(d)] = d;
  rows[R_HEADER][35] = "Pus 1";
  rows[R_HEADER][36] = "Pus 2";
  rows[R_HEADER][37] = "Pus 3";
  rows[R_HEADER][38] = "Jumlah";

  // -- Team leaders (6 rows each, starting Row 16)
  const leaderTotals: { workers: number; bunches: number; hi: number; hhi: number }[] = [];

  leaders.forEach((leader, i) => {
    const base = leaderFirstRow(i);
    const zon = "ZON " + String.fromCharCode(65 + i);
    const dayEntries = entriesByLeader[leader.id] || {};

    rows[base][0] = i + 1;             // BIL
    rows[base][1] = leader.name || "";  // Name
    rows[base + 4][2] = "(" + zon + ")"; // ZON

    rows[base][3] = "Bil. Pekerja";
    rows[base + 1][3] = "Tandan";
    rows[base + 2][3] = "Bil. Tandan";
    rows[base + 3][3] = "Hasil(Tan) HI";
    rows[base + 4][3] = "Hasil(Tan) HHI";

    let totWorkers = 0;
    let totBunches = 0;
    let cumBunches = 0;
    let totHi = 0;
    let cumHi = 0;

    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      const dc = dayCol(d);

      if (entry && entry.work_status === "work") {
        if (entry.num_workers !== null && entry.num_workers !== undefined && entry.num_workers !== "") {
          const v = Number(entry.num_workers) || 0;
          rows[base][dc] = v;
          totWorkers += v;
        }
        if (entry.bunches !== null && entry.bunches !== undefined && entry.bunches !== "") {
          const v = Number(entry.bunches) || 0;
          rows[base + 1][dc] = v;
          totBunches += v;
          cumBunches += v;
        }
        if (cumBunches > 0) rows[base + 2][dc] = cumBunches;
        if (entry.tons !== null && entry.tons !== undefined && entry.tons !== "") {
          const t = round2(Number(entry.tons));
          rows[base + 3][dc] = t;
          totHi = round2(totHi + t);
          cumHi = round2(cumHi + t);
          rows[base + 4][dc] = cumHi;
        }
      } else if (entry && entry.work_status === "no_work") {
        rows[base][dc] = "-";
        rows[base + 1][dc] = "-";
        if (cumBunches > 0) rows[base + 2][dc] = cumBunches;
        // Tons still count on no_work days — transport delivers fruit to factory
        if (entry.tons !== null && entry.tons !== undefined && entry.tons !== "") {
          const t = round2(Number(entry.tons));
          rows[base + 3][dc] = t;
          totHi = round2(totHi + t);
          cumHi = round2(cumHi + t);
        }
        rows[base + 4][dc] = cumHi;
      }
    }

    rows[base][38] = totWorkers;
    rows[base + 1][38] = totBunches;
    rows[base + 2][38] = cumBunches;
    rows[base + 3][38] = totHi;
    rows[base + 4][38] = cumHi;

    leaderTotals.push({ workers: totWorkers, bunches: totBunches, hi: totHi, hhi: cumHi });
  });

  // -- Summary rows
  const lastLeaderRow = leaderLastRow(N - 1);
  const R_BIJI = lastLeaderRow + 1;
  const R_BIJI_CUM = R_BIJI + 1;
  const R_SUMMARY = R_BIJI_CUM + 1;
  const R_SUMMARY_CUM = R_SUMMARY + 1;

  rows[R_BIJI][0] = "Biji Relai (M/t)";
  rows[R_BIJI][3] = "Hari ini";
  rows[R_BIJI_CUM][3] = "Hingga Hari Ini";

  // Populate Biji Relai data from biji_relai table
  const bijiByDay: Record<number, number> = {};
  for (const br of bijiRelaiData || []) {
    const day = dayOf(br.date);
    if (br.tons !== null && br.tons !== undefined) {
      bijiByDay[day] = round2(Number(br.tons));
    }
  }
  let bijiCum = 0;
  let totalBiji = 0;
  for (let d = 1; d <= days; d++) {
    const dc = dayCol(d);
    if (bijiByDay[d] !== undefined) {
      rows[R_BIJI][dc] = bijiByDay[d];
      bijiCum = round2(bijiCum + bijiByDay[d]);
      totalBiji = round2(totalBiji + bijiByDay[d]);
    }
    if (bijiCum > 0) {
      rows[R_BIJI_CUM][dc] = bijiCum;
    }
  }
  rows[R_BIJI][38] = totalBiji;
  rows[R_BIJI_CUM][38] = bijiCum;

  rows[R_SUMMARY][0] = "Jumlah Hasil (M/t)";
  rows[R_SUMMARY][3] = "Hari ini";
  rows[R_SUMMARY_CUM][3] = "Hingga Hari Ini";

  // Compute summary per day
  let grandHi = 0;
  let grandCum = 0;
  for (let d = 1; d <= days; d++) {
    const dc = dayCol(d);
    let dayHi = 0;
    for (const leader of leaders) {
      const entry = (entriesByLeader[leader.id] || {})[d];
      if (entry && entry.tons !== null && entry.tons !== undefined && entry.tons !== "") {
        dayHi = round2(dayHi + Number(entry.tons));
        grandCum = round2(grandCum + Number(entry.tons));
      }
    }
    if (dayHi > 0) rows[R_SUMMARY][dc] = dayHi;
    if (grandCum > 0) rows[R_SUMMARY_CUM][dc] = grandCum;
  }
  for (const lt of leaderTotals) grandHi = round2(grandHi + lt.hi);
  rows[R_SUMMARY][38] = grandHi;
  rows[R_SUMMARY_CUM][38] = grandCum;

  // -- Signatures
  const R_SIG1 = R_SUMMARY_CUM + 1;
  rows[R_SIG1][0] = "T . T Penyelia";
  rows[R_SIG1 + 1][0] = "T . T Field Controller (FC)";
  rows[R_SIG1 + 2][0] = "T .T Pengurus";
  const R_LAST = R_SIG1 + 2;

  // =====================================================================
  // Phase 2: Create worksheet from 2D array
  // =====================================================================
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // =====================================================================
  // Phase 3: Apply merges, styling, borders, column widths, row heights
  // =====================================================================
  const merges: XLSX.Range[] = [];

  // -- Title
  merges.push(merge(R_TITLE, 21, R_TITLE, 23));
  // -- Subtitle
  merges.push(merge(R_SUB, 21, R_SUB, 23));
  // -- Info lines: B:C merge
  for (const ln of infoLines) merges.push(merge(ln.r, 1, ln.r, 2));
  // -- Hasil header: AJ14:AM14
  merges.push(merge(R_HASILHDR, 35, R_HASILHDR, 38));
  // -- Jum.Pusingan: AN14:AN15
  merges.push(merge(R_HASILHDR, 39, R_HASILHDR + 1, 39));
  // -- Leader merges: A, B, C(ZON)
  leaders.forEach((_, i) => {
    const base = leaderFirstRow(i);
    merges.push(merge(base, 0, base + 5, 0));     // A col
    merges.push(merge(base, 1, base + 5, 1));     // B col
    merges.push(merge(base + 4, 2, base + 5, 2)); // C col (ZON)
  });
  // -- Biji Relai: A:C across 2 rows
  merges.push(merge(R_BIJI, 0, R_BIJI_CUM, 2));
  // -- Jumlah Hasil: A:C across 2 rows
  merges.push(merge(R_SUMMARY, 0, R_SUMMARY_CUM, 2));
  // -- Signatures: A:D each
  merges.push(merge(R_SIG1, 0, R_SIG1, 3));
  merges.push(merge(R_SIG1 + 1, 0, R_SIG1 + 1, 3));
  merges.push(merge(R_SIG1 + 2, 0, R_SIG1 + 2, 3));

  ws["!merges"] = merges;

  // -- Apply styling to every cell
  function setS(r: number, c: number, opts: {
    bold?: boolean; size?: number; align?: "left" | "center" | "right";
    valign?: "top" | "center" | "bottom"; wrap?: boolean; numFmt?: string;
  }) {
    const cell = XLSX.utils.encode_cell({ r, c });
    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
    const s: any = ws[cell].s ? { ...ws[cell].s } : {};
    if (opts.bold || opts.size) {
      s.font = { ...(s.font || {}), ...(opts.bold ? { bold: true } : {}), ...(opts.size ? { sz: opts.size } : {}) };
    }
    if (opts.align || opts.wrap || opts.valign) {
      s.alignment = {
        ...(s.alignment || {}),
        ...(opts.align ? { horizontal: opts.align } : {}),
        ...(opts.valign ? { vertical: opts.valign } : { vertical: "center" }),
        ...(opts.wrap ? { wrapText: true } : {}),
      };
    }
    if (opts.numFmt) s.numFmt = opts.numFmt;
    ws[cell].s = s;
  }

  // -- Title styling
  setS(R_TITLE, 21, { bold: true, size: 11, align: "center" });
  setS(R_SUB, 21, { bold: true, size: 14, align: "center", wrap: true });

  // -- BULAN
  setS(R_BULAN, 21, { bold: true, align: "center" });
  setS(R_BULAN, 23, { align: "center" });

  // -- Info lines
  for (const ln of infoLines) {
    setS(ln.r, 1, { bold: true, align: "left", valign: "top" });
    setS(ln.r, 3, { align: "left", valign: "top" });
    setS(ln.r, 14, { bold: true, align: "left" });
    setS(ln.r, 17, { align: "center" });
    setS(ln.r, 26, { bold: true, align: "left" });
    setS(ln.r, 28, { align: "center" });
  }

  // -- Hasil header
  setS(R_HASILHDR, 35, { bold: true, align: "center", wrap: true });
  setS(R_HASILHDR, 39, { bold: true, align: "center", wrap: true });

  // -- Main header
  for (let c = 0; c <= 38; c++) setS(R_HEADER, c, { bold: true, align: "center" });

  // -- Leader cell styling
  leaders.forEach((_, i) => {
    const base = leaderFirstRow(i);
    setS(base, 0, { bold: true, align: "center", wrap: true });
    setS(base, 1, { align: "left", wrap: true });
    setS(base + 4, 2, { align: "center" });
    for (let k = 0; k <= 4; k++) setS(base + k, 3, { align: "center", wrap: true });
    for (let d = 1; d <= days; d++) {
      const dc = dayCol(d);
      setS(base, dc, { align: "center", numFmt: FMT_INT });
      setS(base + 1, dc, { align: "center", numFmt: FMT_INT });
      setS(base + 2, dc, { align: "center", numFmt: FMT_INT });
      setS(base + 3, dc, { align: "center", numFmt: FMT_TON });
      setS(base + 4, dc, { align: "center", numFmt: FMT_TON });
    }
    setS(base, 38, { align: "center", numFmt: FMT_INT });
    setS(base + 1, 38, { align: "center", numFmt: FMT_INT });
    setS(base + 2, 38, { align: "center", numFmt: FMT_INT });
    setS(base + 3, 38, { align: "center", numFmt: FMT_TON });
    setS(base + 4, 38, { align: "center", numFmt: FMT_TON });
  });

  // -- Summary styling
  setS(R_BIJI, 0, { bold: true, align: "center", wrap: true, valign: "center" });
  setS(R_BIJI, 3, { bold: true, align: "center" });
  setS(R_BIJI_CUM, 3, { bold: true, align: "center" });
  setS(R_BIJI, 38, { align: "center", numFmt: FMT_TON });
  setS(R_BIJI_CUM, 38, { align: "center", numFmt: FMT_TON });

  setS(R_SUMMARY, 0, { bold: true, align: "center", wrap: true, valign: "center" });
  setS(R_SUMMARY, 3, { bold: true, align: "center" });
  setS(R_SUMMARY_CUM, 3, { bold: true, align: "center" });

  for (let d = 1; d <= days; d++) {
    const dc = dayCol(d);
    setS(R_SUMMARY, dc, { align: "center", numFmt: FMT_TON });
    setS(R_SUMMARY_CUM, dc, { align: "center", numFmt: FMT_TON });
  }
  setS(R_SUMMARY, 38, { align: "center", numFmt: FMT_TON });
  setS(R_SUMMARY_CUM, 38, { align: "center", numFmt: FMT_TON });

  // -- Biji Relai data cell styling
  for (let d = 1; d <= days; d++) {
    const dc = dayCol(d);
    setS(R_BIJI, dc, { align: "center", numFmt: FMT_TON });
    setS(R_BIJI_CUM, dc, { align: "center", numFmt: FMT_TON });
  }
  setS(R_BIJI, 38, { align: "center", numFmt: FMT_TON });
  setS(R_BIJI_CUM, 38, { align: "center", numFmt: FMT_TON });

  // -- Signature styling
  setS(R_SIG1, 0, { bold: true, align: "center", wrap: true });
  setS(R_SIG1 + 1, 0, { bold: true, align: "center", wrap: true });
  setS(R_SIG1 + 2, 0, { bold: true, align: "center", wrap: true });

  // -- Borders on full data grid (row 13 through R_LAST, cols A-AM)
  for (let r = R_HASILHDR; r <= R_LAST; r++) {
    for (let c = 0; c <= 38; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      if (!ws[cell]) ws[cell] = { t: "s", v: "" };
      ws[cell].s = {
        ...(ws[cell].s || {}),
        border: allBorders,
        alignment: { ...(ws[cell].s?.alignment || {}), horizontal: ws[cell].s?.alignment?.horizontal || "center", vertical: "center" },
      };
    }
  }

  // -- Column widths
  const colWidths: ({ wch: number } | undefined)[] = [];
  colWidths[0] = { wch: 5 };       // A
  colWidths[1] = { wch: 16 };      // B
  colWidths[2] = { wch: 11.71 };   // C
  colWidths[3] = { wch: 16.29 };   // D
  for (let d = 1; d <= 31; d++) colWidths[dayCol(d)] = { wch: 4.5 };
  colWidths[35] = { wch: 8 };      // AJ
  colWidths[36] = { wch: 8 };      // AK
  colWidths[37] = { wch: 8 };      // AL
  colWidths[38] = { wch: 8 };      // AM
  colWidths[39] = { wch: 15.0 };   // AN
  ws["!cols"] = colWidths as any;

  // -- Row heights
  const rowHeights: ({ hpt: number } | undefined)[] = [];
  rowHeights[R_SUB] = { hpt: 18.75 };
  for (let r = R_HEADER; r <= R_LAST; r++) rowHeights[r] = { hpt: 30 };
  ws["!rows"] = rowHeights as any;

  return ws;
}

// ------------------------------------------------------------------
// Top-level export: runs the Supabase queries, then builds and
// downloads the workbook.
// ------------------------------------------------------------------
export async function exportHarvestingMonthly(params: {
  userId: string;
  plantationId: string;
  blockId: string;
  month: number;
  year: number;
}) {
  const { userId, plantationId, blockId, month, year } = params;
  const days = daysInMonth(year, month);
  const monthName = MONTH_NAMES[month];

  const { data: blockPlantation, error: blockErr } = await supabase
    .from("plantations")
    .select("*")
    .eq("id", blockId)
    .single();

  if (blockErr) console.error("[Export] Block query error:", blockErr);
  if (!blockPlantation) throw new Error("Block not found. Queried id=" + blockId);

  const rancanganName = blockPlantation.rancangan || "FELDA SAHABAT 05";
  const blockName = blockPlantation.block || "Block 01";

  const { data: leaders, error: leadersErr } = await supabase
    .from("team_leaders")
    .select("*")
    .eq("plantation_id", blockId)
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (leadersErr) console.error("[Export] Leaders query error:", leadersErr);
  if (!leaders || leaders.length === 0) throw new Error("No team leaders found for this block (plantation_id=" + blockId + ")");

  const mm = String(month + 1).padStart(2, "0");
  const startDate = year + "-" + mm + "-01";
  const endDate = year + "-" + mm + "-" + String(days).padStart(2, "0");

  const { data: entries, error: entriesErr } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("plantation_id", blockId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (entriesErr) console.error("[Export] Entries query error:", entriesErr);

  // Query Biji Relai (palm seed tonnage) for this block and month
  const { data: bijiRelaiData } = await supabase
    .from("biji_relai")
    .select("*")
    .eq("user_id", userId)
    .eq("plantation_id", blockId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const entriesByLeader: Record<string, Record<number, any>> = {};
  for (const leader of leaders) entriesByLeader[leader.id] = {};
  for (const entry of entries || []) {
    const day = dayOf(entry.date);
    if (!entriesByLeader[entry.team_leader_id]) entriesByLeader[entry.team_leader_id] = {};
    entriesByLeader[entry.team_leader_id][day] = entry;
  }

  const totalEntriesMapped = Object.values(entriesByLeader).reduce((sum, dayMap) => sum + Object.keys(dayMap).length, 0);

  if (totalEntriesMapped === 0) {
    throw new Error(`No entries found for ${monthName} ${year}. Make sure daily entries exist for this block.`);
  }

  const ws = buildHarvestingMonthlyWorksheet({
    rancanganName,
    blockName,
    blockPlantation,
    leaders,
    entriesByLeader,
    bijiRelaiData: bijiRelaiData || [],
    days,
    monthName,
    year,
    month,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Harvesting Monthly");

  const cleanRancangan = (rancanganName || "Plantation").replace(/[^a-zA-Z0-9]/g, "");
  const cleanBlock = (blockName || "Block01").replace(/[^a-zA-Z0-9]/g, "");
  const filename = "PalmInsight_Harvesting_" + cleanRancangan + "_" + cleanBlock + "_" + monthName + "_" + year + ".xlsx";

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
