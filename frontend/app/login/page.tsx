"use client";

import React, { useState } from "react";
import {
  Code2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  Target,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  CheckCircle2,
  LogIn,
  KeyRound,
  IdCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth";
import { API_BASE } from "@/lib/api";

type AuthTab = "student" | "faculty";

const SAMPLE_STUDENTS = [
  { roll: "CSM1A001", pass: "Skill@1000", name: "Aarav Reddy", dept: "CSE (AI & ML)" },
  { roll: "CSM1A002", pass: "Skill@1001", name: "Vivaan Sharma", dept: "CSE (AI & ML)" },
  { roll: "ECE2A001", pass: "Skill@1050", name: "Ananya Patel", dept: "ECE" },
  { roll: "EEE4B006", pass: "Skill@1199", name: "Sowmya Das", dept: "EEE" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState<AuthTab>("student");

  // Form fields
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectSample = (sample: typeof SAMPLE_STUDENTS[0]) => {
    setTab("student");
    setRollNumber(sample.roll);
    setPassword(sample.pass);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (tab === "student") {
        if (!rollNumber.trim() || !password.trim()) {
          setErrorMessage("Please enter your Student Roll Number and Password.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/student-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roll_number: rollNumber.trim().toUpperCase(),
            password: password.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || "Invalid Roll Number or Password");
        }

        // Store JWT token
        if (data.token) {
          localStorage.setItem("skillscatalyst_student_token", data.token);
        }

        const u = data.user || {};
        login(u.email || `${u.roll_number}@tkrec.ac.in`, u.roll_number, u.full_name || u.roll_number, "student", u);
      } else {
        if (!email.trim() || !password.trim()) {
          setErrorMessage("Please enter your Faculty Email and Password.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/faculty-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || "Invalid Faculty credentials");
        }

        if (data.token) {
          localStorage.setItem("skillscatalyst_student_token", data.token);
        }

        const u = data.user || {};
        login(u.email, u.roll_number || u.email, u.full_name || "Faculty", "faculty");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a15] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#090d1a] rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              SKILLSCATALYST
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">TKRET STUDENT & FACULTY PORTAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Auth Enabled</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto px-4 my-auto py-8 z-10">
        <div className="bg-[#0b1021]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400">
              Sign in to access your SkillsCatalyst dashboard
            </p>
          </div>

          {/* Role Tab Selector */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setTab("student"); setErrorMessage(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === "student"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Login</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab("faculty"); setErrorMessage(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === "faculty"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Faculty Login</span>
            </button>
          </div>

          {/* Quick Demo Credentials Bar */}
          {tab === "student" && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Quick Test Credentials (Click to Auto-fill):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_STUDENTS.map((s) => (
                  <button
                    key={s.roll}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      rollNumber === s.roll
                        ? "bg-indigo-600/30 border-indigo-400 text-white font-medium shadow-sm"
                        : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="font-mono text-indigo-300 font-bold">{s.roll}</div>
                    <div className="text-[11px] text-slate-400 truncate">{s.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "student" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Student Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. CSM1A001"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-3.5 text-sm font-mono text-white placeholder-slate-600 transition-all uppercase tracking-wider"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Faculty Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@tkrec.ac.in"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "student" ? "e.g. Skill@1000" : "Enter faculty password"}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 z-10 border-t border-slate-900">
        © 2026 SkillsCatalyst — TKR College of Engineering & Technology. All rights reserved.
      </footer>
    </div>
  );
}
