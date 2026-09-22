import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFeaturedCompanies, useCompanyQuestions } from "@/hooks/useCompanies";
import {
  Code2,
  BookOpen,
  CheckCircle2,
  Search,
  ChevronRight,
  Flame,
  Swords,
  Layers,
  Cpu,
  Database,
  Building2,
  Coins,
  ArrowRight,
  SlidersHorizontal,
  Bookmark,
  Check,
  Lock,
  FileText,
  Shuffle,
  Grid,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Problems dataset matching TUF
const DSA_PROBLEMS_DATA = [
  { id: "p1", index: 893, title: "Express Number as Sum of Two Primes", slug: "two-sum", difficulty: "Core", topic: "Mathematics", companies: ["Google", "Amazon"], isPotd: true },
  { id: "p2", index: 1, title: "Two Sum", slug: "two-sum", difficulty: "Basic", topic: "Hashing", moreTopics: 1, companies: ["Google", "Amazon", "Meta"] },
  { id: "p3", index: 2, title: "Search X in sorted array", slug: "two-sum", difficulty: "Basic", topic: "Binary Search", moreTopics: 1, companies: ["Microsoft", "Adobe"] },
  { id: "p4", index: 3, title: "Reverse a Linked List", slug: "two-sum", difficulty: "Core", topic: "Linked List", companies: ["Amazon", "Microsoft"] },
  { id: "p5", index: 4, title: "Level Order Traversal", slug: "two-sum", difficulty: "Core", topic: "Binary Trees", companies: ["Google", "Meta"] },
  { id: "p6", index: 5, title: "Number of Islands", slug: "two-sum", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Amazon", "Bloomberg"] },
  { id: "p7", index: 6, title: "Subsets I", slug: "two-sum", difficulty: "Core", topic: "Recursion", moreTopics: 1, companies: ["Meta", "Apple"] },
  { id: "p8", index: 7, title: "Climbing Stairs", slug: "two-sum", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Adobe"] },
  { id: "p9", index: 8, title: "Trapping Rainwater", slug: "trapping-rain-water", difficulty: "Core", topic: "Stack & Queue", moreTopics: 1, companies: ["Amazon", "Google", "Goldman Sachs"] },
  { id: "p10", index: 9, title: "K-th Largest Element in an Array", slug: "two-sum", difficulty: "Core", topic: "Heaps", moreTopics: 1, companies: ["Meta", "Microsoft"] },
  { id: "p11", index: 10, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Basic", topic: "Stack", companies: ["Meta", "Amazon"] },
  { id: "p12", index: 11, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Basic", topic: "Arrays", companies: ["Amazon", "Microsoft"] },
  { id: "p13", index: 12, title: "Maximum Subarray (Kadane)", slug: "maximum-subarray", difficulty: "Core", topic: "DP & Arrays", companies: ["Google", "Apple"] },
  { id: "p14", index: 13, title: "3Sum", slug: "3sum", difficulty: "Core", topic: "Two Pointers", companies: ["Google", "Meta"] },
  { id: "p15", index: 14, title: "Median of Two Sorted Arrays", slug: "two-sum", difficulty: "Hard", topic: "Binary Search", companies: ["Google", "Microsoft"] },
  { id: "p16", index: 15, title: "Merge k Sorted Lists", slug: "two-sum", difficulty: "Hard", topic: "Heaps", companies: ["Amazon", "Meta"] },
];

const TOP_COMPANIES = [
  { name: "Amazon", count: 443, global: true },
  { name: "Google", count: 447, global: true },
  { name: "Meta", count: 357, global: true },
  { name: "Uber", count: 433, global: true },
  { name: "Microsoft", count: 466, global: true },
  { name: "Oracle", count: 431, global: true },
  { name: "Salesforce", count: 412, global: true },
  { name: "Apple", count: 400, global: true },
  { name: "Adobe", count: 404, global: true },
  { name: "LinkedIn", count: 406, global: true },
  { name: "Atlassian", count: 378, global: true },
  { name: "Intuit", count: 371, global: true },
  { name: "PayPal", count: 394, global: true },
  { name: "Goldman Sachs", count: 415, global: true },
  { name: "eBay", count: 314, global: true },
  { name: "Airbnb", count: 402, global: true },
  { name: "D. E. Shaw", count: 330, global: true },
  { name: "Walmart Global Tech", count: 343, global: true },
  { name: "Capital One", count: 352, global: true },
  { name: "Morgan Stanley", count: 392, global: true },
  { name: "Flipkart", count: 260, global: false },
  { name: "Swiggy", count: 185, global: false },
  { name: "Zomato", count: 140, global: false },
  { name: "CRED", count: 95, global: false },
];

export default function PracticeHubPage() {
  const navigate = useNavigate();

  // Active view: "hub" (prep_hub.png) OR "dsa_practice" (dsa_practice.png)
  const [currentView, setCurrentView] = useState<"hub" | "dsa_practice">("hub");

  // Solved state persisted in localStorage
  const [solvedProblems, setSolvedProblems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tuf_solved_problems");
      return saved ? JSON.parse(saved) : { p1: true, p2: true };
    } catch {
      return { p1: true, p2: true };
    }
  });

  const toggleSolved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSolvedProblems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("tuf_solved_problems", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [companyTabFilter, setCompanyTabFilter] = useState<"global" | "indian">("global");

  // Solved calculations
  const totalCount = DSA_PROBLEMS_DATA.length;
  const solvedCount = Object.values(solvedProblems).filter(Boolean).length;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  const basicSolved = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Basic" && solvedProblems[p.id]).length;
  const basicTotal = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Basic").length;

  const coreSolved = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Core" && solvedProblems[p.id]).length;
  const coreTotal = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Core").length;

  const hardSolved = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Hard" && solvedProblems[p.id]).length;
  const hardTotal = DSA_PROBLEMS_DATA.filter((p) => p.difficulty === "Hard").length;

  const filteredProblems = useMemo(() => {
    return DSA_PROBLEMS_DATA.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.companies.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans pb-16 px-4 sm:px-6 lg:px-8 pt-6 max-w-[1400px] mx-auto">
      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: PREP HUB OVERVIEW (Matching tuf_ui/prep_hub.png 1:1)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "hub" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Section (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* TUF Prephub Hero Banner Card with 3D Illustration & Single Capsule Bar */}
            <div className="p-7 sm:p-8 rounded-2xl bg-[#0D0E12] border border-[#181A20] relative overflow-hidden flex flex-col justify-between min-h-[200px]">
              <div className="relative z-10 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  Prephub
                </h1>
                <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1.5 leading-relaxed">
                  Your one-stop platform to learn, and master every interview subject.
                </p>

                {/* Single Continuous Stats Capsule Bar (matching prep_hub.png 1:1) */}
                <div className="mt-6 inline-flex items-center rounded-xl bg-[#08090C] border border-[#181A20] px-3.5 py-2 text-xs text-[#8B92A0] font-sans shadow-inner">
                  <div className="flex items-center gap-1.5 pr-3.5 border-r border-[#181A20]">
                    <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>
                      <strong className="text-white font-semibold">24.3K</strong> Active this month
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3.5 border-r border-[#181A20]">
                    <Sparkles className="w-3.5 h-3.5 text-[#327CF6]" />
                    <span>
                      <strong className="text-white font-semibold">1.8M</strong> Total Users
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-3.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>
                      <strong className="text-white font-semibold">16</strong> Curated Subjects
                    </span>
                  </div>
                </div>
              </div>

              {/* TUF Glowing Right Graphic Representation */}
              <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 items-center pointer-events-none opacity-80">
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#327CF6]/15 rounded-full blur-2xl" />
                  <div className="w-36 h-24 rounded-xl bg-[#08090C] border border-[#1E2229] shadow-2xl flex flex-col items-center justify-center p-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-[#327CF6] flex items-center justify-center text-white font-bold text-xs font-mono shadow-md shadow-[#327CF6]/30">
                      F&gt;
                    </div>
                    <span className="text-[10px] text-[#525866] font-mono mt-1">Intervue Engine</span>
                  </div>
                </div>
              </div>
            </div>

            {/* "Explore Subjects" Section (Vertical Stacked Rows matching prep_hub.png 1:1) */}
            <div className="space-y-3.5">
              <h2 className="text-base font-bold text-white tracking-tight">Explore Subjects</h2>

              {/* Subject Row 1: DSA */}
              <div
                onClick={() => setCurrentView("dsa_practice")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                      DSA
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Learn DSA from the Basics, Practise Key Patterns and Prepare for Coding Interviews.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>6 Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject Row 2: System Design */}
              <div
                onClick={() => setCurrentView("dsa_practice")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                      System Design
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Prepare for design interviews with OOPs, Design Principles and Practical Low Level Design.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>2 Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject Row 3: Core Subjects */}
              <div
                onClick={() => setCurrentView("dsa_practice")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                      Core Subjects
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Strengthen your DBMS, Operating Systems and Computer Networks fundamentals for technical interviews.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>6 Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject Row 4: Data Engineering */}
              <div
                onClick={() => setCurrentView("dsa_practice")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                      Data Engineering
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Learn SQL, Practise Interview Queries and Build a Foundation in Database Design and Performance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>2 Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail Section (4 of 12 cols, matching prep_hub.png 1:1) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Promo Card: Battle Arena Live (matching Zenkai card styling) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131124] to-[#0A0C10] border border-[#261E42] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  COMPETITIVE ARENA
                </span>
                <h3 className="text-xl font-extrabold text-white mt-3 tracking-tight">
                  LIVE BATTLE ARENA
                </h3>
                <p className="text-xs text-[#8B92A0] mt-1">
                  Compete in timed assessment rooms with live standings and anti-cheat proctoring.
                </p>
              </div>

              <Link
                to="/rooms"
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Enter Battle Arena</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            </div>

            {/* Daily Planner Card (matching prep_hub.png 1:1) */}
            <div className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] min-h-[260px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Planner</h3>
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#14161C] border border-[#1E2229] flex items-center justify-center text-[#8B92A0] mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Track your daily targets
                  </p>
                  <p className="text-[11px] text-[#525866] mt-1 max-w-xs">
                    Solve questions each day to maintain your streak and earn certificates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentView("dsa_practice")}
                className="w-full py-2 rounded-xl bg-[#14161C] hover:bg-[#1A1D24] text-xs font-medium text-white border border-[#1E2229] transition-all cursor-pointer"
              >
                View Today's Tasks →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 2: DSA PRACTICE SET (Matching tuf_ui/dsa_practice.png 1:1)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "dsa_practice" && (
        <div className="space-y-6">
          {/* Top Breadcrumb & Header with TUF Progress Card */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-2">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-2 font-sans">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </button>
                <span>/</span>
                <span className="text-white font-medium">DSA</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                DSA Practice Set
              </h1>
              <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1 max-w-2xl leading-relaxed">
                Build your problem-solving skills with DSA practice organised by topic, pattern, and company. Work through different approaches, revisit challenging problems, and prepare for coding interviews.
              </p>

              {/* Flat Amber Feature Badges (matching dsa_practice.png 1:1) */}
              <div className="flex items-center gap-4 pt-3 flex-wrap text-xs text-[#F59E0B] font-medium">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Company Asked
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Pattern Based
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Asked Frequency
                </span>
              </div>
            </div>

            {/* TUF Progress Card (Right Header Card in dsa_practice.png) */}
            <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] w-full lg:w-80 shrink-0">
              <div className="flex items-center justify-between text-xs text-[#8B92A0] mb-2">
                <span className="font-semibold text-white">Your Progress</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white text-[11px] transition-colors"
                >
                  See all list ↗
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">{progressPercent} %</span>
                <span className="text-xs text-[#525866]">({solvedCount}/{totalCount} solved)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#181A20] text-center">
                <div>
                  <span className="text-[10px] text-[#10B981] font-semibold block">Basic</span>
                  <span className="text-xs font-mono font-bold text-white">{basicSolved}/{basicTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#F59E0B] font-semibold block">Core</span>
                  <span className="text-xs font-mono font-bold text-white">{coreSolved}/{coreTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#EF4444] font-semibold block">Hard</span>
                  <span className="text-xs font-mono font-bold text-white">{hardSolved}/{hardTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Problem Table (Left 9 cols) + Top Companies Sidebar (Right 3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Table Area (9 cols) */}
            <div className="lg:col-span-9 space-y-4">
              {/* Search & Counter Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-[#525866] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search problems"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#525866] outline-none transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#7A808C]">
                  <span className="font-mono">{filteredProblems.length} problems</span>
                  <button className="p-1.5 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:text-white transition-colors">
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:text-white transition-colors">
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* The 48px Sleek Data Table (Matching dsa_practice.png 1:1) */}
              <div className="rounded-2xl border border-[#181A20] bg-[#0D0E12] overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="px-5 py-3 border-b border-[#181A20] text-[11px] font-semibold text-[#7A808C] grid grid-cols-12 gap-3 items-center bg-[#090A0D]">
                  <div className="col-span-6 sm:col-span-5">Problem</div>
                  <div className="col-span-2 text-center">Difficulty</div>
                  <div className="col-span-2 hidden sm:block">Companies</div>
                  <div className="col-span-2 hidden sm:block">Topics</div>
                  <div className="col-span-4 sm:col-span-1 text-right">Resources</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#181A20]">
                  {filteredProblems.map((prob) => {
                    const isSolved = Boolean(solvedProblems[prob.id]);
                    return (
                      <div
                        key={prob.id}
                        className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-[#111318] transition-colors text-xs"
                      >
                        {/* Column 1: Checkbox + Title + POTD tag */}
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => toggleSolved(prob.id, e)}
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border",
                              isSolved
                                ? "bg-[#327CF6] border-[#327CF6] text-white"
                                : "border-[#272B33] text-transparent hover:border-[#327CF6]"
                            )}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>

                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              to={`/coding/${prob.slug}`}
                              className={cn(
                                "font-medium hover:text-[#327CF6] transition-colors truncate",
                                isSolved ? "text-[#7A808C] line-through" : "text-[#EDEDED]"
                              )}
                            >
                              {prob.index}. {prob.title}
                            </Link>

                            {prob.isPotd && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 shrink-0">
                                &lt;&gt; POTD
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Difficulty */}
                        <div className="col-span-2 flex justify-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide",
                              prob.difficulty === "Basic"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : prob.difficulty === "Core"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}
                          >
                            {prob.difficulty}
                          </span>
                        </div>

                        {/* Column 3: Companies Lock / Badge */}
                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-[#525866]">
                          <Lock className="w-3.5 h-3.5 text-[#327CF6]/70" />
                          <span className="text-[11px] font-mono text-[#8B92A0]">
                            {prob.companies[0]}
                          </span>
                        </div>

                        {/* Column 4: Topics Tag */}
                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-[#14161C] text-[#8B92A0] text-[10px] font-mono border border-[#1E2229] truncate">
                            {prob.topic}
                          </span>
                          {prob.moreTopics && (
                            <span className="text-[10px] text-[#525866] font-mono">
                              +{prob.moreTopics}
                            </span>
                          )}
                        </div>

                        {/* Column 5: Resources (Editorial + Bookmark) */}
                        <div className="col-span-4 sm:col-span-1 flex items-center justify-end gap-2 text-[#7A808C]">
                          <Link
                            to={`/coding/${prob.slug}`}
                            className="w-6 h-6 rounded-lg flex items-center justify-center hover:text-white hover:bg-[#1A1D24] transition-colors"
                            title="Editorial & Code"
                          >
                            <span className="text-[10px] font-bold font-mono text-[#327CF6]">F&gt;</span>
                          </Link>
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg flex items-center justify-center hover:text-white hover:bg-[#1A1D24] transition-colors"
                            title="Bookmark"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar Area (3 cols, matching dsa_practice.png 1:1) */}
            <div className="lg:col-span-3 space-y-5">
              {/* Practice Questions by Company Pass Card */}
              <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] relative overflow-hidden">
                <span className="text-[10px] font-semibold text-[#8B92A0] flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-[#327CF6]" /> Company Pass
                </span>
                <h3 className="text-sm font-bold text-white">
                  Practice questions by company
                </h3>

                <div className="my-4 space-y-1.5 text-[11px] text-[#7A808C]">
                  <p className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-[#327CF6]" /> Curated DSA
                  </p>
                  <p className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-[#F59E0B]" /> Recent questions
                  </p>
                  <p className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#10B981]" /> Stay up to date
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="w-full py-2 rounded-xl bg-[#327CF6] hover:bg-[#2563EB] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>Explore Company Pass</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top Companies Selector (matching dsa_practice.png right column 1:1) */}
              <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Top Companies
                  </h3>
                  <span className="text-[10px] text-[#525866] font-mono">51 total</span>
                </div>

                {/* Global vs Indian pill switcher */}
                <div className="flex items-center p-1 rounded-xl bg-[#08090C] border border-[#181A20] mb-3 text-xs">
                  <button
                    onClick={() => setCompanyTabFilter("global")}
                    className={cn(
                      "flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer text-center",
                      companyTabFilter === "global"
                        ? "bg-[#181A20] text-white font-semibold"
                        : "text-[#7A808C] hover:text-white"
                    )}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setCompanyTabFilter("indian")}
                    className={cn(
                      "flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer text-center",
                      companyTabFilter === "indian"
                        ? "bg-[#181A20] text-white font-semibold"
                        : "text-[#7A808C] hover:text-white"
                    )}
                  >
                    Indian
                  </button>
                </div>

                {/* Company Badges List */}
                <div className="grid grid-cols-2 gap-2">
                  {TOP_COMPANIES.filter((c) =>
                    companyTabFilter === "global" ? c.global : !c.global
                  ).slice(0, 16).map((comp) => (
                    <div
                      key={comp.name}
                      className="p-2 rounded-xl bg-[#08090C] border border-[#181A20] hover:border-[#262933] transition-colors flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <span className="text-[#8B92A0] group-hover:text-white truncate">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#14161C] text-[#7A808C]">
                        {comp.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}