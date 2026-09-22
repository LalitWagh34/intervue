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
  Bookmark,
  Check,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Filter,
  Shuffle,
  Clock,
  TrendingUp,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SHEET DATASETS
// ============================================================================

export interface DsaProblem {
  id: string;
  index: number;
  title: string;
  slug: string;
  difficulty: "Basic" | "Core" | "Hard";
  topic: string;
  moreTopics?: number;
  companies: string[];
  isPotd?: boolean;
}

export interface SheetMeta {
  id: string;
  subjectId: "dsa" | "system_design" | "core_cs";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: "blue" | "emerald" | "amber" | "purple";
  problemCount: number;
  estimatedHours: string;
  problems: DsaProblem[];
}

const SHEETS_CATALOG: SheetMeta[] = [
  // ─── DSA SHEETS ──────────────────────────────────────────
  {
    id: "striver_a2z",
    subjectId: "dsa",
    title: "Striver's A2Z DSA Sheet",
    subtitle: "Zero to Hero Comprehensive Roadmap",
    description: "Step-by-step master roadmap covering programming syntax, math, arrays, binary search, recursion, trees, graphs, and dynamic programming.",
    badge: "Most Popular",
    badgeColor: "blue",
    problemCount: 455,
    estimatedHours: "120 hrs",
    problems: [
      { id: "s1", index: 1, title: "Two Sum", slug: "two-sum", difficulty: "Basic", topic: "Hashing", moreTopics: 1, companies: ["Google", "Amazon"], isPotd: true },
      { id: "s2", index: 2, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Basic", topic: "Stack", companies: ["Meta", "Amazon"] },
      { id: "s3", index: 3, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Basic", topic: "Arrays", companies: ["Amazon", "Microsoft"] },
      { id: "s4", index: 4, title: "Merge Sort Algorithm", slug: "two-sum", difficulty: "Core", topic: "Sorting", companies: ["Google", "Adobe"] },
      { id: "s5", index: 5, title: "Maximum Subarray Sum (Kadane)", slug: "maximum-subarray", difficulty: "Core", topic: "DP & Arrays", companies: ["Google", "Apple"] },
      { id: "s6", index: 6, title: "3Sum", slug: "3sum", difficulty: "Core", topic: "Two Pointers", companies: ["Google", "Meta"] },
      { id: "s7", index: 7, title: "Next Permutation", slug: "two-sum", difficulty: "Hard", topic: "Arrays", companies: ["Google", "Uber"] },
      { id: "s8", index: 8, title: "Trapping Rainwater", slug: "trapping-rain-water", difficulty: "Hard", topic: "Two Pointers", companies: ["Amazon", "Google"] },
      { id: "s9", index: 9, title: "Binary Search on Sorted Array", slug: "two-sum", difficulty: "Basic", topic: "Binary Search", companies: ["Microsoft"] },
      { id: "s10", index: 10, title: "Search in Rotated Sorted Array", slug: "two-sum", difficulty: "Core", topic: "Binary Search", companies: ["Google", "Meta"] },
      { id: "s11", index: 11, title: "Find Peak Element", slug: "two-sum", difficulty: "Core", topic: "Binary Search", companies: ["Amazon"] },
      { id: "s12", index: 12, title: "Longest Substring Without Repeating", slug: "two-sum", difficulty: "Core", topic: "Sliding Window", companies: ["Amazon", "Google"] },
    ],
  },
  {
    id: "neetcode_150",
    subjectId: "dsa",
    title: "NeetCode 150",
    subtitle: "Pattern-Based FAANG Preparation",
    description: "The global gold standard sheet grouping problems by algorithmic patterns: Sliding Window, Monotonic Stack, Backtracking, and 2D Dynamic Programming.",
    badge: "Pattern Mastery",
    badgeColor: "emerald",
    problemCount: 150,
    estimatedHours: "80 hrs",
    problems: [
      { id: "nc1", index: 1, title: "Contains Duplicate & Hash Set", slug: "two-sum", difficulty: "Basic", topic: "Arrays & Hashing", companies: ["Amazon", "Google"] },
      { id: "nc2", index: 2, title: "Valid Anagram", slug: "two-sum", difficulty: "Basic", topic: "Arrays & Hashing", companies: ["Meta", "Uber"] },
      { id: "nc3", index: 3, title: "Two Sum", slug: "two-sum", difficulty: "Basic", topic: "Arrays & Hashing", companies: ["Google", "Meta"], isPotd: true },
      { id: "nc4", index: 4, title: "Group Anagrams", slug: "two-sum", difficulty: "Core", topic: "Arrays & Hashing", companies: ["Amazon", "Apple"] },
      { id: "nc5", index: 5, title: "Top K Frequent Elements", slug: "two-sum", difficulty: "Core", topic: "Heaps", companies: ["Meta", "Amazon"] },
      { id: "nc6", index: 6, title: "Valid Palindrome", slug: "two-sum", difficulty: "Basic", topic: "Two Pointers", companies: ["Microsoft"] },
      { id: "nc7", index: 7, title: "3Sum", slug: "3sum", difficulty: "Core", topic: "Two Pointers", companies: ["Google", "Meta"] },
      { id: "nc8", index: 8, title: "Container With Most Water", slug: "two-sum", difficulty: "Core", topic: "Two Pointers", companies: ["Google", "Amazon"] },
      { id: "nc9", index: 9, title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", topic: "Two Pointers", companies: ["Goldman Sachs", "Google"] },
      { id: "nc10", index: 10, title: "Longest Substring Without Repeating", slug: "two-sum", difficulty: "Core", topic: "Sliding Window", companies: ["Amazon", "Bloomberg"] },
      { id: "nc11", index: 11, title: "Longest Repeating Character Replacement", slug: "two-sum", difficulty: "Core", topic: "Sliding Window", companies: ["Google"] },
      { id: "nc12", index: 12, title: "Minimum Window Substring", slug: "two-sum", difficulty: "Hard", topic: "Sliding Window", companies: ["Meta", "Uber"] },
    ],
  },
  {
    id: "blind_75",
    subjectId: "dsa",
    title: "Blind 75",
    subtitle: "Essential 75 High-ROI LeetCode Problems",
    description: "The original curated list of 75 high-yield problems designed for rapid revision when you have 3 to 4 weeks before your technical interviews.",
    badge: "Fast Track",
    badgeColor: "amber",
    problemCount: 75,
    estimatedHours: "40 hrs",
    problems: [
      { id: "b1", index: 1, title: "Two Sum", slug: "two-sum", difficulty: "Basic", topic: "Hashing", companies: ["Google", "Amazon"], isPotd: true },
      { id: "b2", index: 2, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Basic", topic: "Arrays", companies: ["Amazon", "Meta"] },
      { id: "b3", index: 3, title: "Contains Duplicate", slug: "two-sum", difficulty: "Basic", topic: "Hashing", companies: ["Apple"] },
      { id: "b4", index: 4, title: "Product of Array Except Self", slug: "two-sum", difficulty: "Core", topic: "Arrays", companies: ["Amazon", "Meta"] },
      { id: "b5", index: 5, title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Core", topic: "DP", companies: ["Google", "Microsoft"] },
      { id: "b6", index: 6, title: "3Sum", slug: "3sum", difficulty: "Core", topic: "Two Pointers", companies: ["Google", "Uber"] },
      { id: "b7", index: 7, title: "Reverse Linked List", slug: "two-sum", difficulty: "Basic", topic: "Linked List", companies: ["Amazon"] },
      { id: "b8", index: 8, title: "Merge Two Sorted Lists", slug: "two-sum", difficulty: "Basic", topic: "Linked List", companies: ["Microsoft"] },
      { id: "b9", index: 9, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Basic", topic: "Stack", companies: ["Meta"] },
    ],
  },
  {
    id: "striver_sde",
    subjectId: "dsa",
    title: "Striver's SDE Sheet",
    subtitle: "Top 191 Interview Questions",
    description: "The most tested 191 questions asked in technical interviews at Amazon, Microsoft, Google, Uber, Flipkart, and leading tech unicorns.",
    badge: "Placement Core",
    badgeColor: "purple",
    problemCount: 191,
    estimatedHours: "90 hrs",
    problems: [
      { id: "sd1", index: 1, title: "Set Matrix Zeroes", slug: "two-sum", difficulty: "Core", topic: "Arrays", companies: ["Amazon", "Microsoft"] },
      { id: "sd2", index: 2, title: "Pascal's Triangle", slug: "two-sum", difficulty: "Basic", topic: "Arrays", companies: ["Google", "Adobe"] },
      { id: "sd3", index: 3, title: "Next Permutation", slug: "two-sum", difficulty: "Core", topic: "Arrays", companies: ["Google", "Uber"] },
      { id: "sd4", index: 4, title: "Kadane's Algorithm", slug: "maximum-subarray", difficulty: "Core", topic: "Arrays", companies: ["Amazon", "Apple"] },
      { id: "sd5", index: 5, title: "Sort an Array of 0s, 1s, and 2s", slug: "two-sum", difficulty: "Core", topic: "Two Pointers", companies: ["Microsoft"] },
      { id: "sd6", index: 6, title: "Stock Buy and Sell", slug: "best-time-to-buy-and-sell-stock", difficulty: "Basic", topic: "Arrays", companies: ["Amazon"] },
    ],
  },

  // ─── CORE CS SHEETS ──────────────────────────────────────
  {
    id: "os_sheet",
    subjectId: "core_cs",
    title: "Operating Systems (OS) Sheet",
    subtitle: "Core Architecture & Process Scheduling",
    description: "Processes vs Threads, Concurrency & Deadlocks, Virtual Memory, Paging, and CPU Scheduling algorithms.",
    badge: "High Yield",
    badgeColor: "blue",
    problemCount: 45,
    estimatedHours: "20 hrs",
    problems: [
      { id: "os1", index: 1, title: "Process vs Thread Architecture", slug: "two-sum", difficulty: "Basic", topic: "Concurrency", companies: ["Google", "Amazon"] },
      { id: "os2", index: 2, title: "Deadlock Detection & Prevention (Banker's)", slug: "two-sum", difficulty: "Core", topic: "Deadlocks", companies: ["Microsoft"] },
      { id: "os3", index: 3, title: "Virtual Memory & Page Replacement", slug: "two-sum", difficulty: "Core", topic: "Memory", companies: ["Apple"] },
    ],
  },
  {
    id: "dbms_sheet",
    subjectId: "core_cs",
    title: "Database Management (DBMS) Sheet",
    subtitle: "Transactions, Indexing & Normalization",
    description: "ACID Properties, Normalization (1NF to BCNF), Indexing (B-Trees), Transactions & SQL Query Optimizations.",
    badge: "Must Master",
    badgeColor: "amber",
    problemCount: 40,
    estimatedHours: "18 hrs",
    problems: [
      { id: "db1", index: 1, title: "ACID Properties & Isolation Levels", slug: "two-sum", difficulty: "Basic", topic: "Transactions", companies: ["Amazon", "Uber"] },
      { id: "db2", index: 2, title: "B-Tree vs B+ Tree Indexing Mechanisms", slug: "two-sum", difficulty: "Core", topic: "Indexing", companies: ["Google", "Oracle"] },
      { id: "db3", index: 3, title: "Normalization Forms (1NF through BCNF)", slug: "two-sum", difficulty: "Core", topic: "Relational", companies: ["Microsoft"] },
    ],
  },
  {
    id: "cn_sheet",
    subjectId: "core_cs",
    title: "Computer Networks (CN) Sheet",
    subtitle: "Protocols, OSI & Transport Layer",
    description: "OSI Model, TCP/IP, 3-Way Handshake, DNS, HTTP/HTTPS, WebSockets, and IP Addressing.",
    badge: "Essential",
    badgeColor: "emerald",
    problemCount: 38,
    estimatedHours: "16 hrs",
    problems: [
      { id: "cn1", index: 1, title: "TCP 3-Way Handshake & Connection Teardown", slug: "two-sum", difficulty: "Basic", topic: "Transport", companies: ["Cisco", "Google"] },
      { id: "cn2", index: 2, title: "HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC", slug: "two-sum", difficulty: "Core", topic: "Application", companies: ["Cloudflare", "Meta"] },
      { id: "cn3", index: 3, title: "DNS Lookup Resolution Flow", slug: "two-sum", difficulty: "Basic", topic: "Routing", companies: ["Amazon"] },
    ],
  },
];

const TOP_COMPANIES_PRESET = [
  { name: "Amazon", count: 443, global: true },
  { name: "Google", count: 447, global: true },
  { name: "Meta", count: 357, global: true },
  { name: "Uber", count: 433, global: true },
  { name: "Microsoft", count: 466, global: true },
  { name: "Oracle", count: 431, global: true },
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

  // Navigation View State:
  // - "hub": The root Prephub overview with Explore Subjects list
  // - "sheets_catalog": Multiple sheets view for a subject (DSA / Core CS)
  // - "sheet_practice": The problem set table for a specific sheet
  // - "company_wise": The dedicated 470+ company question explorer
  const [currentView, setCurrentView] = useState<"hub" | "sheets_catalog" | "sheet_practice" | "company_wise">("hub");

  // Selected Subject ("dsa" | "core_cs")
  const [selectedSubject, setSelectedSubject] = useState<"dsa" | "core_cs">("dsa");

  // Selected Sheet inside subject
  const [selectedSheetId, setSelectedSheetId] = useState<string>("striver_a2z");

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

  // Solved state persisted in localStorage
  const [solvedProblems, setSolvedProblems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tuf_solved_problems");
      return saved ? JSON.parse(saved) : { s1: true, s2: true, nc3: true };
    } catch {
      return { s1: true, s2: true, nc3: true };
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

  // Search in sheet
  const [sheetSearchQuery, setSheetSearchQuery] = useState("");

  // Get active sheet metadata
  const currentSheet = useMemo(() => {
    return SHEETS_CATALOG.find((s) => s.id === selectedSheetId) || SHEETS_CATALOG[0];
  }, [selectedSheetId]);

  // Sheets belonging to current subject
  const currentSubjectSheets = useMemo(() => {
    return SHEETS_CATALOG.filter((s) => s.subjectId === selectedSubject);
  }, [selectedSubject]);

  // Active sheet problem metrics
  const activeSheetProblems = currentSheet.problems;
  const sheetTotalCount = activeSheetProblems.length;
  const sheetSolvedCount = activeSheetProblems.filter((p) => solvedProblems[p.id]).length;
  const sheetProgressPercent = Math.round((sheetSolvedCount / Math.max(sheetTotalCount, 1)) * 100);

  const basicSolved = activeSheetProblems.filter((p) => p.difficulty === "Basic" && solvedProblems[p.id]).length;
  const basicTotal = activeSheetProblems.filter((p) => p.difficulty === "Basic").length;

  const coreSolved = activeSheetProblems.filter((p) => p.difficulty === "Core" && solvedProblems[p.id]).length;
  const coreTotal = activeSheetProblems.filter((p) => p.difficulty === "Core").length;

  const hardSolved = activeSheetProblems.filter((p) => p.difficulty === "Hard" && solvedProblems[p.id]).length;
  const hardTotal = activeSheetProblems.filter((p) => p.difficulty === "Hard").length;

  const filteredSheetProblems = useMemo(() => {
    return activeSheetProblems.filter((p) => {
      if (!sheetSearchQuery) return true;
      const q = sheetSearchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.companies.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [activeSheetProblems, sheetSearchQuery]);

  // Handler to open a subject catalog
  const openSubject = (subjectId: "dsa" | "core_cs") => {
    setSelectedSubject(subjectId);
    // select first sheet of that subject by default
    const firstSheet = SHEETS_CATALOG.find((s) => s.subjectId === subjectId);
    if (firstSheet) setSelectedSheetId(firstSheet.id);
    setCurrentView("sheets_catalog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler to select and practice a specific sheet
  const openSheetPractice = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setCurrentView("sheet_practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler to open company-wise view directly
  const openCompanyWise = (companyName?: string) => {
    if (companyName) setSelectedCompany(companyName);
    setCurrentView("company_wise");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans pb-16 px-4 sm:px-6 lg:px-8 pt-6 max-w-[1400px] mx-auto">
      {/* ──────────────────────────────────────────────────────────────────────────
          LEVEL 1: PREP HUB ROOT OVERVIEW (tuf_ui/prep_hub.png)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "hub" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Section (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Prephub Hero Banner Card with Single Capsule Bar */}
            <div className="p-7 sm:p-8 rounded-2xl bg-[#0D0E12] border border-[#181A20] relative overflow-hidden flex flex-col justify-between min-h-[200px]">
              <div className="relative z-10 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  Prephub
                </h1>
                <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1.5 leading-relaxed">
                  Your one-stop platform to learn, and master every interview subject.
                </p>

                {/* Single Continuous Stats Capsule Bar */}
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

              {/* Right Glowing Logo Illustration */}
              <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 items-center pointer-events-none opacity-80">
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#327CF6]/15 rounded-full blur-2xl" />
                  <div className="w-36 h-24 rounded-xl bg-[#08090C] border border-[#1E2229] shadow-2xl flex flex-col items-center justify-center p-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-[#327CF6] flex items-center justify-center text-white font-bold text-xs font-mono shadow-md shadow-[#327CF6]/30">
                      F&gt;
                    </div>
                    <span className="text-[10px] text-[#525866] font-mono mt-1">Intervue TUF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* "Explore Subjects" Section (Vertical Stacked Horizontal Rows) */}
            <div className="space-y-3.5">
              <h2 className="text-base font-bold text-white tracking-tight">Explore Subjects</h2>

              {/* Subject 1: DSA (Opens DSA Sheets Catalog with A2Z, NeetCode 150, Blind 75, SDE) */}
              <div
                onClick={() => openSubject("dsa")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        DSA Sheets
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30">
                        4 Major Sheets
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Striver A2Z, NeetCode 150, Blind 75 & Striver's SDE Sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Explore Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 2: Company-Wise (Dedicated 470+ company question system) */}
              <div
                onClick={() => openCompanyWise()}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        Company-Wise Sheets
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        470+ Companies
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Past interview papers ranked by ask rate from Google, Amazon, Meta, Microsoft, Apple & startups.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>View Companies</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 3: Core Subjects (OS, DBMS, CN) */}
              <div
                onClick={() => openSubject("core_cs")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        Core CS Subjects
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        3 Sheets
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Strengthen DBMS, Operating Systems and Computer Networks fundamentals for technical rounds.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Explore Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 4: AI Mock Interviews */}
              <div
                onClick={() => navigate("/interview")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        AI Mock Interviews
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        Live Simulation
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Interactive real-time text and coding interviews with AI scoring and rubric evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Launch Room</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail (4 of 12 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Battle Arena Contest Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131124] to-[#0A0C10] border border-[#261E42] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  COMPETITIVE ARENA
                </span>
                <h3 className="text-xl font-extrabold text-white mt-3 tracking-tight">
                  LIVE BATTLE ARENA
                </h3>
                <p className="text-xs text-[#8B92A0] mt-1">
                  Host or join timed assessments with peer competition, live scoring, and anti-cheat proctoring.
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

            {/* Daily Planner Card */}
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
                onClick={() => openSheetPractice("striver_a2z")}
                className="w-full py-2 rounded-xl bg-[#14161C] hover:bg-[#1A1D24] text-xs font-medium text-white border border-[#1E2229] transition-all cursor-pointer"
              >
                View Today's Tasks →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          LEVEL 2: SHEETS CATALOG CARDS VIEW (Selecting between Striver A2Z, NeetCode 150, Blind 75, etc.)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "sheets_catalog" && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#181A20]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-white font-medium capitalize">
                  {selectedSubject === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {selectedSubject === "dsa" ? "Data Structures & Algorithms Sheets" : "Core CS Fundamentals"}
              </h1>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                Choose a structured curriculum that matches your timeline and interview target.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Multiple Sheet Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentSubjectSheets.map((sheet) => {
              const sheetProblems = sheet.problems;
              const solvedCountForSheet = sheetProblems.filter((p) => solvedProblems[p.id]).length;
              const pct = Math.round((solvedCountForSheet / Math.max(sheetProblems.length, 1)) * 100);

              return (
                <div
                  key={sheet.id}
                  onClick={() => openSheetPractice(sheet.id)}
                  className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/50 hover:bg-[#101217] transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          sheet.badgeColor === "emerald"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : sheet.badgeColor === "amber"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : sheet.badgeColor === "purple"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-[#327CF6]/10 text-[#327CF6] border-[#327CF6]/20"
                        )}
                      >
                        {sheet.badge}
                      </span>

                      <span className="text-xs font-mono text-[#525866]">
                        {sheet.estimatedHours}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-[#327CF6] transition-colors">
                      {sheet.title}
                    </h2>
                    <p className="text-xs text-[#327CF6] font-medium mt-0.5">
                      {sheet.subtitle}
                    </p>
                    <p className="text-xs text-[#7A808C] mt-2.5 leading-relaxed">
                      {sheet.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#181A20]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#8B92A0] font-medium">Progress</span>
                      <span className="font-mono text-white font-bold">
                        {pct}% ({solvedCountForSheet}/{sheetProblems.length})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#181A20] overflow-hidden mb-4">
                      <div
                        className="h-full bg-[#327CF6] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#525866]">
                        {sheet.problemCount} Problems
                      </span>
                      <span className="text-xs font-semibold text-[#327CF6] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Start Practicing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          LEVEL 3: SHEET PRACTICE VIEW (Problem Table + Sheet Switcher Pill Bar)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "sheet_practice" && (
        <div className="space-y-6">
          {/* Breadcrumb & Sheet Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-2">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-2 font-sans">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Prephub
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-white transition-colors cursor-pointer capitalize"
                >
                  {currentSheet.subjectId === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </button>
                <span>/</span>
                <span className="text-white font-medium">{currentSheet.title}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                {currentSheet.title}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1 max-w-2xl leading-relaxed">
                {currentSheet.description}
              </p>

              {/* Seamless Sheet Switcher Bar (User can switch between Striver A2Z, NeetCode 150, Blind 75 without leaving!) */}
              <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
                <span className="text-xs text-[#525866] font-semibold shrink-0">Switch Sheet:</span>
                {currentSubjectSheets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSheetPractice(s.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border",
                      selectedSheetId === s.id
                        ? "bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/40 font-semibold shadow-sm"
                        : "bg-[#0D0E12] text-[#8B92A0] border-[#181A20] hover:text-white hover:border-[#262933]"
                    )}
                  >
                    {s.title.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* TUF Progress Card for Current Sheet */}
            <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] w-full lg:w-80 shrink-0">
              <div className="flex items-center justify-between text-xs text-[#8B92A0] mb-2">
                <span className="font-semibold text-white">Your Progress</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-white text-[11px] transition-colors"
                >
                  All sheets ↗
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sheetProgressPercent} %</span>
                <span className="text-xs text-[#525866]">({sheetSolvedCount}/{sheetTotalCount} solved)</span>
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

          {/* Table Area (9 cols) + Top Companies Sidebar (3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-9 space-y-4">
              {/* Search & Counter Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-[#525866] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${currentSheet.title}...`}
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#525866] outline-none transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#7A808C]">
                  <span className="font-mono">{filteredSheetProblems.length} questions in this sheet</span>
                  <button className="p-1.5 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:text-white transition-colors">
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:text-white transition-colors">
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 48px Sleek Data Table */}
              <div className="rounded-2xl border border-[#181A20] bg-[#0D0E12] overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[#181A20] text-[11px] font-semibold text-[#7A808C] grid grid-cols-12 gap-3 items-center bg-[#090A0D]">
                  <div className="col-span-6 sm:col-span-5">Problem</div>
                  <div className="col-span-2 text-center">Difficulty</div>
                  <div className="col-span-2 hidden sm:block">Companies</div>
                  <div className="col-span-2 hidden sm:block">Topics</div>
                  <div className="col-span-4 sm:col-span-1 text-right">Action</div>
                </div>

                <div className="divide-y divide-[#181A20]">
                  {filteredSheetProblems.map((prob) => {
                    const isSolved = Boolean(solvedProblems[prob.id]);
                    return (
                      <div
                        key={prob.id}
                        className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-[#111318] transition-colors text-xs"
                      >
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

                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-[#525866]">
                          <Lock className="w-3.5 h-3.5 text-[#327CF6]/70" />
                          <span className="text-[11px] font-mono text-[#8B92A0]">
                            {prob.companies[0]}
                          </span>
                        </div>

                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-[#14161C] text-[#8B92A0] text-[10px] font-mono border border-[#1E2229] truncate">
                            {prob.topic}
                          </span>
                        </div>

                        <div className="col-span-4 sm:col-span-1 flex items-center justify-end gap-2 text-[#7A808C]">
                          <Link
                            to={`/coding/${prob.slug}`}
                            className="px-2.5 py-1 rounded-lg bg-[#327CF6]/15 hover:bg-[#327CF6] text-[#327CF6] hover:text-white border border-[#327CF6]/30 font-semibold text-xs transition-all flex items-center gap-1"
                          >
                            <span>Solve</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Top Companies */}
            <div className="lg:col-span-3 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Company Practice
                  </h3>
                  <button
                    type="button"
                    onClick={() => openCompanyWise()}
                    className="text-[10px] text-[#327CF6] hover:underline"
                  >
                    View 470+ ↗
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {TOP_COMPANIES_PRESET.slice(0, 10).map((comp) => (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => openCompanyWise(comp.name)}
                      className="p-2 rounded-xl bg-[#08090C] border border-[#181A20] hover:border-[#327CF6]/50 transition-colors flex items-center justify-between text-xs cursor-pointer group text-left"
                    >
                      <span className="text-[#8B92A0] group-hover:text-white truncate">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#14161C] text-[#7A808C]">
                        {comp.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4: DEDICATED COMPANY-WISE QUESTION EXPLORER (470+ COMPANIES)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === "company_wise" && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between pb-2 border-b border-[#181A20]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-white font-medium">Company-Wise Question Hub</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Target Company Assessment Sets</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  470+ Verified Companies
                </span>
              </h1>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                Questions organized by company, recency, and interview ask rate with automated Judge0 evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer"
            >
              ← Back to Prephub
            </button>
          </div>

          {/* Company Picker Bar */}
          <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8B92A0] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#327CF6]" />
                Target Company: <strong className="text-white font-bold">{selectedCompany}</strong>
              </span>
              <span className="text-xs text-[#525866] font-mono">
                {companyQuestionsData?.totalCount || 0} questions available
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
                      : "bg-[#08090C] text-[#8B92A0] hover:text-white hover:bg-[#14161C] border border-[#181A20]"
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
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs self-start sm:self-auto">
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
                      ? "bg-[#181A20] text-white shadow-sm font-semibold"
                      : "text-[#7A808C] hover:text-white"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#525866] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${selectedCompany} questions...`}
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                className="w-full bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#525866] outline-none transition-all"
              />
            </div>
          </div>

          {/* Company Problem List Table */}
          <div className="rounded-2xl border border-[#181A20] bg-[#0D0E12] overflow-hidden">
            <div className="p-4 border-b border-[#181A20] flex items-center justify-between bg-[#08090C]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {selectedCompany} Problem Breakdown
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 text-[10px] font-semibold font-mono">
                  {companyQuestionsData?.totalCount || 0} questions
                </span>
              </div>
              <span className="text-[11px] text-[#525866] font-mono">
                Ranked by interview ask rate
              </span>
            </div>

            {isCompanyLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[#327CF6] border-t-transparent animate-spin" />
                <p className="text-xs text-[#8B92A0] font-mono">Loading questions for {selectedCompany}...</p>
              </div>
            ) : (
              <div className="divide-y divide-[#181A20]">
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
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#111318] transition-colors"
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
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : q.difficulty === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
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
                              className="px-1.5 py-0.5 rounded bg-[#08090C] text-[#8B92A0] text-[10px] font-mono border border-[#181A20]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {q.frequency > 0 && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-[#525866] font-mono block">Ask Rate</span>
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
                              ? "bg-[#08090C] hover:bg-[#14161C] text-[#8B92A0] hover:text-white border border-[#181A20]"
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
    </div>
  );
}