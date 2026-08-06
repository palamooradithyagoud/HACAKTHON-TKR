"use client";

import React, { useState } from "react";
import {
  Code2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  BarChart3,
  Target,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth";

// ── Demo / hardcoded credentials ─────────────────────────────────────────────
const STUDENT_ACCOUNTS: Record<string, { password: string; name: string }> = {
  "student@demo.com": { password: "student123", name: "Alex Student" },
  "alice@college.edu": { password: "alice123", name: "Alice Johnson" },
  "bob@college.edu": { password: "bob123", name: "Bob Smith" },
};

const FACULTY_ACCOUNTS: Record<string, { password: string; name: string }> = {
  "faculty@demo.com": { password: "faculty123", name: "Dr. Faculty" },
  "prof.sharma@college.edu": { password: "prof123", name: "Prof. Sharma" },
  "dr.rao@college.edu": { password: "rao123", name: "Dr. Rao" },
};

type AuthTab = "student" | "faculty";

export default function LoginPage() {
  const { login } = useAuth();

  const [tab, setTab] = useState<AuthTab>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setEmail("");
    setPassword("");
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    // Simulate a brief async check
    await new Promise((r) => setTimeout(r, 600));

    const accounts = tab === "student" ? STUDENT_ACCOUNTS : FACULTY_ACCOUNTS;
    const account = accounts[email.trim().toLowerCase()];

    if (!account || account.password !== password) {
      setErrorMessage(
        tab === "student"
          ? "Invalid student credentials. Try student@demo.com / student123"
          : "Invalid faculty credentials. Try faculty@demo.com / faculty123"
      );
      setLoading(false);
      return;
    }

    const userId = `${tab}_${email.replace(/[^a-z0-9]/gi, "_")}`;
    login(email.trim(), userId, account.name, tab as UserRole);
  };

  const fillDemo = () => {
    if (tab === "student") {
      setEmail("student@demo.com");
      setPassword("student123");
    } else {
      setEmail("faculty@demo.com");
      setPassword("faculty123");
    }
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen w-full bg-[#060a15] text-white flex flex-col lg:flex-row -m-6 md:-m-8 lg:-m-10 select-none overflow-x-hidden relative">
      {/* Background Ambient Glow & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-[50%] left-[30%] w-[400px] h-[400px] bg-cyan-600/8 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* LEFT COLUMN: Branding & Features */}
      <div className="w-full lg:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-10 space-y-8">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Code2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">SkillsCatalyst</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-extrabold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3" />
            AI-POWERED CAREER ACCELERATOR
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.1] text-white mb-4">
            Master Tech Interviews.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Accelerate Your Career.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8 font-medium">
            The all-in-one AI platform for top-tier technology roles. Prepare with structured roadmaps, practice company-wise DSA problems, and master your technical interviews.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[
              { val: "500+", label: "LEETCODE QUESTIONS" },
              { val: "100+", label: "TECH COMPANIES" },
              { val: "98%", label: "ATS PRECISION" },
            ].map((s) => (
              <div key={s.label} className="bg-[#0b1222]/80 border border-white/[0.08] rounded-2xl p-4 text-center backdrop-blur-md">
                <div className="text-xl sm:text-2xl font-black text-white">{s.val}</div>
                <div className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="space-y-3.5">
            {[
              { icon: Zap, color: "indigo", title: "Roadmap & Resources", desc: "Personalized 5-tier learning pathways, YouTube playlists & certifications for any skill." },
              { icon: BarChart3, color: "blue", title: "Topic-wise & Company-wise DSA", desc: "500+ frequency-ranked LeetCode problems for Google, Meta, Amazon, Microsoft & Apple." },
              { icon: Target, color: "cyan", title: "Interview Prep + Resume Review", desc: "Multi-stage ATS resume scoring, recruiter simulation & real-time AI mock interviews." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className={`bg-[#0b1222]/60 hover:bg-[#0b1222] border border-white/[0.08] hover:border-${color}-500/30 rounded-2xl p-4 flex items-start gap-4 transition-all duration-200 group`}>
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{title}</h3>
                  <p className="text-xs text-slate-400 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured local authentication — Student & Faculty portals</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Login Card */}
      <div className="w-full lg:w-[45%] p-6 sm:p-10 lg:p-12 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[460px] bg-[#090e1a]/90 border border-white/[0.1] rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden"
        >
          {/* Ambient top glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-1 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400 font-medium">Choose your portal to continue</p>
          </div>

          {/* Role Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 relative z-10">
            {[
              { id: "student" as AuthTab, label: "Student", icon: GraduationCap, gradient: "from-blue-600 via-indigo-600 to-blue-500", shadow: "shadow-indigo-600/30" },
              { id: "faculty" as AuthTab, label: "Faculty", icon: BookOpen, gradient: "from-purple-600 via-violet-600 to-purple-500", shadow: "shadow-purple-600/30" },
            ].map(({ id, label, icon: Icon, gradient, shadow }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`relative py-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 cursor-pointer overflow-hidden ${
                  tab === id
                    ? `bg-gradient-to-r ${gradient} border-transparent text-white shadow-lg ${shadow}`
                    : "bg-[#0d1326] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.15]"
                }`}
              >
                {tab === id && (
                  <motion.div
                    layoutId="activePortalPill"
                    className={`absolute inset-0 bg-gradient-to-r ${gradient} -z-10`}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wide uppercase">{label} Portal</span>
              </button>
            ))}
          </div>

          {/* Portal Description Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className={`relative z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                tab === "student"
                  ? "bg-blue-500/10 border-blue-500/25 text-blue-300"
                  : "bg-purple-500/10 border-purple-500/25 text-purple-300"
              }`}
            >
              {tab === "student" ? (
                <>
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Student Portal — Access learning roadmaps, AI mentor & placement prep.</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Faculty Portal — Monitor student progress, manage content & analytics.</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <div style={{ perspective: "1000px" }} className="relative z-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key={tab}
                initial={{ rotateY: tab === "student" ? -60 : 60, opacity: 0, scale: 0.95 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: tab === "student" ? 60 : -60, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleLogin}
                className="space-y-4 origin-center"
              >
                {/* Email Field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">
                    {tab === "student" ? "Student" : "Faculty"} Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={`${tab}-email`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tab === "student" ? "student@demo.com" : "faculty@demo.com"}
                      className="bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={`${tab}-password`}
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo credentials hint */}
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Use demo credentials →
                </button>

                {/* Submit Button */}
                <button
                  id={`${tab}-login-submit`}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1 ${
                    tab === "student"
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30"
                      : "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 hover:from-purple-500 hover:to-violet-500 shadow-purple-600/30"
                  } text-white`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as {tab === "student" ? "Student" : "Faculty"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Credential hints */}
          <div className="relative z-10 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <GraduationCap className="w-3 h-3 text-blue-400" />
                <span className="font-mono">student@demo.com</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">student123</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <BookOpen className="w-3 h-3 text-purple-400" />
                <span className="font-mono">faculty@demo.com</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">faculty123</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
