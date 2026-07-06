"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Download, Upload, Trash2, User, Mail, Lock, Sun, Moon, CheckCircle, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [importing, setImporting] = useState(false);

  // Account state
  const [displayName, setDisplayName] = useState(profile?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    setNameMessage(null);
    try {
      const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      if (metaError) throw metaError;
      const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: displayName.trim() });
      if (profileError) throw profileError;
      await fetchProfile();
      setNameMessage({ type: "success", text: "Name updated successfully." });
    } catch (err: any) {
      setNameMessage({ type: "error", text: err.message || "Failed to update name." });
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    const { data: plantations } = await supabase.from("plantations").select("*").eq("user_id", user.id);
    const { data: leaders } = await supabase.from("team_leaders").select("*").eq("user_id", user.id);
    const { data: entries } = await supabase.from("daily_entries").select("*").eq("user_id", user.id);
    const json = JSON.stringify({ plantations, team_leaders: leaders, daily_entries: entries }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palminsight-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const data = JSON.parse(text);
    if (user) {
      await supabase.from("plantations").delete().eq("user_id", user.id);
      await supabase.from("team_leaders").delete().eq("user_id", user.id);
      await supabase.from("daily_entries").delete().eq("user_id", user.id);

      if (data.plantations) await supabase.from("plantations").insert(data.plantations.map((p: any) => ({ ...p, user_id: user.id })));
      if (data.team_leaders) await supabase.from("team_leaders").insert(data.team_leaders.map((t: any) => ({ ...t, user_id: user.id })));
      if (data.daily_entries) await supabase.from("daily_entries").insert(data.daily_entries.map((e: any) => ({ ...e, user_id: user.id })));
    }
    setImporting(false);
    alert("Data restored successfully!");
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure? All data will be permanently deleted.")) return;
    if (!user) return;
    await supabase.from("plantations").delete().eq("user_id", user.id);
    await supabase.from("team_leaders").delete().eq("user_id", user.id);
    await supabase.from("daily_entries").delete().eq("user_id", user.id);
    alert("All data deleted.");
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader title="Settings" subtitle="Manage your account and data" />

        <div className="space-y-6">

          {/* ===== Account Section ===== */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-green)" }}>Account</h2>
            <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>

              {/* Display Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
                  <User className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Display Name</div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-sm text-white outline-none border"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !displayName.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "var(--accent-green)" }}
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
              {nameMessage && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: nameMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: nameMessage.type === "success" ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {nameMessage.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {nameMessage.text}
                </div>
              )}

              <div className="border-t" style={{ borderColor: "var(--border-default)" }} />

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                  <Mail className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Email</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{user?.email || "-"}</div>
                </div>
              </div>

              <div className="border-t" style={{ borderColor: "var(--border-default)" }} />

              {/* Change Password */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
                    <Lock className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Change Password</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Update your password</div>
                  </div>
                </div>
                <div className="space-y-3 ml-13">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none border placeholder:opacity-40"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none border placeholder:opacity-40"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "var(--accent-amber)" }}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
                {passwordMessage && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mt-3" style={{ backgroundColor: passwordMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: passwordMessage.type === "success" ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {passwordMessage.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {passwordMessage.text}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== Appearance Section ===== */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-green)" }}>Appearance</h2>
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.15)" }}>
                    {theme === "dark" ? <Sun className="w-5 h-5" style={{ color: "var(--accent-purple)" }} /> : <Moon className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Theme</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{theme === "dark" ? "Dark mode" : "Light mode"}</div>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="relative w-12 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: theme === "dark" ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)" }}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                    style={{ transform: theme === "light" ? "translateX(24px)" : "translateX(0)" }}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* ===== Data Management Section ===== */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-green)" }}>Data Management</h2>
            <div className="space-y-3">
              <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                      <Download className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Export Data</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Download all data as JSON</div>
                    </div>
                  </div>
                  <button onClick={handleExport} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "rgba(59,130,246,0.2)", color: "var(--accent-blue)" }}>
                    Download
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-green-light)" }}>
                    <Upload className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Restore Data</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{importing ? "Restoring..." : "Import from JSON backup"}</div>
                  </div>
                  <label className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "var(--accent-green)" }}>
                    Choose File
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent-red-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                      <Trash2 className="w-5 h-5" style={{ color: "var(--accent-red)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Danger Zone</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Permanently delete all data</div>
                    </div>
                  </div>
                  <button onClick={handleDeleteAll} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)" }}>
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
