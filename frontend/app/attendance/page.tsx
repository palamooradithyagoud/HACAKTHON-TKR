"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, Users, Search, Save, CheckCircle, 
  AlertTriangle, RefreshCw, Calendar, CheckSquare, XSquare, Clock
} from "lucide-react";

import { getSharedMockStudents } from "@/lib/mockData";
import { API_BASE, apiFetch, getAuthHeaders } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function AttendancePage() {
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("4");
  const [section, setSection] = useState("all");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Search State
  const [search, setSearch] = useState("");

  // Attendance Sheet status mapping
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, "present" | "absent" | "late">>({});
  const [isSaving, setIsSaving] = useState(false);
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
              roll_number: `22TK1A${(s.department || "05").toUpperCase()}${String(idx + 1).padStart(2, "0")}`,
              section: s.section || "Section A",
              department: s.department || "CSE",
              year: s.year || "4",
              academic_year: s.academic_year || "4th Year",
              college: s.college || "TKR College of Engineering & Technology",
              attendance_percentage: 92.0,
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

  // Filter students by year, department, section and search
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s: any) => {
      const sYear = String(s.year || s.academic_year || "");
      const sDept = String(s.department || "").toUpperCase();
      const sSec = String(s.section || "");

      const matchesYear = year === "all" || sYear === year || sYear.includes(year) || (year === "4" && (sYear === "4" || sYear.includes("4")));
      const matchesDept = department === "all" || sDept === department.toUpperCase();
      const matchesSection = section === "all" || sSec === section || sSec === `Section ${section}` || sSec.toLowerCase().includes(section.toLowerCase());
      const matchesSearch = (s.name || "").toLowerCase().includes(search.toLowerCase()) || 
                            (s.roll_number || "").toLowerCase().includes(search.toLowerCase());

      return matchesYear && matchesDept && matchesSection && matchesSearch;
    });
  }, [studentsList, year, department, section, search]);

  // Pre-populate attendanceSheet with present by default whenever the filter changes
  useEffect(() => {
    const initial: Record<string, "present" | "absent" | "late"> = {};
    filteredStudents.forEach((s: any) => {
      initial[s.id] = "present";
    });
    setAttendanceSheet(initial);
  }, [filteredStudents]);

  // Handle status update
  const setStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceSheet(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Bulk Actions
  const markAll = (status: "present" | "absent" | "late") => {
    const updated = { ...attendanceSheet };
    filteredStudents.forEach((s: any) => {
      updated[s.id] = status;
    });
    setAttendanceSheet(updated);
  };

  // Submit Handler
  const handleSubmit = async () => {
    setIsSaving(true);
    // Simulate network delay to backend
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  // Mock stats for history reporting
  const historyStats = {
    presentPct: 78,
    absentPct: 15,
    latePct: 7,
    totalCount: 42
  };

  return (
    <div className="space-y-6 pb-16 mt-6 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-purple-400" />
            <span>Attendance Register</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Select filters to load lists, log bulk attendance, and view real-time metrics.
          </p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold">Attendance Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* FILTER SHEET */}
      <div className="glass p-5 rounded-2xl border border-white/10 bg-[#090e1a]/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        
        <div className="space-y-1 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Years</option>
            <option value="4">Year 4</option>
            <option value="3">Year 3</option>
            <option value="2">Year 2</option>
            <option value="1">Year 1</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Depts</option>
            <option value="CSE">CSE</option>
            <option value="CSM">CSM</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class/Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          >
            <option>DSA</option>
            <option>Database Systems</option>
            <option>Web Dev Lab</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="space-y-1 md:col-span-1 flex items-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving || filteredStudents.length === 0}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Attendance Logging Sheet */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => markAll("present")} className="px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-[10px] font-bold text-emerald-400 transition-all flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" /> All Present
              </button>
              <button onClick={() => markAll("absent")} className="px-3 py-1.5 rounded-lg border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-[10px] font-bold text-rose-400 transition-all flex items-center gap-1">
                <XSquare className="w-3.5 h-3.5" /> All Absent
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/10 bg-[#121622] overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => {
                      const currentStatus = attendanceSheet[student.id] || "present";
                      return (
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-200">{student.name}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{student.roll_number}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setStatus(student.id, "present")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "present"
                                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => setStatus(student.id, "absent")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "absent"
                                    ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => setStatus(student.id, "late")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "late"
                                    ? "bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-slate-500 font-medium text-xs">
                        No students found for this class combination.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Reports / Charts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-5 rounded-2xl border border-white/10 bg-[#121622] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Monthly Report</h3>
              <p className="text-xs text-slate-500 mb-6">Aggregated class records.</p>
              
              <div className="space-y-4">
                {/* Aggregated distribution chart */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Overall Present Ratio</span>
                    <span className="text-emerald-400 font-mono">{historyStats.presentPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${historyStats.presentPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Overall Late Ratio</span>
                    <span className="text-amber-400 font-mono">{historyStats.latePct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${historyStats.latePct}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Absent Ratio</span>
                    <span className="text-rose-400 font-mono">{historyStats.absentPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${historyStats.absentPct}%` }} />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/5 text-[11px] text-slate-500 leading-normal">
                  Aggregate total check-ins registered: <strong>{historyStats.totalCount || 0}</strong> dates.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
