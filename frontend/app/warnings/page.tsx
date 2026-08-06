"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Users, ShieldAlert, Sparkles, ChevronRight, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";

import { fetchFacultyStudents } from "@/lib/api";

export default function WarningsPage() {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: fetchFacultyStudents
  });

  const flaggedStudents = useMemo(() => {
    return students.filter((s: any) => s.attendance_percentage < 75.0 || s.coding_score < 400);
  }, [students]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          LOADING COHORT ALERTS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <span>System Alerts & Risk Warnings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Real-time tracking of students who require immediate academic or technical mentoring.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold font-mono text-lg">
            {flaggedStudents.length}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">At Risk Candidates</span>
            <span className="text-sm font-black text-slate-200">Requires Urgent Interaction</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Diagnostics</span>
            <span className="text-sm font-black text-slate-200">Automated Mentor Support Active</span>
          </div>
        </div>
      </div>

      {/* DETAILED ALERTS LIST */}
      <div className="glass border border-white/10 rounded-2xl bg-white/[0.01] p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cohort Flag Registry</h3>

        <div className="space-y-3.5">
          {flaggedStudents.length > 0 ? (
            flaggedStudents.map((s: any) => {
              const hasLowAttendance = s.attendance_percentage < 75.0;
              const hasLowCoding = s.coding_score < 400;
              
              return (
                <div key={s.id} className="p-4 rounded-xl border border-white/5 bg-[#090e1a] hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{s.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {s.roll_number}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {hasLowAttendance && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Low Attendance ({s.attendance_percentage}%)
                        </span>
                      )}
                      {hasLowCoding && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low Coding Activity ({s.coding_score} pts)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href="/students"
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href="/messages"
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition-all flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact</span>
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 text-xs py-10 text-center font-medium">
              No students are currently flagged as academic risks.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
