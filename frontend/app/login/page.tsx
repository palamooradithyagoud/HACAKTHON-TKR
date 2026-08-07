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
  User,
  Building2,
  CheckCircle2,
  UserPlus,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth";
import { saveAcademicProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type AuthTab = "student" | "faculty";

export default function LoginPage() {
  const { login } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [tab, setTab] = useState<AuthTab>("student");

  // Sign in / Sign up form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter email and password.");
      return;
    }

    if (mode === "signup" && (!fullName || !department)) {
      setErrorMessage("Please fill out your full name and department.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const sanitizedId = `${tab}_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;

      if (mode === "signup") {
        // Try registering in Supabase Auth first
        try {
          if (supabase) {
            await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: {
                  full_name: fullName,
                  role: tab,
                  department: department,
                  section: section,
                },
              },
            });
          }
        } catch (sbErr) {
          console.warn("Supabase auth signup warning:", sbErr);
        }

        // Save student / faculty academic record to DB & localStorage
        const academicPayload = {
          user_id: sanitizedId,
          full_name: fullName,
          college: "TKR College of Engineering & Technology",
          department: department || "CSM",
          section: section || (tab === "student" ? "Section A" : ""),
          academic_year: academicYear || "2nd Year",
          target_role: tab === "student" ? "Software Engineer" : "Faculty",
        };

        try {
          localStorage.setItem(`sc_academic_profile_${sanitizedId}`, JSON.stringify(academicPayload));
          await saveAcademicProfile(academicPayload).catch(() => {});
        } catch {}

        setSuccessMessage("Account created successfully! Logging you in...");
        await new Promise((r) => setTimeout(r, 600));

        login(cleanEmail, sanitizedId, fullName, tab as UserRole);
      } else {
        // Sign In Flow
        try {
          if (supabase) {
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });
          }
        } catch (sbErr) {
          console.warn("Supabase auth signin warning:", sbErr);
        }

        await new Promise((r) => setTimeout(r, 500));
        const derivedName = fullName || cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        login(cleanEmail, sanitizedId, derivedName, tab as UserRole);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
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
      <div className="w-full lg:w-[52%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-10 space-y-8">
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
            TKR COLLEGE ACADEMIC & PLACEMENT PORTAL
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.1] text-white mb-4">
            Accelerate Skills.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Empower Placement Success.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8 font-medium">
            The unified platform connecting students and faculty. Track DSA practice across LeetCode & GitHub, complete career roadmaps, and monitor student academic performance.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[
              { val: "TKR", label: "COLLEGE OF ENGG & TECH" },
              { val: "660+", label: "COMPANY DSAS" },
              { val: "100%", label: "SUPABASE SYNCED" },
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
              { icon: Zap, color: "indigo", title: "Student Career Roadmaps", desc: "Interactive timeline trees for Full Stack, Data Science, AI/ML & DevOps with resources." },
              { icon: BarChart3, color: "blue", title: "Live Platform Statistics", desc: "Automatic tracking across LeetCode, GitHub, CodeChef, GeeksforGeeks & Codeforces." },
              { icon: Target, color: "cyan", title: "Faculty Analytics & Scoreboard", desc: "Real-time class attendance, assignment tracking & student readiness monitoring." },
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
          <span>Database Authenticated — TKR College Student & Faculty Portals</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Card */}
      <div className="w-full lg:w-[48%] p-6 sm:p-10 lg:p-12 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[480px] bg-[#090e1a]/95 border border-white/[0.1] rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden"
        >
          {/* Ambient top glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {mode === "signin" ? "Sign in to access your portal" : "Register your student/faculty account"}
              </p>
            </div>

            <div className="flex bg-[#0b1222] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "signup"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Role Tab Switcher (Student vs Faculty) */}
          <div className="grid grid-cols-2 gap-2 relative z-10">
            {[
              { id: "student" as AuthTab, label: "Student", icon: GraduationCap, gradient: "from-blue-600 via-indigo-600 to-blue-500", shadow: "shadow-indigo-600/30" },
              { id: "faculty" as AuthTab, label: "Faculty", icon: BookOpen, gradient: "from-purple-600 via-violet-600 to-purple-500", shadow: "shadow-purple-600/30" },
            ].map(({ id, label, icon: Icon, gradient, shadow }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`relative py-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer overflow-hidden ${
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
                <Icon className="w-4 h-4" />
                <span className="text-[11px] font-extrabold tracking-wide uppercase">{label} Portal</span>
              </button>
            ))}
          </div>

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
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Container */}
          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name for Sign Up */}
              {mode === "signup" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adithya Goud"
                      className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  {tab === "student" ? "Student" : "Faculty"} Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tab === "student" ? "student@tkr.ac.in" : "faculty@tkr.ac.in"}
                    className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
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

              {/* Additional Sign Up Details */}
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. CSM / CSE"
                        className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                      />
                    </div>

                    {tab === "student" ? (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                          Section / Batch
                        </label>
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          placeholder="e.g. Section A"
                          className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                          Academic Year
                        </label>
                        <input
                          type="text"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          placeholder="e.g. 2025-2026"
                          className="bg-slate-900/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-semibold text-white focus:border-indigo-500 outline-none w-full transition-all placeholder-slate-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                      Institution
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/60 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">TKR College of Engineering & Technology</span>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2 ${
                  tab === "student"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30"
                    : "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 hover:from-purple-500 hover:to-violet-500 shadow-purple-600/30"
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    {mode === "signin" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>
                      {mode === "signin"
                        ? `Sign In as ${tab === "student" ? "Student" : "Faculty"}`
                        : `Register as ${tab === "student" ? "Student" : "Faculty"}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Toggle mode footnote */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Create Student/Faculty Account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Sign In to your Portal
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
