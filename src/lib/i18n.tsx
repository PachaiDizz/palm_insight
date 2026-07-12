"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Locale = "en" | "ms";

const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.plantations": "Plantations",
    "nav.teams": "Teams",
    "nav.entries": "Entries",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Greetings
    "greeting.morning": "Good Morning",
    "greeting.afternoon": "Good Afternoon",
    "greeting.evening": "Good Evening",

    // Auth
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.name": "Full Name",
    "auth.forgotPassword": "Forgot password?",
    "auth.resetPassword": "Reset Password",
    "auth.resetSent": "Check your email for a password reset link.",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.registerSuccess": "Check your email to confirm your account.",
    "auth.confirmed": "Email confirmed! You can now sign in.",
    "auth.signInWith": "Sign in with",
    "auth.orContinueWith": "Or continue with",
    "auth.rememberMe": "Remember me",
    "auth.passwordMismatch": "Passwords do not match",

    // Dashboard
    "dashboard.monthlyOverview": "Monthly Overview",
    "dashboard.recentEntries": "Recent Entries",
    "dashboard.todaysPulse": "Today's Pulse",
    "dashboard.bunchesToday": "Bunches Today",
    "dashboard.tonsToday": "Tons Today",
    "dashboard.activeTeams": "Active Teams",

    // Team page
    "team.title": "Team Management",
    "team.selectBlock": "Select a block to manage team leaders.",
    "team.addLeader": "Add Leader",
    "team.addLeaderTitle": "Add Team Leader",
    "team.name": "Name",
    "team.phone": "Phone (optional)",
    "team.cancel": "Cancel",
    "team.add": "Add",
    "team.saving": "Saving...",
    "team.noPlantations": "No plantations set. Complete onboarding first.",
    "team.selectBlockLabel": "Select Block",
    "team.leaders": "leaders",
    "team.leader": "leader",
    "team.lastEntry": "Last entry:",
    "team.noEntries": "No entries yet",
    "team.noLeaders": "No team leaders for this block yet.",
    "team.addFirstLeader": "Add First Leader",
    "team.workersToday": "Workers today:",
    "team.backToBlocks": "Back to all blocks",
    "team.addEntry": "Add Entry",
    "team.viewDetails": "View Details",
    "team.bijiRelai": "Biji Relai",
    "team.totalWorkers": "Total Workers",
    "team.additional": "Additional",
    "team.totalLots": "Total Lots",
    "team.looseFruit": "Loose Fruit",
    "team.removeLeader": "Remove",
    "team.newEntry": "New Entry",
    "team.saved": "Saved",
    "team.closeEntryForm": "Close entry form",

    // Entry form
    "entry.workDay": "Work Day",
    "entry.noWork": "No Work",
    "entry.date": "Date",
    "entry.workers": "Workers",
    "entry.lot": "Lot",
    "entry.bunches": "Bunches",
    "entry.tons": "Tons",
    "entry.backlogs": "Backlogs",
    "entry.notes": "Notes",
    "entry.notesPlaceholder": "Any additional notes...",
    "entry.noWorkPlaceholder": "Reason for no work...",
    "entry.saveEntry": "Save Entry",
    "entry.filterByDate": "Filter by Date",
    "entry.clearFilter": "Clear",
    "entry.dateRange": "Date Range",
    "entry.from": "From",
    "entry.to": "To",

    // Detail view
    "detail.workingDays": "Working Days",
    "detail.totalBunches": "Total Bunches",
    "detail.totalTonnage": "Total Tonnage",
    "detail.totalBacklogs": "Total Backlogs",
    "detail.avgBunchesDay": "Avg Bunches/Day",
    "detail.avgTonsDay": "Avg Tons/Day",
    "detail.avgWorkersDay": "Avg Workers/Day",
    "detail.allEntries": "All Entries",
    "detail.noEntriesPeriod": "No entries found for this period.",
    "detail.entries": "entries",
    "detail.prevMonth": "Previous month",
    "detail.nextMonth": "Next month",
    "detail.clearDateRange": "Clear date range",
    "detail.editEntry": "Edit entry",
    "detail.deleteEntry": "Delete entry",

    // Status
    "status.work": "Work",
    "status.noWork": "No Work",

    // Actions
    "action.save": "Save",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.cancel": "Cancel",
    "action.confirm": "Confirm",
    "action.export": "Export",
    "action.import": "Import",
    "action.back": "Back",

    // Delete confirmations
    "confirm.deleteEntry": "Delete this entry? This action cannot be undone.",
    "confirm.deleteLeader": "Remove this team leader? This will also remove all their daily entries.",
    "confirm.deleteBijiRelai": "Delete this Biji Relai entry?",

    // Messages
    "msg.entrySaved": "Entry saved successfully!",
    "msg.entryUpdated": "Entry updated!",
    "msg.entryDeleted": "Entry deleted.",
    "msg.leaderAdded": "Team leader added!",
    "msg.leaderRemoved": "Leader removed.",
    "msg.bijiRelaiSaved": "Biji Relai saved!",
    "msg.bijiRelaiUpdated": "Biji Relai updated.",
    "msg.bijiRelaiDeleted": "Biji Relai entry deleted.",
    "msg.noTeamSelected": "No team leader selected.",
    "msg.failedSave": "Failed to save entry.",
    "msg.failedUpdate": "Failed to update entry.",
    "msg.failedAdd": "Failed to add leader.",

    // Daily entries page
    "entries.title": "Daily Entries",
    "entries.totalEntries": "Total Entries",
    "entries.workDays": "Work Days",
    "entries.totalBunches": "Total Bunches",
    "entries.totalTons": "Total Tons",
    "entries.backlogs": "Backlogs",
    "entries.noData": "No entries found.",
    "entries.exportCSV": "Export CSV",

    // Bulk operations
    "bulk.selected": "selected",
    "bulk.selectAll": "Select all",
    "bulk.deselectAll": "Deselect all",
    "bulk.deleteSelected": "Delete selected",
    "bulk.exportSelected": "Export selected",
    "bulk.confirmDelete": "Delete {count} entries? This action cannot be undone.",
    "bulk.deleted": "{count} entries deleted.",

    // Import
    "import.title": "Import Data",
    "import.description": "Upload a CSV file with daily entries",
    "import.selectFile": "Select CSV file",
    "import.preview": "Preview",
    "import.import": "Import {count} entries",
    "import.importing": "Importing...",
    "import.success": "Successfully imported {count} entries.",
    "import.error": "Import failed. Please check your file format.",
    "import.dragDrop": "Drag and drop a CSV file here, or click to browse",
    "import.format": "Expected format: Date, Leader, Block, Status, Workers, Bunches, Tons, Backlogs, Notes",
    "import.cancel": "Cancel",

    // Offline
    "offline.title": "You're Offline",
    "offline.message": "Changes will sync when you're back online.",
    "offline.pending": "{count} changes pending sync",
    "offline.syncing": "Syncing changes...",
    "offline.synced": "All changes synced!",
    "offline.retry": "Retry",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.english": "English",
    "settings.malay": "Bahasa Melayu",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.darkMode": "Dark mode",
    "settings.lightMode": "Light mode",
    "settings.dataManagement": "Data Management",
    "settings.exportData": "Export Data",
    "settings.importData": "Import Data",
    "settings.backupData": "Backup Data",
    "settings.restoreData": "Restore Data",
    "settings.dangerZone": "Danger Zone",
    "settings.deleteAllData": "Delete All Data",
    "settings.account": "Account",
    "settings.displayName": "Display Name",
    "settings.changePassword": "Change Password",
    "settings.notifications": "Notifications",

    // Plantations
    "plantations.title": "Plantations",
    "plantations.addPlantation": "Add Plantation",
    "plantations.noPlantations": "No plantations yet. Add your first plantation to get started.",
    "plantations.rancangan": "Rancangan",
    "plantations.peringkat": "Peringkat",
    "plantations.block": "Block",
    "plantations.area": "Area (hectares)",
    "plantations.leaders": "leaders",

    // Reports
    "reports.title": "Reports",
    "reports.monthlyReport": "Monthly Report",

    // Biji Relai
    "bijiRelai.title": "Biji Relai",
    "bijiRelai.seedTonnage": "Seed Tonnage",
    "bijiRelai.history": "Biji Relai History",
    "bijiRelai.cumulative": "Cumulative",
    "bijiRelai.description": "Palm seed tonnage collected per block",

    // Edit modal
    "edit.title": "Edit Entry",
    "edit.workers": "Workers",
    "edit.lot": "Lot",
    "edit.bunches": "Bunches",
    "edit.tons": "Tons",
    "edit.backlogs": "Backlogs",
    "edit.notes": "Notes",
    "edit.notesPlaceholder": "Add notes...",
    "edit.saveChanges": "Save Changes",
    "edit.transportNote": "Transport may still bring fruit even when workers are off.",

    // Export modal
    "export.title": "Export Harvesting Monthly",
    "export.description": "Generate Excel report",
    "export.plantation": "Plantation",
    "export.block": "Block",
    "export.month": "Month",
    "export.year": "Year",
    "export.exporting": "Exporting...",
  },
  ms: {
    // Navigation
    "nav.dashboard": "Papan Pemuka",
    "nav.plantations": "Kebun",
    "nav.teams": "Pasukan",
    "nav.entries": "Entri",
    "nav.reports": "Laporan",
    "nav.settings": "Tetapan",
    "nav.logout": "Log Keluar",

    // Greetings
    "greeting.morning": "Selamat Pagi",
    "greeting.afternoon": "Selamat Petang",
    "greeting.evening": "Selamat Malam",

    // Auth
    "auth.login": "Log Masuk",
    "auth.register": "Cipta Akaun",
    "auth.email": "Emel",
    "auth.password": "Kata Laluan",
    "auth.confirmPassword": "Sahkan Kata Laluan",
    "auth.name": "Nama Penuh",
    "auth.forgotPassword": "Lupa kata laluan?",
    "auth.resetPassword": "Tetapkan Semula Kata Laluan",
    "auth.resetSent": "Semak emel anda untuk pautan tetapan semula kata laluan.",
    "auth.noAccount": "Tiada akaun?",
    "auth.hasAccount": "Sudah mempunyai akaun?",
    "auth.registerSuccess": "Semak emel anda untuk mengesahkan akaun.",
    "auth.confirmed": "Emel disahkan! Anda boleh log masuk sekarang.",
    "auth.signInWith": "Log masuk dengan",
    "auth.orContinueWith": "Atau teruskan dengan",
    "auth.rememberMe": "Ingat saya",
    "auth.passwordMismatch": "Kata laluan tidak sepadan",

    // Dashboard
    "dashboard.monthlyOverview": "Ringkasan Bulanan",
    "dashboard.recentEntries": "Entri Terkini",
    "dashboard.todaysPulse": "Nadi Hari Ini",
    "dashboard.bunchesToday": "Bunches Hari Ini",
    "dashboard.tonsToday": "Tan Hari Ini",
    "dashboard.activeTeams": "Pasukan Aktif",

    // Team page
    "team.title": "Pengurusan Pasukan",
    "team.selectBlock": "Pilih blok untuk mengurus ketua pasukan.",
    "team.addLeader": "Tambah Ketua",
    "team.addLeaderTitle": "Tambah Ketua Pasukan",
    "team.name": "Nama",
    "team.phone": "Telefon (pilihan)",
    "team.cancel": "Batal",
    "team.add": "Tambah",
    "team.saving": "Menyimpan...",
    "team.noPlantations": "Tiada kebun ditetapkan. Siapkan pemasangan dahulu.",
    "team.selectBlockLabel": "Pilih Blok",
    "team.leaders": "ketua",
    "team.leader": "ketua",
    "team.lastEntry": "Entri terakhir:",
    "team.noEntries": "Belum ada entri",
    "team.noLeaders": "Tiada ketua pasukan untuk blok ini lagi.",
    "team.addFirstLeader": "Tambah Ketua Pertama",
    "team.workersToday": "Pekerja hari ini:",
    "team.backToBlocks": "Kembali ke semua blok",
    "team.addEntry": "Tambah Entri",
    "team.viewDetails": "Lihat Butiran",
    "team.bijiRelai": "Biji Relai",
    "team.totalWorkers": "Jumlah Pekerja",
    "team.additional": "Tambahan",
    "team.totalLots": "Jumlah Lot",
    "team.looseFruit": "Buah Longgar",
    "team.removeLeader": "Buang",
    "team.newEntry": "Entri Baru",
    "team.saved": "Disimpan",
    "team.closeEntryForm": "Tutup borang entri",

    // Entry form
    "entry.workDay": "Hari Bekerja",
    "entry.noWork": "Tidak Bekerja",
    "entry.date": "Tarikh",
    "entry.workers": "Pekerja",
    "entry.lot": "Lot",
    "entry.bunches": "Bunches",
    "entry.tons": "Tan",
    "entry.backlogs": "Baki",
    "entry.notes": "Nota",
    "entry.notesPlaceholder": "Nota tambahan...",
    "entry.noWorkPlaceholder": "Sebab tidak bekerja...",
    "entry.saveEntry": "Simpan Entri",
    "entry.filterByDate": "Tapis mengikut Tarikh",
    "entry.clearFilter": "Padam",
    "entry.dateRange": "Julat Tarikh",
    "entry.from": "Dari",
    "entry.to": "Ke",

    // Detail view
    "detail.workingDays": "Hari Bekerja",
    "detail.totalBunches": "Jumlah Bunches",
    "detail.totalTonnage": "Jumlah Tan",
    "detail.totalBacklogs": "Jumlah Baki",
    "detail.avgBunchesDay": "Purata Bunches/Hari",
    "detail.avgTonsDay": "Purata Tan/Hari",
    "detail.avgWorkersDay": "Purata Pekerja/Hari",
    "detail.allEntries": "Semua Entri",
    "detail.noEntriesPeriod": "Tiada entri ditemui untuk tempoh ini.",
    "detail.entries": "entri",
    "detail.prevMonth": "Bulan sebelumnya",
    "detail.nextMonth": "Bulan seterusnya",
    "detail.clearDateRange": "Padam julat tarikh",
    "detail.editEntry": "Edit entri",
    "detail.deleteEntry": "Padam entri",

    // Status
    "status.work": "Bekerja",
    "status.noWork": "Tidak Bekerja",

    // Actions
    "action.save": "Simpan",
    "action.delete": "Padam",
    "action.edit": "Edit",
    "action.cancel": "Batal",
    "action.confirm": "Sahkan",
    "action.export": "Eksport",
    "action.import": "Import",
    "action.back": "Kembali",

    // Delete confirmations
    "confirm.deleteEntry": "Padam entri ini? Tindakan ini tidak boleh dibatalkan.",
    "confirm.deleteLeader": "Buang ketua pasukan ini? Ini akan membuang semua entri harian mereka.",
    "confirm.deleteBijiRelai": "Padam entri Biji Relai ini?",

    // Messages
    "msg.entrySaved": "Entri berjaya disimpan!",
    "msg.entryUpdated": "Entri dikemas kini!",
    "msg.entryDeleted": "Entri dipadam.",
    "msg.leaderAdded": "Ketua pasukan ditambah!",
    "msg.leaderRemoved": "Ketua dibuang.",
    "msg.bijiRelaiSaved": "Biji Relai disimpan!",
    "msg.bijiRelaiUpdated": "Biji Relai dikemas kini.",
    "msg.bijiRelaiDeleted": "Entri Biji Relai dipadam.",
    "msg.noTeamSelected": "Tiada ketua pasukan dipilih.",
    "msg.failedSave": "Gagal menyimpan entri.",
    "msg.failedUpdate": "Gagal mengemas kini entri.",
    "msg.failedAdd": "Gagal menambah ketua.",

    // Daily entries page
    "entries.title": "Entri Harian",
    "entries.totalEntries": "Jumlah Entri",
    "entries.workDays": "Hari Bekerja",
    "entries.totalBunches": "Jumlah Bunches",
    "entries.totalTons": "Jumlah Tan",
    "entries.backlogs": "Baki",
    "entries.noData": "Tiada entri ditemui.",
    "entries.exportCSV": "Eksport CSV",

    // Bulk operations
    "bulk.selected": "dipilih",
    "bulk.selectAll": "Pilih semua",
    "bulk.deselectAll": "Nyahpilih semua",
    "bulk.deleteSelected": "Padam dipilih",
    "bulk.exportSelected": "Eksport dipilih",
    "bulk.confirmDelete": "Padam {count} entri? Tindakan ini tidak boleh dibatalkan.",
    "bulk.deleted": "{count} entri dipadam.",

    // Import
    "import.title": "Import Data",
    "import.description": "Muat naik fail CSV dengan entri harian",
    "import.selectFile": "Pilih fail CSV",
    "import.preview": "Pratonton",
    "import.import": "Import {count} entri",
    "import.importing": "Mengimport...",
    "import.success": "Berjaya mengimport {count} entri.",
    "import.error": "Import gagal. Sila semak format fail anda.",
    "import.dragDrop": "Seret dan lepas fail CSV di sini, atau klik untuk melihat",
    "import.format": "Format jangkaan: Tarikh, Ketua, Blok, Status, Pekerja, Bunches, Tan, Baki, Nota",
    "import.cancel": "Batal",

    // Offline
    "offline.title": "Anda Secara Offline",
    "offline.message": "Perubahan akan disegerakkan apabila anda kembali online.",
    "offline.pending": "{count} perubahan menunggu penyeragaman",
    "offline.syncing": "Menyegerakkan perubahan...",
    "offline.synced": "Semua perubahan disegerakkan!",
    "offline.retry": "Cuba Semula",

    // Settings
    "settings.title": "Tetapan",
    "settings.language": "Bahasa",
    "settings.english": "English",
    "settings.malay": "Bahasa Melayu",
    "settings.appearance": "Penampilan",
    "settings.theme": "Tema",
    "settings.darkMode": "Mod gelap",
    "settings.lightMode": "Mod terang",
    "settings.dataManagement": "Pengurusan Data",
    "settings.exportData": "Eksport Data",
    "settings.importData": "Import Data",
    "settings.backupData": "Sandaran Data",
    "settings.restoreData": "Pulihkan Data",
    "settings.dangerZone": "Zon Bahaya",
    "settings.deleteAllData": "Padam Semua Data",
    "settings.account": "Akaun",
    "settings.displayName": "Nama Paparan",
    "settings.changePassword": "Tukar Kata Laluan",
    "settings.notifications": "Pemberitahuan",

    // Plantations
    "plantations.title": "Kebun",
    "plantations.addPlantation": "Tambah Kebun",
    "plantations.noPlantations": "Tiada kebun lagi. Tambah kebun pertama anda untuk bermula.",
    "plantations.rancangan": "Rancangan",
    "plantations.peringkat": "Peringkat",
    "plantations.block": "Blok",
    "plantations.area": "Luas (hektar)",
    "plantations.leaders": "ketua",

    // Reports
    "reports.title": "Laporan",
    "reports.monthlyReport": "Laporan Bulanan",

    // Biji Relai
    "bijiRelai.title": "Biji Relai",
    "bijiRelai.seedTonnage": "Tan Benih",
    "bijiRelai.history": "Sejarah Biji Relai",
    "bijiRelai.cumulative": "Kumulatif",
    "bijiRelai.description": "Tan benih sawit dikutip mengikut blok",

    // Edit modal
    "edit.title": "Edit Entri",
    "edit.workers": "Pekerja",
    "edit.lot": "Lot",
    "edit.bunches": "Bunches",
    "edit.tons": "Tan",
    "edit.backlogs": "Baki",
    "edit.notes": "Nota",
    "edit.notesPlaceholder": "Tambah nota...",
    "edit.saveChanges": "Simpan Perubahan",
    "edit.transportNote": "Pengangkutan masih boleh membawa buah walaupun pekerja cuti.",

    // Export modal
    "export.title": "Eksport Panen Bulanan",
    "export.description": "Hasilkan laporan Excel",
    "export.plantation": "Kebun",
    "export.block": "Blok",
    "export.month": "Bulan",
    "export.year": "Tahun",
    "export.exporting": "Mengeksport...",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("palm-insight-locale") as Locale) || "en";
    }
    return "en";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("palm-insight-locale", newLocale);
    document.documentElement.lang = newLocale === "ms" ? "ms" : "en";
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = translations[locale]?.[key] ?? translations.en[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
