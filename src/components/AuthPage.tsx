"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Leaf, User, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "register";

function AuthPageInner({ initialMode = "login" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false); // NEW: show "check your email" state
  const router = useRouter();
  const searchParams = useSearchParams(); // NEW: read ?confirmed=true from /auth/callback
  const confirmed = searchParams.get("confirmed");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setShowPassword(false);
    setRegistered(false);
  };

  const switchMode = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log("Attempting login with:", { email });
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log("Login result:", JSON.stringify(result, null, 2));
      if (result.error) setError(result.error.message);
      else router.push("/dashboard");
    } catch (err) {
      console.error("Login catch error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: saves name to user_metadata + profiles table, shows "check email" after signup
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }, // saves to user_metadata
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Also insert into profiles table if you have one
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: name,
        });
        setRegistered(true); // show "check your email" message instead of switching to login
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const easeOut: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: easeOut },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.25 },
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(16, 185, 129, 0.12)" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(120, 53, 15, 0.2)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px]" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }} />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="w-full max-w-[440px]">
        <motion.div
          className="relative z-10 rounded-3xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(16, 185, 129, 0.12)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(to bottom right, #10b981, #16a34a)", boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)" }}>
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl text-white tracking-tight block leading-tight">PalmInsight</span>
                <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Plantation Tracker</span>
              </div>
            </div>

            {/* NEW: Email confirmed success banner (shown after /auth/callback redirect) */}
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-3"
                style={{ backgroundColor: "var(--accent-green-light)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(16,185,129,0.2)" }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span>Email confirmed! You can now sign in.</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait" custom={mode === "register" ? 1 : -1}>
              {/* NEW: "Check your email" screen shown after successful signup */}
              {registered ? (
                <motion.div
                  key="registered"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(to bottom right, #10b981, #16a34a)", boxShadow: "0 10px 15px -3px rgba(16,185,129,0.2)" }}>
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="section-heading text-xl text-white mb-2">Check your email</h2>
                  <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    We sent a confirmation link to:
                  </p>
                  <p className="text-sm font-semibold text-green-400 mb-5">{email}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Click the link in the email to activate your account, then come back to sign in. Check your spam folder if you don&apos;t see it.
                  </p>
                  <button
                    onClick={() => { resetForm(); setMode("login"); }}
                    className="mt-6 text-sm font-semibold hover:underline underline-offset-4 transition-colors"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    Back to sign in
                  </button>
                </motion.div>
              ) : mode === "login" ? (
                <motion.div
                  key="login"
                  custom={1}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="mb-6">
                    <h1 className="page-title text-2xl text-white tracking-tight">Welcome back</h1>
                    <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Sign in to manage your plantations</p>
                  </div>

                  {error && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "var(--accent-red-light)", borderColor: "var(--accent-red-border)", border: "1px solid", color: "var(--accent-red)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-red-light)" }}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded" style={{ borderColor: "rgba(16,185,129,0.3)", backgroundColor: "var(--bg-input)" }} />
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>Remember me</span>
                      </label>
                      <button type="button" className="text-sm font-medium transition-colors" style={{ color: "var(--accent-amber)" }}>
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 text-white py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                      style={{ background: "linear-gradient(to right, #059669, #16a34a)", boxShadow: "0 10px 15px -3px rgba(16,185,129,0.2)" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  custom={1}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="mb-6">
                    <h1 className="page-title text-2xl text-white tracking-tight">Create account</h1>
                    <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Start tracking your plantation data</p>
                  </div>

                  {error && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "var(--accent-red-light)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--accent-red)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-red-light)" }}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Username</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type="text"
                          placeholder="Enter your username"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid rgba(16,185,129,0.15)", color: "white", "--tw-ring-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 text-white py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                      style={{ background: "linear-gradient(to right, #059669, #16a34a)", boxShadow: "0 10px 15px -3px rgba(16,185,129,0.2)" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!registered && (
            <div className="px-8 py-5 border-t" style={{ backgroundColor: "rgba(16,185,129,0.08)", borderColor: "var(--border-default)" }}>
              <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => switchMode("register")} className="font-semibold hover:underline underline-offset-4 transition-colors" style={{ color: "var(--accent-amber)" }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => switchMode("login")} className="font-semibold hover:underline underline-offset-4 transition-colors" style={{ color: "var(--accent-amber)" }}>
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          By continuing, you agree to our{" "}
          <button className="hover:underline underline-offset-4 transition-colors" style={{ color: "var(--text-muted)" }}>Terms</button>
          {" "}and{" "}
          <button className="hover:underline underline-offset-4 transition-colors" style={{ color: "var(--text-muted)" }}>Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

// Wrapped in Suspense because useSearchParams() requires it in Next.js App Router
export default function AuthPage({ initialMode = "login" }: { initialMode?: Mode }) {
  return (
    <Suspense>
      <AuthPageInner initialMode={initialMode} />
    </Suspense>
  );
}


