"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { otherWorkFormSchema } from "@/lib/schemas";
import { toLocalInput, fromLocalInput } from "@/lib/otherWorks";
import { JOB_TYPES, JOB_STATUS_LABELS } from "./jobMeta";
import type {
  OtherWork,
  OtherWorkStatus,
  OtherWorkType,
  Plantation,
  TeamLeader,
} from "@/types";

interface JobFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  plantations: Plantation[];
  teams: TeamLeader[];
  defaultPlantationId?: string;
  editing?: OtherWork | null;
}

export default function JobFormDrawer({
  open,
  onClose,
  onSaved,
  plantations,
  teams,
  defaultPlantationId,
  editing = null,
}: JobFormDrawerProps) {
  const { user } = useAuth();

  // This drawer is mounted fresh each time it opens (see parent), so initial
  // values can come straight from props instead of a state-sync effect.
  const [title, setTitle] = useState(editing?.title ?? "");
  const [type, setType] = useState<OtherWorkType>(editing?.type ?? "lain_lain");
  const [status, setStatus] = useState<OtherWorkStatus>(editing?.status ?? "scheduled");
  const [plantationId, setPlantationId] = useState(
    editing?.plantation_id ?? defaultPlantationId ?? plantations[0]?.id ?? ""
  );
  const [teamId, setTeamId] = useState(editing?.team_id ?? "");
  const [workers, setWorkers] = useState(String(editing?.workers ?? 0));
  const [startedAt, setStartedAt] = useState(toLocalInput(editing?.started_at));
  const [endedAt, setEndedAt] = useState(toLocalInput(editing?.ended_at));
  const [progress, setProgress] = useState(String(editing?.progress ?? 0));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const plantationTeams = teams.filter((t) => t.plantation_id === plantationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = otherWorkFormSchema.safeParse({
      title,
      type,
      status,
      plantation_id: plantationId,
      progress,
      workers,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const payload = {
      plantation_id: plantationId,
      team_id: teamId || null,
      type,
      title: title.trim(),
      status,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      workers: Math.max(0, Number(workers) || 0),
      started_at: fromLocalInput(startedAt),
      ended_at: fromLocalInput(endedAt),
      notes: notes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("other_works").update(payload).eq("id", editing.id)
      : await supabase
          .from("other_works")
          .insert({ ...payload, created_by: user.id });

    setSaving(false);

    if (error) {
      setErrors({ form: error.message || "Gagal menyimpan kerja" });
      return;
    }

    onSaved(editing ? "Kerja dikemas kini" : "Kerja ditambah");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Sunting Kerja" : "Tambah Kerja"}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Tajuk Kerja"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth. Racun Rumpai Blok A"
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Jenis Kerja"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as OtherWorkType)}
          >
            {JOB_TYPES.map((jt) => (
              <option key={jt.value} value={jt.value}>
                {jt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OtherWorkStatus)}
          >
            {(Object.keys(JOB_STATUS_LABELS) as OtherWorkStatus[]).map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>

          <Select
            label="Blok"
            name="plantation_id"
            value={plantationId}
            onChange={(e) => {
              setPlantationId(e.target.value);
              setTeamId("");
            }}
            error={errors.plantation_id}
          >
            <option value="">Pilih blok…</option>
            {plantations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rancangan} · Block {p.block}
              </option>
            ))}
          </Select>

          <Select
            label="Kumpulan / Ketua"
            name="team_id"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">— Tiada —</option>
            {plantationTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          <Input
            label="Bilangan Pekerja"
            name="workers"
            type="number"
            min={0}
            inputMode="numeric"
            value={workers}
            onChange={(e) => setWorkers(e.target.value)}
            error={errors.workers}
          />

          <Input
            label="Kemajuan (%)"
            name="progress"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            error={errors.progress}
          />

          <Input
            label="Masa Mula"
            name="started_at"
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />

          <Input
            label="Masa Tamat (pilihan)"
            name="ended_at"
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
          />
        </div>

        <Textarea
          label="Catatan"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nota tambahan (pilihan)"
        />

        {errors.form && (
          <p className="text-xs" style={{ color: "var(--accent-red)" }} role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? "Simpan Perubahan" : "Tambah Kerja"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
