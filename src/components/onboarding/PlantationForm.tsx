"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Leaf, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { plantationSchema, type PlantationFormData } from "@/lib/schemas";

export default function PlantationForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<PlantationFormData>({
    rancangan: "",
    peringkat: "",
    block: "",
    ketua_block: "",
    biro_ladang: "",
    penyelia: "",
    mandor: "",
    area_hectare: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PlantationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    setFieldErrors({});

    const result = plantationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("plantations").insert({
      user_id: user.id,
      rancangan: formData.rancangan,
      peringkat: formData.peringkat,
      block: formData.block,
      ketua_block: formData.ketua_block,
      biro_ladang: formData.biro_ladang,
      penyelia: formData.penyelia,
      mandor: formData.mandor,
      area_hectare: parseFloat(formData.area_hectare) || 0,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/teams");
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-default)",
    color: "white",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }} />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-theme" style={{ background: "linear-gradient(to right, #d97706, #f59e0b)" }}>1</div>
            <span className="text-sm font-medium text-theme">Plantation</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(245,158,11,0.15)" }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "var(--text-muted)" }}>2</div>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Team</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, #f59e0b, #f59e0b)" }}>
              <Leaf className="w-5 h-5 text-theme" />
            </div>
            <span className="font-bold text-lg text-theme">PalmInsight</span>
          </div>

          <h1 className="page-title text-2xl text-theme mt-6 mb-1">Set Up Your Plantation</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Fill in your plantation details before getting started.</p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm" style={{ backgroundColor: "var(--accent-red-light)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-red)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1 - Basic Information */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-theme" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>1</div>
                <h2 className="card-title text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Rancangan</label>
                  <input
                    type="text"
                    placeholder="e.g., Sahabat 04/05"
                    value={formData.rancangan}
                    onChange={(e) => handleChange("rancangan", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:opacity-40"
                    style={{ ...inputStyle, borderColor: fieldErrors.rancangan ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.rancangan && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.rancangan}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Peringkat</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 020"
                    value={formData.peringkat}
                    onChange={(e) => handleChange("peringkat", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:opacity-40"
                    style={{ ...inputStyle, borderColor: fieldErrors.peringkat ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.peringkat && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.peringkat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Block</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 04"
                    value={formData.block}
                    onChange={(e) => handleChange("block", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:opacity-40"
                    style={{ ...inputStyle, borderColor: fieldErrors.block ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.block && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.block}</p>}
                </div>
              </div>
            </div>

            {/* Section 2 - Management Details */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-theme" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>2</div>
                <h2 className="card-title text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Management Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Ketua Block</label>
                  <input
                    type="text"
                    value={formData.ketua_block}
                    onChange={(e) => handleChange("ketua_block", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ ...inputStyle, borderColor: fieldErrors.ketua_block ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.ketua_block && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.ketua_block}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Biro Ladang</label>
                  <input
                    type="text"
                    value={formData.biro_ladang}
                    onChange={(e) => handleChange("biro_ladang", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ ...inputStyle, borderColor: fieldErrors.biro_ladang ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.biro_ladang && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.biro_ladang}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Penyelia</label>
                  <input
                    type="text"
                    value={formData.penyelia}
                    onChange={(e) => handleChange("penyelia", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ ...inputStyle, borderColor: fieldErrors.penyelia ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.penyelia && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.penyelia}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Mandor</label>
                  <input
                    type="text"
                    value={formData.mandor}
                    onChange={(e) => handleChange("mandor", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ ...inputStyle, borderColor: fieldErrors.mandor ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.mandor && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.mandor}</p>}
                </div>
              </div>
            </div>

            {/* Section 3 - Area Information */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-theme" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>3</div>
                <h2 className="card-title text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Area Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Area (hectare)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 120.5"
                    value={formData.area_hectare}
                    onChange={(e) => handleChange("area_hectare", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:opacity-40"
                    style={{ ...inputStyle, borderColor: fieldErrors.area_hectare ? "#f87171" : undefined, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
                  />
                  {fieldErrors.area_hectare && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{fieldErrors.area_hectare}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-theme py-3 px-4 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #d97706, #f59e0b)", boxShadow: "0 10px 15px -3px rgba(245,158,11,0.2)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Team Details</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
