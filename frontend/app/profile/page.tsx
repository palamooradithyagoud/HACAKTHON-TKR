"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { 
  User, Mail, GraduationCap, BookOpen, Clock, 
  Settings, Award, Lock, LogOut, CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
  const { session, logout } = useAuth();

  if (!session) return null;

  const courses = [
    { code: "CS-301", name: "Data Structures & Algorithms", schedule: "Mon, Wed, Fri (9:00 AM)" },
    { code: "CS-302", name: "System Design & Architecture", schedule: "Tue, Thu (11:30 AM)" },
    { code: "CS-205", name: "Web Development Lab", schedule: "Mon, Fri (2:00 PM)" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-16"
    >
      {/* Faculty Info Card */}
      <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#0d1730] via-[#091122] to-[#120b29] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-400 p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#060c18] flex items-center justify-center text-white font-black text-2xl font-mono">
              F
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight">{session.name || "Dr. Faculty"}</h1>
            <p className="text-xs text-slate-400 font-medium">
              {session.email || "faculty@demo.com"} • Senior Professor
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Computer Science & Engineering</span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Teaching Assignments */}
        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Assigned Courses</span>
          </h3>

          <div className="space-y-3.5">
            {courses.map((course, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-[#090e1a]">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-200">{course.name}</h4>
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/10">
                    {course.code}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  {course.schedule}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Institution Details */}
        <div className="glass p-5 rounded-2xl border border-white/10 bg-white/[0.01] space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Academic Credentials</span>
          </h3>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
              <span className="text-slate-400 font-medium">Institution</span>
              <span className="text-slate-200 font-bold">Vardhaman College of Engineering</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
              <span className="text-slate-400 font-medium">Degree</span>
              <span className="text-slate-200 font-bold">Ph.D. in Computer Science</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
              <span className="text-slate-400 font-medium">Teaching Experience</span>
              <span className="text-slate-200 font-bold">12+ Years</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-[#090e1a]">
              <span className="text-slate-400 font-medium">Access Authorization</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Department Head
              </span>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
