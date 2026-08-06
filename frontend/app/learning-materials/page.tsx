"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, PlusCircle, Search, Filter, Save, 
  X, Sparkles, BookOpen, Link2, PlayCircle, FileText,
  Clock, Download, ChevronRight, Eye, LayoutGrid
} from "lucide-react";

import { 
  createLearningMaterial, 
  fetchLearningMaterials 
} from "@/lib/api";

export default function LearningMaterialsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Form States
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pdf");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [semester, setSemester] = useState("5th Semester");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState("3rd Year");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["learning-materials"],
    queryFn: fetchLearningMaterials
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => createLearningMaterial(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-materials"] });
      setCreateOpen(false);
      // Reset Form
      setTitle("");
      setUrl("");
    }
  });

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m: any) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                            m.subject.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === "all" || m.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [materials, search, subjectFilter]);

  // Submit Handler
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    setIsSubmitting(true);
    await createMutation.mutateAsync({
      title,
      type,
      url,
      subject,
      semester,
      department,
      academic_year: year
    });
    setIsSubmitting(false);
  };

  const getIcon = (typeStr: string) => {
    switch (typeStr) {
      case "pdf": return <FileText className="w-5 h-5 text-rose-400" />;
      case "ppt": return <LayoutGrid className="w-5 h-5 text-amber-400" />;
      case "video": return <PlayCircle className="w-5 h-5 text-cyan-400" />;
      case "link": return <Link2 className="w-5 h-5 text-indigo-400" />;
      default: return <BookOpen className="w-5 h-5 text-purple-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          FETCHING ACADEMIC REPOSITORY...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Learning Materials</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Upload lecture notes, reference URLs, PowerPoint decks, and code sheets.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 bg-white/[0.01]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search materials by title or subject..."
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

      {/* MATERIALS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMaterials.map((mat: any) => (
          <div key={mat.id} className="glass p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1223] to-[#070b14] shadow-md flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 shrink-0 mt-0.5">
              {getIcon(mat.type)}
            </div>
            
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {mat.subject}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight mt-1.5 truncate">{mat.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {mat.department} • {mat.academic_year} • Semester: {mat.semester}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {mat.uploaded_at ? new Date(mat.uploaded_at).toLocaleDateString() : "Just Now"}
                </span>

                <a
                  href={mat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Resource</span>
                </a>
              </div>
            </div>
          </div>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-2 text-center py-10 glass rounded-2xl border border-white/10 text-slate-500 text-xs font-semibold">
            No academic resources found. Click 'Upload Material' to add notes.
          </div>
        )}
      </div>

      {/* UPLOAD DRAWER */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 32 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-purple-400" />
                  <span>Register Course Material</span>
                </h2>
                <button onClick={() => setCreateOpen(false)} className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Title</label>
                  <input type="text" placeholder="e.g. Design Patterns Cheat Sheet" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                    <option value="pdf">PDF Document</option>
                    <option value="ppt">PowerPoint Slides</option>
                    <option value="video">Lecture Video Link</option>
                    <option value="link">Reference Web Link</option>
                    <option value="practice_sheet">Practice Coding Sheet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document / Asset URL</label>
                  <input type="url" placeholder="https://example.com/notes.pdf" value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                    <option>Data Structures & Algorithms</option>
                    <option>System Design & Architecture</option>
                    <option>Web Development Lab</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                      <option>3rd Year</option>
                      <option>2nd Year</option>
                      <option>1st Year</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none">
                      <option>5th Semester</option>
                      <option>3rd Semester</option>
                      <option>1st Semester</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg transition-all">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Publishing..." : "Upload & Share"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
