"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserCheck, 
  FilePlus, 
  Upload,
  Calendar,
  GraduationCap,
  Zap,
  BarChart2,
  ClipboardCheck,
  Mail,
  AlertTriangle,
  Trophy,
  ChevronRight,
  Code
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useAuth } from "@/lib/auth";
import { getSharedMockStudents } from "@/lib/mockData";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const;
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function FacultyDashboard() {
  const { session } = useAuth();
  
  const students = getSharedMockStudents();
  const topCoders = [...students].sort((a, b) => (b.coding_score || 0) - (a.coding_score || 0)).slice(0, 4);

  const attendanceWarnings = students.filter(s => (s.attendance_percentage ?? (s as any).attendance ?? 100) < 75).slice(0, 3);
  const assignmentWarnings = students.filter(s => s.unsubmitted_assignments && s.unsubmitted_assignments.length > 0).slice(0, 3);
  const totalAttendanceWarnings = students.filter(s => (s.attendance_percentage ?? (s as any).attendance ?? 100) < 75).length;
  const totalAssignmentWarnings = students.filter(s => s.unsubmitted_assignments && s.unsubmitted_assignments.length > 0).length;

  // Live counts from backend
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [newMessages, setNewMessages] = useState<number | null>(null);

  useEffect(() => {
    // Fetch pending assignment reviews count
    fetch(`${API_BASE}/api/faculty/assignments`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.submissions) {
          const pending = data.submissions.filter((s: any) => s.status === "pending").length;
          setPendingReviews(pending);
        }
      })
      .catch(() => {});

    // Fetch unread messages count across all students
    const allStudents = getSharedMockStudents();
    let unread = 0;
    let fetched = 0;
    allStudents.forEach((s: any) => {
      fetch(`${API_BASE}/api/faculty/messages/${s.id}`)
        .then(r => r.ok ? r.json() : [])
        .then((msgs: any[]) => {
          unread += msgs.filter((m: any) => m.sender_id !== "faculty_demo" && !m.is_read).length;
          fetched++;
          if (fetched === allStudents.length) setNewMessages(unread);
        })
        .catch(() => { fetched++; if (fetched === allStudents.length) setNewMessages(unread); });
    });
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-5xl mx-auto space-y-8 text-[#f0f4ff] font-sans antialiased mt-6 px-2">
      
      {/* 1. Header Section (Welcome Banner) */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#1e2330] bg-gradient-to-br from-[#1a1f2d] to-[#121622] p-8 md:p-10 shadow-lg">
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Good Morning, {session?.name || "Prof. Sarah Chen"}
          </h1>
          <p className="text-[#9ba1b0] text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            Welcome back to your dashboard. Here's what's happening today in the<br/>Computer Science department.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-6 text-[13px] font-semibold text-[#8a94a6]">
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5">
              <GraduationCap className="w-4 h-4 text-[#8b92a5]" /> Computer Science Dept
            </div>
            <span className="w-1 h-1 rounded-full bg-[#4a5568]"></span>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5">
              <Calendar className="w-4 h-4 text-[#38b2ac]" /> Oct 24, 2024
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 fill-white" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <Link href="/attendance" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1a1f2d] hover:bg-[#222839] border border-white/5 transition-colors group h-40">
            <div className="w-12 h-12 rounded-full bg-[#44337a]/30 flex items-center justify-center mb-4">
              <UserCheck className="w-5 h-5 text-[#9f7aea]" />
            </div>
            <span className="text-[13px] font-semibold text-slate-300">Mark Attendance</span>
          </Link>

          <Link href="/assignments" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1a1f2d] hover:bg-[#222839] border border-white/5 transition-colors group h-40">
            <div className="w-12 h-12 rounded-full bg-[#234e52]/30 flex items-center justify-center mb-4">
              <FilePlus className="w-5 h-5 text-[#38b2ac]" />
            </div>
            <span className="text-[13px] font-semibold text-slate-300">Create Assignment</span>
          </Link>

          <Link href="/learning-materials" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1a1f2d] hover:bg-[#222839] border border-white/5 transition-colors group h-40">
            <div className="w-12 h-12 rounded-full bg-[#2a4365]/50 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5 text-[#63b3ed]" />
            </div>
            <span className="text-[13px] font-semibold text-slate-300">Upload Material</span>
          </Link>

        </div>
      </motion.div>

      {/* 3. Overview */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-[15px] font-bold text-[#38b2ac] flex items-center gap-2">
          <BarChart2 className="w-4 h-4" /> Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <Link href="/assignments" className="flex flex-col justify-between p-6 rounded-2xl bg-[#1a1f2d] border border-white/5 h-44 hover:bg-[#222839] transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-[#7b341e]/30 flex items-center justify-center border border-[#ed8936]/10">
              <ClipboardCheck className="w-5 h-5 text-[#ed8936]" />
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-1">
                {pendingReviews !== null ? pendingReviews : "—"}
              </div>
              <div className="text-[13px] font-medium text-[#8a94a6]">Pending Reviews</div>
            </div>
          </Link>

          <Link href="/messages" className="flex flex-col justify-between p-6 rounded-2xl bg-[#1a1f2d] border border-white/5 h-44 hover:bg-[#222839] transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-[#44337a]/30 flex items-center justify-center border border-[#9f7aea]/10">
              <Mail className="w-5 h-5 text-[#9f7aea]" />
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-1">
                {newMessages !== null ? newMessages : "—"}
              </div>
              <div className="text-[13px] font-medium text-[#8a94a6]">New Messages</div>
            </div>
          </Link>

        </div>
      </motion.div>

      {/* 4. FACULTY SECTION COHORT CODING LEADERBOARD */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-amber-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Student Coding Leaderboard (Cohort Top Coders)
          </h3>
          <Link href="/students" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors">
            <span>View Full Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-[#1a1f2d] border border-white/10 rounded-2xl p-4 space-y-3">
          {topCoders.map((s, idx) => (
            <Link key={s.id || idx} href="/students" className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                  idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                  idx === 1 ? "bg-slate-400/20 text-slate-200 border border-slate-400/40" :
                  idx === 2 ? "bg-amber-700/20 text-amber-400 border border-amber-700/40" :
                  "bg-white/5 text-slate-400 border border-white/10"
                }`}>
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-[10px] font-mono font-normal text-slate-400">{s.roll_number}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.department} • Year {s.year}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {s.coding_score} pts
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* 4. Active Warnings */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-[15px] font-bold text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Active Warnings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Attendance Warning */}
          <div className="flex flex-col p-6 rounded-2xl bg-[#1a1f2d] border border-rose-500/10 h-auto">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Attendance Below 65%
            </h4>
            <div className="space-y-2">
              {attendanceWarnings.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.roll_number}</div>
                  </div>
                  <span className="text-xs font-black font-mono text-rose-400">{s.attendance_percentage}%</span>
                </div>
              ))}
            </div>
            <Link href="/warnings" className="text-[11px] text-slate-400 hover:text-white mt-4 font-semibold transition-colors">
              View all {totalAttendanceWarnings} attendance warnings &rarr;
            </Link>
          </div>

          {/* Assignment Warning */}
          <div className="flex flex-col p-6 rounded-2xl bg-[#1a1f2d] border border-amber-500/10 h-auto">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Assignments Not Submitted
            </h4>
            <div className="space-y-2">
              {assignmentWarnings.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.roll_number}</div>
                  </div>
                  <span className="text-xs font-black text-amber-400 truncate max-w-[80px]">{s.unsubmitted_assignments[0]}</span>
                </div>
              ))}
            </div>
            <Link href="/warnings" className="text-[11px] text-slate-400 hover:text-white mt-4 font-semibold transition-colors">
              View all {totalAssignmentWarnings} assignment warnings &rarr;
            </Link>
          </div>

        </div>
      </motion.div>

    </motion.div>
  );
}
