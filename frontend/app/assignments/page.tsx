"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, Search, Filter, PlusCircle, Save, 
  X, Sparkles, CheckCircle2, Clock, AlertTriangle, FileText,
  User, Send, MessageSquare, BookOpen
} from "lucide-react";

import { 
  fetchFacultyAssignments, 
  createFacultyAssignment, 
  evaluateFacultySubmission 
} from "@/lib/api";

export default function AssignmentsPage() {
  const qc = useQueryClient();

  // Dialog / Drawer States
  const [createOpen, setCreateOpen] = useState(false);
  const [evaluateSub, setEvaluateSub] = useState<any | null>(null);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Form States for Create Assignment
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState(10);
  const [attachments, setAttachments] = useState("");
  
  // Evaluation States
  const [gradeMarks, setGradeMarks] = useState(10);
  const [gradeFeedback, setGradeFeedback] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["faculty-assignments"],
    queryFn: fetchFacultyAssignments
  });

  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => createFacultyAssignment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-assignments"] });
      setCreateOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setDeadline("");
      setMaxMarks(10);
      setAttachments("");
    }
  });

  const evaluateMutation = useMutation({
    mutationFn: (payload: any) => evaluateFacultySubmission(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-assignments"] });
      setEvaluateSub(null);
      setGradeFeedback("");
    }
  });

  // Filters
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub: any) => {
      const matchesSearch = sub.student_name.toLowerCase().includes(search.toLowerCase()) || 
                            sub.assignment_title.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === "all" || sub.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [submissions, search, subjectFilter]);

  // Compute metrics
  const summaryStats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s: any) => s.status === "graded").length;
    const pending = submissions.filter((s: any) => s.status === "pending").length;
    return { total, graded, pending };
  }, [submissions]);

  // Handle Publish Assignment
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;
    setIsSubmitting(true);
    await createMutation.mutateAsync({
      title,
      description,
      subject,
      deadline: new Date(deadline).toISOString(),
      max_marks: maxMarks,
      attachments
    });
    setIsSubmitting(false);
  };

  // Handle Grade Submission
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluateSub) return;
    setIsGrading(true);
    await evaluateMutation.mutateAsync({
      submission_id: evaluateSub.id,
      marks_obtained: gradeMarks,
      feedback: gradeFeedback
    });
    setIsGrading(false);
  };

  const handleOpenEvaluate = (sub: any) => {
    setEvaluateSub(sub);
    setGradeMarks(sub.marks_obtained || 10);
    setGradeFeedback(sub.feedback || "");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          LOADING ASSIGNMENTS PLATFORM...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Assignment Tracker</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Publish coursework files, grade student answers, and track evaluation progress.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Assignment</span>
        </button>
      </div>

      {/* STATS STRIPE */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/10 bg-white/[0.01]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Submissions</span>
          <span className="text-2xl font-black text-white mt-1 block font-mono">{summaryStats.total}</span>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/10 bg-white/[0.01]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Evaluations Completed</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">{summaryStats.graded}</span>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/10 bg-white/[0.01]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">{summaryStats.pending}</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 bg-white/[0.01]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or assignment title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none"
        >
          <option value="all">All Subjects</option>
          <option>Data Structures & Algorithms</option>
          <option>System Design & Architecture</option>
          <option>Web Development Lab</option>
        </select>
      </div>

      {/* SUBMISSIONS LIST */}
      <div className="glass rounded-2xl border border-white/10 bg-white/[0.01] overflow-hidden p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Student Submissions Log</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider pb-2">
                <th className="py-2.5">Student</th>
                <th className="py-2.5">Assignment</th>
                <th className="py-2.5">Date Submitted</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 font-semibold text-slate-200">{sub.student_name}</td>
                    <td className="py-3 text-slate-400">
                      <div className="font-semibold text-slate-300">{sub.assignment_title || "General Tasks"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{sub.subject}</div>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="py-3">
                      {sub.status === "graded" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Graded ({sub.marks_obtained} pts)
                        </span>
                      ) : sub.submitted_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/5">
                          <AlertTriangle className="w-3 h-3" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {sub.submitted_at ? (
                        <button
                          onClick={() => handleOpenEvaluate(sub)}
                          className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-[11px] font-bold text-slate-300 hover:text-white transition-all"
                        >
                          Grade / Feedback
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-600 pr-3 select-none">No Submission</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No submissions matching current parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ASSIGNMENT DRAWER */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 32 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-purple-400" />
                  <span>Publish Assignment</span>
                </h2>
                <button onClick={() => setCreateOpen(false)} className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignment Title</label>
                  <input type="text" placeholder="e.g. Advanced AVL Balance Trees" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                    <option>Data Structures & Algorithms</option>
                    <option>System Design & Architecture</option>
                    <option>Web Development Lab</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deadline Date & Time</label>
                  <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maximum Marks</label>
                  <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attachments / Reference PDF URL</label>
                  <input type="text" placeholder="e.g. https://example.com/handout.pdf" value={attachments} onChange={(e) => setAttachments(e.target.value)} className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                  <textarea placeholder="Write instructions, grading rubrics, or coding questions..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none resize-none" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg transition-all">
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Publishing..." : "Publish to Class Register"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EVALUATION DRAWER */}
      <AnimatePresence>
        {evaluateSub && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEvaluateSub(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 32 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Review Submission</span>
                </h2>
                <button onClick={() => setEvaluateSub(null)} className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Candidate Info</span>
                  <div className="text-xs font-bold text-slate-200">{evaluateSub.student_name}</div>
                  <div className="text-xs font-medium text-slate-400">{evaluateSub.assignment_title}</div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Submission Content</span>
                  <div className="text-xs font-mono p-3 rounded-lg bg-black/30 border border-white/5 text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {evaluateSub.submission_content || "No text description provided. Standard attachments uploaded."}
                  </div>
                </div>

                <form onSubmit={handleGradeSubmit} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score Awarded</label>
                    <input type="number" min={0} step={0.5} value={gradeMarks} onChange={(e) => setGradeMarks(Number(e.target.value))} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Teacher Feedback</label>
                    <textarea placeholder="Provide detailed code remarks, AVL balance check corrections, or improvement points..." rows={4} value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} required className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none resize-none" />
                  </div>

                  <button type="submit" disabled={isGrading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg transition-all">
                    <Save className="w-4 h-4" />
                    {isGrading ? "Submitting Grade..." : "Submit Score & Feedback"}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
