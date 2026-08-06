"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, Users, Search, Save, CheckCircle, 
  AlertTriangle, RefreshCw, Calendar, CheckSquare, XSquare, Clock
} from "lucide-react";

import { 
  fetchFacultyStudents, 
  saveFacultyAttendance, 
  fetchFacultyAttendance 
} from "@/lib/api";

export default function AttendancePage() {
  const qc = useQueryClient();
  
  // Selection States
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState("3rd Year");
  const [section, setSection] = useState("A");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Search State
  const [search, setSearch] = useState("");

  // Attendance Sheet status mapping
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, "present" | "absent" | "late">>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: fetchFacultyStudents,
    onSuccess: (data) => {
      // Pre-populate attendanceSheet with present by default for active listing
      const initial: Record<string, "present" | "absent" | "late"> = {};
      data.forEach((s: any) => {
        initial[s.id] = "present";
      });
      setAttendanceSheet(initial);
    }
  });

  const { data: attendanceHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["faculty-attendance"],
    queryFn: fetchFacultyAttendance
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveFacultyAttendance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-attendance"] });
      qc.invalidateQueries({ queryKey: ["faculty-students"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  // Filter students by section and search
  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const matchesSection = s.section === section;
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.roll_number.toLowerCase().includes(search.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [students, section, search]);

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
    const records = Object.keys(attendanceSheet).map(studentId => ({
      student_id: studentId,
      status: attendanceSheet[studentId]
    }));

    const payload = {
      subject,
      department,
      year,
      section,
      date,
      records
    };

    await saveMutation.mutateAsync(payload);
    setIsSaving(false);
  };

  // Compute stats for history reporting
  const historyStats = useMemo(() => {
    if (attendanceHistory.length === 0) return { presentPct: 0, absentPct: 0, latePct: 0 };
    const total = attendanceHistory.length;
    const present = attendanceHistory.filter((h: any) => h.status === "present").length;
    const absent = attendanceHistory.filter((h: any) => h.status === "absent").length;
    const late = attendanceHistory.filter((h: any) => h.status === "late").length;
    return {
      presentPct: Math.round((present / total) * 100),
      absentPct: Math.round((absent / total) * 100),
      latePct: Math.round((late / total) * 100),
      totalCount: total
    };
  }, [attendanceHistory]);

  if (loadingStudents) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
          PREPARING ATTENDANCE REGISTER...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Attendance Register</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Select filters to load lists, log bulk attendance, and view real-time metrics.
        </p>
      </div>

      {/* FILTER SHEET */}
      <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-purple-500/50"
          >
            <option>Data Structures & Algorithms</option>
            <option>System Design & Architecture</option>
            <option>Web Development Lab</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none"
          >
            <option>3rd Year</option>
            <option>2nd Year</option>
            <option>1st Year</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="space-y-1 flex items-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving || filteredStudents.length === 0}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Attendance"}
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
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold placeholder-slate-500 focus:outline-none"
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

          <div className="glass rounded-2xl border border-white/10 bg-white/[0.01] overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider pb-2">
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Roll Number</th>
                    <th className="py-2.5">Section</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => {
                      const currentStatus = attendanceSheet[student.id] || "present";
                      return (
                        <tr key={student.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 font-semibold text-slate-200">{student.name}</td>
                          <td className="py-3 text-slate-400 font-mono">{student.roll_number}</td>
                          <td className="py-3 text-slate-400">Section {student.section}</td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setStatus(student.id, "present")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "present"
                                    ? "bg-emerald-500 text-slate-950 shadow"
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => setStatus(student.id, "absent")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "absent"
                                    ? "bg-rose-500 text-white shadow"
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => setStatus(student.id, "late")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  currentStatus === "late"
                                    ? "bg-amber-500 text-slate-950 shadow"
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
                      <td colSpan={4} className="text-center py-6 text-slate-500 font-medium">No students match current search/filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Reports / Charts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Monthly Attendance Report</h3>
              <p className="text-xs text-slate-500 mb-6">Cohort logs parsed on university records.</p>
              
              {loadingHistory ? (
                <div className="text-center py-10">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[10px] font-mono text-slate-500">Loading history...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Aggregated distribution chart */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Overall Present Ratio</span>
                      <span className="text-emerald-400 font-mono">{historyStats.presentPct}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${historyStats.presentPct}%` }} />
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

                  <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500 leading-normal">
                    Aggregate total check-ins registered: <strong>{historyStats.totalCount || 0}</strong> dates.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
