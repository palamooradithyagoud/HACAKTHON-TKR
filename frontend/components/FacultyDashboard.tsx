"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, MessageSquare, PlusCircle, Bookmark,
  Calendar, GraduationCap, Mail, UserCheck, FilePlus, Upload
} from "lucide-react";

import { fetchFacultyDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
};

export default function FacultyDashboard() {
  const { session } = useAuth();

  // Queries
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: fetchFacultyDashboard,
    refetchOnWindowFocus: false
  });

  const metrics = dashboardData?.metrics || {
    pending_reviews: 0,
    low_attendance_students: 0,
    low_coding_students: 0,
    total_students: 0,
    total_assignments: 0
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse uppercase">
          Waking up Dashboard...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6 pb-16 text-[#f0f4ff] font-sans antialiased mt-6"
    >
      
      {/* 1. Welcome Card wishing the Faculty */}
      <motion.div variants={cardVariants} className="glass p-6 rounded-2xl border border-white/10 bg-white/[0.01] space-y-4">
        <h2 className="text-xl font-black text-white tracking-tight leading-snug">
          Good Morning, {session?.name || "Prof. Sarah Chen"}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Computer Science Dept</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-450 shrink-0" />
            <span>{currentDateFormatted}</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <BookIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Semester 5</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Actions Box containing the 4 sub-boxes */}
      <motion.div variants={cardVariants} className="glass border border-white/10 p-6 rounded-2xl bg-white/[0.01]">
        <div className="grid grid-cols-4 gap-4">
          <Link href="/attendance" className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-purple-500/[0.05] group transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Mark Attendance</span>
          </Link>

          <Link href="/assignments" className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-cyan-500/[0.05] group transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <FilePlus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Create Assignment</span>
          </Link>

          <Link href="/messages" className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-amber-500/[0.05] group transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Message Student</span>
          </Link>

          <Link href="/learning-materials" className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-blue-500/[0.05] group transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Upload Material</span>
          </Link>
        </div>
      </motion.div>

      {/* 3. Metrics Cards (Pending Reviews & New Messages) */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Reviews</span>
            <span className="text-xl font-black text-white mt-1 block font-mono">
              {metrics.pending_reviews || "14"}
            </span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Mail className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Messages</span>
            <span className="text-xl font-black text-white mt-1 block font-mono">
              5
            </span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

// Minimal BookIcon helper
function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
