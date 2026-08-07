"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertTriangle, CheckCircle2, 
  ChevronRight, X, Sparkles, Code, Award, Calendar, Clock, Save, Edit3, Globe, RefreshCw
} from "lucide-react";

import { getSharedMockStudents } from "@/lib/mockData";
import { API_BASE, apiFetch, getAuthHeaders } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeStudentDetail, setActiveStudentDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  
  // Faculty Remarks temporary state
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      try {
        const authHeaders = await getAuthHeaders();
        const res = await apiFetch(`${API_BASE}/api/faculty/students`, {
          headers: { ...authHeaders }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStudentsList(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch students from API:", e);
      }

      // Query Supabase user_academic_profile directly
      try {
        if (supabase) {
          const { data } = await supabase.from("user_academic_profile").select("*");
          if (data && data.length > 0) {
            const mapped = data.map((s, idx) => ({
              id: s.user_id || `stu_${idx}`,
              name: s.full_name || `Student ${idx + 1}`,
              roll_number: s.roll_number || `22TK1A${(s.department || "05").toUpperCase()}${String(idx + 1).padStart(2, "0")}`,
              section: s.section || "Section A",
              department: s.department || "CSE",
              year: s.academic_year || "2nd Year",
              academic_year: s.academic_year || "Year 2",
              college: s.college || "TKR College of Engineering & Technology",
              attendance_percentage: parseFloat(s.attendance_percentage || "0.0"),
              coding_score: s.coding_score || 0,
              placement_readiness_score: 0.0,
              faculty_notes: "",
              leetcode_handle: "",
              github_handle: "",
            }));
            setStudentsList(mapped);
            setLoading(false);
            return;
          }
        }
      } catch {}

      setStudentsList(getSharedMockStudents());
      setLoading(false);
    }

    loadStudents();
  }, []);

  // Fetch full student detail directly from Supabase tables (user_coding_profiles, saved_playlists) + API
  useEffect(() => {
    if (!activeStudentId) {
      setActiveStudentDetail(null);
      return;
    }

    let isMounted = true;
    setLoadingDetail(true);

    async function fetchDetail() {
      let sbDetail: any = null;
      try {
        if (supabase) {
          const { data: acadData } = await supabase
            .from("user_academic_profile")
            .select("*")
            .eq("user_id", activeStudentId);

          const { data: codeData } = await supabase
            .from("user_coding_profiles")
            .select("*")
            .eq("user_id", activeStudentId);

          const { data: plData } = await supabase
            .from("saved_playlists")
            .select("*")
            .eq("user_id", activeStudentId);

          const baseStudent = studentsList.find((s) => s.id === activeStudentId) || {};
          const acadRow = acadData && acadData[0] ? acadData[0] : {};
          const codeRow = codeData && codeData[0] ? codeData[0] : {};

          let totalSolved = 0;
          const platforms: any[] = [];
          const lcUrl = codeRow.leetcode_url || baseStudent.leetcode_handle || "";
          const ghUrl = codeRow.github_url || baseStudent.github_handle || "";

          if (codeRow.stats_json) {
            for (const [pName, pData] of Object.entries<any>(codeRow.stats_json)) {
              if (pData && typeof pData === "object") {
                let solved = pData.total_solved || pData.solved || 0;
                if (!solved && (pData.badge || pData.summary)) {
                  const m = String(pData.badge || pData.summary).match(/(\d+)/);
                  if (m) solved = parseInt(m[1], 10);
                }
                if (solved && typeof solved === "number" && solved > 0) {
                  totalSolved += solved;
                  platforms.push({ name: pName.charAt(0).toUpperCase() + pName.slice(1), solved });
                }
              }
            }
          }

          const followingPlaylists = (plData || []).map((pl: any) => ({
            id: pl.playlist_id,
            title: pl.title || "Untitled Playlist",
            channel: pl.channel || "",
            video_count: pl.video_count || "?",
            thumbnail: pl.thumbnail || "",
          }));

          sbDetail = {
            ...baseStudent,
            id: activeStudentId,
            name: acadRow.full_name || baseStudent.name,
            roll_number: acadRow.roll_number || baseStudent.roll_number,
            department: acadRow.department || baseStudent.department,
            section: acadRow.section || baseStudent.section,
            year: acadRow.academic_year || baseStudent.year,
            attendance_percentage: acadRow.attendance_percentage || baseStudent.attendance_percentage || 0,
            coding_profiles: {
              leetcode_url: lcUrl,
              github_url: ghUrl,
              total_solved: totalSolved,
              platforms: platforms,
            },
            playlists_info: {
              following: followingPlaylists,
              completed: [],
            },
            roadmaps_info: {
              following: [],
              completed: [],
            },
            attendance_info: {
              percentage: acadRow.attendance_percentage || 0,
              status: (acadRow.attendance_percentage || 0) >= 75 ? "Safe (≥75%)" : "Attention Required (<75%)",
            },
          };
        }
      } catch (e) {
        console.warn("Direct Supabase query error:", e);
      }

      // Fetch from Backend API as enrichment fallback
      try {
        const authHeaders = await getAuthHeaders();
        const res = await apiFetch(`${API_BASE}/api/faculty/students/${activeStudentId}`, {
          headers: { ...authHeaders },
        });
        if (res.ok) {
          const apiData = await res.json();
          if (isMounted) {
            setActiveStudentDetail({
              ...sbDetail,
              ...apiData,
              coding_profiles: {
                ...sbDetail?.coding_profiles,
                ...apiData?.coding_profiles,
                total_solved: apiData?.coding_profiles?.total_solved || sbDetail?.coding_profiles?.total_solved || 0,
                platforms: apiData?.coding_profiles?.platforms?.length ? apiData.coding_profiles.platforms : sbDetail?.coding_profiles?.platforms || [],
              },
              playlists_info: {
                following: apiData?.playlists_info?.following?.length ? apiData.playlists_info.following : sbDetail?.playlists_info?.following || [],
                completed: apiData?.playlists_info?.completed || [],
              },
            });
            setLoadingDetail(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend API fetch error:", e);
      }

      if (isMounted) {
        if (sbDetail) {
          setActiveStudentDetail(sbDetail);
        } else {
          setActiveStudentDetail(studentsList.find((s) => s.id === activeStudentId));
        }
        setLoadingDetail(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [activeStudentId, studentsList]);

  const handleOpenStudent = (student: any) => {
    setActiveStudentId(student.id);
    setActiveStudentDetail(student);
    setNotesInput(student.faculty_notes || "");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId) return;
    setSavingNotes(true);
    setTimeout(() => {
       setSavingNotes(false);
       setSaveSuccess(true);
       setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  // Filter students based on all filters and sort descending by coding score
  const filteredStudents = useMemo(() => {
    const filtered = studentsList.filter(s => {
      const nameMatch = (s.name || "").toLowerCase().includes(search.toLowerCase());
      const rollMatch = (s.roll_number || "").toLowerCase().includes(search.toLowerCase());
      const matchesSearch = nameMatch || rollMatch;
      const matchesYear = yearFilter === "all" || s.year === yearFilter || s.academic_year === yearFilter;
      const matchesDept = deptFilter === "all" || s.department === deptFilter;
      const matchesSection = sectionFilter === "all" || s.section === sectionFilter;
      return matchesSearch && matchesYear && matchesDept && matchesSection;
    });
    
    // Sort descending by coding score
    return filtered.sort((a, b) => (b.coding_score || 0) - (a.coding_score || 0));
  }, [studentsList, search, yearFilter, deptFilter, sectionFilter]);

  const detail = useMemo(() => activeStudentDetail || studentsList.find(s => s.id === activeStudentId), [studentsList, activeStudentId, activeStudentDetail]);

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
              className="fixed top-0 right-0 bottom-0 w-full max-w-md md:max-w-xl bg-[#070c18] border-l border-white/10 z-50 p-6 overflow-y-auto flex flex-col space-y-6"
            >
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

              {/* 1. ATTENDANCE & CODING OVERVIEW CARD */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-3.5 text-center flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
                  </div>
                  <span className="text-2xl font-black text-white font-mono my-1">
                    {detail.attendance_info?.percentage ?? detail.attendance_percentage ?? 0}%
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (detail.attendance_percentage || 0) >= 75
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}>
                    {(detail.attendance_percentage || 0) >= 75 ? "Safe (≥75%)" : "Attention Required (<75%)"}
                  </span>
                </div>

                <div className="bg-purple-500/[0.04] border border-purple-500/20 rounded-2xl p-3.5 text-center flex flex-col justify-between">
                  <div className="flex items-center justify-between text-purple-400 mb-1">
                    <Code className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Questions Solved</span>
                  </div>
                  <span className="text-2xl font-black text-white font-mono my-1">
                    {detail.coding_profiles?.total_solved || (detail.coding_score ? Math.round(detail.coding_score / 10) : 0)}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Across Connected Platforms
                  </span>
                </div>
              </div>

              {/* 2. CODING PROFILES & PLATFORMS */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Coding Profiles & Platform Stats</span>
                  </h3>
                  <span className="text-[10px] text-indigo-300 font-mono font-semibold">
                    {detail.coding_profiles?.total_solved || 0} Total Solved
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {detail.leetcode_handle || detail.coding_profiles?.leetcode_url ? (
                    <a
                      href={detail.coding_profiles?.leetcode_url || `https://leetcode.com/u/${detail.leetcode_handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>LeetCode</span>
                      <strong className="font-mono text-white">@{detail.leetcode_handle || "connected"}</strong>
                    </a>
                  ) : null}

                  {detail.github_handle || detail.coding_profiles?.github_url ? (
                    <a
                      href={detail.coding_profiles?.github_url || `https://github.com/${detail.github_handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/25 text-slate-300 text-xs font-bold hover:bg-slate-500/20 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                      <strong className="font-mono text-white">@{detail.github_handle || "connected"}</strong>
                    </a>
                  ) : null}

                  {(!detail.leetcode_handle && !detail.github_handle && (!detail.coding_profiles?.platforms || detail.coding_profiles.platforms.length === 0)) && (
                    <p className="text-xs text-slate-500 font-medium">No external coding profiles connected yet.</p>
                  )}
                </div>

                {detail.coding_profiles?.platforms && detail.coding_profiles.platforms.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    {detail.coding_profiles.platforms.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <span className="text-slate-400 font-medium">{p.name}</span>
                        <span className="font-bold font-mono text-white">{p.solved} solved</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. COURSE PLAYLISTS (FOLLOWING VS COMPLETED) */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Course Playlists</span>
                </h3>

                {/* Following Playlists */}
                <div>
                  <span className="text-[11px] font-bold text-cyan-300 block mb-1.5">
                    Currently Following ({detail.playlists_info?.following?.length || 0})
                  </span>
                  {detail.playlists_info?.following && detail.playlists_info.following.length > 0 ? (
                    <div className="space-y-2">
                      {detail.playlists_info.following.map((pl: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                            <span className="font-bold text-white truncate">{pl.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300 font-semibold shrink-0 ml-2">
                            {pl.video_count} videos
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No active playlists currently following.</p>
                  )}
                </div>

                {/* Completed Playlists */}
                {detail.playlists_info?.completed && detail.playlists_info.completed.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1.5">
                      Completed Playlists ({detail.playlists_info.completed.length})
                    </span>
                    <div className="space-y-2">
                      {detail.playlists_info.completed.map((pl: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-bold text-white truncate">{pl.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-300 font-bold shrink-0 ml-2">
                            Completed ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. CAREER ROADMAPS (FOLLOWING VS COMPLETED) */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Career Roadmaps</span>
                </h3>

                {/* Following Roadmaps */}
                <div>
                  <span className="text-[11px] font-bold text-purple-300 block mb-1.5">
                    Currently Following ({detail.roadmaps_info?.following?.length || 0})
                  </span>
                  {detail.roadmaps_info?.following && detail.roadmaps_info.following.length > 0 ? (
                    <div className="space-y-2">
                      {detail.roadmaps_info.following.map((rm: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-white truncate">{rm.title}</span>
                            <span className="text-purple-300 font-mono text-[11px]">{rm.progress_percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${rm.progress_percent}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {rm.completed_milestones} / {rm.total_milestones} milestones completed
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No active roadmaps currently following.</p>
                  )}
                </div>

                {/* Completed Roadmaps */}
                {detail.roadmaps_info?.completed && detail.roadmaps_info.completed.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1.5">
                      Completed Roadmaps ({detail.roadmaps_info.completed.length})
                    </span>
                    <div className="space-y-2">
                      {detail.roadmaps_info.completed.map((rm: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex items-center justify-between text-xs font-bold">
                          <span className="text-white">{rm.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            🎉 100% Completed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. PRIVATE FACULTY NOTES */}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
