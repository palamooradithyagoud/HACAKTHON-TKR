"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Building2,
  TrendingUp,
  Search,
  Sparkles,
  ExternalLink,
  Flame,
  Clock,
  MapPin,
  Globe,
  Award,
  BookOpen,
  Code2,
  Zap,
  ChevronRight,
  HelpCircle,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Filter,
  RefreshCw,
  Newspaper,
  Layers,
  Smile,
} from "lucide-react";
import MemeLearningSection from "@/components/MemeLearningSection";
import {
  fetchOpportunities,
  fetchCompanyDetails,
  fetchCompanyAiTips,
  fetchTechTrends,
  triggerApifyCrawl,
} from "@/lib/api";

type MainTab = "opportunities" | "companies" | "trends" | "memes";
type CategoryFilter = "all" | "internship" | "job" | "hackathon" | "contest" | "scholarship";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<MainTab>("opportunities");

  // ── Initial Fallback Datasets for Instant Render ───────────────────────────
  const INITIAL_OPPORTUNITIES = [
    {
      id: "opp-1",
      title: "Software Development Engineer Intern (Summer 2026)",
      organizer: "Google",
      category: "internship",
      typeBadge: "🎓 Internship",
      location: "Bengaluru / Hyderabad (Hybrid)",
      isRemote: false,
      deadline: "2026-08-30",
      deadlineFormatted: "Aug 30, 2026",
      status: "Closing Soon",
      stipend: "₹1,25,000 / month",
      skills: ["Data Structures", "Algorithms", "C++ / Java / Python", "System Design"],
      applyUrl: "https://careers.google.com/jobs/results/",
      description: "Work alongside Google engineers to build global internet infrastructure and next-gen AI applications."
    },
    {
      id: "opp-2",
      title: "Frontend Engineer - React 19 & Next.js",
      organizer: "Vercel",
      category: "job",
      typeBadge: "💼 Full-Time Job",
      location: "Global Remote",
      isRemote: true,
      deadline: "2026-09-15",
      deadlineFormatted: "Sep 15, 2026",
      status: "Actively Hiring",
      stipend: "$120,000 - $160,000 / year",
      skills: ["Next.js", "React 19", "TypeScript", "Tailwind CSS", "Edge Functions"],
      applyUrl: "https://vercel.com/careers",
      description: "Help craft the future of web deployment, edge computing, and frontend frameworks."
    },
    {
      id: "opp-3",
      title: "Global AI & Agentic LLM Hackathon 2026",
      organizer: "Groq & OpenAI",
      category: "hackathon",
      typeBadge: "🏆 Hackathon",
      location: "Online / Global",
      isRemote: true,
      deadline: "2026-08-25",
      deadlineFormatted: "Aug 25, 2026",
      status: "🔴 Live Now",
      stipend: "₹25,00,000 Grand Prize Pool",
      skills: ["Python", "Groq API", "LangChain", "PyTorch", "RAG / VectorDB"],
      applyUrl: "https://devpost.com/hackathons",
      description: "Build high-speed real-time AI agents using Groq LPU hardware and win cash prizes, cloud credits, and job offers."
    },
    {
      id: "opp-4",
      title: "LeetCode Biweekly Coding Challenge 138",
      organizer: "LeetCode",
      category: "contest",
      typeBadge: "⚡ Coding Contest",
      location: "Online",
      isRemote: true,
      deadline: "2026-08-15",
      deadlineFormatted: "Aug 15, 2026",
      status: "Starts this Weekend",
      stipend: "Top Ranks Get Interview Referrals + Swag",
      skills: ["Competitive Programming", "DSA", "Problem Solving"],
      applyUrl: "https://leetcode.com/contest/",
      description: "Compete against 30,000+ engineers globally in 4 algorithmic challenges within 90 minutes."
    },
    {
      id: "opp-5",
      title: "Graduate Women in Tech Fellowship 2026",
      organizer: "Microsoft Philanthropy",
      category: "scholarship",
      typeBadge: "📜 Scholarship",
      location: "India & SEA Region",
      isRemote: true,
      deadline: "2026-10-01",
      deadlineFormatted: "Oct 01, 2026",
      status: "Applications Open",
      stipend: "₹2,00,000 Tuition Grant + Microsoft Mentorship",
      skills: ["Computer Science", "Leadership", "Academic Excellence"],
      applyUrl: "https://www.microsoft.com/en-us/research/academic-programs/",
      description: "Providing financial assistance, 1-on-1 mentorship, and internship fast-track for outstanding women in CS."
    },
    {
      id: "opp-6",
      title: "Backend Systems & Cloud Engineer (FastAPI & Rust)",
      organizer: "Swiggy Tech",
      category: "job",
      typeBadge: "💼 Full-Time Job",
      location: "Bengaluru, KA",
      isRemote: false,
      deadline: "2026-09-10",
      deadlineFormatted: "Sep 10, 2026",
      status: "Actively Hiring",
      stipend: "₹18 - ₹28 LPA",
      skills: ["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker & K8s"],
      applyUrl: "https://careers.swiggy.com/",
      description: "Scale real-time delivery routing and microservices serving over 10 million orders daily."
    }
  ];

  const INITIAL_GOOGLE = {
    name: "Google",
    logo: "🔍",
    tagline: "Organizing the world's information and making it universally accessible.",
    overview: "Google is an engineering-driven powerhouse focusing on search, cloud, AI, Android, and global scale distributed systems.",
    techStack: {
      "Frontend": ["Angular", "Lit", "TypeScript", "Dart / Flutter"],
      "Backend": ["C++", "Java", "Go", "Python"],
      "Cloud & Infra": ["Google Cloud (GCP)", "Kubernetes (Borg)", "Spanner"],
      "AI / ML": ["TensorFlow", "JAX", "Gemini 2.5 Flash", "TPU Infrastructure"]
    },
    hiringRoles: ["Software Engineer (SWE I/II)", "Site Reliability Engineer (SRE)", "AI Research Engineer", "Product Manager"],
    salaryRange: "Fresher: ₹22 - ₹38 LPA | Senior: ₹50 - ₹1.2 Cr",
    requiredSkills: ["Data Structures & Algorithms", "System Design & Scalability", "Concurrency", "Clean Code & Refactoring"],
    interviewQuestions: [
      { q: "Given a binary tree, return its vertical order traversal.", category: "Coding (Hard)", tag: "Trees & BFS" },
      { q: "Design Google Drive / Google Photos backend at 1 Billion user scale.", category: "System Design", tag: "Distributed Storage" },
      { q: "Implement an LRU Cache with O(1) get and put operations.", category: "Coding (Medium)", tag: "Data Structures" },
      { q: "Tell me about a time you had a technical disagreement with a Senior Lead.", category: "Behavioral", tag: "Googleyness" }
    ],
    aiTips: "Google emphasizes deep algorithmic problem-solving with tight time/space complexity analysis. Always communicate your thought process out loud before coding. Practice Googleyness questions on conflict resolution, ownership, and ambiguity."
  };

  const INITIAL_TRENDS = {
    trendingTech: [
      {
        id: "tech-1",
        name: "Agentic AI & LLM Engineering",
        category: "Artificial Intelligence",
        marketDemand: 98,
        demandTag: "🔥 Ultra High Demand",
        difficulty: "Intermediate - Advanced",
        growthRate: "+240% YoY",
        summary: "Building autonomous AI agents using LangChain, AutoGen, CrewAI, Function Calling, and Groq high-speed LPU inference.",
        recommendedNextSkills: ["Python 3.12", "LangChain / LlamaIndex", "Vector DBs (Chroma/Qdrant)", "FastAPI", "Groq/OpenAI APIs"],
        salaryBoost: "+45% Premium"
      },
      {
        id: "tech-2",
        name: "Next.js 16 & Server Components",
        category: "Full-Stack Web",
        marketDemand: 94,
        demandTag: "⚡ High Industry Adoption",
        difficulty: "Intermediate",
        growthRate: "+180% YoY",
        summary: "Modern React 19 architecture with Server Actions, Turbopack, App Router, Edge Middleware, and Tailwind v4.",
        recommendedNextSkills: ["TypeScript", "React 19 Hooks", "Tailwind CSS", "Supabase / PostgreSQL", "Vercel Deployment"],
        salaryBoost: "+30% Premium"
      },
      {
        id: "tech-3",
        name: "Rust Systems & Cloud Native",
        category: "Systems & Infrastructure",
        marketDemand: 91,
        demandTag: "🚀 Explosive Growth",
        difficulty: "Advanced",
        growthRate: "+150% YoY",
        summary: "Memory-safe high performance systems programming replacing C/C++ in cloud infrastructure, WebAssembly, and databases.",
        recommendedNextSkills: ["Rust Ownership & Borrowing", "Tokio Async Engine", "WebAssembly (Wasm)", "Docker & Microservices"],
        salaryBoost: "+40% Premium"
      },
      {
        id: "tech-4",
        name: "Vector Databases & RAG Architecture",
        category: "AI Infrastructure",
        marketDemand: 95,
        demandTag: "🔥 Hot Skill 2026",
        difficulty: "Intermediate",
        growthRate: "+210% YoY",
        summary: "Retrieval-Augmented Generation (RAG), embedding spaces, Semantic Search, and real-time enterprise AI memory.",
        recommendedNextSkills: ["Pinecone / Qdrant", "Sentence Transformers", "Hybrid Search", "Chunking Strategies"],
        salaryBoost: "+35% Premium"
      }
    ],
    inDemandSkills: [
      { name: "Python & PyTorch", role: "AI / ML Engineer", jobsCount: "42,000+ Openings", avgSalary: "₹16 - ₹35 LPA" },
      { name: "TypeScript & Next.js", role: "Full Stack Engineer", jobsCount: "38,000+ Openings", avgSalary: "₹12 - ₹28 LPA" },
      { name: "Docker & Kubernetes", role: "DevOps & Cloud Engineer", jobsCount: "29,000+ Openings", avgSalary: "₹15 - ₹32 LPA" },
      { name: "System Design & Distributed DBs", role: "Senior Architect", jobsCount: "18,000+ Openings", avgSalary: "₹28 - ₹60 LPA" }
    ],
    latestTechNews: [
      {
        id: "news-1",
        title: "Groq LPU Acceleration Sets New World Record for Real-Time AI Voice & Text Synthesis",
        source: "TechCrunch",
        time: "2 Hours Ago",
        tag: "AI Hardware",
        url: "https://groq.com/"
      },
      {
        id: "news-2",
        title: "React 19 & Next.js 16 Formally Adopted by 80% of Top Tech Startups",
        source: "Vercel Engineering",
        time: "5 Hours Ago",
        tag: "Web Ecosystem",
        url: "https://nextjs.org/blog"
      },
      {
        id: "news-3",
        title: "India's Tech Hiring Rebounds: 150,000+ New Openings for AI & Full-Stack Developers",
        source: "Economic Times Tech",
        time: "1 Day Ago",
        tag: "Career & Hiring",
        url: "https://economictimes.indiatimes.com/tech"
      }
    ]
  };

  // ── 1. Opportunities State ──────────────────────────────────────────────────
  const [oppCategory, setOppCategory] = useState<CategoryFilter>("all");
  const [oppSearch, setOppSearch] = useState("");
  const [opportunities, setOpportunities] = useState<any[]>(INITIAL_OPPORTUNITIES);
  const [loadingOpp, setLoadingOpp] = useState(false);

  // ── 2. Company Explorer State ───────────────────────────────────────────────
  const [companySearchInput, setCompanySearchInput] = useState("Google");
  const [activeCompany, setActiveCompany] = useState<any>(INITIAL_GOOGLE);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>(["Google", "Microsoft", "Amazon", "Meta", "TCS"]);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [customAiStrategy, setCustomAiStrategy] = useState<string | null>(null);
  const [generatingAiTips, setGeneratingAiTips] = useState(false);

  // ── 3. Tech Trends State ────────────────────────────────────────────────────
  const [techTrendsData, setTechTrendsData] = useState<any>(INITIAL_TRENDS);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // ── Load Opportunities ─────────────────────────────────────────────────────
  const loadOpportunities = async (cat = oppCategory, search = oppSearch) => {
    setLoadingOpp(true);
    try {
      const res = await fetchOpportunities(cat, search);
      if (res?.success && Array.isArray(res.data)) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOpp(false);
    }
  };

  const [runningApifyActor, setRunningApifyActor] = useState(false);

  const handleRunApifyCrawl = async () => {
    setRunningApifyActor(true);
    try {
      const res = await triggerApifyCrawl(oppSearch || "software engineering developer internships jobs 2026", oppCategory);
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningApifyActor(false);
    }
  };

  // ── Load Company Details ───────────────────────────────────────────────────
  const loadCompany = async (cName: string) => {
    setLoadingCompany(true);
    setCustomAiStrategy(null);
    try {
      const res = await fetchCompanyDetails(cName);
      if (res?.success && res.data) {
        setActiveCompany(res.data);
        if (res.availableCompanies) setAvailableCompanies(res.availableCompanies);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompany(false);
    }
  };

  // ── Generate AI Strategy for Company ─────────────────────────────────────
  const handleGenerateAiStrategy = async () => {
    if (!companySearchInput.trim()) return;
    setGeneratingAiTips(true);
    try {
      const res = await fetchCompanyAiTips(companySearchInput.trim());
      if (res?.success && res.aiStrategy) {
        setCustomAiStrategy(res.aiStrategy);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAiTips(false);
    }
  };

  // ── Load Tech Trends ───────────────────────────────────────────────────────
  const loadTechTrends = async () => {
    setLoadingTrends(true);
    try {
      const res = await fetchTechTrends();
      if (res?.success && res.data) {
        setTechTrendsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    loadOpportunities("all", "");
    loadCompany("Google");
    loadTechTrends();
  }, []);

  // Filter handler for opportunities search input
  const handleSearchOpportunities = (e: React.FormEvent) => {
    e.preventDefault();
    loadOpportunities(oppCategory, oppSearch);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6 pb-16 px-2 sm:px-4"
    >
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apify Live Crawler &amp; Groq AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              SkillsCatalyst <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">Explore Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Discover real-time career opportunities, research tech company interview question banks, and master high-demand tech trends.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-lg sm:text-xl font-black text-emerald-400 block">50+</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Active Opportunities</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-lg sm:text-xl font-black text-cyan-400 block">Top 5</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Tech Companies</span>
            </div>
          </div>
        </div>

        {/* ── Main Navigation Tabs ────────────────────────────────────────────── */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab("opportunities")}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              activeTab === "opportunities"
                ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === "opportunities" ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"}`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Opportunities Explorer
              </div>
              <p className="text-[11px] text-slate-400">Jobs, Internships &amp; Hackathons</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("companies")}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              activeTab === "companies"
                ? "bg-cyan-600/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === "companies" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Company Explorer
              </div>
              <p className="text-[11px] text-slate-400">Interview Qs &amp; AI Prep Tips</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              activeTab === "trends"
                ? "bg-emerald-600/20 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === "trends" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Tech Trends &amp; Insights
              </div>
              <p className="text-[11px] text-slate-400">In-Demand Skills &amp; AI News</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("memes")}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              activeTab === "memes"
                ? "bg-purple-600/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === "memes" ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400"}`}>
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                Meme Learning Hub 🎭
              </div>
              <p className="text-[11px] text-slate-400">Coding &amp; DSA via Memes</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── TAB 1: 💼 OPPORTUNITIES EXPLORER ────────────────────────────────── */}
      {activeTab === "opportunities" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Controls Bar: Search & Category Pills */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <form onSubmit={handleSearchOpportunities} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                  placeholder="Search opportunities by role, company, or skill (e.g., React, Python, Remote, Google)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
              <button
                type="button"
                onClick={handleRunApifyCrawl}
                disabled={runningApifyActor}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {runningApifyActor ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Zap className="w-4 h-4 text-yellow-200" />
                )}
                <span>{runningApifyActor ? "Crawling Web via Apify..." : "⚡ Crawl Live via Apify Actor"}</span>
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "all", label: "All Opportunities", icon: Layers },
                { id: "internship", label: "🎓 Internships", icon: Briefcase },
                { id: "job", label: "💼 Full-Time Jobs", icon: Building2 },
                { id: "hackathon", label: "🏆 Hackathons", icon: Award },
                { id: "contest", label: "⚡ Coding Contests", icon: Code2 },
                { id: "scholarship", label: "📜 Scholarships", icon: Zap },
              ].map((cat) => {
                const sel = oppCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setOppCategory(cat.id as CategoryFilter);
                      loadOpportunities(cat.id as CategoryFilter, oppSearch);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      sel
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opportunities Cards Grid */}
          {loadingOpp ? (
            <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /> Crawling opportunities via Apify...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-slate-300 font-bold text-base">No opportunities found</p>
              <p className="text-slate-500 text-xs">Try clearing your search query or selecting a different category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-xl relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {opp.typeBadge || opp.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {opp.status}
                      </span>
                    </div>

                    {/* Title & Company */}
                    <div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                        {opp.title}
                      </h3>
                      <p className="text-xs font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {opp.organizer}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {opp.description}
                    </p>

                    {/* Details Info Pills */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 font-medium pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1">
                        {opp.isRemote ? <Globe className="w-3 h-3 text-cyan-400" /> : <MapPin className="w-3 h-3 text-rose-400" />}
                        {opp.location}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-amber-300 font-bold">
                        <DollarSign className="w-3 h-3 text-amber-400" /> {opp.stipend}
                      </span>
                    </div>

                    {/* Required Skills Tag Chips */}
                    {opp.skills && opp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {opp.skills.map((sk: string) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Apply Link Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deadline: {opp.deadlineFormatted || opp.deadline}
                    </span>
                    <a
                      href={opp.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 group-hover:translate-x-0.5"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB 2: 🏢 COMPANY EXPLORER ─────────────────────────────────────── */}
      {activeTab === "companies" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Search Company Bar & Quick Chips */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companySearchInput}
                  onChange={(e) => setCompanySearchInput(e.target.value)}
                  placeholder="Search any company (e.g., Google, Microsoft, Amazon, Meta, TCS, Uber, Stripe)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
              <button
                onClick={() => loadCompany(companySearchInput)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Load Company
              </button>
            </div>

            {/* Quick Popular Company Chips */}
            {availableCompanies.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Popular:</span>
                {availableCompanies.map((cName) => (
                  <button
                    key={cName}
                    onClick={() => {
                      setCompanySearchInput(cName);
                      loadCompany(cName);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      activeCompany?.name?.toLowerCase() === cName.toLowerCase()
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingCompany ? (
            <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> Fetching company interview breakdown &amp; tech stack...
            </div>
          ) : activeCompany ? (
            <div className="space-y-6">
              {/* Company Banner Overview Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-500/30 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">{activeCompany.logo || "🏢"}</span>
                    <div>
                      <h2 className="text-2xl font-black text-white">{activeCompany.name}</h2>
                      <p className="text-xs text-cyan-400 font-semibold">{activeCompany.tagline}</p>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-300">
                    💰 {activeCompany.salaryRange}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeCompany.overview}
                </p>

                {/* Hiring Roles Badges */}
                {activeCompany.hiringRoles && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Hiring Roles:</span>
                    <div className="flex flex-wrap gap-2">
                      {activeCompany.hiringRoles.map((role: string) => (
                        <span key={role} className="px-3 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs font-bold">
                          💼 {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tech Stack Grid & Required Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tech Stack Breakdown */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Tech Stack Engineering Breakdown</span>
                  </h3>
                  <div className="space-y-3 pt-1">
                    {activeCompany.techStack &&
                      Object.entries(activeCompany.techStack).map(([layer, techList]: [string, any]) => (
                        <div key={layer} className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">{layer}:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(techList) &&
                              techList.map((t: string) => (
                                <span key={t} className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                                  {t}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Required Core Skills */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Required Competencies &amp; Skills</span>
                  </h3>
                  <div className="space-y-2 pt-1">
                    {activeCompany.requiredSkills &&
                      activeCompany.requiredSkills.map((sk: string) => (
                        <div key={sk} className="flex items-center gap-2 text-xs font-bold text-slate-200 p-2 rounded-xl bg-slate-950 border border-slate-850">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{sk}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Frequently Asked Interview Questions */}
              {activeCompany.interviewQuestions && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>Frequently Asked Interview Questions</span>
                  </h3>

                  <div className="space-y-3">
                    {activeCompany.interviewQuestions.map((qObj: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {qObj.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">{qObj.tag}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                          Q{idx + 1}. {qObj.q}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⚡ AI Interview Preparation Strategy */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <span>Groq / Gemini AI Preparation Strategy for {activeCompany.name}</span>
                  </h3>
                  <button
                    onClick={handleGenerateAiStrategy}
                    disabled={generatingAiTips}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    {generatingAiTips ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{generatingAiTips ? "Generating..." : "Generate Custom AI Strategy"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                  {customAiStrategy ? (
                    <div className="whitespace-pre-line font-medium text-slate-200">{customAiStrategy}</div>
                  ) : (
                    <p>{activeCompany.aiTips || "Focus on solid core CS fundamentals, system design, and communication."}</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}

      {/* ── TAB 3: 📈 TECH TRENDS & LEARNING INSIGHTS ───────────────────────── */}
      {activeTab === "trends" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {loadingTrends ? (
            <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Analyzing market demand &amp; tech trends...
            </div>
          ) : techTrendsData ? (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400/30" />
                  <span>Trending Technologies &amp; High-Demand Skills (2026)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time market insights on what technologies are worth spending your learning hours on.
                </p>
              </div>

              {/* Trending Tech Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techTrendsData.trendingTech &&
                  techTrendsData.trendingTech.map((tech: any) => (
                    <div
                      key={tech.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {tech.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {tech.demandTag}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-white">{tech.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-semibold">
                            <span>Growth: <strong className="text-emerald-400">{tech.growthRate}</strong></span>
                            <span>•</span>
                            <span>Salary Boost: <strong className="text-amber-300">{tech.salaryBoost}</strong></span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{tech.summary}</p>

                        {/* Recommended Next Skills Path */}
                        {tech.recommendedNextSkills && (
                          <div className="pt-2 space-y-1.5 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Recommended Next Skills Sequence:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {tech.recommendedNextSkills.map((sk: string, idx: number) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1"
                                >
                                  <span>{sk}</span>
                                  {idx < tech.recommendedNextSkills.length - 1 && (
                                    <ArrowRight className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Most In-Demand Skills Grid */}
              {techTrendsData.inDemandSkills && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span>Top In-Demand Developer Skills in Market</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {techTrendsData.inDemandSkills.map((sk: any) => (
                      <div key={sk.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-xs font-bold text-white block">{sk.name}</span>
                        <span className="text-[11px] text-cyan-400 block font-semibold">{sk.role}</span>
                        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-900">
                          <span>{sk.jobsCount}</span>
                          <span className="text-amber-300 font-bold">{sk.avgSalary}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest AI & Tech News Feed */}
              {techTrendsData.latestTechNews && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Newspaper className="w-4 h-4 text-purple-400" />
                    <span>Latest Tech &amp; AI Ecosystem News</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {techTrendsData.latestTechNews.map((news: any) => (
                      <a
                        key={news.id}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {news.tag}
                          </span>
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                            {news.title}
                          </h4>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-900">
                          <span>{news.source}</span>
                          <span>{news.time}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      )}

      {/* ── TAB 4: 🎭 MEME LEARNING HUB ────────────────────────────────────── */}
      {activeTab === "memes" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <MemeLearningSection />
        </motion.div>
      )}
    </motion.div>
  );
}
