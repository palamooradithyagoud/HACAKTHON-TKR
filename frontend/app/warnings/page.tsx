"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  ChevronRight,
  MessageSquare,
  Clock,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { getSharedMockStudents } from "@/lib/mockData";
import { API_BASE, apiFetch, getAuthHeaders } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function WarningsPage() {
  const [activeCategory, setActiveCategory] = useState<"attendance" | "assignments">("attendance");
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // State for automation loading & alerts
  const [sendingState, setSendingState] = useState<Record<string, boolean>>({});
  const [sendingAll, setSendingAll] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const authHeaders = await getAuthHeaders();
        const res = await apiFetch(`${API_BASE}/api/faculty/students`, {
          headers: { ...authHeaders }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStudentsList(data);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch students from API for warnings:", e);
      }

      // Supabase fallback
      try {
        if (supabase) {
          const { data } = await supabase.from("user_academic_profile").select("*");
          if (data && data.length > 0) {
            const mapped = data.map((s, idx) => ({
              id: s.user_id || `stu_${idx}`,
              name: s.full_name || `Student ${idx + 1}`,
              roll_number: `22TK1A${(s.department || "05").toUpperCase()}${String(idx + 1).padStart(2, "0")}`,
              department: s.department || "CSM",
              email: s.email || `${(s.user_id || "student").toLowerCase()}@tkrec.ac.in`,
              attendance_percentage: s.attendance_percentage ?? 70.0,
              unsubmitted_assignments: ["Data Structures Assignment #2"]
            }));
            setStudentsList(mapped);
            return;
          }
        }
      } catch {}

      setStudentsList(getSharedMockStudents());
    }

    loadStudents();
  }, []);

  // Process warnings from students data
  const warnings = useMemo(() => {
    const list: any[] = [];
    studentsList.forEach((student) => {
      const attVal = parseFloat(student.attendance_percentage ?? student.attendance ?? 100);
      const studentEmail = student.email || `${(student.roll_number || student.id || "student").toLowerCase()}@tkrec.ac.in`;
      const dept = student.department || "CSM";
      
      // 1. Attendance warning (below 75%)
      if (attVal < 75) {
        list.push({
          id: `${student.id || student.roll_number}-att`,
          name: student.name || student.full_name,
          roll_number: student.roll_number || student.id,
          department: dept,
          email: studentEmail,
          type: "attendance",
          numericAttendance: attVal,
          value: `${attVal.toFixed(1)}%`,
          desc: `Attendance is ${attVal.toFixed(1)}% (Below mandatory 75% cutoff)`
        });
      }
      
      // 2. Assignment warning (unsubmitted assignments)
      if (student.unsubmitted_assignments && student.unsubmitted_assignments.length > 0) {
        student.unsubmitted_assignments.forEach((assignmentName: string, index: number) => {
          list.push({
            id: `${student.id || student.roll_number}-assign-${index}`,
            name: student.name || student.full_name,
            roll_number: student.roll_number || student.id,
            department: dept,
            email: studentEmail,
            type: "assignment",
            numericAttendance: attVal,
            value: assignmentName,
            desc: `Did not submit ${assignmentName}`
          });
        });
      } else if (attVal < 70) {
        list.push({
          id: `${student.id || student.roll_number}-assign-def`,
          name: student.name || student.full_name,
          roll_number: student.roll_number || student.id,
          department: dept,
          email: studentEmail,
          type: "assignment",
          numericAttendance: attVal,
          value: "DSA Module 3 Task",
          desc: `Overdue submission: DSA Module 3 Lab Task`
        });
      }
    });
    return list;
  }, [studentsList]);

  const attendanceCount = warnings.filter(w => w.type === "attendance").length;
  const assignmentCount = warnings.filter(w => w.type === "assignment").length;

  const displayedWarnings = useMemo(() => {
    return warnings.filter(w => 
      activeCategory === "attendance" ? w.type === "attendance" : w.type === "assignment"
    );
  }, [activeCategory, warnings]);

  // ── n8n Webhook Attendance Reminder Dispatcher ─────────────────────────────
  const sendSingleReminder = async (s: any) => {
    const N8N_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://shivapatel.app.n8n.cloud/webhook/attendance-alert";
    const PROXY_URL = `${API_BASE}/api/faculty/send-attendance-reminder`;

    // Validation check before making request
    if (!s.name || !s.email) {
      const valError = `❌ Validation Error: Missing student name or email for ${s.roll_number || "student"}.`;
      console.warn("[Validation Error]", valError);
      setAlertMessage({ type: "error", text: valError });
      return { success: false, student: s, error: valError };
    }

    const payload = {
      studentName: s.name,
      rollNo: s.roll_number,
      department: s.department || "CSM",
      attendance: s.numericAttendance ?? (s.value ? parseFloat(String(s.value).replace("%", "")) : 68),
      email: s.email
    };

    console.log("==========================================");
    console.log("[n8n Attendance Webhook Dispatch]");
    console.log("Target n8n Webhook URL:", N8N_URL);
    console.log("Backend Proxy URL:", PROXY_URL);
    console.log("Request Payload:", payload);

    setSendingState((prev) => ({ ...prev, [s.id]: true }));

    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      console.log("Status Code:", res.status);
      const data = await res.json();
      console.log("Response Body:", data);

      if (data.success) {
        const okMsg = `✅ Attendance reminder sent successfully to ${s.name}.`;
        setAlertMessage({ type: "success", text: okMsg });
        return { success: true, student: s };
      } else {
        const errorDetail = data.error || data.detail || data.message || `HTTP ${res.status}`;
        const errMsg = `❌ Error sending reminder to ${s.name}: ${errorDetail} (Status: ${res.status})`;
        console.warn("[n8n Webhook Warning]", data);
        setAlertMessage({ type: "error", text: errMsg });
        return { success: false, student: s, error: errMsg };
      }
    } catch (err: any) {
      const errMsg = `❌ Error sending reminder to ${s.name}: ${err.message || String(err)}`;
      console.error("[n8n Webhook Exception]", err);
      setAlertMessage({ type: "error", text: errMsg });
      return { success: false, student: s, error: errMsg };
    } finally {
      setSendingState((prev) => ({ ...prev, [s.id]: false }));
    }
  };

  // ── "Send Reminder to All" Batch Dispatcher via Promise.allSettled ──────────
  const handleSendReminderToAll = async () => {
    const lowAttendanceStudents = warnings.filter((w) => w.type === "attendance");
    if (lowAttendanceStudents.length === 0) return;

    setSendingAll(true);
    setAlertMessage(null);

    console.log(`[n8n Batch] Dispatching attendance reminders to ${lowAttendanceStudents.length} students via Promise.allSettled...`);

    const results = await Promise.allSettled(
      lowAttendanceStudents.map((student) => sendSingleReminder(student))
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value && r.value.success
    ).length;

    const total = lowAttendanceStudents.length;

    if (successCount === total) {
      setAlertMessage({
        type: "success",
        text: `✅ Attendance reminders sent successfully to ${successCount} students.`,
      });
    } else {
      setAlertMessage({
        type: "error",
        text: `⚠️ Attendance reminders sent to ${successCount} of ${total} students. (Check console logs for details).`,
      });
    }

    setSendingAll(false);
  };

  return (
    <div className="space-y-6 pb-16 mt-6 max-w-7xl mx-auto px-4">
      
      {/* FLOATING NOTIFICATION TOAST ALERT BANNER */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xl ${
              alertMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {alertMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold leading-relaxed">{alertMessage.text}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            <span>System Alerts &amp; Risk Warnings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Real-time tracking of students who require immediate academic or technical mentoring.
          </p>
        </div>

        {/* 📨 SEND REMINDER TO ALL HEADER BUTTON */}
        {activeCategory === "attendance" && warnings.filter(w => w.type === "attendance").length > 0 && (
          <button
            onClick={handleSendReminderToAll}
            disabled={sendingAll}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-black text-white transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 cursor-pointer shrink-0"
          >
            {sendingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-rose-200" />
            )}
            <span>{sendingAll ? "Sending to All..." : "📨 Send Reminder to All"}</span>
          </button>
        )}
      </div>

      {/* SUMMARY CATEGORY BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveCategory("attendance")}
          className={`text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${
            activeCategory === "attendance" 
              ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
              : "bg-[#1a1f2d] border-white/5 hover:border-white/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-lg border ${
            activeCategory === "attendance" ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-white/5 text-slate-400 border-white/10"
          }`}>
            {attendanceCount}
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              activeCategory === "attendance" ? "text-rose-400" : "text-slate-500"
            }`}>
              Less Attendance
            </span>
            <span className={`text-sm font-black ${
              activeCategory === "attendance" ? "text-white" : "text-slate-300"
            }`}>
              Students below 75% attendance
            </span>
          </div>
        </button>

        <button 
          onClick={() => setActiveCategory("assignments")}
          className={`text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${
            activeCategory === "assignments" 
              ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
              : "bg-[#1a1f2d] border-white/5 hover:border-white/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            activeCategory === "assignments" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5 text-slate-400 border-white/10"
          }`}>
            <FileWarning className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              activeCategory === "assignments" ? "text-amber-400" : "text-slate-500"
            }`}>
              Not Submitted Assignments
            </span>
            <span className={`text-sm font-black ${
              activeCategory === "assignments" ? "text-white" : "text-slate-300"
            }`}>
              {assignmentCount} Pending submissions
            </span>
          </div>
        </button>
      </div>

      {/* DETAILED ALERTS LIST */}
      <div className="glass border border-white/10 rounded-2xl bg-[#121622] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            {activeCategory === "attendance" ? (
              <><AlertTriangle className="w-4 h-4 text-rose-500" /> Students with Low Attendance</>
            ) : (
              <><FileWarning className="w-4 h-4 text-amber-500" /> Students with Missing Assignments</>
            )}
          </h3>

          {activeCategory === "attendance" && displayedWarnings.length > 0 && (
            <button
              onClick={handleSendReminderToAll}
              disabled={sendingAll}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-[11px] font-extrabold text-white transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {sendingAll ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Send className="w-3.5 h-3.5 text-rose-200" />
              )}
              <span>{sendingAll ? "Sending to All..." : "📨 Send Reminder to All"}</span>
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3.5"
            >
              {displayedWarnings.length > 0 ? (
                displayedWarnings.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-white/5 bg-[#090e1a] hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-200">{s.name}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                          {s.roll_number}
                        </span>
                        {s.email && (
                          <a
                            href={`mailto:${s.email}?subject=Urgent: Attendance Shortage Warning (${s.roll_number})&body=Dear ${s.name},%0D%0A%0D%0AYour current attendance is ${s.value}, which is below the mandatory 75% cutoff. Please report to the faculty department immediately.`}
                            className="text-[10px] font-semibold text-rose-300 hover:text-white flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md transition-colors"
                            title={`Send email to ${s.email}`}
                          >
                            <Mail className="w-3 h-3 text-rose-400" />
                            <span>{s.email}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {s.type === "attendance" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {s.desc}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {s.desc}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="mr-4 text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                          {s.type === "attendance" ? "Attendance" : "Pending"}
                        </span>
                        <span className={`text-xs font-black font-mono ${s.type === "attendance" ? "text-rose-400" : "text-amber-400"}`}>
                          {s.value}
                        </span>
                      </div>

                      <Link
                        href="/students"
                        className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>

                      {/* ⚡ Send Reminder Button via n8n Webhook */}
                      <button
                        onClick={() => sendSingleReminder(s)}
                        disabled={!!sendingState[s.id] || sendingAll}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-[11px] font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                      >
                        {sendingState[s.id] ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>{sendingState[s.id] ? "Sending..." : "Send Reminder"}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs py-10 text-center font-medium">
                  No students in this category.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
