import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProblems } from "@/hooks/useProblems";
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
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVIEW_MODES = [
  {
    id: "text",
    label: "AI Text Interview",
    desc: "Real-time chat Q&A with deep conversational follow-ups and scoring",
    icon: MessageSquare,
    available: true,
  },
  {
    id: "voice",
    label: "AI Voice Interview",
    desc: "Speak naturally into microphone; adapts dynamically to spoken answers",
    icon: Mic,
    available: true,
  },
  {
    id: "coding",
    label: "Live Code Interview",
    desc: "Solve algorithmic problems under simulated interview pressure",
    icon: Code2,
    available: true,
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
      { id: "p1", title: "Two Sum", slug: "two-sum", difficulty: "EASY", companies: ["Google", "Amazon", "Meta"] },
      { id: "p2", title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "EASY", companies: ["Meta", "Amazon", "Bloomberg"] },
      { id: "p3", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "EASY", companies: ["Amazon", "Google", "Microsoft"] },
      { id: "p4", title: "Print 1 to N using Recursion", slug: "two-sum", difficulty: "EASY", companies: ["Accenture"] },
    ],
  },
  {
    id: 2,
    title: "Step 2: Learn Important Sorting Techniques",
    desc: "Selection, Bubble, Insertion Sort, Merge Sort, and Quick Sort",
    problems: [
      { id: "p5", title: "Selection & Bubble Sort Implementation", slug: "two-sum", difficulty: "EASY", companies: ["Adobe"] },
      { id: "p6", title: "Merge Sort Algorithm", slug: "two-sum", difficulty: "MEDIUM", companies: ["Amazon", "Microsoft"] },
      { id: "p7", title: "Quick Sort & Dutch National Flag", slug: "two-sum", difficulty: "MEDIUM", companies: ["Google"] },
    ],
  },
  {
    id: 3,
    title: "Step 3: Solve Problems on Arrays [Easy -> Medium -> Hard]",
    desc: "Fundamental array logic, prefix sums, two pointers, Kadane's algorithm, and subarray problems",
    problems: [
      { id: "p8", title: "Two Sum", slug: "two-sum", difficulty: "EASY", companies: ["Amazon", "Google", "Meta"] },
      { id: "p9", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "EASY", companies: ["Amazon", "Meta"] },
      { id: "p10", title: "Maximum Subarray Sum (Kadane's Algorithm)", slug: "maximum-subarray", difficulty: "MEDIUM", companies: ["Google", "Amazon", "Apple"] },
      { id: "p11", title: "3Sum", slug: "3sum", difficulty: "MEDIUM", companies: ["Google", "Amazon", "Meta"] },
      { id: "p12", title: "Next Permutation", slug: "two-sum", difficulty: "HARD", companies: ["Google", "Uber", "Goldman Sachs"] },
      { id: "p13", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "HARD", companies: ["Amazon", "Google", "Bloomberg"] },
    ],
  },
  {
    id: 4,
    title: "Step 4: Binary Search [1D, 2D Arrays, Search Space]",
    desc: "Binary search mechanics, lower/upper bounds, and minimax optimization",
    problems: [
      { id: "p14", title: "Binary Search on Sorted Array", slug: "two-sum", difficulty: "EASY", companies: ["Microsoft"] },
      { id: "p15", title: "Search in Rotated Sorted Array", slug: "two-sum", difficulty: "MEDIUM", companies: ["Google", "Meta"] },
      { id: "p16", title: "Find Peak Element", slug: "two-sum", difficulty: "MEDIUM", companies: ["Amazon"] },
      { id: "p17", title: "Book Allocation Problem / Painter Partition", slug: "two-sum", difficulty: "HARD", companies: ["Google", "Flipkart"] },
    ],
  },
  {
    id: 5,
    title: "Step 5: Strings & Dynamic Programming",
    desc: "String parsing, anagrams, memoization, grid paths, and subsequence matching",
    problems: [
      { id: "p18", title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "EASY", companies: ["Meta", "Google"] },
      { id: "p19", title: "Longest Substring Without Repeating Characters", slug: "two-sum", difficulty: "MEDIUM", companies: ["Amazon", "Google"] },
      { id: "p20", title: "Maximum Subarray (Kadane)", slug: "maximum-subarray", difficulty: "MEDIUM", companies: ["Apple", "Microsoft"] },
      { id: "p21", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "HARD", companies: ["Goldman Sachs", "Google"] },
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
  },
  {
    title: "Database Management (DBMS)",
    icon: Database,
    desc: "ACID Properties, Normalization (1NF-BCNF), Indexing (B-Tree), Transactions & SQL Joins",
    questions: 40,
    badge: "Must Master",
  },
  {
    title: "Computer Networks (CN)",
    icon: Network,
    desc: "OSI Model, TCP/IP, 3-Way Handshake, DNS, HTTP/HTTPS, WebSockets, IP Addressing",
    questions: 38,
    badge: "Essential",
  },
];

export default function PracticeHubPage() {
  const navigate = useNavigate();
  const { data: dbProblems } = useProblems();

  const [activeTab, setActiveTab] = useState<"sheets" | "companies" | "interviews" | "core_cs">("sheets");
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 3: true });
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Company-Wise State
  const { data: featuredCompaniesData } = useFeaturedCompanies();
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("thirtyDays");
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");

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

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto text-slate-100 font-sans">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
              Placement Curriculum
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> SDE Prep Roadmap
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Placement Preparation Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Master Data Structures & Algorithms, practice company-wise questions, test core CS subjects, or launch AI mock interviews.
          </p>
        </div>

        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 bg-[#327cf6] hover:bg-[#2563eb] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(50,124,246,0.35)] transition-all self-start md:self-auto"
        >
          <Swords className="w-4 h-4 text-cyan-300" />
          <span>Enter Battle Arena</span>
        </Link>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8 p-1.5 rounded-2xl bg-[#0c0d14] border border-white/[0.08] max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("sheets")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "sheets"
              ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.35)]"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>DSA Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "companies"
              ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.35)]"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company-Wise (470+)</span>
        </button>

        <button
          onClick={() => setActiveTab("interviews")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "interviews"
              ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.35)]"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Interviews</span>
        </button>

        <button
          onClick={() => setActiveTab("core_cs")}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "core_cs"
              ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.35)]"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Core CS</span>
        </button>
      </div>

      {/* ─── TAB 1: DSA ROADMAP SHEETS ───────────────────────────────── */}
      {activeTab === "sheets" && (
        <div>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topic or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0d14] border border-white/[0.08] focus:border-[#327cf6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    selectedDifficulty === diff
                      ? "bg-white/[0.12] text-white border border-white/[0.2]"
                      : "text-slate-400 hover:text-slate-200 bg-white/[0.02] border border-transparent"
                  )}
                >
                  {diff}
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
                  p.companies.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchDiff && matchSearch;
              });

              if (searchQuery && filteredProblems.length === 0) return null;

              return (
                <div
                  key={step.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0b10] overflow-hidden transition-all shadow-sm"
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400">
                        0{step.id}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">
                          {step.title}
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500">
                        {step.problems.length} problems
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Problems Table */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                      {filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <Circle className="w-3.5 h-3.5 text-slate-600 hover:text-emerald-400 cursor-pointer transition-colors" />
                            <div>
                              <p className="font-semibold text-slate-200">{problem.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {problem.companies.map((company, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-400 text-[10px] font-mono border border-white/[0.05]"
                                  >
                                    {company}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                problem.difficulty === "EASY"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : problem.difficulty === "MEDIUM"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              )}
                            >
                              {problem.difficulty}
                            </span>

                            <Link
                              to={`/coding/${problem.slug}`}
                              className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold transition-all text-xs flex items-center gap-1"
                            >
                              <span>Solve</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: COMPANY-WISE PREP (470+ COMPANIES) ────────────────── */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          {/* Company Picker Bar */}
          <div className="p-4 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Select Target Company
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Powered by 470+ Companies Dataset
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(featuredCompaniesData?.companies || []).map((comp) => (
                <button
                  key={comp.slug}
                  onClick={() => setSelectedCompany(comp.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    selectedCompany === comp.name
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40"
                      : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]"
                  )}
                >
                  <span className="font-mono text-[11px] opacity-75">{comp.icon}</span>
                  <span>{comp.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Recency Timeframe */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs self-start sm:self-auto">
              {[
                { id: "thirtyDays", label: "🔥 Last 30 Days (Trending)" },
                { id: "threeMonths", label: "3 Months" },
                { id: "sixMonths", label: "6 Months" },
                { id: "all", label: "All Time" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    selectedTimeframe === tf.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Search within company */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${selectedCompany} questions...`}
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                className="w-full bg-[#0c0d14] border border-white/[0.08] focus:border-[#327cf6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Company Problem List */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b10] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {selectedCompany} Interview Questions
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold font-mono">
                  {companyQuestionsData?.totalCount || 0} questions
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Ranked by interview frequency
              </span>
            </div>

            {isCompanyLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-xs text-slate-400 font-mono">Loading {selectedCompany} questions...</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
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
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200 text-xs sm:text-sm">
                            {q.title}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              q.difficulty === "EASY"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : q.difficulty === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            )}
                          >
                            {q.difficulty}
                          </span>
                          {q.isNative && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                              ⚡ Native Runner
                            </span>
                          )}
                        </div>

                        {/* Topics */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {q.topics.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-400 text-[10px] font-mono border border-white/[0.05]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Frequency & Action Buttons */}
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {q.frequency > 0 && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-500 font-mono block">Ask Rate</span>
                            <span className="text-xs font-extrabold text-amber-400 font-mono">
                              {q.frequency}%
                            </span>
                          </div>
                        )}

                        {q.isNative ? (
                          <Link
                            to={`/coding/${q.slug}`}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
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
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1",
                            q.isNative
                              ? "bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06]"
                              : "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
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

      {/* ─── TAB 3: AI INTERVIEWS ────────────────────────────────────── */}
      {activeTab === "interviews" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mode Selector Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Interview Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INTERVIEW_MODES.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => setInterviewMode(mode.id)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between",
                    interviewMode === mode.id
                      ? "bg-[#0e1322] border-[#327cf6] shadow-[0_0_20px_rgba(50,124,246,0.25)]"
                      : "bg-[#0a0b10] border-white/[0.08] hover:border-white/[0.15]"
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                        interviewMode === mode.id
                          ? "bg-[#327cf6] text-white"
                          : "bg-white/[0.04] text-slate-400"
                      )}
                    >
                      <mode.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">{mode.label}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{mode.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">READY</span>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        interviewMode === mode.id ? "bg-[#327cf6]" : "bg-white/[0.1]"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Evaluation Rubric Card */}
            <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] mt-6">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Multi-Dimensional AI Evaluation Engine
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                After each interview session, our Groq Llama 3.3 engine evaluates your performance across 4 industry-standard dimensions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs font-bold text-white">Technical Accuracy</p>
                  <p className="text-[10px] text-slate-400 mt-1">Core CS correctness</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs font-bold text-white">Communication</p>
                  <p className="text-[10px] text-slate-400 mt-1">Clarity & structure</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs font-bold text-white">Problem Solving</p>
                  <p className="text-[10px] text-slate-400 mt-1">Trade-off analysis</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs font-bold text-white">Edge Cases</p>
                  <p className="text-[10px] text-slate-400 mt-1">Robust thinking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Launcher Sidebar */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Session Configuration
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Engineering Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#0c0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#327cf6] cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#0a0b10]">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Seniority / Experience Level
                </label>
                <div className="space-y-1.5">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setLevel(lvl.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                        level === lvl.id
                          ? "bg-blue-600/15 text-blue-400 border-blue-500/30"
                          : "bg-white/[0.02] text-slate-400 border-white/[0.05] hover:text-white"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08]">
              <button
                onClick={startInterview}
                className="w-full py-3 rounded-xl bg-[#327cf6] hover:bg-[#2563eb] text-white font-bold text-xs shadow-[0_0_20px_rgba(50,124,246,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Interview Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: CORE CS MODULES ──────────────────────────────────── */}
      {activeTab === "core_cs" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CORE_CS_MODULES.map((mod, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{mod.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{mod.desc}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">{mod.questions} MCQs & Concepts</span>
                <Link
                  to="/rooms"
                  className="text-xs font-bold text-blue-400 hover:text-cyan-300 flex items-center gap-1"
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
  );
}