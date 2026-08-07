"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Sparkles,
  Code2,
  Terminal,
  Flame,
  BookOpen,
  Heart,
  Bookmark,
  Share2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  Layers,
  Cpu,
  GitBranch,
  Globe,
  Database,
} from "lucide-react";

export interface MemeConcept {
  id: string;
  title: string;
  category: "dsa" | "web" | "devops" | "sysdesign";
  categoryBadge: string;
  difficulty: "Easy" | "Medium" | "Hard";
  memeSetup: {
    dialogue: { speaker: string; text: string; emoji: string; color: string }[];
    punchline: string;
    punchlineEmoji: string;
  };
  conceptSummary: string;
  interviewQuestion: {
    title: string;
    leetcodeId?: number;
    explanation: string;
    codeSnippet: string;
    language: string;
  };
  likes: number;
}

const MEME_CONCEPTS: MemeConcept[] = [
  {
    id: "meme-dp-memo",
    title: "1. Dynamic Programming (Memoization)",
    category: "dsa",
    categoryBadge: "⚡ DSA & Algorithms",
    difficulty: "Medium",
    memeSetup: {
      dialogue: [
        { speaker: "Teacher", text: "What is 1 + 1 + 1 + 1 + 1?", emoji: "👨‍🏫", color: "text-slate-300" },
        { speaker: "Student", text: "5!", emoji: "🧑‍🎓", color: "text-cyan-400" },
        { speaker: "Teacher", text: "*Adds a '1' at the end* What is it now?", emoji: "👨‍🏫", color: "text-slate-300" },
        { speaker: "Student", text: "6!", emoji: "🧑‍🎓", color: "text-emerald-400" },
        { speaker: "Teacher", text: "How did you know it was 6 so fast without counting again?!", emoji: "👨‍🏫", color: "text-amber-400" }
      ],
      punchline: "Student: 'Because I remembered it was 5!' 🧠 -> You just understood Memoization!",
      punchlineEmoji: "🎉"
    },
    conceptSummary: "Memoization avoids re-computing expensive subproblems by caching previous results in a Lookup Table (Hash Map or Array). This converts Exponential O(2^N) recursion into Linear O(N) time!",
    interviewQuestion: {
      title: "LeetCode 70 — Climbing Stairs / Fibonacci",
      leetcodeId: 70,
      explanation: "Instead of calling fib(n-1) + fib(n-2) recursively (O(2^N)), store previous step counts in an array.",
      language: "python",
      codeSnippet: `# ❌ Bad: Exponential O(2^N) Recursion
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2) # Recomputes subproblems 1000s of times!

# ✅ Good: Linear O(N) DP Memoization
memo = {}
def fib_dp(n):
    if n <= 1: return n
    if n not in memo:
        memo[n] = fib_dp(n-1) + fib_dp(n-2) # Saved for O(1) reuse!
    return memo[n]`
    },
    likes: 342
  },
  {
    id: "meme-two-pointers",
    title: "2. Floyd's Cycle Detection (Fast & Slow Pointers)",
    category: "dsa",
    categoryBadge: "⚡ DSA & Algorithms",
    difficulty: "Easy",
    memeSetup: {
      dialogue: [
        { speaker: "Slow Pointer 🐢", text: "I move 1 node per step.", emoji: "🐢", color: "text-cyan-400" },
        { speaker: "Fast Pointer 🐇", text: "I move 2 nodes per step!", emoji: "🐇", color: "text-amber-400" },
        { speaker: "Linked List Cycle 🔄", text: "Haha you'll never reach the end NULL node!", emoji: "😈", color: "text-rose-400" }
      ],
      punchline: "Fast & Slow meeting point: 'Tag! You're it!' 🤝 -> Cycle Detected in O(N) time and O(1) space!",
      punchlineEmoji: "🎯"
    },
    conceptSummary: "If a Linked List has a loop, a fast pointer moving at twice the speed of a slow pointer will EVENTUALLY overtake and collide with the slow pointer inside the loop.",
    interviewQuestion: {
      title: "LeetCode 141 — Linked List Cycle Detection",
      leetcodeId: 141,
      explanation: "Move slow by 1 step, fast by 2 steps. If fast === slow, return True.",
      language: "javascript",
      codeSnippet: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;         // 🐢 1 step
    fast = fast.next.next;    // 🐇 2 steps
    if (slow === fast) return true; // 🎯 Collision! Cycle exists.
  }
  return false; // Reached NULL end -> No cycle
}`
    },
    likes: 289
  },
  {
    id: "meme-js-coercion",
    title: "3. JavaScript Type Coercion (== vs ===)",
    category: "web",
    categoryBadge: "🌐 Web Dev & JS",
    difficulty: "Easy",
    memeSetup: {
      dialogue: [
        { speaker: "JavaScript Engine", text: "0 == '' -> true!", emoji: "🤡", color: "text-amber-400" },
        { speaker: "JavaScript Engine", text: "0 == '0' -> true!", emoji: "🤪", color: "text-amber-400" },
        { speaker: "JavaScript Engine", text: "false == '0' -> true!", emoji: "🤯", color: "text-rose-400" },
        { speaker: "Developer", text: "So '' == '0' must be true, right?", emoji: "🧑‍💻", color: "text-cyan-400" }
      ],
      punchline: "JavaScript: '' == '0' -> FALSE! 💀 -> Always use strict equality (===)! ",
      punchlineEmoji: "🛑"
    },
    conceptSummary: "The double equals (==) operator performs Implicit Type Coercion before comparing values. Triple equals (===) checks BOTH value and data type strictly without conversion.",
    interviewQuestion: {
      title: "Frontend Interview — Explain JS Type Coercion",
      explanation: "Explain why 0 == '' is true (both convert to number 0), but '' == '0' compares two strings.",
      language: "javascript",
      codeSnippet: `// ❌ Loose Equality (==) performs type coercion
console.log(0 == '');        // true (Number('') -> 0)
console.log(false == '0');   // true (Number(false) -> 0)

// ✅ Strict Equality (===) checks value AND type
console.log(0 === '');       // false (Number vs String)
console.log(0 === 0);        // true (Same type & value)`
    },
    likes: 415
  },
  {
    id: "meme-git-force",
    title: "4. Git Push --Force on Friday at 4:59 PM",
    category: "devops",
    categoryBadge: "🛠️ Git & DevOps",
    difficulty: "Medium",
    memeSetup: {
      dialogue: [
        { speaker: "Junior Dev", text: "I have merge conflicts... let me run git push origin main --force!", emoji: "🧑‍💻", color: "text-cyan-400" },
        { speaker: "Git Remote", text: "Overwriting 3 months of team commits without checking...", emoji: "🔥", color: "text-rose-400" },
        { speaker: "Senior Lead", text: "WHO JUST ERASED PRODUCTION HISTORY?!", emoji: "😱", color: "text-amber-400" }
      ],
      punchline: "Use 'git push --force-with-lease' to protect team commits from being accidentally overwritten!",
      punchlineEmoji: "🛡️"
    },
    conceptSummary: "--force unconditionally overwrites remote branch history. --force-with-lease checks if someone else pushed new commits to the remote branch first before replacing history.",
    interviewQuestion: {
      title: "Git Workflow — Safely Reverting & Pushing History",
      explanation: "How to safely push amended commits without breaking team branches.",
      language: "bash",
      codeSnippet: `# ❌ Dangerous: Overwrites remote unconditionally
git push origin main --force

# ✅ Safe: Fails if someone else pushed changes in the meantime
git push origin main --force-with-lease`
    },
    likes: 512
  },
  {
    id: "meme-deadlock",
    title: "5. Multithreading Deadlocks & Mutex Locks",
    category: "sysdesign",
    categoryBadge: "🏛️ System Design & OS",
    difficulty: "Hard",
    memeSetup: {
      dialogue: [
        { speaker: "Thread A", text: "I locked Resource 1. Now waiting for Resource 2...", emoji: "🧵", color: "text-cyan-400" },
        { speaker: "Thread B", text: "I locked Resource 2. Now waiting for Resource 1...", emoji: "🧵", color: "text-indigo-400" },
        { speaker: "Operating System", text: "So neither of you is giving up your lock?", emoji: "🤖", color: "text-amber-400" }
      ],
      punchline: "Thread A & Thread B: 🗿 🗿 -> Permanent Freeze! (4 Coffman Conditions Met)",
      punchlineEmoji: "❄️"
    },
    conceptSummary: "Deadlock occurs when 2+ threads hold resources while waiting for resources held by others in a circular dependency. Solved using strict Lock Ordering or Resource Timeouts.",
    interviewQuestion: {
      title: "OS & System Design — Preventing Deadlocks",
      explanation: "Always acquire locks in a global predefined order across all threads.",
      language: "python",
      codeSnippet: `# ❌ Bad: Lock ordering mismatch causes Deadlock!
# Thread A acquires Lock1 -> Lock2
# Thread B acquires Lock2 -> Lock1

# ✅ Good: Always acquire locks in the same hierarchical order
with lock1:
    with lock2:
        # Perform critical section work safely
        pass`
    },
    likes: 367
  },
  {
    id: "meme-center-div",
    title: "6. Centering a Div in CSS (Flexbox vs Grid)",
    category: "web",
    categoryBadge: "🌐 Web Dev & JS",
    difficulty: "Easy",
    memeSetup: {
      dialogue: [
        { speaker: "NASA", text: "We landed a rover on Mars 140 Million miles away!", emoji: "🚀", color: "text-cyan-400" },
        { speaker: "Junior Web Dev", text: "Can you center this <div> vertically and horizontally in CSS?", emoji: "🧑‍💻", color: "text-slate-300" },
        { speaker: "Old CSS 2.0 Dev", text: "margin-top: -150px; float: left; position: absolute; ... wait why is it on the moon?", emoji: "😭", color: "text-rose-400" }
      ],
      punchline: "Modern Flexbox/Grid: 'display: flex; place-items: center;' -> Solved in 2 lines! 🎉",
      punchlineEmoji: "✨"
    },
    conceptSummary: "Flexbox and CSS Grid provide layout context where child items can be aligned along main and cross axes instantly without absolute positioning offsets.",
    interviewQuestion: {
      title: "CSS Layouts — Modern Centering Techniques",
      explanation: "Demonstrate Flexbox and CSS Grid centering.",
      language: "css",
      codeSnippet: `/* Modern Flexbox Centering */
.container-flex {
  display: flex;
  justify-content: center; /* Horizontal */
  align-items: center;     /* Vertical */
}

/* Modern CSS Grid Centering (Shortest!) */
.container-grid {
  display: grid;
  place-items: center;     /* Both axes! */
}`
    },
    likes: 620
  }
];

export default function MemeLearningSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMemes = MEME_CONCEPTS.filter((m) => {
    if (activeCategory === "all") return true;
    return m.category === activeCategory;
  });

  return (
    <div className="space-y-8">
      {/* ── Top Header Banner for Meme Hub */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Smile className="w-3.5 h-3.5 text-yellow-300" />
              <span>Byte-Sized Visual Tech Lessons</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Meme Learning Hub</span>
              <span className="text-xl">🎭</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Master complex Data Structures, Algorithms, Web Engineering, and System Architecture through hilarious, memorable programmer memes &amp; interview takeaways!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-center min-w-[120px]">
              <span className="text-xl font-black text-purple-400 block">6+</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Meme Lessons</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center min-w-[120px]">
              <span className="text-xl font-black text-cyan-400 block">100%</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Interview Ready</span>
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All Memes 🎭" },
            { id: "dsa", label: "DSA & Algorithms ⚡" },
            { id: "web", label: "Web Dev & JS 🌐" },
            { id: "devops", label: "Git & DevOps 🛠️" },
            { id: "sysdesign", label: "System Design 🏛️" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/50"
                    : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Meme Concept Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMemes.map((m) => {
          const isLiked = !!likedMap[m.id];
          const isBookmarked = !!bookmarkedMap[m.id];
          const currentLikes = m.likes + (isLiked ? 1 : 0);

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-[#0f172a]/90 border border-slate-800 hover:border-purple-500/40 p-6 flex flex-col justify-between space-y-6 shadow-xl transition-all group"
            >
              <div className="space-y-4">
                {/* Top Badge & Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {m.categoryBadge}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                        m.difficulty === "Easy"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : m.difficulty === "Medium"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {m.difficulty}
                    </span>

                    <button
                      onClick={() => toggleBookmark(m.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isBookmarked
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Save Concept"}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                  {m.title}
                </h3>

                {/* Visual Meme Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 relative overflow-hidden">
                  <div className="space-y-2">
                    {m.memeSetup.dialogue.map((d, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs font-medium">
                        <span className="text-base shrink-0">{d.emoji}</span>
                        <div className="space-x-1.5">
                          <strong className="text-slate-400">{d.speaker}:</strong>
                          <span className={`${d.color}`}>{d.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-bold text-yellow-300 bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20">
                    <span className="text-base">{m.memeSetup.punchlineEmoji}</span>
                    <span>{m.memeSetup.punchline}</span>
                  </div>
                </div>

                {/* Concept Explanation Box */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    <span>The Real Tech Concept (Why it Works)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {m.conceptSummary}
                  </p>
                </div>

                {/* Interview Question & Code Snippet */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span>{m.interviewQuestion.title}</span>
                    </div>

                    <button
                      onClick={() => copyCode(m.id, m.interviewQuestion.codeSnippet)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {m.interviewQuestion.explanation}
                  </p>

                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed scrollbar-thin">
                    <code>{m.interviewQuestion.codeSnippet}</code>
                  </pre>
                </div>
              </div>

              {/* Bottom Actions: Like & Share */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <button
                  onClick={() => toggleLike(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLiked
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{currentLikes} Likes</span>
                </button>

                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>SkillsCatalyst Byte Lesson</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
