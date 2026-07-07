"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
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
} from "lucide-react";

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
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
          ? "bg-[#0f1a0f]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center group-hover:bg-[#10b981]/15 transition-colors">
            <TreePalm className="w-4.5 h-4.5 text-[#10b981]" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            PalmInsight
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-[#050f05] bg-[#10b981] hover:bg-[#059669] rounded-lg transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-white/60 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:hidden bg-[#0f1a0f]/95 backdrop-blur-xl border-b border-white/5 px-5 pb-4"
        >
          <Link
            href="/login"
            className="block py-2.5 text-sm text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block mt-1 py-2.5 text-sm font-medium text-center text-[#050f05] bg-[#10b981] rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </motion.div>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#10b981]/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-[#10b981]/[0.04] rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/[0.06] text-[#10b981] text-xs font-medium mb-8">
            <LeafIcon className="w-3.5 h-3.5" />
            Built for Malaysian Palm Oil Estates
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="hero-headline text-4xl sm:text-5xl md:text-6xl text-white"
        >
          Track Your Harvest.
          <br />
          Manage Your Teams.
          <br />
          <span className="text-[#10b981]">Grow Smarter.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-6 text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed"
        >
          PalmInsight is a productivity tracker built for palm oil plantation supervisors
          and estate managers in Malaysia. Log daily harvests, monitor team performance,
          and generate reports — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#050f05] bg-[#10b981] hover:bg-[#059669] rounded-xl transition-all"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
          >
            Login to Dashboard
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-5 text-xs text-white/25"
        >
          No credit card required. Free forever.
        </motion.p>
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
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-white">
            Everything You Need to Run Your Plantation
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.06}>
              <div className="group h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-[#10b981]/20 hover:bg-[#10b981]/[0.03] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] mb-4 group-hover:bg-[#10b981]/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="card-title text-[15px] text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
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
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-white">
            Simple Workflow, Powerful Results
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.1}>
              <div className="relative text-center px-6 py-8">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center text-[#10b981] text-lg font-bold mx-auto mb-5">
                  {s.num}
                </div>
                <h3 className="card-title text-base text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
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
          <div className="rounded-2xl bg-[#10b981]/[0.08] border border-[#10b981]/10 px-6 py-12 sm:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.value}>
                  <p className="text-xl sm:text-2xl font-bold text-[#10b981]">{s.value}</p>
                  <p className="mt-1.5 text-sm text-white/40">{s.desc}</p>
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
          <h2 className="section-heading text-2xl sm:text-3xl tracking-tight text-white">
            Ready to Take Control of Your Plantation?
          </h2>
          <p className="mt-4 text-base text-white/40 max-w-lg mx-auto leading-relaxed">
            Join plantation supervisors already using PalmInsight to track productivity
            and manage their teams efficiently.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 text-sm font-semibold text-[#050f05] bg-[#10b981] hover:bg-[#059669] rounded-xl transition-all"
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
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
            <TreePalm className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">PalmInsight</span>
            <span className="text-xs text-white/25 ml-2">Palm Oil Plantation Productivity Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-white/30">
          <Link href="/login" className="hover:text-white/60 transition-colors">
            Login
          </Link>
          <Link href="/register" className="hover:text-white/60 transition-colors">
            Register
          </Link>
          <Link href="/dashboard" className="hover:text-white/60 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-white/15">
        &copy; 2026 PalmInsight. Built for Malaysian palm oil estates.
      </div>
    </footer>
  );
}

/* ─── Main ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1a0f] text-white antialiased">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
