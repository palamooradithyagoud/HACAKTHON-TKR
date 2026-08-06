"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, PlusCircle, Search, Save, X, 
  Sparkles, CheckCircle2, Clock, Users, ShieldAlert,
  ArrowRight, Radio, Tag, Send
} from "lucide-react";

import { 
  createFacultyAnnouncement, 
  fetchFacultyAnnouncements 
} from "@/lib/api";

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetScope, setTargetScope] = useState("all");
  const [targetValue, setTargetValue] = useState("All Classes");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["faculty-announcements"],
    queryFn: fetchFacultyAnnouncements
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => createFacultyAnnouncement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-announcements"] });
      setCreateOpen(false);
      // Reset Form
      setTitle("");
      setContent("");
      setTargetScope("all");
      setTargetValue("All Classes");
    }
  });

  // Handle submit
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsSubmitting(true);
    await createMutation.mutateAsync({
      title,
      content,
      target_scope: targetScope,
      target_value: targetScope === "all" ? "All Classes" : targetValue
    });
    setIsSubmitting(false);
  };

  const handleScopeChange = (scope: string) => {
    setTargetScope(scope);
    if (scope === "all") setTargetValue("All Classes");
    else if (scope === "department") setTargetValue("CSE");
    else if (scope === "year") setTargetValue("3rd Year");
    else if (scope === "section") setTargetValue("A");
    else if (scope === "subject") setTargetValue("Data Structures & Algorithms");
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((ann: any) => 
    ann.title.toLowerCase().includes(search.toLowerCase()) || 
    ann.content.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          LOADING NOTICE BOARD...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notice Board</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Publish announcements, alerts, and instructions to target departments/sections.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass p-4 rounded-2xl border border-white/10 bg-white/[0.01]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notice archive by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* ANNOUNCEMENT BLOCKS */}
      <div className="space-y-4">
        {filteredAnnouncements.map((ann: any) => (
          <div key={ann.id} className="glass p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1223] to-[#070b14] shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">{ann.title}</h3>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Published: {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : "Just Now"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  {ann.target_scope}: {ann.target_value}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-4xl">
              {ann.content}
            </p>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-10 glass rounded-2xl border border-white/10 text-slate-500 text-xs font-semibold">
            No notices found matching query. Click 'Publish Notice' to send announcements.
          </div>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT DRAWER */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 32 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-400" />
                  <span>Publish Announcement</span>
                </h2>
                <button onClick={() => setCreateOpen(false)} className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notice Title</label>
                  <input type="text" placeholder="e.g. Schedule Change for DSA Lab" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scope Target</label>
                    <select value={targetScope} onChange={(e) => handleScopeChange(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                      <option value="all">Entire College</option>
                      <option value="department">Department</option>
                      <option value="year">Specific Year</option>
                      <option value="section">Specific Section</option>
                      <option value="subject">Specific Subject</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Value</label>
                    {targetScope === "all" ? (
                      <input type="text" value="All Classes" disabled className="w-full p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-500 text-xs font-semibold focus:outline-none" />
                    ) : targetScope === "department" ? (
                      <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                        <option>CSE</option>
                        <option>ECE</option>
                        <option>EEE</option>
                      </select>
                    ) : targetScope === "year" ? (
                      <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                        <option>3rd Year</option>
                        <option>2nd Year</option>
                        <option>1st Year</option>
                      </select>
                    ) : targetScope === "section" ? (
                      <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                      </select>
                    ) : (
                      <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                        <option>Data Structures & Algorithms</option>
                        <option>System Design & Architecture</option>
                        <option>Web Development Lab</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detailed Body Content</label>
                  <textarea placeholder="Write full details, timings, instructions, or hyperlinks..." rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none resize-none" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg transition-all">
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Publishing Notice..." : "Send Announcement"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
