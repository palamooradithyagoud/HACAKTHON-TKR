"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertTriangle, CheckCircle2, 
  ChevronRight, X, Sparkles, Code, Award, Calendar, Clock, Save, Edit3, Globe
} from "lucide-react";

// 1. Generate exactly 80 mock students (4 Years, 2 Depts, 2 Sections, 5 Students each)
const generateMockStudents = () => {
  const students = [];
  const years = [1, 2, 3, 4];
  const depts = ["CSE", "CSM"];
  const sections = ["A", "B"];
  
  let idCounter = 1;
  years.forEach(year => {
    depts.forEach(dept => {
      sections.forEach(section => {
        for (let i = 1; i <= 5; i++) {
          const attendance = Math.floor(Math.random() * 40) + 60; // 60-100%
          const codingScore = Math.floor(Math.random() * 600) + 200; // 200-800
          const placement = Math.floor(Math.random() * 50) + 50; // 50-100%
          
          const isRisk = attendance < 75 || codingScore < 400;
          const riskReasons = [];
          if (attendance < 75) riskReasons.push("Attendance is below 75% threshold.");
          if (codingScore < 400) riskReasons.push("Coding performance is below average.");

          students.push({
            id: `STU${year}${dept}${section}${i}`,
            name: `Student ${idCounter} (${dept})`,
            roll_number: `22XX1A${dept === 'CSE' ? '05' : '06'}${idCounter.toString().padStart(2, '0')}`,
            section,
            department: dept,
            year: year.toString(),
            academic_year: `Year ${year}`,
            attendance_percentage: attendance,
            coding_score: codingScore,
            placement_readiness_score: placement,
            faculty_notes: "",
            ai_insights: {
              risk_level: isRisk ? "high" : "low",
              risk_reasons: riskReasons
            },
            leetcode_handle: `student${idCounter}_lc`,
            github_handle: `student${idCounter}_gh`,
            assignment_history: [
              { submission_id: 1, title: "Data Structures Lab 1", status: "graded", marks_obtained: Math.floor(Math.random() * 5) + 5, max_marks: 10, subject: "DSA" },
              { submission_id: 2, title: "Mid Term Evaluation", status: "graded", marks_obtained: Math.floor(Math.random() * 20) + 10, max_marks: 30, subject: dept }
            ],
            timeline: [
              { title: "Submitted Assignment", description: "Completed DSA Lab 1 on time." },
              { title: "Platform Joined", description: "Linked LeetCode account." }
            ]
          });
          idCounter++;
        }
      });
    });
  });
  return students;
};

const ALL_STUDENTS = generateMockStudents();

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

  // Filter students based on all filters
  const filteredStudents = useMemo(() => {
    return ALL_STUDENTS.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.roll_number.toLowerCase().includes(search.toLowerCase());
      const matchesYear = yearFilter === "all" || s.year === yearFilter;
      const matchesDept = deptFilter === "all" || s.department === deptFilter;
      const matchesSection = sectionFilter === "all" || s.section === sectionFilter;
      return matchesSearch && matchesYear && matchesDept && matchesSection;
    });
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

      {/* STUDENT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStudents.length === 0 ? (
           <div className="col-span-full py-20 text-center text-slate-500 text-sm font-medium">
             No students found matching your filters.
           </div>
        ) : (
          filteredStudents.map((student: any) => {
            const isRisk = student.attendance_percentage < 75.0 || student.coding_score < 400;
            return (
              <motion.div
                layoutId={`card-${student.id}`}
                onClick={() => handleOpenStudent(student)}
                whileHover={{ y: -4, borderColor: "rgba(139, 92, 246, 0.3)" }}
                key={student.id}
                className="glass p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1223] to-[#070b14] shadow-md cursor-pointer select-none flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[140px]">{student.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {student.roll_number}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">Y{student.year}</span>
                        <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">{student.department}</span>
                        <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">Sec {student.section}</span>
                      </div>
                    </div>
                    {isRisk ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" /> Risk
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Safe
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase block mb-0.5">Attnd.</span>
                      <span className={`text-xs font-black font-mono ${student.attendance_percentage < 75.0 ? "text-rose-400" : "text-white"}`}>
                        {student.attendance_percentage}%
                      </span>
                    </div>
                    <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase block mb-0.5">Code</span>
                      <span className={`text-xs font-black font-mono ${student.coding_score < 400 ? "text-rose-400" : "text-white"}`}>
                        {student.coding_score}
                      </span>
                    </div>
                    <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase block mb-0.5">Prep</span>
                      <span className="text-xs font-black font-mono text-cyan-400">
                        {student.placement_readiness_score}%
                      </span>
                    </div>
                  </div>
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
