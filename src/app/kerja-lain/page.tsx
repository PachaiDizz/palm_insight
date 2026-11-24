"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { usePlantations, useTeamLeaders } from "@/lib/queries";
import {
  useOtherWorks,
  groupJobsByDate,
  jobDateKey,
} from "@/lib/otherWorks";
import DashboardLayout from "@/components/DashboardLayout";
import JobCard from "@/components/kerja-lain/JobCard";
import JobFormDrawer from "@/components/kerja-lain/JobFormDrawer";
import { JOB_TYPES } from "@/components/kerja-lain/jobMeta";
import Button from "@/components/ui/Button";
import Toast, { type ToastData } from "@/components/ui/Toast";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ChevronLeft,
  Plus,
  Briefcase,
} from "lucide-react";
import type { OtherWork } from "@/types";

type Tab = "running" | "completed" | "all";

function EmptyState({
  title,
  subtitle,
  onAdd,
  showAdd,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  showAdd?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
      >
        <Briefcase className="w-8 h-8" />
      </div>
      <p className="text-sm font-semibold text-theme">{title}</p>
      {subtitle && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}
      {showAdd && onAdd && (
        <Button className="mt-5" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Tambah Kerja
        </Button>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="card-glow rounded-2xl p-4 sm:p-5"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="w-32 h-4 mb-1.5" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-3" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function KerjaLainPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plantations = [], isLoading: plantationsLoading } = usePlantations(user?.id);
  const [plantationId, setPlantationId] = useState<string | null>(null);
  const selectedPlantation = useMemo(
    () => plantations.find((p) => p.id === plantationId) ?? plantations[0] ?? null,
    [plantations, plantationId]
  );

  const { data: allTeams = [] } = useTeamLeaders(user?.id);
  const { data: works = [], isLoading: worksLoading } = useOtherWorks(
    user?.id,
    selectedPlantation?.id
  );

  const [tab, setTab] = useState<Tab>("running");
  const [filterType, setFilterType] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OtherWork | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const teamOptions = useMemo(
    () => allTeams.filter((t) => t.plantation_id === selectedPlantation?.id),
    [allTeams, selectedPlantation?.id]
  );

  const running = useMemo(() => works.filter((w) => w.status === "running"), [works]);
  const completed = useMemo(() => works.filter((w) => w.status === "completed"), [works]);

  const passesFilters = (job: OtherWork) => {
    if (filterType !== "all" && job.type !== filterType) return false;
    if (filterTeam !== "all" && job.team_id !== filterTeam) return false;
    const key = jobDateKey(job);
    if (fromDate && key < fromDate) return false;
    if (toDate && key > toDate) return false;
    return true;
  };

  const filteredCompleted = useMemo(
    () => completed.filter(passesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completed, filterType, filterTeam, fromDate, toDate]
  );
  const filteredAll = useMemo(
    () => works.filter(passesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [works, filterType, filterTeam, fromDate, toDate]
  );

  const loading = plantationsLoading || worksLoading;
  const hasAny = works.length > 0;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (job: OtherWork) => {
    setEditing(job);
    setFormOpen(true);
  };
  const handleSaved = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["otherWorks"] });
    queryClient.invalidateQueries({ queryKey: ["otherWorkCounts"] });
    setToast({ type: "success", message });
  };

  const tabs: { id: Tab; label: string; count: number; dot?: boolean }[] = [
    { id: "running", label: "Sedang Berjalan", count: running.length, dot: true },
    { id: "completed", label: "Selesai", count: completed.length },
    { id: "all", label: "Semua", count: works.length },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 sm:mb-6">
          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="flex items-center justify-center w-10 h-10 rounded-xl border transition-colors hover:bg-[var(--hover-subtle)] shrink-0"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="page-title text-xl sm:text-2xl lg:text-3xl tracking-tight text-theme">
              KERJA-KERJA LAIN
            </h1>
            {plantations.length > 1 ? (
              <select
                aria-label="Pilih blok"
                value={selectedPlantation?.id ?? ""}
                onChange={(e) => setPlantationId(e.target.value)}
                className="mt-1 text-xs sm:text-sm bg-transparent outline-none cursor-pointer rounded-lg px-1 py-0.5 border"
                style={{
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-default)",
                }}
              >
                {plantations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rancangan} · Block {p.block}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                {selectedPlantation
                  ? `${selectedPlantation.rancangan} · Block ${selectedPlantation.block}`
                  : "—"}
              </p>
            )}
          </div>

          <Button onClick={openAdd} className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kerja</span>
            <span className="sr-only">Tambah Kerja</span>
          </Button>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-3 sm:mb-4 overflow-x-auto"
          style={{ backgroundColor: "var(--bg-card)" }}
          role="tablist"
          aria-label="Tapis kerja"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors min-h-[38px]"
                style={{
                  backgroundColor: active ? "var(--accent-primary-light)" : "transparent",
                  color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                }}
              >
                {t.dot && (
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: "var(--status-work)" }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--status-work)" }} />
                  </span>
                )}
                {t.label}
                <span
                  className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? "var(--accent-primary-border)" : "var(--hover-subtle)",
                    color: active ? "var(--accent-primary)" : "var(--text-muted)",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters (history + all) */}
        {!loading && tab !== "running" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <Select
              aria-label="Tapis jenis kerja"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              containerClassName="sm:flex-1 min-w-0"
            >
              <option value="all">Semua jenis</option>
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>
                  {jt.label}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Tapis kumpulan"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              containerClassName="sm:flex-1 min-w-0"
            >
              <option value="all">Semua kumpulan</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <Input
                aria-label="Dari tarikh"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                containerClassName="flex-1 min-w-0"
              />
              <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                –
              </span>
              <Input
                aria-label="Hingga tarikh"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                containerClassName="flex-1 min-w-0"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <GridSkeleton />
        ) : plantations.length === 0 ? (
          <EmptyState
            title="Tiada blok dijumpai"
            subtitle="Tambah blok terlebih dahulu untuk merekod kerja-kerja lain."
          />
        ) : !hasAny ? (
          <EmptyState
            title="Tiada kerja direkodkan"
            subtitle="Mulakan dengan merekod kerja-kerja lain untuk blok ini."
            onAdd={openAdd}
            showAdd
          />
        ) : tab === "running" ? (
          running.length === 0 ? (
            <EmptyState title="Tiada kerja sedang berjalan" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {running.map((job) => (
                <JobCard key={job.id} job={job} onEdit={openEdit} />
              ))}
            </div>
          )
        ) : tab === "completed" ? (
          filteredCompleted.length === 0 ? (
            <EmptyState title="Belum ada sejarah kerja" />
          ) : (
            <div className="space-y-6">
              {groupJobsByDate(filteredCompleted).map((group) => (
                <section key={group.label}>
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {group.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {group.items.map((job) => (
                      <JobCard key={job.id} job={job} onEdit={openEdit} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : filteredAll.length === 0 ? (
          <EmptyState title="Tiada kerja sepadan dengan tapisan" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredAll.map((job) => (
              <JobCard key={job.id} job={job} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <JobFormDrawer
          key={editing?.id ?? "new"}
          open
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
          plantations={plantations}
          teams={allTeams}
          defaultPlantationId={selectedPlantation?.id}
          editing={editing}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </DashboardLayout>
  );
}
