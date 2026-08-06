"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Map,
  Target,
  Briefcase,
  Sparkles,
  BarChart3,
  Code2,
  Menu,
  X,
  Flame,
  Zap,
  ChevronRight,
  User,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/lib/auth";
import BookIcon from "@/components/icons/BookIcon";
import UserIcon from "@/components/icons/UserIcon";
import ExploreIcon from "@/components/icons/ExploreIcon";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid, desc: "Overview & metrics" },
  { name: "Learning", href: "/learning", icon: BookIcon, desc: "Courses & YouTube playlists" },
  { name: "Roadmaps", href: "/roadmaps", icon: Map, desc: "Interactive career tracks", disabled: true },
  { name: "Practice", href: "/practice", icon: Target, desc: "Aptitude & company questions", disabled: true },
  { name: "Career", href: "/career", icon: Briefcase, desc: "AI resume analysis", disabled: true },
  { name: "Explore", href: "/explore", icon: ExploreIcon, desc: "Trending skills & tools" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, desc: "Detailed performance" },
  { name: "Profile", href: "/settings", icon: UserIcon, desc: "Account & settings" },
];

// High-frequency bottom bar items for 1-thumb native smartphone navigation
const bottomBarItems = [
  { name: "Home", href: "/dashboard", icon: LayoutGrid },
  { name: "Learn", href: "/learning", icon: BookIcon },
  { name: "Explore", href: "/explore", icon: ExploreIcon },
  { name: "Practice", href: "/practice", icon: Target, disabled: true },
  { name: "Profile", href: "/settings", icon: UserIcon },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/login" || isLoading || !session) {
    return null;
  }

  const userEmail = session?.email || "Guest User";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Native Smartphone Top Header (< md viewport) ── */}
      <header className="md:hidden sticky top-0 z-30 w-full px-4 py-3 bg-[#060a15]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Code2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white gradient-text-blue block leading-none">
              SkillsCatalyst
            </span>
            <span className="text-[9px] text-slate-400 font-medium tracking-wide block mt-0.5">
              Mobile Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <Link
            href="/explore"
            className="p-2 rounded-xl glass hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Drawer trigger button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all mobile-touch-target"
          >
            {drawerOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>
      </header>

      {/* ── Native Slide-Over Navigation Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Darkened Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 md:hidden"
            />

            {/* Slide-in Panel from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm glass-strong bg-[#091122]/95 border-l border-white/10 z-50 p-5 flex flex-col justify-between overflow-y-auto mobile-touch-scroll md:hidden"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {userInitial}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm truncate max-w-[170px]">
                        {userEmail.split("@")[0]}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Session
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white mobile-touch-target"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive =
                      !item.disabled &&
                      (pathname === item.href ||
                      (pathname === "/" && item.href === "/dashboard"));
                    const Icon = item.icon;
                    const isExplore = item.name === "Explore";
                    const isDisabled = item.disabled;

                    return (
                      <Link
                        key={item.name}
                        href={isDisabled ? "#" : item.href}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                          } else {
                            setDrawerOpen(false);
                          }
                        }}
                        className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all mobile-touch-target ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed select-none"
                            : isActive
                            ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/10"
                            : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isActive
                                ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                                : "bg-white/5 text-slate-400 group-hover:text-white"
                            }`}
                          >
                            {isExplore ? (
                              <ExploreIcon size={18} />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="block font-medium leading-none text-white">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isActive ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer: Streak Badge */}
              <div className="glass rounded-2xl p-4 mt-6 border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-orange-400 fill-orange-400/30" />
                    Daily Learning Streak
                  </div>
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  0 <span className="text-xs font-semibold text-slate-400">days active</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="streak-bar h-full w-[10%]" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Native Floating Glass Pill Navigation Bar (Visible on smartphone < md) ── */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 rounded-full border border-white/15 bg-[#091122]/92 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] px-2 py-1.5 flex items-center justify-around">
        {bottomBarItems.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href ||
            (pathname === "/" && item.href === "/dashboard"));
          const Icon = item.icon;
          const isExplore = item.name === "Explore";
          const isDisabled = item.disabled;

          return (
            <Link
              key={item.name}
              href={isDisabled ? "#" : item.href}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[46px] rounded-full transition-all select-none ${
                isDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileBottomNavActive"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/35 via-purple-600/30 to-blue-500/25 rounded-full border border-blue-400/40 shadow-lg shadow-blue-500/30"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={isDisabled ? undefined : { scale: 0.86 }}
                className={`relative z-10 flex flex-col items-center justify-center transition-colors duration-200 ${
                  isActive ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isExplore ? (
                  <ExploreIcon size={20} className={`relative z-10 transition-transform duration-200 ${isActive ? "scale-110 text-cyan-300" : ""}`} />
                ) : (
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                      isActive ? "text-cyan-300 scale-110" : "text-slate-400"
                    }`}
                  />
                )}
                <span
                  className={`text-[10px] tracking-tight font-medium mt-0.5 relative z-10 transition-all duration-200 ${
                    isActive ? "text-white font-bold opacity-100 scale-105" : "text-slate-400 opacity-80"
                  }`}
                >
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
