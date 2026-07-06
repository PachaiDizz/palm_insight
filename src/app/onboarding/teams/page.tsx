"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { getUserPlantation } from "@/lib/onboarding";
import { Leaf, ArrowRight, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import TeamLeaderCard from "@/components/onboarding/TeamLeaderCard";

interface TeamLeader {
  name: string;
  phone: string;
  notes: string;
}

export default function TeamSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState<TeamLeader[]>([{ name: "", phone: "", notes: "" }]);
  const [plantationId, setPlantationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      getUserPlantation(user.id).then((p) => {
        if (p) setPlantationId(p.id);
      });
    }
  }, [user]);

  const addLeader = () => {
    setLeaders((prev) => [...prev, { name: "", phone: "", notes: "" }]);
  };

  const removeLeader = (index: number) => {
    setLeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLeader = (index: number, field: string, value: string) => {
    setLeaders((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !plantationId) return;

    const validLeaders = leaders.filter((l) => l.name.trim());
    if (validLeaders.length === 0) {
      setError("Add at least one team leader");
      return;
    }

    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("team_leaders").insert(
      validLeaders.map((l) => ({
        user_id: user.id,
        plantation_id: plantationId,
        name: l.name.trim(),
        phone: l.phone.trim(),
        notes: l.notes.trim(),
      }))
    );

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    border: "1px solid rgba(6,78,59,0.4)",
    color: "white",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(6, 78, 59, 0.2)" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(5, 46, 22, 0.2)" }} />
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "rgba(16,185,129,0.3)", color: "var(--accent-green)" }}>✓</div>
            <span className="text-sm font-medium" style={{ color: "var(--accent-green)" }}>Plantation</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(6,78,59,0.4)" }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(to right, #059669, #16a34a)" }}>2</div>
            <span className="text-sm font-medium text-white">Team</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, #10b981, #16a34a)" }}>
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">PalmInsight</span>
          </div>

          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Team Details</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Add your team leaders. You can add as many as needed.</p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm" style={{ backgroundColor: "var(--accent-red-light)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-red)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              {leaders.map((leader, i) => (
                <TeamLeaderCard
                  key={i}
                  index={i}
                  name={leader.name}
                  phone={leader.phone}
                  notes={leader.notes}
                  onChange={updateLeader}
                  onRemove={removeLeader}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addLeader}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all border border-dashed mb-6"
              style={{ borderColor: "rgba(6,78,59,0.5)", color: "rgba(255,255,255,0.6)", backgroundColor: "rgba(6,78,59,0.1)" }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Leader</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #059669, #16a34a)", boxShadow: "0 10px 15px -3px rgba(16,185,129,0.2)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Save & Go to Dashboard</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
