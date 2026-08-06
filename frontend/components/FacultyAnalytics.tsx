"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart3, Users, ClipboardList, Target, TrendingUp,
  Award, Brain, AlertTriangle, BookOpen
} from "lucide-react";

import { fetchFacultyStudents, fetchFacultyDashboard } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

export default function FacultyAnalytics() {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: fetchFacultyStudents
  });

  const { data: dashboardData, isLoading: loadingDash } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: fetchFacultyDashboard
  });

  const stats = useMemo(() => {
    if (students.length === 0) return {
      avgAttendance: 0,
      avgCoding: 0,
      avgPlacement: 0,
      atRiskCount: 0,
      aboveCutoffCount: 0
    };

    const totalAttendance = students.reduce((acc: number, curr: any) => acc + curr.attendance_percentage, 0);
    const totalCoding = students.reduce((acc: number, curr: any) => acc + curr.coding_score, 0);
    const totalPlacement = students.reduce((acc: number, curr: any) => acc + curr.placement_readiness_score, 0);
    
    const atRisk = students.filter((s: any) => s.attendance_percentage < 75.0 || s.coding_score < 400).length;
    
    return {
      avgAttendance: Math.round((totalAttendance / students.length) * 10) / 10,
      avgCoding: Math.round(totalCoding / students.length),
      avgPlacement: Math.round((totalPlacement / students.length) * 10) / 10,
      atRiskCount: atRisk,
      aboveCutoffCount: students.length - atRisk
    };
  }, [students]);

  if (loadingStudents || loadingDash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          COMPUTING COHORT STATISTICS...
        </p>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-16"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Performance Analytics</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Aggregated cohort analysis, placement readiness indices, and risk alerts.
          </p>
        </div>
      </div>

      {/* METRIC CARD STRIPE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={cardVariants} className="glass p-5 rounded-2xl border border-white/10 bg-[#0c1325]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Average Attendance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.avgAttendance}%</span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> CSE Avg
            </span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${stats.avgAttendance}%` }} />
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="glass p-5 rounded-2xl border border-white/10 bg-[#0c1325]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Average Coding Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.avgCoding}</span>
            <span className="text-[10px] font-bold text-indigo-400 flex items-center">
              pts
            </span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${(stats.avgCoding / 1000) * 100}%` }} />
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="glass p-5 rounded-2xl border border-white/10 bg-[#0c1325]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Placement Readiness</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.avgPlacement}%</span>
            <span className="text-[10px] font-bold text-cyan-400">Target</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-cyan-500" style={{ width: `${stats.avgPlacement}%` }} />
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="glass p-5 rounded-2xl border border-white/10 bg-[#0c1325]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Risk Profile Flags</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">{stats.atRiskCount}</span>
            <span className="text-[10px] font-bold text-slate-400">Students at Risk</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${(stats.atRiskCount / students.length) * 100}%` }} />
          </div>
        </motion.div>
      </div>

      {/* COHORT BREAKDOWN SECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column - Academic growth & stats */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Visualizing Student distribution using pure CSS charts */}
          <motion.div variants={cardVariants} className="glass p-6 rounded-2xl border border-white/10 flex-1 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white mb-2">Student Performance Matrix</h3>
            <p className="text-xs text-slate-500 mb-6">Comparison of Coding Score vs Attendance percentage across section A & B.</p>
            
            <div className="space-y-4">
              {students.map((student: any) => {
                const isRisk = student.attendance_percentage < 75.0 || student.coding_score < 400;
                return (
                  <div key={student.id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">{student.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{student.roll_number}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                        <span>Attendance: <strong className={student.attendance_percentage < 75.0 ? "text-rose-400" : "text-slate-200"}>{student.attendance_percentage}%</strong></span>
                        <span>Coding: <strong className={student.coding_score < 400 ? "text-rose-400" : "text-slate-200"}>{student.coding_score}</strong></span>
                      </div>
                    </div>
                    {/* Double Bar */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${student.attendance_percentage < 75.0 ? "bg-rose-500" : "bg-purple-500"}`} style={{ width: `${student.attendance_percentage}%` }} />
                      </div>
                      <div className="bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${student.coding_score < 400 ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(100, (student.coding_score / 1000) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Academic Placement Readiness Breakdown */}
          <motion.div variants={cardVariants} className="glass p-6 rounded-2xl border border-white/10 flex-1 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white mb-2">Placement Readiness Analysis</h3>
            <p className="text-xs text-slate-500 mb-6">Percentage likelihood of direct recruitment eligibility based on resume scoring and aptitude quiz metrics.</p>
            
            <div className="space-y-5">
              {students.map((student: any) => {
                const score = student.placement_readiness_score;
                let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                let statusLabel = "Highly Prepared";
                if (score < 50.0) {
                  badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                  statusLabel = "Critical Gap";
                } else if (score < 80.0) {
                  badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  statusLabel = "Preparing";
                }

                return (
                  <div key={student.id} className="flex items-center gap-4">
                    <div className="w-24 text-xs font-bold text-slate-300 truncate">{student.name}</div>
                    <div className="flex-1 bg-white/5 h-3.5 rounded-xl overflow-hidden p-0.5 border border-white/10">
                      <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-lg transition-all" style={{ width: `${score}%` }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white font-mono w-10 text-right">{score}%</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>

        {/* Right Column - Status breakdown & stats */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Cohort Risk Breakdown Card */}
          <motion.div variants={cardVariants} className="glass p-6 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Cohort Risk Status</h3>
              <p className="text-xs text-slate-500 mb-6">Current split of students meeting critical metrics.</p>
              
              {/* Pie Chart Representation in SVG */}
              <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  
                  {/* High Risk segment (red) */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" stroke="#f43f5e" 
                    strokeWidth="3.5"
                    strokeDasharray={`${(stats.atRiskCount / students.length) * 100} ${100 - (stats.atRiskCount / students.length) * 100}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Safe Segment (green) */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" stroke="#10b981" 
                    strokeWidth="3"
                    strokeDasharray={`${(stats.aboveCutoffCount / students.length) * 100} ${100 - (stats.aboveCutoffCount / students.length) * 100}`}
                    strokeDashoffset={`${-(stats.atRiskCount / students.length) * 100}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-400">Total Cohort</span>
                  <span className="text-2xl font-black text-white">{students.length}</span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-xl border border-white/5 bg-[#0a0e1b]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">Under Control</span>
                  </div>
                  <span className="text-emerald-400 font-mono">{stats.aboveCutoffCount} students</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-xl border border-white/5 bg-[#0a0e1b]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-slate-300">At Academic Risk</span>
                  </div>
                  <span className="text-rose-400 font-mono">{stats.atRiskCount} students</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Academic Engagement KPI */}
          <motion.div variants={cardVariants} className="glass p-6 rounded-2xl border border-white/10 bg-white/[0.01] flex-1">
            <h3 className="text-sm font-bold text-white mb-1">Academic Engagement Index</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregate evaluation completion rate.</p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-[#0a0e1b] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Evaluations Completed</span>
                  <span className="text-lg font-black text-slate-200">
                    {students.length * metrics.total_assignments - metrics.pending_reviews} / {students.length * metrics.total_assignments}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold font-mono">
                  {Math.round(((students.length * metrics.total_assignments - metrics.pending_reviews) / Math.max(1, students.length * metrics.total_assignments)) * 100)}%
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-[#0a0e1b] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unrated Submissions</span>
                  <span className="text-lg font-black text-amber-400">
                    {metrics.pending_reviews}
                  </span>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
