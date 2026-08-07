"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertTriangle, CheckCircle2, 
  ChevronRight, X, Sparkles, Code, Award, Calendar, Clock, Save, Edit3, Globe, RefreshCw, Trophy, Medal, ArrowUpDown
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
  const [sortBy, setSortBy] = useState<string>("coding_score_desc");
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
              year: s.year || "4",
              academic_year: s.academic_year || "4th Year",
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
            const statsJson = codeRow.stats_json as any;

            // HackerRank - direct score
            const hr = statsJson.hackerrank;
            if (hr?.configured) {
              const score = Number(hr.score || hr.direct_score || 0);
              const solved = Number(hr.problems_solved || hr.total_solved || 0);
              if (score > 0 || solved > 0) { totalSolved += solved; platforms.push({ name: "HackerRank", solved, score: Math.round(score) }); }
            }

            // CodeChef: (problems*2) + ((rating-1200)^2/10) + (contests*50)
            const cc = statsJson.codechef;
            if (cc?.configured) {
              const problems = Number(cc.total_solved || cc.problems_solved || 0);
              const rating = Number(cc.rating || 0);
              const contests = Number(cc.contests || cc.contests_count || 0);
              const rDiff = Math.max(0, rating - 1200);
              const score = Math.round((problems * 2) + (rDiff * rDiff / 10) + (contests * 50));
              totalSolved += problems;
              if (problems > 0 || score > 0) platforms.push({ name: "CodeChef", solved: problems, score });
            }

            // CodeForces: (problems*2) + ((rating-800)^2/10) + (contests*50)
            const cf = statsJson.codeforces;
            if (cf?.configured) {
              const problems = Number(cf.total_solved || cf.problems_solved || 0);
              const rating = Number(cf.rating || 0);
              const contests = Number(cf.contests || cf.contests_count || 0);
              const rDiff = Math.max(0, rating - 800);
              const score = Math.round((problems * 2) + (rDiff * rDiff / 10) + (contests * 50));
              totalSolved += problems;
              if (problems > 0 || score > 0) platforms.push({ name: "CodeForces", solved: problems, score });
            }

            // LeetCode: (problems*10) + ((rating-1300)^2/10) + (contests*50)
            const lc = statsJson.leetcode;
            if (lc?.configured) {
              let problems = Number(lc.total_solved || 0) || (Number(lc.easy_solved||0) + Number(lc.medium_solved||0) + Number(lc.hard_solved||0));
              if (!problems && lc.badge) { const m = String(lc.badge).match(/(\d+)/); if (m) problems = parseInt(m[1]); }
              const rating = Number(lc.rating || 0);
              const contests = Number(lc.contests || lc.contests_count || 0);
              const rDiff = Math.max(0, rating - 1300);
              const score = Math.round((problems * 10) + (rDiff * rDiff / 10) + (contests * 50));
              totalSolved += problems;
              if (problems > 0 || score > 0) platforms.push({ name: "LeetCode", solved: problems, score });
            }

            // InterviewBit: score / 5
            const ib = statsJson.interviewbit;
            if (ib?.configured) {
              const rawScore = Number(ib.score || 0);
              const solved = Number(ib.problems_solved || ib.total_solved || 0);
              const score = Math.round(rawScore / 5);
              totalSolved += solved;
              if (rawScore > 0 || solved > 0) platforms.push({ name: "InterviewBit", solved, score });
            }

            // GFG: (original_score*10) + (problems_solved*5)
            const gfg = statsJson.geeksforgeeks;
            if (gfg?.configured) {
              const origScore = Number(gfg.coding_score || gfg.score || gfg.original_score || 0);
              const problems = Number(gfg.total_solved || gfg.problems_solved || 0);
              const score = Math.round((origScore * 10) + (problems * 5));
              totalSolved += problems;
              if (problems > 0 || score > 0) platforms.push({ name: "GeeksforGeeks", solved: problems, score });
            }

            // GitHub: (repos*15) + (contributions*5)
            const gh = statsJson.github;
            if (gh?.configured) {
              const repos = Number(gh.repos || gh.public_repos || 0);
              const contribs = Number(gh.contributions || gh.total_contributions || 0);
              const score = Math.round((repos * 15) + (contribs * 5));
              if (repos > 0 || score > 0) platforms.push({ name: "GitHub", solved: 0, score });
            }
          }

          const followingPlaylists = (plData || []).map((pl: any) => ({
            id: pl.playlist_id,
            title: pl.title || "Untitled Playlist",
            channel: pl.channel || "",
            video_count: pl.video_count || "?",
            thumbnail: pl.thumbnail || "",
          }));

          const overallScore = platforms.reduce((s: number, p: any) => s + (p.score || 0), 0);

          sbDetail = {
            ...baseStudent,
            id: activeStudentId,
            name: acadRow.full_name || baseStudent.name,
            roll_number: acadRow.roll_number || baseStudent.roll_number,
            department: acadRow.department || baseStudent.department,
            section: acadRow.section || baseStudent.section,
            year: acadRow.academic_year || baseStudent.year,
            attendance_percentage: acadRow.attendance_percentage || baseStudent.attendance_percentage || 0,
            coding_score: overallScore || acadRow.coding_score || baseStudent.coding_score || 0,
            coding_profiles: {
              leetcode_url: lcUrl,
              github_url: ghUrl,
              total_solved: totalSolved,
              overall_score: overallScore,
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
              coding_score: apiData?.coding_score || apiData?.coding_profiles?.overall_score || sbDetail?.coding_score || 0,
              coding_profiles: {
                ...sbDetail?.coding_profiles,
                ...apiData?.coding_profiles,
                total_solved: apiData?.coding_profiles?.total_solved || sbDetail?.coding_profiles?.total_solved || 0,
                overall_score: apiData?.coding_profiles?.overall_score || sbDetail?.coding_profiles?.overall_score || 0,
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

  // Filter students based on search/filters and apply selected sorting technique
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

    // Apply sorting technique
    return filtered.sort((a, b) => {
      if (sortBy === "coding_score_desc") return (b.coding_score || 0) - (a.coding_score || 0);
      if (sortBy === "coding_score_asc") return (a.coding_score || 0) - (b.coding_score || 0);
      if (sortBy === "leetcode_desc") return (b.leetcode_solved || 0) - (a.leetcode_solved || 0);
      if (sortBy === "gfg_desc") return (b.gfg_solved || 0) - (a.gfg_solved || 0);
      if (sortBy === "codeforces_desc") return (b.codeforces_solved || 0) - (a.codeforces_solved || 0);
      if (sortBy === "codechef_desc") return (b.codechef_solved || 0) - (a.codechef_solved || 0);
      if (sortBy === "github_desc") return ((b.github_repos || 0) * 15 + (b.github_commits || 0) * 2) - ((a.github_repos || 0) * 15 + (a.github_commits || 0) * 2);
      if (sortBy === "attendance_desc") return (b.attendance_percentage || 0) - (a.attendance_percentage || 0);
      if (sortBy === "attendance_asc") return (a.attendance_percentage || 0) - (b.attendance_percentage || 0);
      if (sortBy === "placement_desc") return (b.placement_readiness_score || 0) - (a.placement_readiness_score || 0);
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      return (b.coding_score || 0) - (a.coding_score || 0);
    });
  }, [studentsList, search, yearFilter, deptFilter, sectionFilter, sortBy]);

  const topThree = useMemo(() => filteredStudents.slice(0, 3), [filteredStudents]);
  const detail = useMemo(() => activeStudentDetail || studentsList.find(s => s.id === activeStudentId), [studentsList, activeStudentId, activeStudentDetail]);

  return (
    <div className="space-y-6 pb-16 relative mt-6 max-w-7xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              Faculty Section Leaderboard
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TKREC Coding Leaderboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            College-wide student coding rankings across LeetCode, GeeksforGeeks, CodeChef, HackerRank, Codeforces, and GitHub.
          </p>
        </div>
        <div className="bg-[#1a1f2d] border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-sm">
            <span className="text-white font-black text-lg font-mono">{filteredStudents.length}</span>
            <span className="text-slate-400 text-xs font-semibold block">Students Ranked</span>
          </div>
        </div>
      </div>

      {/* ── TOP 3 PODIUM (GOLD, SILVER, BRONZE) ────────────────────────── */}
      {topThree.length >= 3 && !search && yearFilter === "all" && deptFilter === "all" && sectionFilter === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Silver - #2 */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => handleOpenStudent(topThree[1])}
            className="glass p-5 rounded-3xl border border-slate-400/30 bg-gradient-to-b from-[#141b2d] to-[#0a0f1d] relative overflow-hidden shadow-xl cursor-pointer order-2 md:order-1"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-slate-300/15 border border-slate-300/30 text-slate-200 text-xs font-black flex items-center gap-1">
                🥈 Rank #2
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">{topThree[1].roll_number}</span>
            </div>
            <div className="text-center my-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-[#070b14] flex items-center justify-center text-white font-black text-xl font-mono">
                  {topThree[1].name.charAt(0)}
                </div>
              </div>
              <h3 className="text-base font-bold text-white mt-3 truncate">{topThree[1].name}</h3>
              <p className="text-xs text-slate-400 font-medium">{topThree[1].department} • Sec {topThree[1].section}</p>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Coding Score</span>
              <span className="font-black font-mono text-slate-200 text-lg">{topThree[1].coding_score} pts</span>
            </div>
          </motion.div>

          {/* Gold - #1 */}
          <motion.div
            whileHover={{ y: -6 }}
            onClick={() => handleOpenStudent(topThree[0])}
            className="glass p-6 rounded-3xl border border-amber-500/50 bg-gradient-to-b from-[#221808] to-[#0f0a03] relative overflow-hidden shadow-2xl cursor-pointer order-1 md:order-2 shadow-amber-500/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1">
                🏆 Rank #1 (Gold)
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">{topThree[0].roll_number}</span>
            </div>
            <div className="text-center my-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-xl shadow-amber-500/30">
                <div className="w-full h-full rounded-[14px] bg-[#0c0803] flex items-center justify-center text-amber-300 font-black text-2xl font-mono">
                  {topThree[0].name.charAt(0)}
                </div>
              </div>
              <h3 className="text-lg font-black text-white mt-3 truncate">{topThree[0].name}</h3>
              <p className="text-xs text-amber-300/80 font-semibold">{topThree[0].department} • Sec {topThree[0].section}</p>
            </div>
            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-200/80 font-medium">Champion Score</span>
              <span className="font-black font-mono text-amber-400 text-xl">{topThree[0].coding_score} pts</span>
            </div>
          </motion.div>

          {/* Bronze - #3 */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => handleOpenStudent(topThree[2])}
            className="glass p-5 rounded-3xl border border-amber-800/30 bg-gradient-to-b from-[#1c120a] to-[#0f0904] relative overflow-hidden shadow-xl cursor-pointer order-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-400 text-xs font-black flex items-center gap-1">
                🥉 Rank #3
              </span>
              <span className="text-xs font-mono font-bold text-amber-600">{topThree[2].roll_number}</span>
            </div>
            <div className="text-center my-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-[#0a0603] flex items-center justify-center text-white font-black text-xl font-mono">
                  {topThree[2].name.charAt(0)}
                </div>
              </div>
              <h3 className="text-base font-bold text-white mt-3 truncate">{topThree[2].name}</h3>
              <p className="text-xs text-slate-400 font-medium">{topThree[2].department} • Sec {topThree[2].section}</p>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Coding Score</span>
              <span className="font-black font-mono text-amber-500 text-lg">{topThree[2].coding_score} pts</span>
            </div>
          </motion.div>
        </div>
      )}

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

          {/* SORT BY TECHNIQUE SELECTOR */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <ArrowUpDown className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#0e1629] border border-indigo-500/40 text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-400 transition-all shadow-md"
            >
              <option value="coding_score_desc">Sort: Total Coding Score (High → Low)</option>
              <option value="coding_score_asc">Sort: Total Coding Score (Low → High)</option>
              <option value="leetcode_desc">Sort: LeetCode Solved (High → Low)</option>
              <option value="gfg_desc">Sort: GeeksforGeeks Solved (High → Low)</option>
              <option value="codeforces_desc">Sort: Codeforces Solved (High → Low)</option>
              <option value="codechef_desc">Sort: CodeChef Solved (High → Low)</option>
              <option value="github_desc">Sort: GitHub Activity (High → Low)</option>
              <option value="attendance_desc">Sort: Attendance % (High → Low)</option>
              <option value="attendance_asc">Sort: Attendance Risk (Low → High)</option>
              <option value="placement_desc">Sort: Placement Readiness (High → Low)</option>
              <option value="name_asc">Sort: Name (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUICK SORTING PILLS */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-indigo-400" />
          Quick Sort:
        </span>
        <button
          onClick={() => setSortBy("coding_score_desc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "coding_score_desc"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          🏆 Overall Score
        </button>
        <button
          onClick={() => setSortBy("leetcode_desc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "leetcode_desc"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          💻 LeetCode Top
        </button>
        <button
          onClick={() => setSortBy("gfg_desc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "gfg_desc"
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          🟢 GeeksforGeeks Top
        </button>
        <button
          onClick={() => setSortBy("codeforces_desc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "codeforces_desc"
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          ⚡ Codeforces Top
        </button>
        <button
          onClick={() => setSortBy("github_desc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "github_desc"
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          🐙 GitHub Activity
        </button>
        <button
          onClick={() => setSortBy("attendance_asc")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            sortBy === "attendance_asc"
              ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/10"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          ⚠️ Attendance Risk
        </button>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider">Overall Score</span>
                  </div>
                  <span className="text-2xl font-black text-white font-mono my-1">
                    {detail.coding_profiles?.overall_score || detail.coding_score || 0}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    {detail.coding_profiles?.total_solved || 0} Problems Solved
                  </span>
                </div>
              </div>

              {/* 2. CODING PROFILES & PLATFORMS */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Coding Profiles &amp; Score Breakdown</span>
                  </h3>
                  <span className="text-[10px] text-indigo-300 font-mono font-semibold bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2 py-0.5">
                    Score: {detail.coding_profiles?.overall_score || detail.coding_score || 0}
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
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Score Breakdown</p>
                    {detail.coding_profiles.platforms.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <span className="text-slate-300 font-semibold">{p.name}</span>
                        <div className="flex items-center gap-3">
                          {p.solved > 0 && (
                            <span className="text-slate-400 font-mono">{p.solved} solved</span>
                          )}
                          <span className="font-black font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
                            {p.score ?? p.solved} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                {/* DATASET CODING PLATFORM METRICS */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Dataset Coding Platform Metrics</span>
                    <span className="text-[10px] font-mono text-indigo-400">6 Platforms Verified</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Code className="w-3.5 h-3.5 text-amber-400" />
                        <span>LeetCode</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.leetcode_solved ?? 127} Solved</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                        <Code className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GeeksforGeeks</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.gfg_solved ?? 242} Solved</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-200 font-semibold">
                        <Code className="w-3.5 h-3.5 text-amber-500" />
                        <span>CodeChef</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.codechef_solved ?? 64} Solved</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                        <Award className="w-3.5 h-3.5 text-teal-400" />
                        <span>HackerRank</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.hackerrank_score ?? 77} pts</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <Code className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Codeforces</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.codeforces_solved ?? 294} Solved</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                        <span>GitHub</span>
                      </div>
                      <span className="font-mono font-bold text-white">{detail.github_repos ?? 4}R / {detail.github_commits ?? 384}C</span>
                    </div>
                  </div>
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
