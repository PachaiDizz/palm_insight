import * as XLSX from "xlsx-js-style";
import { supabase } from "./supabaseClient";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const thin = { style: "thin" as const, color: { rgb: "000000" } };
const thinBorder = { top: thin, bottom: thin, left: thin, right: thin };

function styleCell(
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  opts?: {
    bold?: boolean;
    fontSize?: number;
    align?: "center" | "left" | "right";
    numFmt?: string;
  }
) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = { t: "s", v: "" };
  const s: Record<string, any> = { border: thinBorder };
  if (opts?.bold || opts?.fontSize) {
    s.font = { bold: opts.bold, sz: opts.fontSize };
  }
  if (opts?.align) {
    s.alignment = { horizontal: opts.align };
  }
  if (opts?.numFmt) {
    s.numFmt = opts.numFmt;
  }
  ws[addr].s = s;
}

function putInRow(row: any[], col: number, value: any) {
  while (row.length <= col) row.push("");
  row[col] = value;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

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
  const mm = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${mm}-01`;
  const endDate = `${year}-${mm}-${String(days).padStart(2, "0")}`;

  // Fetch block plantation
  const { data: blockPlantation, error: blockErr } = await supabase
    .from("plantations")
    .select("*")
    .eq("id", blockId)
    .single();

  if (!blockPlantation) throw new Error("Block not found");

  const rancanganName = blockPlantation.rancangan || "FELDA SAHABAT 05";
  const blockName = blockPlantation.block || "Block 01";

  // Fetch team leaders for this block
  const { data: leaders, error: leadersErr } = await supabase
    .from("team_leaders")
    .select("*")
    .eq("plantation_id", blockId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!leaders || leaders.length === 0) throw new Error("No team leaders found for this block");

  // Fetch daily entries for the month
  const { data: entries, error: entriesErr } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("plantation_id", blockId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  // Group entries by team leader and day
  const entriesByLeader: Record<string, Record<number, any>> = {};
  for (const leader of leaders) {
    entriesByLeader[leader.id] = {};
  }
  for (const entry of entries || []) {
    const day = new Date(entry.date + "T00:00:00").getDate();
    if (!entriesByLeader[entry.team_leader_id]) {
      entriesByLeader[entry.team_leader_id] = {};
    }
    entriesByLeader[entry.team_leader_id][day] = entry;
  }

  // ============================================================
  // BUILD AOA (Array of Arrays)
  // Column layout: A=0, B=1, C=2, D=3, E=4..34 (days 1-31), AJ=35, AK=36, AL=37, AM=38
  // ============================================================
  const dayCol = (d: number) => 3 + d; // day 1 = col 4
  const totalCols = 38; // col AM = index 38

  const rows: any[][] = [];

  function ensureRow(idx: number) {
    while (rows.length <= idx) {
      const empty: any[] = [];
      for (let i = 0; i <= totalCols; i++) empty.push("");
      rows.push(empty);
    }
    return rows[idx];
  }

  // ---------- ROW 0 (Excel 1): Title ----------
  const r0 = ensureRow(0);
  putInRow(r0, 0, "HARVESTING MONTHLY");

  // ---------- ROW 1 (Excel 2): Subtitle ----------
  const r1 = ensureRow(1);
  putInRow(r1, 0, `${rancanganName} — BLOCK ${blockName}`);

  // ---------- ROW 2 (Excel 3): BULAN ----------
  const r2 = ensureRow(2);
  putInRow(r2, 0, `BULAN ${monthName} ${year}`);

  // ---------- ROW 3 (Excel 4): Info line 1 ----------
  const r3 = ensureRow(3);
  putInRow(r3, 0, "Rancangan/Peringkat");  // A
  putInRow(r3, 2, ":");                      // C
  putInRow(r3, 3, `${blockPlantation.rancangan || "-"} - ${blockPlantation.peringkat || "-"}`); // D
  putInRow(r3, 7, "Kontraktor Checkroll");   // H
  putInRow(r3, 9, ":");                       // J
  putInRow(r3, 10, "-");                      // K
  putInRow(r3, 13, "Mekanisasi");             // N
  putInRow(r3, 15, ":");                      // P
  putInRow(r3, 16, "TIADA");                 // Q

  // ---------- ROW 4 (Excel 5): Info line 2 ----------
  const r4 = ensureRow(4);
  putInRow(r4, 0, "Penyelia");               // A
  putInRow(r4, 2, ":");                       // C
  putInRow(r4, 3, blockPlantation.penyelia || "-"); // D
  putInRow(r4, 7, "Kumpulan Menuai");        // H
  putInRow(r4, 9, ":");                       // J
  putInRow(r4, 10, "-");                      // K
  putInRow(r4, 13, "Bil. Mekanisasi");       // N
  putInRow(r4, 15, ":");                      // P
  putInRow(r4, 16, "TIADA");                 // Q

  // ---------- ROW 5 (Excel 6): Info line 3 ----------
  const r5 = ensureRow(5);
  putInRow(r5, 0, "Mandor");                 // A
  putInRow(r5, 2, ":");                       // C
  putInRow(r5, 3, blockPlantation.mandor || "-"); // D
  putInRow(r5, 7, "Lori");                   // H
  putInRow(r5, 9, ":");                       // J
  putInRow(r5, 10, "-");                      // K
  putInRow(r5, 13, "Bil Pekerja");           // N
  putInRow(r5, 15, ":");                      // P
  putInRow(r5, 16, String(leaders.length));   // Q

  // ---------- ROW 7 (Excel 8): Column header ----------
  const headerRowIdx = 7;
  const hdr = ensureRow(headerRowIdx);
  putInRow(hdr, 0, "BIL");                    // A
  putInRow(hdr, 1, "Peringkat / Blok");       // B
  putInRow(hdr, 2, "Zon");                    // C
  putInRow(hdr, 3, "Luas (Hek)");             // D
  for (let d = 1; d <= 31; d++) {
    putInRow(hdr, dayCol(d), String(d));
  }
  putInRow(hdr, 35, "Pus 1");                 // AJ
  putInRow(hdr, 36, "Pus 2");                 // AK
  putInRow(hdr, 37, "Pus 3");                 // AL
  putInRow(hdr, 38, "Jumlah");                // AM

  // ---------- TEAM LEADER DATA (5 sub-rows per leader, NO blank rows between) ----------
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;

  let grandTotalTons = 0;
  let todayTotalTons = 0;

  const leaderStartRow = headerRowIdx + 1; // row 8

  leaders.forEach((leader, idx) => {
    const baseRow = leaderStartRow + idx * 5;
    const dayEntries = entriesByLeader[leader.id] || {};
    const zonLabel = `ZON ${String.fromCharCode(65 + idx)}`;

    // --- Sub-row 1: BIL + Name + Bil. Pekerja + workers/day ---
    const rw1 = ensureRow(baseRow);
    putInRow(rw1, 0, idx + 1);       // A: BIL
    putInRow(rw1, 1, leader.name);   // B: Name
    putInRow(rw1, 3, "Bil. Pekerja"); // D

    let leaderTotalWorkers = 0;
    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      const val = entry?.num_workers;
      if (val !== null && val !== undefined && val !== "") {
        putInRow(rw1, dayCol(d), Number(val));
        leaderTotalWorkers += Number(val) || 0;
      }
    }
    putInRow(rw1, 38, leaderTotalWorkers);

    // --- Sub-row 2: Tandan (bunches/day) ---
    const rw2 = ensureRow(baseRow + 1);
    putInRow(rw2, 3, "Tandan");

    let leaderTotalBunches = 0;
    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      const val = entry?.bunches;
      if (val !== null && val !== undefined && val !== "") {
        putInRow(rw2, dayCol(d), Number(val));
        leaderTotalBunches += Number(val) || 0;
      }
    }
    putInRow(rw2, 38, leaderTotalBunches);

    // --- Sub-row 3: Bil. Tandan (same as tandan) ---
    const rw3 = ensureRow(baseRow + 2);
    putInRow(rw3, 3, "Bil. Tandan");

    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      const val = entry?.bunches;
      if (val !== null && val !== undefined && val !== "") {
        putInRow(rw3, dayCol(d), Number(val));
      }
    }
    putInRow(rw3, 38, leaderTotalBunches);

    // --- Sub-row 4: ZON + Hasil(Tan) HI (tons/day, rounded) ---
    const rw4 = ensureRow(baseRow + 3);
    putInRow(rw4, 2, `(${zonLabel})`);
    putInRow(rw4, 3, "Hasil(Tan) HI");

    let leaderTotalTons = 0;
    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      const val = entry?.tons;
      if (entry && entry.work_status === "work" && val !== null && val !== undefined && val !== "") {
        const t = round2(Number(val));
        putInRow(rw4, dayCol(d), t);
        leaderTotalTons = round2(leaderTotalTons + t);
        grandTotalTons = round2(grandTotalTons + t);
        if (isCurrentMonth && d === today) todayTotalTons = round2(todayTotalTons + t);
      }
    }
    putInRow(rw4, 38, round2(leaderTotalTons));

    // --- Sub-row 5: Hasil(Tan) HHI (cumulative tons, rounded) ---
    const rw5 = ensureRow(baseRow + 4);
    putInRow(rw5, 3, "Hasil(Tan) HHI");

    let cumulativeTons = 0;
    for (let d = 1; d <= days; d++) {
      const entry = dayEntries[d];
      // Only accumulate on work days with tons
      if (entry && entry.work_status === "work" && entry.tons) {
        cumulativeTons = round2(cumulativeTons + Number(entry.tons));
      }
      // Always carry forward — write cumulative for every day once > 0
      if (cumulativeTons > 0) {
        putInRow(rw5, dayCol(d), round2(cumulativeTons));
      }
    }
    putInRow(rw5, 38, round2(cumulativeTons));
  });

  // ---------- SUMMARY ROWS (no blank row before them) ----------
  const summaryBase = leaderStartRow + leaders.length * 5;

  // Biji Relai (M/t) — Hari ini
  const sr1 = ensureRow(summaryBase);
  putInRow(sr1, 0, "Biji Relai (M/t)");
  putInRow(sr1, 3, "Hari ini");
  putInRow(sr1, 38, 0);

  // Biji Relai — Hingga Hari Ini
  const sr2 = ensureRow(summaryBase + 1);
  putInRow(sr2, 3, "Hingga Hari Ini");
  putInRow(sr2, 38, 0);

  // Jumlah Hasil (M/t) — Hari ini
  const sr3 = ensureRow(summaryBase + 2);
  putInRow(sr3, 0, "Jumlah Hasil (M/t)");
  putInRow(sr3, 3, "Hari ini");
  if (isCurrentMonth) {
    putInRow(sr3, dayCol(today), round2(todayTotalTons));
  }
  putInRow(sr3, 38, isCurrentMonth ? round2(todayTotalTons) : 0);

  // Jumlah Hasil — Hingga Hari Ini (progressive cumulative across all leaders)
  const sr4 = ensureRow(summaryBase + 3);
  putInRow(sr4, 3, "Hingga Hari Ini");
  let runningCumSum = 0;
  for (let d = 1; d <= days; d++) {
    for (const leader of leaders) {
      const entry = (entriesByLeader[leader.id] || {})[d];
      if (entry && entry.work_status === "work" && entry.tons) {
        runningCumSum = round2(runningCumSum + Number(entry.tons));
      }
    }
    if (runningCumSum > 0) {
      putInRow(sr4, dayCol(d), round2(runningCumSum));
    }
  }
  putInRow(sr4, 38, round2(grandTotalTons));

  // ---------- SIGNATURE ROWS ----------
  const sigBase = summaryBase + 5;
  putInRow(ensureRow(sigBase), 0, "T . T Penyelia");
  putInRow(ensureRow(sigBase + 2), 0, "T . T Field Controller (FC)");
  putInRow(ensureRow(sigBase + 4), 0, "T .T Pengurus");

  // ============================================================
  // CREATE WORKSHEET FROM AOA
  // ============================================================
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // ============================================================
  // COLUMN WIDTHS
  // ============================================================
  const colWidths: { wch: number }[] = [];
  colWidths.push({ wch: 5 });   // A: BIL
  colWidths.push({ wch: 16 });  // B: Peringkat / Blok
  colWidths.push({ wch: 8 });   // C: Zon
  colWidths.push({ wch: 16 });  // D: Labels
  for (let d = 1; d <= 31; d++) {
    colWidths.push({ wch: 4.5 }); // Day columns
  }
  colWidths.push({ wch: 7 });   // AJ: Pus 1
  colWidths.push({ wch: 7 });   // AK: Pus 2
  colWidths.push({ wch: 7 });   // AL: Pus 3
  colWidths.push({ wch: 10 });  // AM: Jumlah
  ws["!cols"] = colWidths;

  // ============================================================
  // MERGES
  // ============================================================
  const lastDataRowIdx = summaryBase + 3; // last summary row
  const lastRowIdx = sigBase + 4; // last signature row

  const merges: XLSX.Range[] = [
    // Title rows: merged A to AM
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols } },
    // Summary row A: Biji Relai merged A-C
    { s: { r: summaryBase, c: 0 }, e: { r: summaryBase, c: 2 } },
    // Summary row C: Jumlah Hasil merged A-C
    { s: { r: summaryBase + 2, c: 0 }, e: { r: summaryBase + 2, c: 2 } },
  ];
  ws["!merges"] = merges;

  // ============================================================
  // APPLY STYLES
  // ============================================================

  // Style title rows (0, 1, 2): merged, bold, centered
  for (let c = 0; c <= totalCols; c++) {
    const a0 = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[a0]) ws[a0].s = { border: thinBorder, font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };

    const a1 = XLSX.utils.encode_cell({ r: 1, c });
    if (ws[a1]) ws[a1].s = { border: thinBorder, font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } };

    const a2 = XLSX.utils.encode_cell({ r: 2, c });
    if (ws[a2]) ws[a2].s = { border: thinBorder, font: { bold: true }, alignment: { horizontal: "center" } };
  }

  // Style info rows (3, 4, 5)
  for (let r = 3; r <= 5; r++) {
    for (const c of [0, 7, 13]) { // A, H, N — label columns
      styleCell(ws, r, c, { bold: true, align: "left" });
    }
    for (const c of [2, 9, 15]) { // C, J, P — colon columns
      styleCell(ws, r, c, { align: "center" });
    }
    for (const c of [3, 10, 16]) { // D, K, Q — value columns
      styleCell(ws, r, c, { align: "left" });
    }
  }

  // Style header row (7): bold, green fill, centered, borders
  for (let c = 0; c <= totalCols; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIdx, c });
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = {
      border: thinBorder,
      font: { bold: true },
      fill: { fgColor: { rgb: "C6EFCE" } },
      alignment: { horizontal: "center" },
    };
  }

  // Style data rows + borders on ALL cells
  const lastDataIdx = leaderStartRow + leaders.length * 5 - 1;
  for (let r = leaderStartRow; r <= lastDataIdx; r++) {
    // BIL: center
    styleCell(ws, r, 0, { align: "center" });
    // Name: left
    styleCell(ws, r, 1, { align: "left" });
    // Zon: center
    styleCell(ws, r, 2, { align: "center" });
    // Label: left
    styleCell(ws, r, 3, { align: "left" });

    // Day columns
    for (let d = 1; d <= 31; d++) {
      const c = dayCol(d);
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };

      const subRow = (r - leaderStartRow) % 5;
      if (typeof ws[addr].v === "number") {
        if (subRow === 3 || subRow === 4) {
          // Hasil(Tan) HI or HHI — decimal
          ws[addr].s = { border: thinBorder, numFmt: "0.00", alignment: { horizontal: "center" } };
        } else {
          // Workers, bunches — integer
          ws[addr].s = { border: thinBorder, numFmt: "0", alignment: { horizontal: "center" } };
        }
      } else {
        ws[addr].s = { border: thinBorder, alignment: { horizontal: "center" } };
      }
    }

    // Pus + Jumlah columns: center, border
    for (let c = 35; c <= 38; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = { border: thinBorder, alignment: { horizontal: "center" } };
      if (typeof ws[addr].v === "number") {
        const subRow = (r - leaderStartRow) % 5;
        ws[addr].s.numFmt = (subRow === 3 || subRow === 4) ? "0.00" : "0";
      }
    }
  }

  // Apply borders + styles to summary rows
  for (let r = summaryBase; r <= summaryBase + 3; r++) {
    for (let c = 0; c <= totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = { border: thinBorder, alignment: { horizontal: "center" } };
    }
    // Labels bold left
    styleCell(ws, r, 0, { bold: true, align: "left" });
    styleCell(ws, r, 3, { bold: true, align: "left" });
    // Number format for tons
    for (let d = 1; d <= 31; d++) {
      const c = dayCol(d);
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].s = { border: thinBorder, numFmt: "0.00", alignment: { horizontal: "center" } };
      }
    }
    // AM column
    const amAddr = XLSX.utils.encode_cell({ r, c: 38 });
    if (ws[amAddr] && typeof ws[amAddr].v === "number") {
      ws[amAddr].s = { border: thinBorder, numFmt: "0.00", alignment: { horizontal: "center" } };
    }
  }

  // Apply borders to signature rows
  for (const sigRow of [sigBase, sigBase + 2, sigBase + 4]) {
    for (let c = 0; c <= totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: sigRow, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = { border: thinBorder };
    }
    styleCell(ws, sigRow, 0, { bold: true, align: "left" });
  }

  // ============================================================
  // WORKBOOK + DOWNLOAD
  // ============================================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Harvesting Monthly");

  const cleanRancangan = (rancanganName || "Plantation").replace(/[^a-zA-Z0-9]/g, "");
  const cleanBlock = (blockName || "Block01").replace(/[^a-zA-Z0-9]/g, "");
  const filename = `PalmInsight_Harvesting_${cleanRancangan}_${cleanBlock}_${monthName}_${year}.xlsx`;

  XLSX.writeFile(wb, filename);
}
