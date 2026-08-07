"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserCheck, 
  FilePlus, 
  MessageSquare,
  Upload,
  Calendar,
  GraduationCap,
  BookOpen,
  Zap,
  BarChart2,
  ClipboardCheck,
  Mail
} from "lucide-react";

import { useAuth } from "@/lib/auth";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FacultyDashboard() {
  const { session } = useAuth();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
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

          <Link href="/messages" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1a1f2d] hover:bg-[#222839] border border-white/5 transition-colors group h-40">
            <div className="w-12 h-12 rounded-full bg-[#7b341e]/30 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-[#ed8936]" />
            </div>
            <span className="text-[13px] font-semibold text-slate-300">Message Student</span>
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
          
          <div className="flex flex-col justify-between p-6 rounded-2xl bg-[#1a1f2d] border border-white/5 h-44 hover:bg-[#222839] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#7b341e]/30 flex items-center justify-center border border-[#ed8936]/10">
              <ClipboardCheck className="w-5 h-5 text-[#ed8936]" />
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-1">14</div>
              <div className="text-[13px] font-medium text-[#8a94a6]">Pending Reviews</div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 rounded-2xl bg-[#1a1f2d] border border-white/5 h-44 hover:bg-[#222839] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#44337a]/30 flex items-center justify-center border border-[#9f7aea]/10">
              <Mail className="w-5 h-5 text-[#9f7aea]" />
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-1">5</div>
              <div className="text-[13px] font-medium text-[#8a94a6]">New Messages</div>
            </div>
          </div>

        </div>
      </motion.div>

    </motion.div>
  );
}
