import { Link } from "react-router-dom";
import { useSession } from "@/lib/auth";
import {
  ArrowRight,
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
    iconColor: "text-[#06B6D4]",
  },
  {
    icon: Code2,
    title: "Striver-Grade Coding Practice",
    desc: "Monaco IDE editor with starter templates in C++, Python, JS, TS, and Java. Judge0 execution with hidden testcase diagnostics.",
    iconColor: "text-[#2F80ED]",
  },
  {
    icon: Brain,
    title: "AI Interview Simulation",
    desc: "Live conversational interviewers tailored to your target job role. Adaptive follow-up questions evaluate technical depth in real-time.",
    iconColor: "text-[#8B5CF6]",
  },
  {
    icon: Zap,
    title: "Instant Diagnostic Scorecard",
    desc: "Granular feedback on time complexity, edge cases, behavioral articulation, and dimensional score breakdowns.",
    iconColor: "text-[#22C55E]",
  },
  {
    icon: Trophy,
    title: "Live Leaderboards & Streaks",
    desc: "Track solved problems, contest penalties, practice streaks, and compete against top engineering candidates nationwide.",
    iconColor: "text-[#F59E0B]",
  },
  {
    icon: MessageSquare,
    title: "AI Tech Doubt Solver",
    desc: "Dedicated AI assistant to explain tricky algorithmic invariants, dry run recursion stacks, and optimize time complexity.",
    iconColor: "text-[#8B5CF6]",
  },
];

const STATS = [
  { value: "1,700,000+", label: "Active Learners" },
  { value: "450+", label: "Curated DSA Problems" },
  { value: "99.4%", label: "Placement Success Rate" },
  { value: "< 2.1s", label: "Execution Speed" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-[#F5F7FA] relative overflow-hidden font-sans">
      {/* ─── Floating Topbar ─────────────────────────────────────────── */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-5xl h-14 rounded-xl bg-[#101216]/90 backdrop-blur-md border border-[#272B33] shadow-lg px-5 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2F80ED] flex items-center justify-center shadow-sm">
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
            <span className="font-bold text-white text-base tracking-tight">
              Intervue
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25 rounded">
              TUF
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#A1A7B3]">
            <Link to="/practice" className="hover:text-white transition-colors">
              Roadmap Sheets
            </Link>
            <Link to="/coding" className="hover:text-white transition-colors">
              Coding Hub
            </Link>
            <Link to="/rooms" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>Battle Arena</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25">
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
                className="inline-flex items-center gap-1.5 bg-[#2F80ED] hover:bg-[#3B9CFF] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#A1A7B3] hover:text-white px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-[#2F80ED] hover:bg-[#3B9CFF] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
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
      <section className="relative pt-32 pb-16 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Social Proof Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-[#14161B] border border-[#272B33] rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B9CFF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F80ED]"></span>
            </span>
            <span className="text-[#F5F7FA] text-xs font-medium tracking-wide">
              1,700,000+ Engineers Prepared
            </span>
            <span className="text-[#3B9CFF] text-xs font-semibold">• Placement Ready</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F7FA] mb-6 leading-tight">
            One Stop Learning Platform <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B9CFF] via-[#2F80ED] to-[#8B5CF6]">
              for TECH Interviews & Battles
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#A1A7B3] text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Master Data Structures & Algorithms with Striver-grade roadmap sheets, practice in a full
            Monaco editor with Judge0 execution, and challenge peers in competitive Battle Arenas.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link
              to={session ? "/practice" : "/login"}
              className="inline-flex items-center gap-2 bg-[#2F80ED] hover:bg-[#3B9CFF] text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
            >
              <span>Start For Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 bg-[#14161B] hover:bg-[#191C22] text-[#F5F7FA] border border-[#272B33] text-sm font-medium px-5 py-3 rounded-lg transition-colors"
            >
              <Swords className="w-4 h-4 text-[#06B6D4]" />
              <span>Explore Battle Arena</span>
            </Link>
          </div>

          {/* ─── Preview Card Shell ────────────────────────────────────── */}
          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-xl border border-[#272B33] bg-[#14161B] overflow-hidden shadow-2xl">
              {/* Window Header */}
              <div className="px-4 py-3 bg-[#101216] border-b border-[#1E2229] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[11px] font-mono text-[#707784] ml-3 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#2F80ED]" />
                    intervue.app/rooms/ARENA-902
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                    14:32 LEFT
                  </span>
                  <span className="text-xs text-[#707784]">12 Online</span>
                </div>
              </div>

              {/* Mockup Split Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 text-left">
                {/* Left: Problem Statement & Test Status */}
                <div className="md:col-span-4 p-5 border-r border-[#1E2229] bg-[#101216]/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 uppercase">
                      Medium
                    </span>
                    <span className="text-[11px] font-mono text-[#2F80ED] font-semibold">
                      +100 pts
                    </span>
                  </div>

                  <h3 className="text-[#F5F7FA] font-semibold text-sm mb-2">Two Sum II - Sorted Array</h3>
                  <p className="text-[#A1A7B3] text-xs leading-relaxed mb-4">
                    Given a 1-indexed array of integers numbers that is already sorted in
                    non-decreasing order, find two numbers such that they add up to target.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#1E2229]">
                    <div className="flex items-center justify-between text-[11px] text-[#A1A7B3] font-mono">
                      <span className="flex items-center gap-1 text-[#22C55E]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 1
                      </span>
                      <span className="text-[#707784]">0.02s</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A1A7B3] font-mono">
                      <span className="flex items-center gap-1 text-[#22C55E]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 2
                      </span>
                      <span className="text-[#707784]">0.03s</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A1A7B3] font-mono">
                      <span className="flex items-center gap-1 text-[#2F80ED]">
                        <Sparkles className="w-3.5 h-3.5" /> Hidden Tests (5/5)
                      </span>
                      <span className="text-[#22C55E] font-semibold">PASSED</span>
                    </div>
                  </div>
                </div>

                {/* Right: Code Editor Mock */}
                <div className="md:col-span-8 p-5 font-mono text-xs text-[#F5F7FA] bg-[#0B0C0F] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2229] text-[11px] text-[#707784]">
                      <span className="text-[#3B9CFF] font-medium">Solution.cpp</span>
                      <span className="text-[10px] text-[#707784]">C++20 (GCC 13.2)</span>
                    </div>

                    <pre className="text-[#A1A7B3] leading-relaxed overflow-x-auto text-[11px]">
                      <span className="text-[#8B5CF6]">vector</span>
                      <span className="text-[#3B9CFF]">&lt;int&gt;</span>{" "}
                      <span className="text-[#F59E0B]">twoSum</span>(
                      <span className="text-[#8B5CF6]">vector</span>
                      <span className="text-[#3B9CFF]">&lt;int&gt;</span>& nums,{" "}
                      <span className="text-[#8B5CF6]">int</span> target) {"{\n"}
                      {"    "}
                      <span className="text-[#8B5CF6]">int</span> left = 0, right = nums.size() - 1;{"\n"}
                      {"    "}
                      <span className="text-[#8B5CF6]">while</span> (left &lt; right) {"{\n"}
                      {"        "}
                      <span className="text-[#8B5CF6]">int</span> sum = nums[left] + nums[right];{"\n"}
                      {"        "}
                      <span className="text-[#8B5CF6]">if</span> (sum == target){" "}
                      <span className="text-[#8B5CF6]">return</span> {"{left + 1, right + 1}"};{"\n"}
                      {"        "}
                      <span className="text-[#8B5CF6]">else if</span> (sum &lt; target) left++;{"\n"}
                      {"        "}
                      <span className="text-[#8B5CF6]">else</span> right--;{"\n"}
                      {"    }\n"}
                      {"    "}
                      <span className="text-[#8B5CF6]">return</span> {"{}"};{"\n"}
                      {"}"}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1E2229]">
                    <div className="flex items-center gap-2 text-[11px] text-[#22C55E] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      Verdict: ACCEPTED (100 pts)
                    </div>
                    <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2F80ED] text-white shadow-sm">
                      Submit Solution
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Numbers / Social Proof Banner ────────────────────────────── */}
      <section className="relative py-10 border-y border-[#272B33] bg-[#101216] z-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-1 tracking-tight">
                {stat.value}
              </div>
              <p className="text-xs text-[#707784] font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Striver-Style DSA Sheets & Roadmap Preview ───────────────── */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25 mb-3">
              <Code2 className="w-3.5 h-3.5" />
              <span>Structured Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] tracking-tight mb-3">
              Placement Roadmap Sheets
            </h2>
            <p className="text-[#A1A7B3] text-sm max-w-xl mx-auto">
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
                    "rounded-xl transition-all border overflow-hidden cursor-pointer",
                    isExpanded
                      ? "bg-[#14161B] border-[#2F80ED]/50 shadow-sm"
                      : "bg-[#101216] border-[#272B33] hover:border-[#3B9CFF]/40"
                  )}
                  onClick={() => setActiveRoadmapStep(isExpanded ? -1 : idx)}
                >
                  <div className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs font-mono transition-colors",
                          isExpanded
                            ? "bg-[#2F80ED] text-white"
                            : "bg-[#14161B] text-[#A1A7B3] border border-[#1E2229]"
                        )}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[#F5F7FA] font-semibold text-sm sm:text-base">
                            {item.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[#A1A7B3] text-xs mt-0.5 hidden sm:block">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#707784] font-mono hidden sm:inline">
                        {item.problems} Problems
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-[#707784] transition-transform",
                          isExpanded && "rotate-90 text-[#2F80ED]"
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Topics Sub-List */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-[#1E2229] bg-[#0B0C0F]/60">
                      <p className="text-xs font-semibold text-[#A1A7B3] mb-3">Topic Modules:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.topics.map((t) => (
                          <div
                            key={t}
                            className="flex items-center justify-between p-3 rounded-lg bg-[#14161B] border border-[#1E2229] hover:border-[#272B33] transition-colors"
                          >
                            <span className="text-xs text-[#F5F7FA] flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2F80ED] shrink-0" />
                              {t}
                            </span>
                            <Link
                              to="/coding"
                              className="text-[11px] text-[#3B9CFF] hover:underline font-medium"
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
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#2F80ED] hover:text-[#3B9CFF] transition-colors"
            >
              <span>View complete DSA Roadmap and Core CS Sheets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Platform Features Grid ───────────────────────────────────── */}
      <section id="features" className="py-20 px-6 border-t border-[#272B33] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] tracking-tight mb-3">
              Engineered for Complete Interview Readiness
            </h2>
            <p className="text-[#A1A7B3] text-sm max-w-lg mx-auto">
              Everything you need to crack SDE-1, SDE-2, and top campus placement rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] hover:border-[#3B9CFF]/40 transition-colors shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-[#101216] border border-[#1E2229] flex items-center justify-center mb-4">
                  <f.icon className={cn("w-5 h-5", f.iconColor)} />
                </div>
                <h3 className="text-base font-semibold text-[#F5F7FA] mb-2">{f.title}</h3>
                <p className="text-xs text-[#A1A7B3] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final Call to Action ─────────────────────────────────────── */}
      <section className="py-20 px-6 relative z-10 text-center">
        <div className="max-w-3xl mx-auto p-10 rounded-2xl bg-[#14161B] border border-[#272B33] relative overflow-hidden shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-3">
            Ready to Accelerate Your Prep?
          </h2>
          <p className="text-[#A1A7B3] text-sm max-w-lg mx-auto mb-6">
            Join over 1.7M learners solving problems, competing in Battle Arenas, and acing technical
            interviews.
          </p>

          <Link
            to={session ? "/practice" : "/login"}
            className="inline-flex items-center gap-2 bg-[#2F80ED] hover:bg-[#3B9CFF] text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-[#272B33] bg-[#0B0C0F] text-xs text-[#707784] relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F7FA]">Intervue</span>
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