"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TreePalm,
  Users,
  ClipboardList,
  BarChart3,
  Shield,
  Cloud,
  ArrowRight,
  Menu,
  X,
  Home,
  Sprout,
  Settings,
} from "lucide-react";

function useReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      options ?? { rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, shown };
}

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal--in" : ""} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ─── SVG Icons ─── */
const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2C6.5 2 2 6.5 2 12c0 2.8 1.2 5.4 3 7.2" strokeLinecap="round" />
    <path d="M12 2c5.5 0 10 4.5 10 10 0 2.8-1.2 5.4-3 7.2" strokeLinecap="round" />
    <path d="M7 22c0-4 2.2-7.6 5.5-9.5" strokeLinecap="round" />
    <path d="M12 2v20" strokeLinecap="round" strokeDasharray="4 3" opacity="0.4" />
  </svg>
);

const features = [
  {
    icon: <TreePalm className="w-6 h-6" />,
    title: "Plantation Management",
    desc: "Register and manage multiple plantation blocks with full details — Rancangan, Peringkat, Block, and more.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Team Management",
    desc: "Organise your team leaders per block, track their assignments and monitor individual performance.",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Daily Entry Logging",
    desc: "Log daily harvest data per team leader — bunches, tonnage, workers, lots and backlogs in minutes.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Reports & Analytics",
    desc: "View monthly production trends, compare performance across blocks and export data as CSV or PDF.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    desc: "Each account has completely isolated data. Your plantation data is only visible to you.",
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: "Always Online",
    desc: "Access your data from any device, anywhere — desktop, tablet or mobile browser.",
  },
];

const steps = [
  {
    num: "1",
    title: "Set Up Your Plantation",
    desc: "Register your plantation details and add your team leaders in minutes.",
  },
  {
    num: "2",
    title: "Log Daily Data",
    desc: "Each day, log harvest data per team leader — bunches, tons, workers and backlogs.",
  },
  {
    num: "3",
    title: "Track & Improve",
    desc: "View reports, monitor performance trends and identify productivity issues early.",
  },
];

const stats = [
  { value: "100% Free", desc: "No subscription, no hidden fees" },
  { value: "Multi-User", desc: "Each account fully isolated and secure" },
  { value: "Mobile Ready", desc: "Works on any device in the field" },
];

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-nav-scrolled)] backdrop-blur-xl border-b border-[var(--border-subtle)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] flex items-center justify-center group-hover:bg-[var(--accent-primary)]/15 transition-colors">
            <TreePalm className="w-4.5 h-4.5 text-[var(--accent-primary)]" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            PalmInsight
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] rounded-lg transition-all"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden animate-menu bg-[var(--bg-nav-scrolled)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-5 pb-4">
          <Link
            href="/login"
            className="block py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block mt-1 py-2.5 text-sm font-medium text-center text-[var(--text-on-accent)] bg-[var(--accent-primary)] rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-primary-light)] rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--accent-primary-light)] rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <div className="mount-reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--accent-primary-border)] bg-[var(--accent-primary-light)] text-[var(--accent-primary)] text-xs font-medium mb-8">
            <LeafIcon className="w-3.5 h-3.5" />
            Built for Malaysian Palm Oil Estates
          </div>
        </div>

        <h1
          className="hero-headline text-4xl sm:text-5xl md:text-6xl text-[var(--text-primary)] mount-reveal"
          style={{ animationDelay: "0.1s" }}
        >
          Track Your Harvest.
          <br />
          Manage Your Teams.
          <br />
          <span className="text-[var(--accent-primary)]">Grow Smarter.</span>
        </h1>

        <p
          className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mount-reveal"
          style={{ animationDelay: "0.22s" }}
        >
          PalmInsight is a productivity tracker built for palm oil plantation supervisors
          and estate managers in Malaysia. Log daily harvests, monitor team performance,
          and generate reports — all in one place.
        </p>

        <div
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 mount-reveal"
          style={{ animationDelay: "0.36s" }}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--text-on-accent)] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-xl transition-all"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] rounded-xl transition-all"
          >
            Login to Dashboard
          </Link>
        </div>

        <p
          className="mt-5 text-xs text-[var(--text-faint)] mount-reveal"
          style={{ animationDelay: "0.5s" }}
        >
          No credit card required. Free forever.
        </p>
      </div>
    </section>
  );
}

/* ─── Dashboard Preview (product imagery) ─── */
const previewBars = [38, 52, 46, 68, 60, 84, 72, 90, 66, 78, 96, 80, 100, 86, 74, 92];
const previewStats = [
  { label: "Total Bunches", value: "12,450", accent: true },
  { label: "Transported", value: "48.20 ton" },
  { label: "Backlogs", value: "320" },
  { label: "Teams Active", value: "6 / 8" },
];
const previewEntries = [
  { leader: "Ahmad bin Hassan", block: "Block A", tons: "4.80", bunches: "1,240", work: true },
  { leader: "Siti binti Omar", block: "Block B", tons: "3.20", bunches: "980", work: true },
  { leader: "Raj Kumar", block: "Block C", tons: "0.00", bunches: "0", work: false },
];

function DashboardPreview() {
  return (
    <section className="relative -mt-10 sm:-mt-16 z-20 px-5 pb-8">
      <div className="max-w-5xl mx-auto">
        <div
          className="relative mount-reveal"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Soft glow behind the window */}
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[var(--accent-primary-light)] blur-3xl opacity-40" />

          {/* App window */}
          <div className="rounded-2xl border overflow-hidden bg-[var(--bg-card)] shadow-2xl" style={{ borderColor: "var(--border-default)" }}>
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 h-11 border-b" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-header)" }}>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-1 rounded-md text-[11px] text-[var(--text-muted)] bg-black/20 max-w-[220px] truncate">
                  palminsight.app/dashboard
                </div>
              </div>
              <TreePalm className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>

            {/* Body */}
            <div className="flex">
              {/* Left rail hint */}
              <div className="hidden sm:flex flex-col items-center gap-4 py-5 px-3 border-r" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-primary-light)]">
                  <TreePalm className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
                {[Home, Sprout, Users, BarChart3, Settings].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: i === 0 ? "var(--accent-primary-light)" : "transparent" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: i === 0 ? "var(--accent-primary)" : "var(--icon-inactive)" }} />
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 p-4 sm:p-5 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Good Morning</div>
                    <div className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">Ahmad &middot; Block A</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-primary-light)] text-[var(--accent-primary)] shrink-0">
                    July 2026
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {previewStats.map((s) => (
                    <div key={s.label} className="rounded-xl p-3 bg-[var(--bg-base)] border" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">{s.label}</div>
                      <div className="text-sm sm:text-lg font-bold" style={{ color: s.accent ? "var(--chart-bunches)" : "var(--text-primary)" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart + recent entries */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Bar chart */}
                  <div className="lg:col-span-2 rounded-xl p-3 sm:p-4 bg-[var(--bg-base)] border" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-3">Monthly Trend</div>
                    <div className="relative h-36">
                      {/* gridlines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="w-full h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-end gap-1">
                        {previewBars.map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{ height: `${h}%`, background: "linear-gradient(to top, #d97706, #f59e0b)", opacity: 0.9 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent entries */}
                  <div className="rounded-xl p-3 sm:p-4 bg-[var(--bg-base)] border" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-3">Recent Entries</div>
                    <div className="space-y-2.5">
                      {previewEntries.map((e) => (
                        <div key={e.leader} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[var(--text-primary)] truncate">{e.leader}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{e.block} &middot; {e.tons} ton</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{e.bunches}</span>
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                              style={{
                                backgroundColor: e.work ? "var(--status-work-bg)" : "var(--status-no-work-bg)",
                                color: e.work ? "var(--status-work)" : "var(--status-no-work)",
                              }}
                            >
                              {e.work ? "Work" : "Off"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <FadeIn className="text-center mb-14">
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
            Everything You Need to Run Your Plantation
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.06}>
              <div className="group h-full p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary-border)] hover:bg-[var(--accent-primary-light)] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] flex items-center justify-center text-[var(--accent-primary)] mb-4 group-hover:bg-[var(--accent-primary)]/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="card-title text-[15px] text-[var(--text-primary)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-5">
        <FadeIn className="text-center mb-14">
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
            Simple Workflow, Powerful Results
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.1}>
              <div className="relative text-center px-6 py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] flex items-center justify-center text-[var(--accent-primary)] text-lg font-bold mx-auto mb-5">
                  {s.num}
                </div>
                <h3 className="card-title text-base text-[var(--text-primary)] mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  return (
    <section className="relative py-20">
      <div className="max-w-5xl mx-auto px-5">
        <FadeIn>
          <div className="rounded-2xl bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] px-6 py-12 sm:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.value}>
                  <p className="text-xl sm:text-2xl font-bold text-[var(--accent-primary)]">{s.value}</p>
                  <p className="mt-1.5 text-sm text-[var(--text-muted)]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <FadeIn>
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
            Ready to Take Control of Your Plantation?
          </h2>
          <p className="mt-4 text-base text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
            Join plantation supervisors already using PalmInsight to track productivity
            and manage their teams efficiently.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 text-sm font-semibold text-[var(--text-on-accent)] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-xl transition-all"
          >
            Create Your Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] py-10">
      <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] flex items-center justify-center">
            <TreePalm className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">PalmInsight</span>
            <span className="text-xs text-[var(--text-faint)] ml-2">Palm Oil Plantation Productivity Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-[var(--text-muted)]">
          <Link href="/login" className="hover:text-[var(--text-muted)] transition-colors">
            Login
          </Link>
          <Link href="/register" className="hover:text-[var(--text-muted)] transition-colors">
            Register
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--text-muted)] transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-[var(--text-faint)]">
        &copy; 2026 PalmInsight. Built for Malaysian palm oil estates.
      </div>
    </footer>
  );
}

/* ─── Main ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
      <Navbar />
      <main id="main-content">
        <Hero />
        <DashboardPreview />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
