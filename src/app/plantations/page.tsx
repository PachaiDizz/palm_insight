"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Edit, Trash2, Sprout, Users, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Plantation } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Toast, { ToastData } from "@/components/ui/Toast";
import { plantationSchema } from "@/lib/schemas";

interface LeaderDraft {
  id: string;
  name: string;
  phone: string;
}

export default function PlantationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plantation | null>(null);
  const [formData, setFormData] = useState({ rancangan: "", peringkat: "", block: "", ketua_block: "", biro_ladang: "", penyelia: "", mandor: "", area_hectare: "" });
  const [leaders, setLeaders] = useState<LeaderDraft[]>([]);
  const [newLeaderName, setNewLeaderName] = useState("");
  const [newLeaderPhone, setNewLeaderPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [leaderCounts, setLeaderCounts] = useState<Record<string, number>>({});
  const [lastEntries, setLastEntries] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const all = await getAllUserPlantations(user.id);
    const sorted = all.sort((a: Plantation, b: Plantation) => (parseInt(a.block) || 0) - (parseInt(b.block) || 0));
    setPlantations(sorted);

    // Fetch team leader counts
    const { data: tlData } = await supabase.from("team_leaders").select("plantation_id").eq("user_id", user.id);
    const counts: Record<string, number> = {};
    (tlData || []).forEach((tl: any) => {
      counts[tl.plantation_id] = (counts[tl.plantation_id] || 0) + 1;
    });
    setLeaderCounts(counts);

    // Fetch last entry date per plantation
    const { data: entryData } = await supabase.from("daily_entries").select("plantation_id, date").eq("user_id", user.id).order("date", { ascending: false });
    const lastMap: Record<string, string | null> = {};
    (entryData || []).forEach((e: any) => {
      if (e.plantation_id && !lastMap[e.plantation_id]) {
        lastMap[e.plantation_id] = e.date;
      }
    });
    setLastEntries(lastMap);
  }

  const resetForm = () => {
    setFormData({ rancangan: "", peringkat: "", block: "", ketua_block: "", biro_ladang: "", penyelia: "", mandor: "", area_hectare: "" });
    setLeaders([]);
    setNewLeaderName("");
    setNewLeaderPhone("");
    setFieldErrors({});
  };

  const addLeader = () => {
    if (!newLeaderName.trim()) return;
    setLeaders([...leaders, { id: crypto.randomUUID(), name: newLeaderName.trim(), phone: newLeaderPhone.trim() }]);
    setNewLeaderName("");
    setNewLeaderPhone("");
  };

  const removeLeader = (id: string) => {
    setLeaders(leaders.filter((l) => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!editing && leaders.length === 0) {
      setToast({ type: "error", message: "Add at least 1 team leader before saving." });
      return;
    }
    setSaving(true);
    setToast(null);
    setFieldErrors({});

    const result = plantationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase.from("plantations").update({
          rancangan: formData.rancangan,
          peringkat: formData.peringkat,
          block: formData.block,
          ketua_block: formData.ketua_block,
          biro_ladang: formData.biro_ladang,
          penyelia: formData.penyelia,
          mandor: formData.mandor,
          area_hectare: parseFloat(formData.area_hectare) || 0,
        }).eq("id", editing.id);
        if (error) throw error;
        setToast({ type: "success", message: "Plantation updated!" });
      } else {
        const { data: newPlantation, error: insertError } = await supabase
          .from("plantations")
          .insert({
            user_id: user.id,
            rancangan: formData.rancangan,
            peringkat: formData.peringkat,
            block: formData.block,
            ketua_block: formData.ketua_block,
            biro_ladang: formData.biro_ladang,
            penyelia: formData.penyelia,
            mandor: formData.mandor,
            area_hectare: parseFloat(formData.area_hectare) || 0,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        if (leaders.length > 0) {
          const { error: leadersError } = await supabase.from("team_leaders").insert(
            leaders.map((l) => ({
              user_id: user.id,
              plantation_id: newPlantation.id,
              name: l.name,
              phone: l.phone || null,
            }))
          );
          if (leadersError) throw leadersError;
        }
        setToast({ type: "success", message: `Plantation created with ${leaders.length} team leader${leaders.length !== 1 ? "s" : ""}!` });
      }

      setShowModal(false);
      resetForm();
      setEditing(null);
      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plantation and all its team leaders?")) return;
    await supabase.from("team_leaders").delete().eq("plantation_id", id);
    await supabase.from("plantations").delete().eq("id", id);
    await loadData();
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader
          title="Plantations"
          subtitle={`${plantations.length} plantation${plantations.length !== 1 ? "s" : ""}`}
          action={
            <button
              onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(to right, #10b981, #16a34a)" }}
            >
              <Plus className="w-4 h-4" /> Add Plantation
            </button>
          }
        />

        {plantations.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
            <Sprout className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No plantations yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
              {plantations.map((p: Plantation) => (
              <div key={p.id} className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Basic Information</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Rancangan</div>
                          <div className="text-sm font-medium text-white">{p.rancangan || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Peringkat</div>
                          <div className="text-sm font-medium text-white">{p.peringkat || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Block</div>
                          <div className="text-sm font-medium text-white">{p.block || "-"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Management Details</div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Ketua Block</div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.ketua_block || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Biro Ladang</div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.biro_ladang || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Penyelia</div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.penyelia || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Mandor</div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.mandor || "-"}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Area Information</div>
                      <div className="text-sm font-medium text-white">{p.area_hectare ? `${p.area_hectare} ha` : "-"}</div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
                        <Users className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--accent-blue)" }}>{leaderCounts[p.id] || 0} Team Leader{leaderCounts[p.id] !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {lastEntries[p.id] ? `Last entry: ${lastEntries[p.id]}` : "No entries yet"}
                      </div>
                      <Link
                        href={`/team?block=${p.id}`}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.03]"
                        style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "var(--accent-green)" }}
                      >
                        Go to Teams →
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => { setEditing(p); setFormData({ rancangan: p.rancangan || "", peringkat: p.peringkat || "", block: p.block || "", ketua_block: p.ketua_block || "", biro_ladang: p.biro_ladang || "", penyelia: p.penyelia || "", mandor: p.mandor || "", area_hectare: p.area_hectare?.toString() || "" }); setShowModal(true); }} className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-red)" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="rounded-2xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
              <h2 className="text-xl font-bold text-white mb-5">{editing ? "Edit" : "Add"} Plantation</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Basic Information</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input placeholder="Rancangan" className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: fieldErrors.rancangan ? "#f87171" : "rgba(6,78,59,0.3)" }} value={formData.rancangan} onChange={(e) => { setFormData({ ...formData, rancangan: e.target.value }); if (fieldErrors.rancangan) setFieldErrors((p) => ({ ...p, rancangan: "" })); }} />
                      {fieldErrors.rancangan && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.rancangan}</p>}
                    </div>
                    <div>
                      <input type="number" min="0" placeholder="Peringkat" className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: fieldErrors.peringkat ? "#f87171" : "rgba(6,78,59,0.3)" }} value={formData.peringkat} onChange={(e) => { setFormData({ ...formData, peringkat: e.target.value }); if (fieldErrors.peringkat) setFieldErrors((p) => ({ ...p, peringkat: "" })); }} />
                      {fieldErrors.peringkat && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.peringkat}</p>}
                    </div>
                    <div>
                      <input type="number" min="0" placeholder="Block" className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: fieldErrors.block ? "#f87171" : "rgba(6,78,59,0.3)" }} value={formData.block} onChange={(e) => { setFormData({ ...formData, block: e.target.value }); if (fieldErrors.block) setFieldErrors((p) => ({ ...p, block: "" })); }} />
                      {fieldErrors.block && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.block}</p>}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Management Details</div>
                  <div className="grid grid-cols-2 gap-3">
                    {["ketua_block", "biro_ladang", "penyelia", "mandor"].map((field) => (
                      <div key={field}>
                        <input placeholder={field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: fieldErrors[field] ? "#f87171" : "rgba(6,78,59,0.3)" }} value={formData[field as keyof typeof formData]} onChange={(e) => { setFormData({ ...formData, [field]: e.target.value }); if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: "" })); }} />
                        {fieldErrors[field] && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors[field]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Area Information</div>
                  <input type="number" step="0.01" min="0" placeholder="Area (hectare)" className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: fieldErrors.area_hectare ? "#f87171" : "rgba(6,78,59,0.3)" }} value={formData.area_hectare} onChange={(e) => { setFormData({ ...formData, area_hectare: e.target.value }); if (fieldErrors.area_hectare) setFieldErrors((p) => ({ ...p, area_hectare: "" })); }} />
                  {fieldErrors.area_hectare && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.area_hectare}</p>}
                </div>

                {/* Team Leaders Section */}
                {!editing && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(16,185,129,0.7)" }}>Team Leaders</div>
                    {leaders.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {leaders.map((l) => (
                          <div key={l.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
                            <div>
                              <span className="text-sm text-white">{l.name}</span>
                              {l.phone && <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{l.phone}</span>}
                            </div>
                            <button type="button" onClick={() => removeLeader(l.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "var(--accent-red)" }}>
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input placeholder="Leader name" className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} value={newLeaderName} onChange={(e) => setNewLeaderName(e.target.value)} />
                      <input placeholder="Phone (optional)" className="w-36 px-4 py-2.5 rounded-xl text-sm text-white outline-none border placeholder:opacity-40" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} value={newLeaderPhone} onChange={(e) => setNewLeaderPhone(e.target.value)} />
                      <button type="button" onClick={addLeader} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "var(--accent-green)" }}>Add</button>
                    </div>
                    {leaders.length === 0 && <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>At least 1 team leader is required.</p>}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setToast(null); }} className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--text-muted)" }}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(to right, #10b981, #16a34a)" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? "Saving..." : editing ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} position="bottom-right" />
      </div>
    </DashboardLayout>
  );
}
