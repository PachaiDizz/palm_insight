"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

interface ImportRow {
  date: string;
  leaderName: string;
  block: string;
  status: string;
  workers: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
}

interface ImportDataModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  leaders: { id: string; name: string; plantation_id: string }[];
  plantations: { id: string; block: string }[];
}

const MAX_STRING_LENGTH = 500;
const MAX_NOTES_LENGTH = 1000;

function sanitizeString(value: string, maxLength: number = MAX_STRING_LENGTH): string {
  // Remove control characters, trim, and limit length
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 7) continue;

    const date = sanitizeString(cols[0] || "");
    const leaderName = sanitizeString(cols[1] || "");
    const block = sanitizeString(cols[2] || "");
    const status = sanitizeString(cols[3] || "work").toLowerCase();
    const workers = sanitizeString(cols[4] || "");
    const bunches = sanitizeString(cols[5] || "");
    const tons = sanitizeString(cols[6] || "");
    const backlogs = sanitizeString(cols[7] || "");
    const notes = sanitizeString(cols[8] || "", MAX_NOTES_LENGTH);

    // Validate required fields
    if (!date || !leaderName || !block) continue;
    if (!isValidDate(date)) continue;

    // Validate numeric fields (allow empty, but reject non-numeric)
    const numericPattern = /^-?\d*\.?\d*$/;
    if (workers && !numericPattern.test(workers)) continue;
    if (bunches && !numericPattern.test(bunches)) continue;
    if (tons && !numericPattern.test(tons)) continue;
    if (backlogs && !numericPattern.test(backlogs)) continue;

    // Validate status
    const validStatus = status.includes("work") && !status.includes("no") ? "work" : "no_work";

    rows.push({
      date,
      leaderName,
      block,
      status: validStatus,
      workers,
      bunches,
      tons,
      backlogs,
      notes,
    });
  }
  return rows;
}

export default function ImportDataModal({
  open,
  onClose,
  onImported,
  leaders,
  plantations,
}: ImportDataModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
  const [error, setError] = useState("");

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError("No valid data rows found. Check the CSV format.");
        return;
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const matchLeader = (row: ImportRow) =>
    leaders.find((l) => l.name.toLowerCase() === row.leaderName.toLowerCase());

  const matchBlock = (row: ImportRow) =>
    plantations.find((p) => p.block === row.block);

  const handleImport = async () => {
    if (!user || parsedRows.length === 0) return;
    setImporting(true);
    setError("");

    let imported = 0;
    let skipped = 0;

    for (const row of parsedRows) {
      const leader = matchLeader(row);
      const block = matchBlock(row);
      if (!leader || !block) {
        skipped++;
        continue;
      }

      const entryData = {
        user_id: user.id,
        team_leader_id: leader.id,
        plantation_id: block.id,
        date: row.date,
        work_status: row.status.toLowerCase().includes("work") && !row.status.toLowerCase().includes("no") ? "work" : "no_work",
        num_workers: row.status.toLowerCase().includes("no") ? null : parseInt(row.workers) || null,
        lot: null,
        bunches: row.status.toLowerCase().includes("no") ? null : parseInt(row.bunches) || null,
        tons: parseFloat(row.tons) || 0,
        backlogs: row.status.toLowerCase().includes("no") ? null : parseInt(row.backlogs) || null,
        notes: row.notes || null,
      };

      const { error: insertError } = await supabase.from("daily_entries").insert(entryData);
      if (!insertError) imported++;
    }

    setResult({ success: true, count: imported });
    setImporting(false);
    if (imported > 0) onImported();
  };

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setResult(null);
    setError("");
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t("import.title")} size="lg">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("import.description")}
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-[var(--accent-primary)]"
          style={{ borderColor: "var(--border-default)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("import.dragDrop")}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
            {t("import.format")}
          </p>
        </div>

        {/* File info */}
        {fileName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--accent-subtle)" }}>
            <FileSpreadsheet className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm text-theme">{fileName}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ({parsedRows.length} rows)
            </span>
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && !result && (
          <div className="max-h-60 overflow-auto rounded-xl border" style={{ borderColor: "var(--border-default)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["Date", "Leader", "Block", "Status", "Workers", "Bunches", "Tons"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 10).map((row, i) => {
                  const matchedLeader = matchLeader(row);
                  const matchedBlock = matchBlock(row);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(245,158,11,0.06)" }}>
                      <td className="px-3 py-1.5">{row.date}</td>
                      <td className="px-3 py-1.5" style={{ color: matchedLeader ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {row.leaderName} {!matchedLeader && "(?)"}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: matchedBlock ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {row.block} {!matchedBlock && "(?)"}
                      </td>
                      <td className="px-3 py-1.5">{row.status}</td>
                      <td className="px-3 py-1.5">{row.workers}</td>
                      <td className="px-3 py-1.5">{row.bunches}</td>
                      <td className="px-3 py-1.5">{row.tons}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {parsedRows.length > 10 && (
              <div className="px-3 py-2 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                ...and {parsedRows.length - 10} more rows
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--accent-green)" }}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {t("import.success", { count: result.count })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {t("import.cancel")}
          </button>
          {parsedRows.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-theme disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #d97706, #f59e0b)" }}
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? t("import.importing") : t("import.import", { count: parsedRows.length })}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
