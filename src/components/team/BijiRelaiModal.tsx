"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Save, X, CheckCircle, Calendar, Truck, Loader2, Edit2, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Plantation, BijiRelai } from "@/types";

interface BijiRelaiModalProps {
  open: boolean;
  onClose: () => void;
  plantation: Plantation;
  entries: BijiRelai[];
  date: string;
  tons: string;
  saving: boolean;
  savedId: string | null;
  onDateChange: (date: string) => void;
  onTonsChange: (tons: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewEntry: () => void;
  onEdit: (entry: BijiRelai) => void;
  onDelete: (id: string) => void;
}

export default function BijiRelaiModal({
  open,
  onClose,
  plantation,
  entries,
  date,
  tons,
  saving,
  savedId,
  onDateChange,
  onTonsChange,
  onSubmit,
  onNewEntry,
  onEdit,
  onDelete,
}: BijiRelaiModalProps) {
  const [editingEntry, setEditingEntry] = useState<BijiRelai | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTons, setEditTons] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const totalTons = sorted.reduce((sum, e) => sum + (Number(e.tons) || 0), 0);

  const handleStartEdit = (entry: BijiRelai) => {
    setEditingEntry(entry);
    setEditDate(entry.date);
    setEditTons(String(entry.tons ?? ""));
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditDate("");
    setEditTons("");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setEditSaving(true);
    // Delegate to parent's onEdit by temporarily swapping
    onEdit({ ...editingEntry, date: editDate, tons: editTons ? parseFloat(editTons) : null });
    setEditingEntry(null);
    setEditSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.12)" }}>
            <Truck className="w-5 h-5" style={{ color: "#22c55e" }} />
          </div>
          <div>
            <h2 className="section-heading text-base text-theme">Biji Relai</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Block {plantation.block} — Seed Tonnage</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border transition-colors"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              <Truck className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
              Tons (Biji Relai)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border transition-colors"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
              value={tons}
              onChange={(e) => onTonsChange(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Palm seed tonnage collected per block</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          {savedId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onNewEntry}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              New Entry
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="relative flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Entry"}
          </motion.button>
        </div>
      </form>

      {/* History */}
      {sorted.length > 0 && (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" style={{ color: "#22c55e" }} />
              <h3 className="text-sm font-semibold text-theme">Biji Relai History</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sorted.length} entries</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{totalTons.toFixed(2)} ton</span>
            </div>
          </div>

          <div className="rounded-xl border bg-[var(--bg-elevated)]/50">
            {/* Desktop table */}
            <table className="w-full border-collapse hidden md:table">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>#</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Date</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tons</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cumulative</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cum = 0;
                  // Display oldest first for cumulative to make sense
                  const oldestFirst = [...sorted].reverse();
                  return oldestFirst.map((e, idx) => {
                    cum += Number(e.tons) || 0;
                    const isEditing = editingEntry?.id === e.id;
                    return (
                      <tr key={e.id} style={{ borderBottom: idx === oldestFirst.length - 1 ? "none" : "1px solid rgba(245,158,11,0.08)" }}>
                        <td className="px-3 py-2.5 text-sm text-center" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                        <td className="px-3 py-2.5 text-sm text-theme font-medium whitespace-nowrap">
                          {isEditing ? (
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                              className="px-2 py-1 rounded-lg text-xs outline-none border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
                          ) : (
                            e.date ? e.date.split("-").reverse().join("/") : "-"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right font-semibold" style={{ color: "#22c55e" }}>
                          {isEditing ? (
                            <input type="text" inputMode="decimal" value={editTons} onChange={(e) => setEditTons(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg text-xs text-right outline-none border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} placeholder="0.00" />
                          ) : (
                            Number(e.tons || 0).toFixed(2)
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{cum.toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={handleSaveEdit} disabled={editSaving}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "#22c55e" }} title="Save">
                                  {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={handleCancelEdit}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--text-muted)" }} title="Cancel">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleStartEdit(e)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-blue)" }} title="Edit">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(e.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-red)" }} title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "rgba(245,158,11,0.08)" }}>
              {(() => {
                let cum = 0;
                const oldestFirst = [...sorted].reverse();
                return oldestFirst.map((e) => {
                  cum += Number(e.tons) || 0;
                  const isEditing = editingEntry?.id === e.id;
                  return (
                    <div key={e.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-theme">
                          {isEditing ? (
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                              className="px-2 py-1 rounded-lg text-xs outline-none border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
                          ) : (
                            e.date ? e.date.split("-").reverse().join("/") : "-"
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <input type="text" inputMode="decimal" value={editTons} onChange={(e) => setEditTons(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg text-xs text-right font-bold outline-none border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)", color: "#22c55e" }} placeholder="0.00" />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{Number(e.tons || 0).toFixed(2)} ton</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Cum: {cum.toFixed(2)} ton</span>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={handleSaveEdit} disabled={editSaving} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "#22c55e" }}>
                                {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={handleCancelEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleStartEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-blue)" }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onDelete(e.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-red)" }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
