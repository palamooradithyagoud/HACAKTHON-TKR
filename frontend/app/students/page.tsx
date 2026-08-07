"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertTriangle, CheckCircle2, 
  ChevronRight, X, Sparkles, Code, Award, Calendar, Clock, Save, Edit3, Globe
} from "lucide-react";

import { getSharedMockStudents } from "@/lib/mockData";

const ALL_STUDENTS = getSharedMockStudents();

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  
  // Faculty Remarks temporary state
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenStudent = (student: any) => {
    setActiveStudentId(student.id);
    setNotesInput(student.faculty_notes || "");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId) return;
    setSavingNotes(true);
    // Simulate network delay
    setTimeout(() => {
       setSavingNotes(false);
       setSaveSuccess(true);
       setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  // Filter students based on all filters and sort descending by coding score
  const filteredStudents = useMemo(() => {
    const filtered = ALL_STUDENTS.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.roll_number.toLowerCase().includes(search.toLowerCase());
      const matchesYear = yearFilter === "all" || s.year === yearFilter;
      const matchesDept = deptFilter === "all" || s.department === deptFilter;
      const matchesSection = sectionFilter === "all" || s.section === sectionFilter;
      return matchesSearch && matchesYear && matchesDept && matchesSection;
    });
    
    // Sort descending by coding score
    return filtered.sort((a, b) => b.coding_score - a.coding_score);
  }, [search, yearFilter, deptFilter, sectionFilter]);

  const detail = useMemo(() => ALL_STUDENTS.find(s => s.id === activeStudentId), [activeStudentId]);

  return (
    <div className="space-y-6 pb-16 relative mt-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Scoreboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            College-wide student scoreboard. View or filter by your specific department, year, and section.
          </p>
        </div>
        <div className="bg-[#1a1f2d] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <div className="text-sm">
            <span className="text-white font-bold">{filteredStudents.length}</span>
            <span className="text-slate-400 ml-1">Students shown</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row gap-3 bg-white/[0.01]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden xl:inline ml-2" />
          
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50 transition-all"
          >
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50 transition-all"
          >
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="CSM">CSM</option>
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50 transition-all"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* STUDENT LIST ROW LAYOUT */}
      <div className="flex flex-col gap-3">
        {filteredStudents.length === 0 ? (
           <div className="py-20 text-center text-slate-500 text-sm font-medium">
             No students found matching your filters.
           </div>
        ) : (
          filteredStudents.map((student: any, index: number) => {
            const isRisk = student.attendance_percentage < 75.0 || student.coding_score < 400;
            return (
              <motion.div
                layoutId={`card-${student.id}`}
                onClick={() => handleOpenStudent(student)}
                whileHover={{ x: 4, borderColor: "rgba(139, 92, 246, 0.3)" }}
                key={student.id}
                className="glass p-4 rounded-xl border border-white/10 bg-gradient-to-r from-[#0c1223] to-[#070b14] shadow-sm cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Left side: Info */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                  
                  {/* Rank Badge */}
                  <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400">
                    #{index + 1}
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-white tracking-tight">{student.name}</h3>
                      {isRisk ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Risk
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Safe
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{student.roll_number}</p>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-300 font-semibold whitespace-nowrap">Year {student.year}</span>
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-300 font-semibold whitespace-nowrap">{student.department}</span>
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-300 font-semibold whitespace-nowrap">Sec {student.section}</span>
                  </div>
                </div>

                {/* Right side: Stats */}
                <div className="flex items-center justify-between md:justify-end gap-6 ml-0 md:ml-auto border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                  <div className="text-center min-w-[60px]">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Attendance</span>
                    <span className={`text-sm font-black font-mono ${student.attendance_percentage < 75.0 ? "text-rose-400" : "text-white"}`}>{student.attendance_percentage}%</span>
                  </div>
                  <div className="text-center min-w-[60px] bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5">
                    <span className="text-[9px] font-extrabold text-purple-400 uppercase block mb-0.5">Coding Score</span>
                    <span className={`text-[15px] font-black font-mono ${student.coding_score < 400 ? "text-rose-400" : "text-white"}`}>{student.coding_score}</span>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Readiness</span>
                    <span className="text-sm font-black font-mono text-cyan-400">{student.placement_readiness_score}%</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 hidden md:block ml-2" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* DETAILED STUDENT DRAWER (MODAL OVERLAY) */}
      <AnimatePresence>
        {activeStudentId && detail && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStudentId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            />

            {/* Slide-over */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md md:max-w-xl bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto flex flex-col"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white tracking-tight">{detail.name}</h2>
                      {detail.ai_insights?.risk_level === "high" && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Critical Alert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Roll: {detail.roll_number} • {detail.department} • Section {detail.section} • Year {detail.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveStudentId(null)}
                    className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI INSIGHTS CARD */}
                <div className="p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-indigo-950/10">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Student Academic Diagnosis</span>
                  </h4>
                  {detail.ai_insights?.risk_reasons?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {detail.ai_insights.risk_reasons.map((r: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex gap-2 font-medium">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">
                      Student is meeting all minimum performance criteria and guidelines. Keep up the encouragement.
                    </p>
                  )}
                </div>

                {/* STATS STRIPE */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-purple-400 mx-auto mb-1.5" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Attendance</span>
                    <span className="text-sm font-black text-white font-mono">{detail.attendance_percentage}%</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                    <Code className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Coding Score</span>
                    <span className="text-sm font-black text-white font-mono">{detail.coding_score} pts</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                    <Award className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Recruitment index</span>
                    <span className="text-sm font-black text-cyan-400 font-mono">{detail.placement_readiness_score}%</span>
                  </div>
                </div>

                {/* CODING PLATS */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Coding Profiles</h3>
                  <div className="flex gap-2">
                    {detail.leetcode_handle && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-slate-200">
                        <Code className="w-3.5 h-3.5 text-amber-500" />
                        LeetCode: <strong className="font-mono">@{detail.leetcode_handle}</strong>
                      </span>
                    )}
                    {detail.github_handle && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-slate-200">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        GitHub: <strong className="font-mono">@{detail.github_handle}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* REMARKS PANEL */}
                <form onSubmit={handleSaveNotes} className="space-y-3 p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                      <span>Private Faculty Notes & Remarks</span>
                    </h4>
                    {saveSuccess && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> Saved Successfully!
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Add private evaluation notes or study recovery plan actions..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-[#090e1a] border border-white/10 text-slate-200 text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingNotes || !notesInput.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingNotes ? "Saving Notes..." : "Save Note"}
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
