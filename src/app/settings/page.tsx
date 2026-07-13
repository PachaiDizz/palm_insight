"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Download, Upload, Trash2, User, Mail, Lock, Sun, Moon, CheckCircle, AlertTriangle, Bell, BellOff, FileSpreadsheet, Globe } from "lucide-react";
import { getNotificationPrefs, saveNotificationPrefs } from "@/components/notifications/notificationHelpers";
import type { NotificationPrefs } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import { getAllUserPlantations } from "@/lib/onboarding";
import { Plantation } from "@/types";
import ExportHarvestingModal from "@/components/ExportHarvestingModal";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
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

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getNotificationPrefs());
  const [pushPermission, setPushPermission] = useState(() => {
    if ("Notification" in window) return Notification.permission;
    return "denied";
  });

  // Plantations for export modal
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load plantations on mount
  useEffect(() => {
    if (user) {
      getAllUserPlantations(user.id).then(setPlantations);
    }
  }, [user]);

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

  const toggleNotifPref = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
  };

  const requestPushPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        toggleNotifPref("browserPush");
        new Notification("PalmInsight", {
          body: "You will now receive harvest reminders and alerts.",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
        });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <PageHeader title="Settings" subtitle="Manage your account and data" />

        <div className="space-y-6">

          {/* ===== Account Section ===== */}
          <section>
            <h2 className="card-title text-sm uppercase tracking-wider mb-3" style={{ color: "var(--accent-primary)" }}>{t("settings.account")}</h2>
            <div className="card-glow rounded-2xl p-4 sm:p-5 space-y-4" style={{ backgroundColor: "var(--bg-card)" }}>

              {/* Display Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-subtle)" }}>
                    <User className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="text-sm font-medium text-theme sm:hidden">Display Name</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme hidden sm:block">Display Name</div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full mt-1 sm:mt-1 px-3 py-2 rounded-xl text-sm text-theme outline-none border"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !displayName.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-theme disabled:opacity-50 min-h-[40px] shrink-0"
                  style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
              {nameMessage && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: nameMessage.type === "success" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: nameMessage.type === "success" ? "var(--accent-primary)" : "var(--accent-red)" }}>
                  {nameMessage.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {nameMessage.text}
                </div>
              )}

              <div className="border-t" style={{ borderColor: "var(--border-default)" }} />

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                  <Mail className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-theme">Email</div>
                  <div className="text-sm mt-1 truncate" style={{ color: "var(--text-muted)" }}>{user?.email || "-"}</div>
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
                    <div className="text-sm font-medium text-theme">Change Password</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Update your password</div>
                  </div>
                </div>
                <div className="space-y-3 sm:ml-13">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border placeholder:opacity-40"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-theme outline-none border placeholder:opacity-40"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                  />
                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-theme disabled:opacity-50 min-h-[40px]"
                    style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "var(--accent-amber)" }}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
                {passwordMessage && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mt-3" style={{ backgroundColor: passwordMessage.type === "success" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: passwordMessage.type === "success" ? "var(--accent-primary)" : "var(--accent-red)" }}>
                    {passwordMessage.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {passwordMessage.text}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== Notifications Section ===== */}
          <section>
            <h2 className="card-title text-sm uppercase tracking-wider mb-3" style={{ color: "var(--accent-primary)" }}>{t("settings.notifications")}</h2>
            <div className="card-glow rounded-2xl p-4 sm:p-5 space-y-0" style={{ backgroundColor: "var(--bg-card)" }}>
              {([
                { key: "dailyReminder" as const, label: "Daily Harvest Reminder", desc: "Remind me when no entries are logged by 10AM" },
                { key: "lowProductivity" as const, label: "Low Productivity Alerts", desc: "Alert when a leader's output drops significantly" },
                { key: "checkinReminder" as const, label: "Check-in Reminders", desc: "Remind me if a leader hasn't logged in 3+ days" },
              ]).map((item, i) => (
                <div key={item.key}>
                  {i > 0 && <div className="border-t my-3" style={{ borderColor: "var(--border-default)" }} />}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-theme">{item.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleNotifPref(item.key)}
                      className="relative w-12 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: notifPrefs[item.key] ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)" }}
                      aria-label={`Toggle ${item.label}`}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                        style={{ transform: notifPrefs[item.key] ? "translateX(24px)" : "translateX(0)" }}
                      />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t my-3" style={{ borderColor: "var(--border-default)" }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
                    {notifPrefs.browserPush ? <Bell className="w-5 h-5" style={{ color: "var(--accent-primary)" }} /> : <BellOff className="w-5 h-5" style={{ color: "var(--text-muted)" }} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-theme">Browser Push Notifications</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {pushPermission === "granted" ? "Enabled" : pushPermission === "denied" ? "Blocked by browser" : "Receive alerts even when the app is not open"}
                    </div>
                  </div>
                </div>
                {pushPermission === "granted" ? (
                  <button
                    onClick={() => toggleNotifPref("browserPush")}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ backgroundColor: notifPrefs.browserPush ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)" }}
                    aria-label="Toggle browser push notifications"
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                      style={{ transform: notifPrefs.browserPush ? "translateX(24px)" : "translateX(0)" }}
                    />
                  </button>
                ) : pushPermission === "default" ? (
                  <button
                    onClick={requestPushPermission}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
                  >
                    Enable Push Notifications
                  </button>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Blocked</span>
                )}
              </div>
            </div>
          </section>

          {/* ===== Appearance Section ===== */}
          <section>
            <h2 className="card-title text-sm uppercase tracking-wider mb-3" style={{ color: "var(--accent-primary)" }}>{t("settings.appearance")}</h2>
            <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(139,92,246,0.15)" }}>
                    {theme === "dark" ? <Sun className="w-5 h-5" style={{ color: "var(--accent-purple)" }} /> : <Moon className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-theme">{t("settings.theme")}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}</div>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="relative w-12 h-6 rounded-full transition-colors shrink-0"
                  style={{ backgroundColor: theme === "dark" ? "rgba(245,158,11,0.3)" : "rgba(139,92,246,0.3)" }}
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

          {/* ===== Language Section ===== */}
          <section>
            <h2 className="card-title text-sm uppercase tracking-wider mb-3" style={{ color: "var(--accent-primary)" }}>{t("settings.language")}</h2>
            <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                    <Globe className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-theme">{t("settings.language")}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{locale === "en" ? "English" : "Bahasa Melayu"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-base)" }}>
                  <button
                    onClick={() => setLocale("en")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: locale === "en" ? "var(--accent-primary)" : "transparent",
                      color: locale === "en" ? "var(--text-on-accent)" : "var(--text-muted)",
                    }}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLocale("ms")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: locale === "ms" ? "var(--accent-primary)" : "transparent",
                      color: locale === "ms" ? "var(--text-on-accent)" : "var(--text-muted)",
                    }}
                  >
                    MS
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ===== Data Management Section ===== */}
          <section>
            <h2 className="card-title text-sm uppercase tracking-wider mb-3" style={{ color: "var(--accent-primary)" }}>{t("settings.dataManagement")}</h2>
            <div className="space-y-3">
              <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                      <Download className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-theme">Export Data</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Download all data as JSON</div>
                    </div>
                  </div>
                  <button onClick={handleExport} className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-theme shrink-0 min-h-[40px]" style={{ backgroundColor: "rgba(59,130,246,0.2)", color: "var(--accent-blue)" }}>
                    Download
                  </button>
                </div>
              </div>

              <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-subtle)" }}>
                      <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-theme">Export Harvesting Monthly</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Generate Excel report in harvesting format</div>
                    </div>
                  </div>
                  <button onClick={() => setShowExportModal(true)} className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-theme shrink-0 min-h-[40px]" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>
                    Export
                  </button>
                </div>
              </div>

              <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-subtle)" }}>
                    <Upload className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-theme">Restore Data</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{importing ? "Restoring..." : "Import from JSON backup"}</div>
                  </div>
                  <label className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shrink-0 min-h-[40px] flex items-center" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>
                    Choose File
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent-red-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                      <Trash2 className="w-5 h-5" style={{ color: "var(--accent-red)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-theme">Danger Zone</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Permanently delete all data</div>
                    </div>
                  </div>
                  <button onClick={handleDeleteAll} className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium shrink-0 min-h-[40px]" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)" }}>
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>

        <ExportHarvestingModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          plantations={plantations}
          userId={user?.id || ""}
        />
      </div>
    </DashboardLayout>
  );
}
