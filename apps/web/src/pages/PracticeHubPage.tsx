import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFeaturedCompanies, useCompanyQuestions } from "@/hooks/useCompanies";
import {
  Code2,
  Mic,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Flame,
  Swords,
  Layers,
  Cpu,
  Database,
  Network,
  Building2,
  Coins,
  ArrowRight,
  SlidersHorizontal,
  Bookmark,
  Check,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVIEW_MODES = [
  {
    id: "text",
    label: "AI Text Interview",
    desc: "Real-time chat Q&A with deep conversational follow-ups and scoring",
    icon: MessageSquare,
    badge: "Interactive",
  },
  {
    id: "voice",
    label: "AI Voice Interview",
    desc: "Speak naturally into microphone; adapts dynamically to spoken answers",
    icon: Mic,
    badge: "Live Audio",
  },
  {
    id: "coding",
    label: "Live Code Interview",
    desc: "Solve algorithmic problems under simulated interview pressure",
    icon: Code2,
    badge: "Judge0 Engine",
  },
];

const ROLES = [
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Scientist",
];

const LEVELS = [
  { id: "junior", label: "Entry / Junior (0-2 yrs)" },
  { id: "mid", label: "Mid-Level (2-5 yrs)" },
  { id: "senior", label: "Senior SDE (5+ yrs)" },
];

const DSA_SHEET_STEPS = [
  {
    id: 1,
    title: "Step 1: Learn the Basics",
    desc: "Language fundamentals, time & space complexities, basic math, and recursion",
    problems: [
      { id: "p1", title: "Two Sum", slug: "two-sum", difficulty: "EASY", topic: "Hashing", companies: ["Google", "Amazon", "Meta"] },
      { id: "p2", title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "EASY", topic: "Stack", companies: ["Meta", "Amazon", "Bloomberg"] },
      { id: "p3", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "EASY", topic: "Arrays", companies: ["Amazon", "Google", "Microsoft"] },
      { id: "p4", title: "Print 1 to N using Recursion", slug: "two-sum", difficulty: "EASY", topic: "Recursion", companies: ["Accenture"] },
    ],
  },
  {
    id: 2,
    title: "Step 2: Learn Important Sorting Techniques",
    desc: "Selection, Bubble, Insertion Sort, Merge Sort, and Quick Sort",
    problems: [
      { id: "p5", title: "Selection & Bubble Sort Implementation", slug: "two-sum", difficulty: "EASY", topic: "Sorting", companies: ["Adobe"] },
      { id: "p6", title: "Merge Sort Algorithm", slug: "two-sum", difficulty: "MEDIUM", topic: "Sorting", companies: ["Amazon", "Microsoft"] },
      { id: "p7", title: "Quick Sort & Dutch National Flag", slug: "two-sum", difficulty: "MEDIUM", topic: "Two Pointers", companies: ["Google"] },
    ],
  },
  {
    id: 3,
    title: "Step 3: Solve Problems on Arrays [Easy -> Medium -> Hard]",
    desc: "Fundamental array logic, prefix sums, two pointers, Kadane's algorithm, and subarray problems",
    problems: [
      { id: "p8", title: "Two Sum", slug: "two-sum", difficulty: "EASY", topic: "Hashing", companies: ["Amazon", "Google", "Meta"] },
      { id: "p9", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "EASY", topic: "Arrays", companies: ["Amazon", "Meta"] },
      { id: "p10", title: "Maximum Subarray Sum (Kadane's Algorithm)", slug: "maximum-subarray", difficulty: "MEDIUM", topic: "DP", companies: ["Google", "Amazon", "Apple"] },
      { id: "p11", title: "3Sum", slug: "3sum", difficulty: "MEDIUM", topic: "Two Pointers", companies: ["Google", "Amazon", "Meta"] },
      { id: "p12", title: "Next Permutation", slug: "two-sum", difficulty: "HARD", topic: "Arrays", companies: ["Google", "Uber", "Goldman Sachs"] },
      { id: "p13", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "HARD", topic: "Two Pointers", companies: ["Amazon", "Google", "Bloomberg"] },
    ],
  },
  {
    id: 4,
    title: "Step 4: Binary Search [1D, 2D Arrays, Search Space]",
    desc: "Binary search mechanics, lower/upper bounds, and minimax optimization",
    problems: [
      { id: "p14", title: "Binary Search on Sorted Array", slug: "two-sum", difficulty: "EASY", topic: "Binary Search", companies: ["Microsoft"] },
      { id: "p15", title: "Search in Rotated Sorted Array", slug: "two-sum", difficulty: "MEDIUM", topic: "Binary Search", companies: ["Google", "Meta"] },
      { id: "p16", title: "Find Peak Element", slug: "two-sum", difficulty: "MEDIUM", topic: "Binary Search", companies: ["Amazon"] },
      { id: "p17", title: "Book Allocation Problem / Painter Partition", slug: "two-sum", difficulty: "HARD", topic: "Binary Search", companies: ["Google", "Flipkart"] },
    ],
  },
  {
    id: 5,
    title: "Step 5: Strings & Dynamic Programming",
    desc: "String parsing, anagrams, memoization, grid paths, and subsequence matching",
    problems: [
      { id: "p18", title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "EASY", topic: "Stack", companies: ["Meta", "Google"] },
      { id: "p19", title: "Longest Substring Without Repeating Characters", slug: "two-sum", difficulty: "MEDIUM", topic: "Sliding Window", companies: ["Amazon", "Google"] },
      { id: "p20", title: "Maximum Subarray (Kadane)", slug: "maximum-subarray", difficulty: "MEDIUM", topic: "DP", companies: ["Apple", "Microsoft"] },
      { id: "p21", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "HARD", topic: "Two Pointers", companies: ["Goldman Sachs", "Google"] },
    ],
  },
];

const CORE_CS_MODULES = [
  {
    title: "Operating Systems (OS)",
    icon: Cpu,
    desc: "Processes vs Threads, Concurrency & Deadlocks, Virtual Memory, Paging, and CPU Scheduling",
    questions: 45,
    badge: "High Yield",
    topics: ["Processes & Threads", "Memory Management", "Deadlocks", "File Systems"],
  },
  {
    title: "Database Management (DBMS)",
    icon: Database,
    desc: "ACID Properties, Normalization (1NF-BCNF), Indexing (B-Tree), Transactions & SQL Joins",
    questions: 40,
    badge: "Must Master",
    topics: ["SQL & Relational", "ACID & Concurrency", "Indexing & Query Plan", "NoSQL"],
  },
  {
    title: "Computer Networks (CN)",
    icon: Network,
    desc: "OSI Model, TCP/IP, 3-Way Handshake, DNS, HTTP/HTTPS, WebSockets, IP Addressing",
    questions: 38,
    badge: "Essential",
    topics: ["TCP/UDP Protocols", "HTTP/HTTPS & SSL", "DNS & Routing", "Sockets & WebSockets"],
  },
];

const TOP_COMPANIES_PRESET = [
  { name: "Google", count: 447, global: true },
  { name: "Amazon", count: 443, global: true },
  { name: "Meta", count: 357, global: true },
  { name: "Uber", count: 433, global: true },
  { name: "Microsoft", count: 466, global: true },
  { name: "Apple", count: 400, global: true },
  { name: "Adobe", count: 404, global: true },
  { name: "Netflix", count: 120, global: true },
  { name: "Flipkart", count: 260, global: false },
  { name: "Swiggy", count: 185, global: false },
  { name: "Zomato", count: 140, global: false },
  { name: "CRED", count: 95, global: false },
];

export default function PracticeHubPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"sheets" | "companies" | "interviews" | "core_cs">("sheets");
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 3: true });
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Solved tracking stored in localStorage
  const [solvedProblems, setSolvedProblems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tuf_solved_problems");
      return saved ? JSON.parse(saved) : { p1: true, p2: true };
    } catch {
      return { p1: true, p2: true };
    }
  });

  function toggleSolved(id: string, e: React.MouseEvent) {
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
  }

  // Calculate stats
  const allProblems = useMemo(() => DSA_SHEET_STEPS.flatMap((s) => s.problems), []);
  const totalProblemsCount = allProblems.length;
  const solvedCount = Object.values(solvedProblems).filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((solvedCount / totalProblemsCount) * 100));

  const easyTotal = allProblems.filter((p) => p.difficulty === "EASY").length;
  const easySolved = allProblems.filter((p) => p.difficulty === "EASY" && solvedProblems[p.id]).length;

  const mediumTotal = allProblems.filter((p) => p.difficulty === "MEDIUM").length;
  const mediumSolved = allProblems.filter((p) => p.difficulty === "MEDIUM" && solvedProblems[p.id]).length;

  const hardTotal = allProblems.filter((p) => p.difficulty === "HARD").length;
  const hardSolved = allProblems.filter((p) => p.difficulty === "HARD" && solvedProblems[p.id]).length;

  // POTD Timer
  const [countdown, setCountdown] = useState({ hrs: "18", mins: "31", secs: "45" });
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
      const hrs = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, "0");
      const mins = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, "0");
      const secs = String(Math.floor((diffMs / 1000) % 60)).padStart(2, "0");
      setCountdown({ hrs, mins, secs });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Company-Wise State
  const { data: featuredCompaniesData } = useFeaturedCompanies();
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("thirtyDays");
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");
  const [companyTabFilter, setCompanyTabFilter] = useState<"global" | "indian">("global");

  const { data: companyQuestionsData, isLoading: isCompanyLoading } = useCompanyQuestions(
    selectedCompany,
    selectedTimeframe
  );

  // Interview selection state
  const [interviewMode, setInterviewMode] = useState("text");
  const [role, setRole] = useState("Backend Engineer");
  const [level, setLevel] = useState("mid");

  function toggleStep(stepId: number) {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  }

  function startInterview() {
    if (interviewMode === "voice") {
      navigate(`/voice-interview?role=${encodeURIComponent(role)}&difficulty=${level}`);
    } else if (interviewMode === "coding") {
      navigate(`/coding`);
    } else {
      navigate(`/interview?role=${encodeURIComponent(role)}&difficulty=${level}&mode=${interviewMode}`);
    }
  }

  function selectCompanyFromSidebar(name: string) {
    setSelectedCompany(name);
    setActiveTab("companies");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#07080B] text-[#EDEDED] font-sans pb-16">
      {/* ─── TUF PREPHUB HERO BANNER ────────────────────────────────────────── */}
      <div className="border-b border-[#1B1F27] bg-[#0A0C10]/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#8A909E] mb-3">
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Platform
            </Link>
            <span>/</span>
            <span className="text-[#327CF6] font-medium">Prep Hub</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  Prephub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30">
                  Placement Curriculum 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8A909E] max-w-2xl leading-relaxed">
                Your one-stop platform to learn, practice, and master every interview subject. Work through structured DSA roadmaps, company-wise past papers, or AI mock interviews.
              </p>

              {/* Stats Bar (matching tuf_ui/prep_hub.png) */}
              <div className="flex items-center gap-2 sm:gap-4 pt-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D0F14] border border-[#1B1F27] text-xs text-[#C5C9D3]">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>
                    <strong className="text-white font-semibold">24.3K</strong> Active this month
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D0F14] border border-[#1B1F27] text-xs text-[#C5C9D3]">
                  <Sparkles className="w-3.5 h-3.5 text-[#327CF6]" />
                  <span>
                    <strong className="text-white font-semibold">1.8M</strong> Total Learners
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D0F14] border border-[#1B1F27] text-xs text-[#C5C9D3]">
                  <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>
                    <strong className="text-white font-semibold">16</strong> Curated Tracks
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-semibold text-xs shadow-md shadow-[#327CF6]/20 transition-all cursor-pointer group"
              >
                <Swords className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
                <span>Enter Battle Arena</span>
              </Link>

              <Link
                to="/coding/two-sum"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D0F14] hover:bg-[#14161B] text-[#C5C9D3] hover:text-white border border-[#1B1F27] hover:border-[#272B33] text-xs font-medium transition-all"
              >
                <Code2 className="w-4 h-4 text-[#327CF6]" />
                <span>Solve Today's POTD</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUBJECT TRACKS / EXPLORE SUBJECTS (matching tuf_ui/prep_hub.png) ────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-white uppercase text-opacity-80">
            Explore Preparation Tracks
          </h2>
          <span className="text-xs text-[#8A909E]">Click any track to view curriculum</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {/* Card 1: DSA Sheets */}
          <div
            onClick={() => setActiveTab("sheets")}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3",
              activeTab === "sheets"
                ? "bg-[#0E121A] border-[#327CF6] shadow-sm shadow-[#327CF6]/15 ring-1 ring-[#327CF6]/30"
                : "bg-[#0D0F14] border-[#1B1F27] hover:border-[#272B33] hover:bg-[#11141B]"
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">DSA Sheets</h3>
                <p className="text-[11px] text-[#8A909E] mt-0.5 line-clamp-2">
                  Learn DSA basics, key patterns, and top interview problems.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#8A909E] shrink-0 font-medium group-hover:text-white transition-colors flex items-center gap-0.5">
              5 Steps <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Company-Wise */}
          <div
            onClick={() => setActiveTab("companies")}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3",
              activeTab === "companies"
                ? "bg-[#0E121A] border-[#327CF6] shadow-sm shadow-[#327CF6]/15 ring-1 ring-[#327CF6]/30"
                : "bg-[#0D0F14] border-[#1B1F27] hover:border-[#272B33] hover:bg-[#11141B]"
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Company-Wise</h3>
                <p className="text-[11px] text-[#8A909E] mt-0.5 line-clamp-2">
                  470+ company verified questions asked in FAANG & top tier firms.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#8A909E] shrink-0 font-medium group-hover:text-white transition-colors flex items-center gap-0.5">
              470+ <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: AI Interviews */}
          <div
            onClick={() => setActiveTab("interviews")}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3",
              activeTab === "interviews"
                ? "bg-[#0E121A] border-[#327CF6] shadow-sm shadow-[#327CF6]/15 ring-1 ring-[#327CF6]/30"
                : "bg-[#0D0F14] border-[#1B1F27] hover:border-[#272B33] hover:bg-[#11141B]"
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">AI Interviews</h3>
                <p className="text-[11px] text-[#8A909E] mt-0.5 line-clamp-2">
                  Real-time voice, text, and coding interviews with AI feedback.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#8A909E] shrink-0 font-medium group-hover:text-white transition-colors flex items-center gap-0.5">
              3 Modes <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 4: Core Subjects */}
          <div
            onClick={() => setActiveTab("core_cs")}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3",
              activeTab === "core_cs"
                ? "bg-[#0E121A] border-[#327CF6] shadow-sm shadow-[#327CF6]/15 ring-1 ring-[#327CF6]/30"
                : "bg-[#0D0F14] border-[#1B1F27] hover:border-[#272B33] hover:bg-[#11141B]"
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Core Subjects</h3>
                <p className="text-[11px] text-[#8A909E] mt-0.5 line-clamp-2">
                  DBMS, Operating Systems, Computer Networks interview sheets.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#8A909E] shrink-0 font-medium group-hover:text-white transition-colors flex items-center gap-0.5">
              3 Tracks <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* ─── MAIN CONTENT 12-COL GRID (matching tuf_ui/dsa_practice.png) ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT/MAIN COLUMN (8/12 or 9/12) ───────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* ─── TAB 1: DSA SHEETS ────────────────────────────────────── */}
            {activeTab === "sheets" && (
              <div className="space-y-6">
                {/* TUF "Your Progress" Card (matching dsa_practice.png) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0D0F14] to-[#12151D] border border-[#1B1F27] shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    {/* Left: Radial Progress */}
                    <div className="flex items-center gap-5">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Background Circle */}
                          <path
                            className="text-[#1B1F27]"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Progress Circle */}
                          <path
                            className="text-[#327CF6] transition-all duration-500 ease-out"
                            strokeDasharray={`${progressPercent}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-base sm:text-lg font-bold text-white font-mono leading-none">
                            {progressPercent}%
                          </span>
                          <span className="text-[9px] text-[#8A909E] font-medium mt-0.5">COMPLETED</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white">Your Progress</h3>
                          <span className="text-xs font-mono text-[#8A909E]">
                            ({solvedCount} / {totalProblemsCount} solved)
                          </span>
                        </div>
                        <p className="text-xs text-[#8A909E] mt-1 max-w-sm">
                          Keep tracking solved questions to build consistency and unlock certificates.
                        </p>
                      </div>
                    </div>

                    {/* Right: Difficulty stats breakdown */}
                    <div className="grid grid-cols-3 gap-3 border-t sm:border-t-0 sm:border-l border-[#1B1F27] pt-4 sm:pt-0 sm:pl-6">
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider block">
                          Basic
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white font-mono">
                          {easySolved} <span className="text-[11px] text-[#8A909E] font-normal">/ {easyTotal}</span>
                        </span>
                      </div>

                      <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold text-[#F59E0B] tracking-wider block">
                          Core
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white font-mono">
                          {mediumSolved} <span className="text-[11px] text-[#8A909E] font-normal">/ {mediumTotal}</span>
                        </span>
                      </div>

                      <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold text-[#EF4444] tracking-wider block">
                          Hard
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white font-mono">
                          {hardSolved} <span className="text-[11px] text-[#8A909E] font-normal">/ {hardTotal}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#707784] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search topic or problem..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0D0F14] border border-[#1B1F27] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#707784] outline-none transition-all"
                    />
                  </div>

                  {/* Difficulty Filter Pills */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#0D0F14] p-1 rounded-xl border border-[#1B1F27]">
                    {[
                      { id: "ALL", label: "All" },
                      { id: "EASY", label: "Basic" },
                      { id: "MEDIUM", label: "Core" },
                      { id: "HARD", label: "Hard" },
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                          selectedDifficulty === diff.id
                            ? "bg-[#1E2229] text-white shadow-sm font-semibold border border-[#272B33]"
                            : "text-[#8A909E] hover:text-white"
                        )}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Steps List Accordion */}
                <div className="space-y-4">
                  {DSA_SHEET_STEPS.map((step) => {
                    const isExpanded = expandedSteps[step.id];
                    const filteredProblems = step.problems.filter((p) => {
                      const matchDiff =
                        selectedDifficulty === "ALL" || p.difficulty === selectedDifficulty;
                      const matchSearch =
                        !searchQuery ||
                        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.companies.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchDiff && matchSearch;
                    });

                    if (searchQuery && filteredProblems.length === 0) return null;

                    const stepSolvedCount = step.problems.filter((p) => solvedProblems[p.id]).length;

                    return (
                      <div
                        key={step.id}
                        className="rounded-2xl border border-[#1B1F27] bg-[#0D0F14] overflow-hidden transition-colors hover:border-[#272B33]"
                      >
                        {/* Step Header */}
                        <div
                          onClick={() => toggleStep(step.id)}
                          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#11141B] transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-[#327CF6]/10 border border-[#327CF6]/25 flex items-center justify-center font-mono font-bold text-xs text-[#327CF6]">
                              0{step.id}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-white tracking-tight">
                                  {step.title}
                                </h3>
                                {stepSolvedCount === step.problems.length && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-semibold flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> Done
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8A909E] mt-0.5 line-clamp-1">{step.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono text-[#8A909E]">
                              {stepSolvedCount}/{step.problems.length} solved
                            </span>
                            <div className="w-6 h-6 rounded-md bg-[#14161B] border border-[#1E2229] flex items-center justify-center text-[#8A909E]">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Problems Table (matching dsa_practice.png) */}
                        {isExpanded && (
                          <div className="border-t border-[#1B1F27] divide-y divide-[#1B1F27]">
                            {/* Table Sub-Header */}
                            <div className="px-5 py-2.5 bg-[#0A0C10] text-[11px] font-semibold text-[#8A909E] uppercase tracking-wider grid grid-cols-12 gap-2">
                              <span className="col-span-6 sm:col-span-5">Problem</span>
                              <span className="col-span-2 text-center">Difficulty</span>
                              <span className="col-span-2 hidden sm:block">Topic</span>
                              <span className="col-span-4 sm:col-span-3 text-right">Action</span>
                            </div>

                            {filteredProblems.map((problem, idx) => {
                              const isSolved = Boolean(solvedProblems[problem.id]);
                              return (
                                <div
                                  key={problem.id}
                                  className="px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-[#12151D] transition-colors text-xs"
                                >
                                  {/* Problem Title & Solved Toggle */}
                                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleSolved(problem.id, e)}
                                      className={cn(
                                        "w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 border",
                                        isSolved
                                          ? "bg-[#10B981] border-[#10B981] text-white"
                                          : "border-[#272B33] bg-[#0A0C10] text-transparent hover:border-[#10B981]"
                                      )}
                                      title={isSolved ? "Mark uncompleted" : "Mark completed"}
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </button>

                                    <div className="min-w-0">
                                      <Link
                                        to={`/coding/${problem.slug}`}
                                        className={cn(
                                          "font-medium truncate block hover:text-[#327CF6] transition-colors",
                                          isSolved ? "text-[#8A909E] line-through" : "text-[#EDEDED]"
                                        )}
                                      >
                                        {idx + 1}. {problem.title}
                                      </Link>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {problem.companies.slice(0, 2).map((comp, cIdx) => (
                                          <span
                                            key={cIdx}
                                            className="px-1.5 py-0.2 rounded bg-[#0A0C10] text-[#707784] text-[9px] font-mono border border-[#1B1F27]"
                                          >
                                            {comp}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Difficulty Badge */}
                                  <div className="col-span-2 flex justify-center">
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide",
                                        problem.difficulty === "EASY"
                                          ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25"
                                          : problem.difficulty === "MEDIUM"
                                          ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25"
                                          : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25"
                                      )}
                                    >
                                      {problem.difficulty === "EASY"
                                        ? "Basic"
                                        : problem.difficulty === "MEDIUM"
                                        ? "Core"
                                        : "Hard"}
                                    </span>
                                  </div>

                                  {/* Topic */}
                                  <div className="col-span-2 hidden sm:block">
                                    <span className="px-2 py-0.5 rounded bg-[#14161B] text-[#8A909E] text-[10px] font-mono border border-[#1E2229]">
                                      {problem.topic}
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                                    <Link
                                      to={`/coding/${problem.slug}`}
                                      className="px-3 py-1 rounded-lg bg-[#327CF6]/15 hover:bg-[#327CF6] text-[#327CF6] hover:text-white border border-[#327CF6]/30 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Solve</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB 2: COMPANY-WISE PREP ─────────────────────────────── */}
            {activeTab === "companies" && (
              <div className="space-y-6">
                {/* Company Selector Header */}
                <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#8A909E] uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#327CF6]" />
                      Selected Company: <strong className="text-white">{selectedCompany}</strong>
                    </span>
                    <span className="text-xs text-[#707784] font-mono">
                      {companyQuestionsData?.totalCount || 0} questions listed
                    </span>
                  </div>

                  {/* Horizontal Company Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {(featuredCompaniesData?.companies || []).map((comp) => (
                      <button
                        key={comp.slug}
                        onClick={() => setSelectedCompany(comp.name)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 cursor-pointer",
                          selectedCompany === comp.name
                            ? "bg-[#327CF6] text-white shadow-sm font-semibold shadow-[#327CF6]/30"
                            : "bg-[#0A0C10] text-[#8A909E] hover:text-white hover:bg-[#14161B] border border-[#1B1F27]"
                        )}
                      >
                        <span className="font-mono text-[11px] opacity-75">{comp.icon}</span>
                        <span>{comp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeframe & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0F14] border border-[#1B1F27] text-xs self-start sm:self-auto">
                    {[
                      { id: "thirtyDays", label: "🔥 Last 30 Days" },
                      { id: "threeMonths", label: "3 Months" },
                      { id: "sixMonths", label: "6 Months" },
                      { id: "all", label: "All Time" },
                    ].map((tf) => (
                      <button
                        key={tf.id}
                        onClick={() => setSelectedTimeframe(tf.id)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                          selectedTimeframe === tf.id
                            ? "bg-[#1E2229] text-white shadow-sm font-semibold border border-[#272B33]"
                            : "text-[#8A909E] hover:text-white"
                        )}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#707784] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${selectedCompany} questions...`}
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      className="w-full bg-[#0D0F14] border border-[#1B1F27] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#707784] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Company Problem List */}
                <div className="rounded-2xl border border-[#1B1F27] bg-[#0D0F14] overflow-hidden">
                  <div className="p-4 border-b border-[#1B1F27] flex items-center justify-between bg-[#0A0C10]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white tracking-tight">
                        {selectedCompany} Problem Frequency
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 text-[10px] font-semibold font-mono">
                        {companyQuestionsData?.totalCount || 0} questions
                      </span>
                    </div>
                    <span className="text-[11px] text-[#707784] font-mono">
                      Ranked by interview ask rate
                    </span>
                  </div>

                  {isCompanyLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-[#327CF6] border-t-transparent animate-spin" />
                      <p className="text-xs text-[#8A909E] font-mono">Loading questions for {selectedCompany}...</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1B1F27]">
                      {(companyQuestionsData?.questions || [])
                        .filter((q) => {
                          if (!companySearchQuery) return true;
                          const qLower = companySearchQuery.toLowerCase();
                          return (
                            q.title.toLowerCase().includes(qLower) ||
                            q.topics.some((t) => t.toLowerCase().includes(qLower)) ||
                            q.difficulty.toLowerCase().includes(qLower)
                          );
                        })
                        .slice(0, 100)
                        .map((q, idx) => (
                          <div
                            key={idx}
                            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#12151D] transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-white text-xs sm:text-sm">
                                  {q.title}
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                    q.difficulty === "EASY"
                                      ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25"
                                      : q.difficulty === "MEDIUM"
                                      ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25"
                                      : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25"
                                  )}
                                >
                                  {q.difficulty}
                                </span>
                                {q.isNative && (
                                  <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold">
                                    ⚡ Native Runner
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {q.topics.slice(0, 4).map((t, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-[#0A0C10] text-[#8A909E] text-[10px] font-mono border border-[#1B1F27]"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                              {q.frequency > 0 && (
                                <div className="text-right hidden sm:block">
                                  <span className="text-[10px] text-[#707784] font-mono block">Ask Rate</span>
                                  <span className="text-xs font-bold text-[#F59E0B] font-mono">
                                    {q.frequency}%
                                  </span>
                                </div>
                              )}

                              {q.isNative ? (
                                <Link
                                  to={`/coding/${q.slug}`}
                                  className="px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Code2 className="w-3.5 h-3.5" />
                                  <span>Solve on Intervue</span>
                                </Link>
                              ) : null}

                              <a
                                href={q.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1",
                                  q.isNative
                                    ? "bg-[#0A0C10] hover:bg-[#14161B] text-[#8A909E] hover:text-white border border-[#1B1F27]"
                                    : "bg-[#327CF6] hover:bg-[#2563EB] text-white font-semibold shadow-sm"
                                )}
                              >
                                <span>{q.isNative ? "LeetCode" : "Solve on LeetCode"}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 3: AI INTERVIEWS ─────────────────────────────────── */}
            {activeTab === "interviews" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {INTERVIEW_MODES.map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setInterviewMode(mode.id)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between",
                        interviewMode === mode.id
                          ? "bg-[#0E121A] border-[#327CF6] shadow-sm shadow-[#327CF6]/20 ring-1 ring-[#327CF6]/30"
                          : "bg-[#0D0F14] border-[#1B1F27] hover:border-[#272B33] hover:bg-[#11141B]"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              interviewMode === mode.id
                                ? "bg-[#327CF6] text-white"
                                : "bg-[#14161B] text-[#8A909E] border border-[#1E2229]"
                            )}
                          >
                            <mode.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B1F27] text-[#8A909E]">
                            {mode.badge}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">{mode.label}</h3>
                        <p className="text-[#8A909E] text-xs leading-relaxed">{mode.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1B1F27] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#10B981] font-semibold">LIVE</span>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            interviewMode === mode.id ? "bg-[#327CF6]" : "bg-[#272B33]"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Config Card */}
                <div className="p-6 rounded-2xl bg-[#0D0F14] border border-[#1B1F27]">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#327CF6]" />
                    Interview Parameters & Target Role
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-xs font-medium text-[#8A909E] block mb-1.5">
                        Target Engineering Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-[#0A0C10] border border-[#1B1F27] focus:border-[#327CF6] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-[#0D0F14]">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#8A909E] block mb-1.5">
                        Seniority / Experience Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {LEVELS.map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setLevel(lvl.id)}
                            className={cn(
                              "px-2.5 py-2 rounded-xl text-[11px] font-medium transition-all border text-center cursor-pointer",
                              level === lvl.id
                                ? "bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/40 font-semibold"
                                : "bg-[#0A0C10] text-[#8A909E] border-[#1B1F27] hover:text-white"
                            )}
                          >
                            {lvl.label.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startInterview}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-semibold text-xs shadow-md shadow-[#327CF6]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch AI Mock Interview Room</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 4: CORE CS MODULES ───────────────────────────────── */}
            {activeTab === "core_cs" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CORE_CS_MODULES.map((mod, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] hover:border-[#327CF6]/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#327CF6]/10 border border-[#327CF6]/25 flex items-center justify-center text-[#327CF6]">
                          <mod.icon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                          {mod.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-2">{mod.title}</h3>
                      <p className="text-[#8A909E] text-xs leading-relaxed mb-4">{mod.desc}</p>

                      {/* Topic badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mod.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#0A0C10] text-[#8A909E] text-[10px] font-mono border border-[#1B1F27]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1B1F27] flex items-center justify-between">
                      <span className="text-xs font-mono text-[#707784]">{mod.questions} Concepts</span>
                      <Link
                        to="/rooms"
                        className="text-xs font-semibold text-[#327CF6] hover:text-[#60A5FA] flex items-center gap-1"
                      >
                        <span>Test in Arena</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── RIGHT/SIDEBAR COLUMN (4/12) (matching tuf_ui/dsa_practice.png & lists.png) ────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Problem Of The Day (POTD) Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0D0F14] to-[#11141B] border border-[#1B1F27] shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Problem Of The Day
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8A909E]" />
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25 text-[10px] font-bold">
                  <Coins className="w-3 h-3 text-[#F59E0B]" />
                  <span>+20 TUF</span>
                </div>
              </div>

              {/* Countdown timer pill */}
              <div className="flex items-center justify-between bg-[#07080B] p-2.5 rounded-xl border border-[#1B1F27] mb-4">
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span className="px-1.5 py-0.5 bg-[#14161B] rounded font-bold">{countdown.hrs}</span>
                  <span className="text-[#707784]">:</span>
                  <span className="px-1.5 py-0.5 bg-[#14161B] rounded font-bold">{countdown.mins}</span>
                  <span className="text-[#707784]">:</span>
                  <span className="px-1.5 py-0.5 bg-[#14161B] rounded font-bold text-[#F59E0B]">
                    {countdown.secs}
                  </span>
                </div>

                <Link
                  to="/coding/two-sum"
                  className="px-3 py-1 rounded-lg bg-[#327CF6] hover:bg-[#2563EB] text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>Solve problem</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-[#0A0C10] border border-[#1B1F27]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">893. Two Sum & Hash Mapping</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#10B981]/15 text-[#10B981]">
                    Basic
                  </span>
                </div>
                <p className="text-[11px] text-[#8A909E] mt-1">
                  Given an array of integers, return indices of two numbers that add up to target.
                </p>
              </div>
            </div>

            {/* 2. Top Companies Selector (matching dsa_practice.png right column) */}
            <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Top Companies
                </h3>
                <span className="text-[10px] text-[#707784] font-mono">51 total</span>
              </div>

              {/* Global / Indian Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-[#0A0C10] border border-[#1B1F27] mb-3 text-xs">
                <button
                  onClick={() => setCompanyTabFilter("global")}
                  className={cn(
                    "flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer text-center",
                    companyTabFilter === "global"
                      ? "bg-[#1E2229] text-white font-semibold shadow-sm"
                      : "text-[#8A909E] hover:text-white"
                  )}
                >
                  Global
                </button>
                <button
                  onClick={() => setCompanyTabFilter("indian")}
                  className={cn(
                    "flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer text-center",
                    companyTabFilter === "indian"
                      ? "bg-[#1E2229] text-white font-semibold shadow-sm"
                      : "text-[#8A909E] hover:text-white"
                  )}
                >
                  Indian Unicorns
                </button>
              </div>

              {/* Company Badges Grid */}
              <div className="grid grid-cols-2 gap-2">
                {TOP_COMPANIES_PRESET.filter((c) =>
                  companyTabFilter === "global" ? c.global : !c.global
                ).map((comp) => (
                  <button
                    key={comp.name}
                    type="button"
                    onClick={() => selectCompanyFromSidebar(comp.name)}
                    className={cn(
                      "p-2 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer border",
                      selectedCompany === comp.name
                        ? "bg-[#327CF6]/15 border-[#327CF6]/40 text-[#327CF6] font-semibold"
                        : "bg-[#0A0C10] border-[#1B1F27] text-[#8A909E] hover:text-white hover:border-[#272B33]"
                    )}
                  >
                    <span className="truncate">{comp.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#14161B] text-[#8A909E]">
                      {comp.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Trending Discussions (matching tuf_ui/lists.png) */}
            <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27]">
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Trending Experiences
                </h3>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: "After 28 Interviews, I Was Still Trying", author: "sde_survivor", time: "2h ago" },
                  { title: "Amazon SDE-1 Full Loop Experience (Jan 2026)", author: "tech_curious", time: "5h ago" },
                  { title: "I Came From a Tier 3 College Yet I Cracked Google", author: "aman_singh", time: "1d ago" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0A0C10] border border-[#1B1F27] hover:border-[#272B33] transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-medium text-[#EDEDED] group-hover:text-[#327CF6] transition-colors line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#707784] mt-1.5 font-mono">
                      <span>@{item.author}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}