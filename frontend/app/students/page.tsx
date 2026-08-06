"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertTriangle, CheckCircle2, 
  BookOpen, ChevronRight, X, Sparkles, MessageSquare, 
  Globe, Code, Award, Calendar, Clock, Save, Edit3
} from "lucide-react";

import { 
  fetchFacultyStudents, 
  fetchFacultyStudentDetail, 
  saveFacultyStudentNotes 
} from "@/lib/api";

export default function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  
  // Faculty Remarks temporary state
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch cohort list
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: fetchFacultyStudents
  });

  // 2. Fetch specific student details when active
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["student-detail", activeStudentId],
    queryFn: () => fetchFacultyStudentDetail(activeStudentId!),
    enabled: !!activeStudentId
  });

  // Notes Mutation
  const saveNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => saveFacultyStudentNotes(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-detail", activeStudentId] });
      qc.invalidateQueries({ queryKey: ["faculty-students"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const handleOpenStudent = (student: any) => {
    setActiveStudentId(student.id);
    setNotesInput(student.faculty_notes || "");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId) return;
    setSavingNotes(true);
    await saveNotesMutation.mutateAsync({ id: activeStudentId, notes: notesInput });
    setSavingNotes(false);
  };

  // Filter students based on search and section filters
  const filteredStudents = students.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchesSection = sectionFilter === "all" || s.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          LOADING STUDENT COHORT...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Monitor scores, read live coding metrics, and view placement readiness status.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 bg-white/[0.01]">
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

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:inline" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((student: any) => {
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
                    <h3 className="text-sm font-bold text-white tracking-tight">{student.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {student.roll_number} • Section {student.section}
                    </p>
                  </div>
                  {isRisk ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" /> At Risk
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Safe
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
                  <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">Attend.</span>
                    <span className={`text-xs font-black font-mono ${student.attendance_percentage < 75.0 ? "text-rose-400" : "text-white"}`}>
                      {student.attendance_percentage}%
                    </span>
                  </div>
                  <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">Coding</span>
                    <span className={`text-xs font-black font-mono ${student.coding_score < 400 ? "text-rose-400" : "text-white"}`}>
                      {student.coding_score}
                    </span>
                  </div>
                  <div className="text-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">Prep Score</span>
                    <span className="text-xs font-black font-mono text-cyan-400">
                      {student.placement_readiness_score}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-400 group">
                <span>View Full Academic Profile</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAILED STUDENT DRAWER (MODAL OVERLAY) */}
      <AnimatePresence>
        {activeStudentId && (
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto flex flex-col justify-between"
            >
              {loadingDetail || !detail ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-[10px] font-mono text-slate-400 animate-pulse uppercase tracking-wider">Loading Student Details...</p>
                </div>
              ) : (
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
                        Roll: {detail.roll_number} • CSE • Section {detail.section} • {detail.academic_year}
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

                  {/* TABS FOR HISTORIES */}
                  <div className="grid grid-cols-2 gap-5">
                    
                    {/* Assignment Submission History */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments Log</h4>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {detail.assignment_history?.length > 0 ? (
                          detail.assignment_history.map((ah: any) => (
                            <div key={ah.submission_id} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-200 truncate pr-2 block">{ah.title}</span>
                                {ah.status === "graded" ? (
                                  <span className="text-[10px] text-emerald-400 font-bold">{ah.marks_obtained}/{ah.max_marks}</span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Unrated</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block leading-tight">{ah.subject}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-xs py-3 text-center">No assignments logged.</div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Activity */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Timeline</h4>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {detail.timeline?.length > 0 ? (
                          detail.timeline.map((act: any, idx: number) => (
                            <div key={idx} className="flex gap-2.5 p-2 rounded-xl bg-white/[0.01] border border-white/5">
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-300 block">{act.title}</span>
                                <p className="text-[10px] text-slate-500 leading-tight">{act.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-xs py-3 text-center">No recent activities.</div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
