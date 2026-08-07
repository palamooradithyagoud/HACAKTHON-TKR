"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, BellRing, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchFacultyAnnouncements } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
} as const;

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "tkr-notice-1",
    title: "TKR College Mid-Term Exam & Attendance Criteria",
    content: "All B.Tech students must maintain a minimum 75% attendance threshold before mid-term exams. Check section notices.",
    target_value: "TKR College",
    created_at: "Today",
  },
  {
    id: "tkr-notice-2",
    title: "Campus Placement & Skill Assessment Drive",
    content: "Submit your updated LeetCode profile link and resume on SkillsCatalyst for upcoming campus placement drives.",
    target_value: "Placement Cell",
    created_at: "Active Notice",
  },
];

export default function UpcomingList({ items = [] }: { items?: any[] }) {
  const { data: dbAnnouncements = [] } = useQuery({
    queryKey: ["faculty-announcements"],
    queryFn: fetchFacultyAnnouncements,
    staleTime: 1000 * 10,
  });

  const announcementsList =
    dbAnnouncements && dbAnnouncements.length > 0
      ? dbAnnouncements.slice(0, 3)
      : DEFAULT_ANNOUNCEMENTS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" as const }}
      className="glass rounded-2xl p-6 h-full flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Important Announcements</h2>
            <p className="text-[11px] text-slate-400 font-medium">Campus & Section Notices</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
          {announcementsList.length} Notices
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3 flex-1 my-2"
      >
        {announcementsList.map((ann: any, index: number) => {
          const isFirst = index === 0;
          return (
            <Link key={ann.id || index} href="/announcements">
              <motion.div
                variants={itemVariants}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group mb-2.5 ${
                  isFirst
                    ? "bg-amber-500/[0.04] border-amber-500/25 hover:border-amber-500/50"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {ann.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 shrink-0">
                    {ann.target_value || "TKR College"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                  {ann.content}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04] text-[10px] text-slate-400">
                  <span className="font-mono text-slate-400">
                    {ann.created_at && !isNaN(Date.parse(ann.created_at)) ? new Date(ann.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
                  </span>
                  <span className="text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
                    Read Notice <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      <Link
        href="/announcements"
        className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 mt-2"
      >
        <BellRing className="w-3.5 h-3.5 text-amber-400" />
        <span>View All Announcements</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
}

