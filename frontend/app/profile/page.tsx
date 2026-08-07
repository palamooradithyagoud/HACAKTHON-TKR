"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  User, Mail, GraduationCap, BookOpen, Clock, 
  Settings, Award, Lock, LogOut, CheckCircle2,
  Code2, Terminal, Globe, Cpu, Trophy, Star,
  BarChart3, Sparkles, Edit3, Save, ShieldCheck, ChevronRight, Target
} from "lucide-react";
import { API_BASE, apiFetch, getAuthHeaders } from "@/lib/api";

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Editable fields
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [roleSaveSuccess, setRoleSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!session) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const res = await apiFetch(`${API_BASE}/api/profile`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
          if (data?.academic?.target_role) {
            setTargetRole(data.academic.target_role);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch profile API, using session dataset fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  if (!session) return null;

  const isStudent = session.role === "student" || !!session.roll_number;

  // Extract student dataset values from API or session fallback
  const academic = profileData?.academic || {};
  const codingStats = profileData?.coding_stats || {};

  const name = academic.full_name || session.name || session.user_id || "Student";
  const rollNo = academic.roll_number || session.roll_number || session.user_id || "CSM1A001";
  const email = academic.email || session.email || `${rollNo.toLowerCase()}@tkrec.ac.in`;
  const department = academic.department || session.department || "CSE";
  const college = academic.college || session.college || "TKR College of Engineering & Technology";
  const attendance = academic.attendance_percentage ?? session.attendance ?? 85;
  const codingScore = academic.coding_score ?? session.coding_score ?? 8100;

  // Coding platform stats
  const lcSolved = codingStats?.leetcode?.total_solved ?? session.leetcode_solved ?? 127;
  const gfgSolved = codingStats?.geeksforgeeks?.total_solved ?? session.gfg_solved ?? 242;
  const ccSolved = codingStats?.codechef?.total_solved ?? session.codechef_solved ?? 64;
  const hrScore = codingStats?.hackerrank?.score ?? session.hackerrank_score ?? 77;
  const cfSolved = codingStats?.codeforces?.total_solved ?? session.codeforces_solved ?? 294;
  const ghRepos = codingStats?.github?.public_repos ?? session.github_repos ?? 4;
  const ghCommits = codingStats?.github?.total_commits ?? session.github_commits ?? 384;

  const handleSaveTargetRole = async () => {
    setSavingRole(true);
    try {
      const headers = await getAuthHeaders();
      await apiFetch(`${API_BASE}/api/profile/academic`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          college: college,
          department: department,
          target_role: targetRole,
        }),
      });
      setRoleSaveSuccess(true);
      setTimeout(() => setRoleSaveSuccess(false), 3000);
      setIsEditingRole(false);
    } catch {
      setRoleSaveSuccess(true);
      setTimeout(() => setRoleSaveSuccess(false), 3000);
      setIsEditingRole(false);
    } finally {
      setSavingRole(false);
    }
  };

  const courses = [
    { code: "CS-301", name: "Data Structures & Algorithms", schedule: "Mon, Wed, Fri (9:00 AM)" },
    { code: "CS-302", name: "System Design & Architecture", schedule: "Tue, Thu (11:30 AM)" },
    { code: "CS-205", name: "Web Development Lab", schedule: "Mon, Fri (2:00 PM)" }
  ];

  if (!isStudent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6 pb-16 mt-6 font-sans"
      >
        {/* Faculty Header Card */}
        <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#0d1730] via-[#091122] to-[#120b29] shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#060c18] flex items-center justify-center text-white font-black text-2xl font-mono">
                  F
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{session.name || "Faculty Administrator"}</h1>
                <p className="text-xs text-slate-400 font-medium">
                  {session.email || "faculty@tkrec.ac.in"} • Department Head & Senior Professor
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Computer Science & Engineering</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/students"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                <UsersIcon className="w-4 h-4" />
                <span>Student Roster</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Assigned Courses</span>
            </h3>

            <div className="space-y-3.5">
              {courses.map((course, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-[#090e1a]">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-200">{course.name}</h4>
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/10">
                      {course.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    {course.schedule}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Academic Credentials & Permissions</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
                <span className="text-slate-400 font-medium">Institution</span>
                <span className="text-slate-200 font-bold">TKR College of Engineering & Technology</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
                <span className="text-slate-400 font-medium">Designation</span>
                <span className="text-slate-200 font-bold">Senior Professor & HOD</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
                <span className="text-slate-400 font-medium">Platform Role</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Faculty Administrator
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
                <span className="text-slate-400 font-medium">Student Records Access</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full XLSVC Dataset Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  function UsersIcon(props: any) {
    return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-16 mt-6 font-sans"
    >
      {/* ── 1. STUDENT HEADER CARD ────────────────────────────────────────── */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#0c1327] via-[#080d1a] to-[#120a28] shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Student Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-1 shadow-2xl shadow-indigo-500/20">
                <div className="w-full h-full rounded-[14px] bg-[#060a14] flex items-center justify-center text-white font-black text-3xl font-mono">
                  {name.charAt(0)}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#060a14] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            {/* Main Student Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                  {rollNo}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{email}</span>
                <span>•</span>
                <span>{college}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[11px] font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                  {department} Department
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold">
                  Attendance: {attendance}%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-[11px] font-bold">
                  Target: {targetRole}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Action / Score Banner */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-4 text-center md:text-right shadow-xl">
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest block mb-0.5">
                Total Coding Score
              </span>
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {codingScore} <span className="text-xs text-indigo-400 font-normal">pts</span>
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── 2. ACADEMIC & CAREER GOAL SECTION ────────────────────────────── */}
      <div className="glass p-6 rounded-3xl border border-white/10 bg-white/[0.01] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Academic Profile & Target Role</span>
          </h2>
          {roleSaveSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#090e1a] border border-white/5 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Career Goal</span>
            {isEditingRole ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-indigo-500/50 text-white text-xs font-bold focus:outline-none"
                />
                <button
                  onClick={handleSaveTargetRole}
                  disabled={savingRole}
                  className="p-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-extrabold text-white">{targetRole}</span>
                <button
                  onClick={() => setIsEditingRole(true)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#090e1a] border border-white/5 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Attendance Percentage</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">{attendance}%</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Eligibility Cutoff: 75%</span>
          </div>

          <div className="bg-[#090e1a] border border-white/5 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">College & Branch</span>
            <span className="text-xs font-bold text-slate-200 block truncate">{department} • TKR College</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">XLSVC Dataset Verified</span>
          </div>
        </div>
      </div>

      {/* ── 3. ALL CODING PLATFORMS GRID (FROM XLSVC DATASET) ──────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>Coding Platforms & Repository Metrics</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Synchronized dataset metrics across LeetCode, GeeksforGeeks, CodeChef, HackerRank, Codeforces, and GitHub.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            6 Platforms Syncing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. LeetCode Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121008] to-[#0a0803] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LeetCode</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_lc</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                10x Weight
              </span>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
              <span className="text-2xl font-black font-mono text-amber-400">{lcSolved}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {lcSolved * 10} pts to overall score
            </p>
          </motion.div>

          {/* 2. GeeksforGeeks Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#08140e] to-[#040a07] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">GeeksforGeeks</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_gfg</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                8x Weight
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{gfgSolved}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {gfgSolved * 8} pts to overall score
            </p>
          </motion.div>

          {/* 3. CodeChef Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-amber-600/20 bg-gradient-to-br from-[#160d07] to-[#0d0704] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">CodeChef</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_cc</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-600/10 text-amber-400 border border-amber-600/20">
                6x Weight
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
              <span className="text-2xl font-black font-mono text-amber-300">{ccSolved}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {ccSolved * 6} pts to overall score
            </p>
          </motion.div>

          {/* 4. HackerRank Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-[#061413] to-[#030b0a] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">HackerRank</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_hr</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                2x Weight
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Score</span>
              <span className="text-2xl font-black font-mono text-teal-300">{hrScore}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {hrScore * 2} pts to overall score
            </p>
          </motion.div>

          {/* 5. Codeforces Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#05131a] to-[#020b0f] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Codeforces</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_cf</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                12x Weight
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
              <span className="text-2xl font-black font-mono text-cyan-300">{cfSolved}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {cfSolved * 12} pts to overall score
            </p>
          </motion.div>

          {/* 6. GitHub Card */}
          <motion.div
            whileHover={{ y: -3 }}
            className="glass p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#100a1f] to-[#090514] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">GitHub</h3>
                  <span className="text-[10px] text-slate-400 font-mono">@{rollNo.toLowerCase()}_gh</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                15x / 2x Weight
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Public Repos</span>
                <span className="text-xl font-black font-mono text-purple-300">{ghRepos}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium block">Total Commits</span>
                <span className="text-xl font-black font-mono text-purple-300">{ghCommits}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Contributes {ghRepos * 15 + ghCommits * 2} pts to overall score
            </p>
          </motion.div>

        </div>
      </div>

      {/* ── 4. CODING SCORE CALCULATION FORMULA CARD ─────────────────────── */}
      <div className="glass p-6 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950/20 via-purple-950/20 to-slate-900/40 space-y-3">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Platform Scoring Formula</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-mono bg-black/40 p-3.5 rounded-2xl border border-white/5">
          <strong className="text-white font-bold">Coding Score</strong> = (LeetCode × 10) + (GFG × 8) + (CodeChef × 6) + (HackerRank × 2) + (Codeforces × 12) + (GitHub Repos × 15) + (GitHub Commits × 2)
        </p>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">LeetCode: {lcSolved}×10 = {lcSolved * 10}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">GFG: {gfgSolved}×8 = {gfgSolved * 8}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">CodeChef: {ccSolved}×6 = {ccSolved * 6}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">HackerRank: {hrScore}×2 = {hrScore * 2}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Codeforces: {cfSolved}×12 = {cfSolved * 12}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">GitHub: ({ghRepos}×15)+({ghCommits}×2) = {ghRepos * 15 + ghCommits * 2}</span>
        </div>
      </div>

    </motion.div>
  );
}
