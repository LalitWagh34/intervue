import { Link } from "react-router-dom";
import { useSession } from "@/lib/auth";
import {
  ArrowRight,
  Mic,
  Code2,
  MessageSquare,
  Trophy,
  Zap,
  Brain,
  Swords,
  ChevronRight,
  CheckCircle2,
  Terminal,
  Sparkles,
  Play,
  Flame,
  Users,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ROADMAP_STEPS = [
  {
    step: "Step 1",
    title: "Learn the Basics",
    desc: "Language syntax, I/O, Time & Space Complexity, basic recursion",
    topics: ["Things to Know in C++/Java/Python", "Patterns", "Basic Math", "Basic Recursion", "Hashing"],
    problems: 32,
    badge: "Free",
  },
  {
    step: "Step 2",
    title: "Important Sorting Techniques",
    desc: "Selection, Bubble, Insertion, Merge Sort, Recursive Bubble & Quick Sort",
    topics: ["Sorting-I (Selection, Bubble, Insertion)", "Sorting-II (Merge, Quick)"],
    problems: 7,
    badge: "Essential",
  },
  {
    step: "Step 3",
    title: "Solve Problems on Arrays",
    desc: "From basic array traversal to optimal Two-Pointer, Kadane's & Dutch Flag",
    topics: ["Easy (Largest, Second Largest, Rotate)", "Medium (Two Sum, Kadane, Majority)", "Hard (Pascal, 3-Sum, Subarrays)"],
    problems: 40,
    badge: "High Weightage",
  },
  {
    step: "Step 4",
    title: "Binary Search & Divide/Conquer",
    desc: "1D Arrays, 2D Matrices, Search Space & Minimax problems",
    topics: ["BS on 1D Arrays", "BS on Answers", "BS on 2D Matrices"],
    problems: 34,
    badge: "Must Master",
  },
  {
    step: "Step 5",
    title: "Dynamic Programming & Trees",
    desc: "From 1D Memoization to Tree Traversals and Graph Shortest Paths",
    topics: ["Binary Trees", "BST", "DP on Grids", "DP on Subsequences", "Graphs"],
    problems: 56,
    badge: "Advanced",
  },
];

const FEATURES = [
  {
    icon: Swords,
    title: "Multiplayer Battle Arena",
    desc: "Host live 1v1 or group contests with friends. Synchronized countdown timer, live leaderboard, and instant test case judging.",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: Code2,
    title: "Striver-Grade Coding Practice",
    desc: "Monaco IDE editor with starter templates in C++, Python, JS, TS, and Java. Judge0 execution with hidden testcase diagnostics.",
    color: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: Brain,
    title: "AI Interview Simulation",
    desc: "Live conversational interviewers tailored to your target job role. Adaptive follow-up questions evaluate technical depth in real-time.",
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    icon: Zap,
    title: "Instant Diagnostic Scorecard",
    desc: "Granular feedback on time complexity, edge cases, behavioral articulation, and dimensional score breakdowns.",
    color: "from-cyan-500/20 to-emerald-500/20",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-300",
  },
  {
    icon: Trophy,
    title: "Live Leaderboards & Streaks",
    desc: "Track solved problems, contest penalties, practice streaks, and compete against top engineering candidates nationwide.",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    icon: MessageSquare,
    title: "AI Tech Doubt Solver",
    desc: "Dedicated AI assistant to explain tricky algorithmic invariants, dry run recursion stacks, and optimize time complexity.",
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
  },
];

const STATS = [
  { value: "1,700,000+", label: "Active Learners" },
  { value: "450+", label: "Curated DSA Problems" },
  { value: "99.4%", label: "Placement Success Rate" },
  { value: "< 2.1s", label: "Judge0 Execution Speed" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#08090c] text-slate-100 relative overflow-hidden font-sans">
      {/* ─── Ambient Glow Blobs ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-glow w-[650px] h-[650px] bg-blue-600/15 top-[-120px] left-[50%] -translate-x-1/2" />
        <div className="ambient-glow w-[500px] h-[500px] bg-violet-600/15 top-[15%] left-[-100px]" />
        <div className="ambient-glow w-[600px] h-[600px] bg-cyan-500/10 top-[35%] right-[-150px]" />
        <div className="ambient-glow w-[550px] h-[550px] bg-indigo-600/10 bottom-[-100px] left-[30%]" />
      </div>

      {/* ─── TakeUForward-Style Floating Frosted Pill Navbar ───────────── */}
      <header className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-5xl h-14 rounded-full tuf-glass border border-white/[0.12] shadow-[0_10px_35px_rgba(0,0,0,0.6)] px-5 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_15px_rgba(50,124,246,0.5)] group-hover:scale-105 transition-transform">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              Intervue
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 rounded-md">
              TUF
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link to="/practice" className="hover:text-white transition-colors">
              Roadmap Sheets
            </Link>
            <Link to="/coding" className="hover:text-white transition-colors">
              Coding Hub
            </Link>
            <Link to="/rooms" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>Battle Arena</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                LIVE
              </span>
            </Link>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 bg-[#327cf6] hover:bg-[#2563eb] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_0_20px_rgba(50,124,246,0.4)] transition-all transform hover:scale-[1.02]"
              >
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-[#327cf6] hover:bg-[#2563eb] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_0_20px_rgba(50,124,246,0.4)] transition-all transform hover:scale-[1.02]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Social Proof Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 mb-7 backdrop-blur-md shadow-[0_0_25px_rgba(50,124,246,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-slate-200 text-xs font-semibold tracking-wide">
              1,700,000+ Engineers Prepared
            </span>
            <span className="text-[#38bdf8] text-xs font-bold">• Placement Ready</span>
          </div>

          {/* High-Impact Headline with Serif Accent */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
            One Stop <br />
            Learning Platform <br />
            <span className="font-serif-accent font-normal text-6xl sm:text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#327cf6] to-[#c084fc]">
              for TECH Interviews & Battles
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Master Data Structures & Algorithms with Striver-grade roadmap sheets, practice in a full
            Monaco editor with Judge0, and challenge peers in real-time competitive Battle Arenas.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to={session ? "/practice" : "/login"}
              className="inline-flex items-center gap-2 bg-[#327cf6] hover:bg-[#2563eb] text-white text-sm font-bold px-7 py-3.5 rounded-full shadow-[0_0_30px_rgba(50,124,246,0.45)] hover:shadow-[0_0_40px_rgba(50,124,246,0.65)] transition-all transform hover:scale-[1.02]"
            >
              <span>Start For Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 tuf-glass hover:bg-white/[0.08] text-slate-200 border border-white/[0.12] text-sm font-semibold px-6 py-3.5 rounded-full transition-all"
            >
              <Swords className="w-4 h-4 text-cyan-400" />
              <span>Explore Battle Arena</span>
            </Link>
          </div>

          {/* ─── Tilted 3D Preview Card Shell (TakeUForward Signature) ───── */}
          <div className="relative mx-auto max-w-4xl pt-4">
            <div className="relative rounded-2xl p-1 bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-transparent shadow-[0_20px_70px_rgba(0,0,0,0.8)]">
              <div className="rounded-2xl bg-[#0b0d14]/95 border border-white/[0.1] overflow-hidden backdrop-blur-xl">
                {/* Window Header */}
                <div className="px-4 py-3 bg-[#08090d] border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-slate-400 ml-3 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      intervue.app/rooms/ARENA-902
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      14:32 LEFT
                    </span>
                    <span className="text-xs font-semibold text-slate-400">12 Online</span>
                  </div>
                </div>

                {/* Mockup Split Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 text-left">
                  {/* Left: Problem Statement & Test Status */}
                  <div className="md:col-span-4 p-5 border-r border-white/[0.08] bg-[#090b11]/70">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                        Medium
                      </span>
                      <span className="text-[11px] font-mono text-blue-400 font-semibold">
                        +100 pts
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-sm mb-2">Two Sum II - Sorted Array</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      Given a 1-indexed array of integers numbers that is already sorted in
                      non-decreasing order, find two numbers such that they add up to target.
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 1
                        </span>
                        <span className="text-slate-400">0.02s</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 2
                        </span>
                        <span className="text-slate-400">0.03s</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-blue-400">
                          <Sparkles className="w-3.5 h-3.5" /> Hidden Tests (5/5)
                        </span>
                        <span className="text-emerald-400">PASSED</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Code Editor Mock */}
                  <div className="md:col-span-8 p-5 font-mono text-xs text-slate-300 bg-[#07080c] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-[11px] text-slate-400">
                        <span className="text-blue-400 font-semibold">Solution.cpp</span>
                        <span className="text-[10px] text-slate-400">C++20 (GCC 13.2)</span>
                      </div>

                      <pre className="text-slate-300 leading-relaxed overflow-x-auto text-[11px]">
                        <span className="text-purple-400">vector</span>
                        <span className="text-blue-300">&lt;int&gt;</span>{" "}
                        <span className="text-amber-300">twoSum</span>(
                        <span className="text-purple-400">vector</span>
                        <span className="text-blue-300">&lt;int&gt;</span>& nums,{" "}
                        <span className="text-purple-400">int</span> target) {"{\n"}
                        {"    "}
                        <span className="text-purple-400">int</span> left = 0, right = nums.size() -
                        1;{"\n"}
                        {"    "}
                        <span className="text-purple-400">while</span> (left &lt; right) {"{\n"}
                        {"        "}
                        <span className="text-purple-400">int</span> sum = nums[left] + nums[right];
                        {"\n"}
                        {"        "}
                        <span className="text-purple-400">if</span> (sum == target){" "}
                        <span className="text-purple-400">return</span> {"{left + 1, right + 1}"};
                        {"\n"}
                        {"        "}
                        <span className="text-purple-400">else if</span> (sum &lt; target) left++;
                        {"\n"}
                        {"        "}
                        <span className="text-purple-400">else</span> right--;{"\n"}
                        {"    }\n"}
                        {"    "}
                        <span className="text-purple-400">return</span> {"{}"};{"\n"}
                        {"}"}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.08]">
                      <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Verdict: ACCEPTED (100 pts)
                      </div>
                      <button className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#327cf6] text-white shadow-md">
                        Submit Solution
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Numbers / Social Proof Banner ────────────────────────────── */}
      <section className="relative py-12 border-y border-white/[0.08] bg-[#0c0d14]/60 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight font-sans">
                {stat.value}
              </div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Striver-Style DSA Sheets & Roadmap Preview ───────────────── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25 mb-3">
              <Code2 className="w-3.5 h-3.5" />
              <span>Structured Curriculum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Striver's Placement Roadmap Sheets
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Follow step-by-step topics curated for FAANG & tier-1 tech recruitment. Every topic
              includes theory, edge cases, and online judge practice.
            </p>
          </div>

          {/* Interactive Steps List */}
          <div className="space-y-3">
            {ROADMAP_STEPS.map((item, idx) => {
              const isExpanded = activeRoadmapStep === idx;
              return (
                <div
                  key={item.step}
                  className={cn(
                    "rounded-2xl transition-all border overflow-hidden cursor-pointer",
                    isExpanded
                      ? "bg-[#0e1017] border-[#327cf6]/50 shadow-[0_0_25px_rgba(50,124,246,0.12)]"
                      : "bg-[#0a0b10]/80 border-white/[0.08] hover:border-white/[0.18]"
                  )}
                  onClick={() => setActiveRoadmapStep(isExpanded ? -1 : idx)}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-colors",
                          isExpanded
                            ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.4)]"
                            : "bg-white/[0.05] text-slate-300 border border-white/[0.08]"
                        )}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-white font-bold text-sm sm:text-base">
                            {item.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        {item.problems} Problems
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform",
                          isExpanded && "rotate-90 text-blue-400"
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Topics Sub-List */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/[0.06] bg-[#07080c]/50">
                      <p className="text-xs font-semibold text-slate-300 mb-3">Topic Modules:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.topics.map((t) => (
                          <div
                            key={t}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-blue-500/30 transition-colors"
                          >
                            <span className="text-xs text-slate-300 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              {t}
                            </span>
                            <Link
                              to="/coding"
                              className="text-[11px] text-[#38bdf8] hover:underline font-semibold"
                            >
                              Practice →
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#38bdf8] hover:text-white transition-colors"
            >
              <span>View complete A2Z DSA Roadmap and Core CS Sheets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Platform Features Grid ───────────────────────────────────── */}
      <section id="features" className="py-20 px-6 border-t border-white/[0.08] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Engineered for Complete Interview Readiness
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Everything you need to crack SDE-1, SDE-2, and top campus placement rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "p-6 rounded-2xl bg-[#0a0b10]/90 border transition-all tuf-glass-hover",
                  f.border
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 border border-white/[0.08]",
                    f.color
                  )}
                >
                  <f.icon className={cn("w-5 h-5", f.iconColor)} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final Call to Action ─────────────────────────────────────── */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-3xl mx-auto p-10 rounded-3xl tuf-glass border border-blue-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(50,124,246,0.15)]">
          <div className="ambient-glow w-96 h-96 bg-blue-600/20 top-[-50%] left-[50%] -translate-x-1/2" />

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative z-10 font-sans">
            Ready to Accelerate Your Prep?
          </h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto mb-8 relative z-10">
            Join over 1.7M learners solving problems, competing in Battle Arenas, and acing technical
            interviews.
          </p>

          <Link
            to={session ? "/practice" : "/login"}
            className="inline-flex items-center gap-2 bg-[#327cf6] hover:bg-[#2563eb] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(50,124,246,0.5)] transition-all transform hover:scale-105 relative z-10"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Sleek TakeUForward Footer ─────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/[0.08] bg-[#06070a] text-xs text-slate-400 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">Intervue</span>
            <span>• Placement Preparation & Battle Arena</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/practice" className="hover:text-white transition-colors">
              Roadmap
            </Link>
            <Link to="/coding" className="hover:text-white transition-colors">
              Coding
            </Link>
            <Link to="/rooms" className="hover:text-white transition-colors">
              Battle Arena
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}