"use client";
import { useState, useEffect, useMemo } from "react";
import { X, FileSpreadsheet, Loader2 } from "lucide-react";
import { Plantation } from "@/types";
import { exportHarvestingMonthly } from "@/lib/exportHarvestingMonthly";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  open: boolean;
  onClose: () => void;
  plantations: Plantation[];
  userId: string;
}

export default function ExportHarvestingModal({ open, onClose, plantations, userId }: Props) {
  const now = new Date();

  // Separate parent rancangan plantations from block-level plantations
  // Parent: records where block is empty/null (rancangan-level entries)
  // If no parent found, treat all records as blocks (flat structure)
  const parentPlantations = useMemo(
    () => plantations.filter((p) => !p.block || p.block.trim() === ""),
    [plantations]
  );

  const hasParentStructure = parentPlantations.length > 0;

  // All plantations that have a block value are block-level entries
  const allBlocks = useMemo(
    () => plantations.filter((p) => p.block && p.block.trim() !== ""),
    [plantations]
  );

  const [plantationId, setPlantationId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [filteredBlocks, setFilteredBlocks] = useState<Plantation[]>([]);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Initialize default selections
  useEffect(() => {
    if (hasParentStructure && parentPlantations.length > 0) {
      setPlantationId(parentPlantations[0].id);
    } else if (plantations.length > 0) {
      // Flat structure: all plantations are blocks, use first as both
      setPlantationId(plantations[0].id);
      setBlockId(plantations[0].id);
    }
  }, [plantations, hasParentStructure, parentPlantations]);

  // Filter blocks when plantation changes
  useEffect(() => {
    if (!plantationId) {
      setFilteredBlocks([]);
      return;
    }

    if (hasParentStructure) {
      // Find blocks that belong to the selected parent rancangan
      const selectedParent = parentPlantations.find((p) => p.id === plantationId);
      if (selectedParent) {
        const matchingBlocks = allBlocks.filter(
          (b) => b.rancangan === selectedParent.rancangan
        );
        setFilteredBlocks(matchingBlocks.length > 0 ? matchingBlocks : allBlocks);
        if (matchingBlocks.length > 0 && !blockId) {
          setBlockId(matchingBlocks[0].id);
        }
      }
    } else {
      // Flat structure: show all plantations as blocks
      setFilteredBlocks(plantations);
      if (!blockId && plantations.length > 0) {
        setBlockId(plantations[0].id);
      }
    }
  }, [plantationId, hasParentStructure, parentPlantations, allBlocks, plantations]);

  if (!open) return null;

  const canExport = plantationId && blockId;

  const handleExport = async () => {
    if (!blockId) {
      setError("Please select a block");
      return;
    }
    setExporting(true);
    setError("");
    try {
      // Always pass the block's own ID as plantationId so the export can resolve data
      await exportHarvestingMonthly({
        userId,
        plantationId: blockId,
        blockId,
        month,
        year,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Export Harvesting Monthly">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-theme">Export Harvesting Monthly</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generate Excel report</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Plantation (only shown when parent structure exists) */}
          {hasParentStructure && (
            <div>
              <label htmlFor="export-plantation" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Plantation</label>
              <select
                id="export-plantation"
                value={plantationId}
                onChange={(e) => {
                  setPlantationId(e.target.value);
                  setBlockId("");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              >
                {parentPlantations.map((p) => (
                  <option key={p.id} value={p.id}>{p.rancangan}</option>
                ))}
              </select>
            </div>
          )}

          {/* Block */}
          <div>
            <label htmlFor="export-block" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Block</label>
            <select
              id="export-block"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              disabled={!plantationId || filteredBlocks.length === 0}
            >
              {filteredBlocks.length === 0 ? (
                <option value="">No blocks available</option>
              ) : (
                filteredBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.block ? `Block ${b.block}` : b.rancangan}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="export-month" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Month</label>
              <select
                id="export-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="export-year" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Year</label>
              <select
                id="export-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border-default)" }}>
          <button
            onClick={onClose}
            aria-label="Cancel export"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !canExport}
            aria-label="Export harvesting data"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-theme disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(to right, #d97706, #f59e0b)" }}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
