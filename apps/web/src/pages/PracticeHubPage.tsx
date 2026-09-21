import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProblems } from "@/hooks/useProblems";
import { useFeaturedCompanies, useCompanyQuestions } from "@/hooks/useCompanies";
import {
  Code2,
  Mic,
  MessageSquare,
  BookOpen,
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
  useProblems();

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-[#F5F7FA] font-sans">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#272B33]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25">
              Placement Curriculum
            </span>
            <span className="text-[#A1A7B3] text-xs flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" /> SDE Prep Roadmap
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#F5F7FA] tracking-tight">
            Placement Preparation Hub
          </h1>
          <p className="text-[#A1A7B3] text-xs md:text-sm mt-1">
            Master Data Structures & Algorithms, practice company-wise questions, test core CS subjects, or launch AI mock interviews.
          </p>
        </div>

        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 bg-[#2F80ED] hover:bg-[#3B9CFF] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Swords className="w-4 h-4 text-[#06B6D4]" />
          <span>Enter Battle Arena</span>
        </Link>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-8 p-1.5 rounded-xl bg-[#101216] border border-[#1E2229] max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("sheets")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "sheets"
              ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
              : "text-[#A1A7B3] hover:text-[#F5F7FA] hover:bg-[#14161B]"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>DSA Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "companies"
              ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
              : "text-[#A1A7B3] hover:text-[#F5F7FA] hover:bg-[#14161B]"
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company-Wise (470+)</span>
        </button>

        <button
          onClick={() => setActiveTab("interviews")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "interviews"
              ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
              : "text-[#A1A7B3] hover:text-[#F5F7FA] hover:bg-[#14161B]"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>AI Interviews</span>
        </button>

        <button
          onClick={() => setActiveTab("core_cs")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0",
            activeTab === "core_cs"
              ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
              : "text-[#A1A7B3] hover:text-[#F5F7FA] hover:bg-[#14161B]"
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
              <Search className="w-4 h-4 text-[#707784] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topic or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#14161B] border border-[#272B33] focus:border-[#2F80ED] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F5F7FA] placeholder-[#707784] outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    selectedDifficulty === diff
                      ? "bg-[#191C22] text-[#F5F7FA] border border-[#272B33]"
                      : "text-[#A1A7B3] hover:text-[#F5F7FA] bg-[#14161B] border border-[#1E2229]"
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
                  className="rounded-xl border border-[#272B33] bg-[#14161B] overflow-hidden shadow-sm"
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#191C22] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2F80ED]/10 border border-[#2F80ED]/25 flex items-center justify-center font-bold text-xs text-[#3B9CFF]">
                        0{step.id}
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
                          {step.title}
                        </h2>
                        <p className="text-[11px] text-[#A1A7B3] mt-0.5">{step.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#707784]">
                        {step.problems.length} problems
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#A1A7B3]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#A1A7B3]" />
                      )}
                    </div>
                  </div>

                  {/* Problems Table */}
                  {isExpanded && (
                    <div className="border-t border-[#1E2229] divide-y divide-[#1E2229]">
                      {filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-[#191C22] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <Circle className="w-3.5 h-3.5 text-[#707784] hover:text-[#22C55E] cursor-pointer transition-colors" />
                            <div>
                              <p className="font-medium text-[#F5F7FA]">{problem.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {problem.companies.map((company, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-[#101216] text-[#A1A7B3] text-[10px] font-mono border border-[#1E2229]"
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
                                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                                problem.difficulty === "EASY"
                                  ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25"
                                  : problem.difficulty === "MEDIUM"
                                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25"
                                  : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25"
                              )}
                            >
                              {problem.difficulty}
                            </span>

                            <Link
                              to={`/coding/${problem.slug}`}
                              className="px-3 py-1 rounded-md bg-[#2F80ED]/10 hover:bg-[#2F80ED]/20 text-[#3B9CFF] border border-[#2F80ED]/30 font-medium transition-colors text-xs flex items-center gap-1"
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
          <div className="p-4 rounded-xl bg-[#14161B] border border-[#272B33]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A1A7B3] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#2F80ED]" />
                Select Target Company
              </span>
              <span className="text-xs text-[#707784] font-mono">
                Powered by 470+ Companies Dataset
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(featuredCompaniesData?.companies || []).map((comp) => (
                <button
                  key={comp.slug}
                  onClick={() => setSelectedCompany(comp.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer",
                    selectedCompany === comp.name
                      ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
                      : "bg-[#101216] text-[#A1A7B3] hover:text-[#F5F7FA] hover:bg-[#191C22] border border-[#1E2229]"
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
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#101216] border border-[#1E2229] text-xs self-start sm:self-auto">
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
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    selectedTimeframe === tf.id
                      ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
                      : "text-[#A1A7B3] hover:text-[#F5F7FA]"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Search within company */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#707784] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${selectedCompany} questions...`}
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                className="w-full bg-[#14161B] border border-[#272B33] focus:border-[#2F80ED] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F5F7FA] placeholder-[#707784] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Company Problem List */}
          <div className="rounded-xl border border-[#272B33] bg-[#14161B] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#1E2229] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#F5F7FA] tracking-tight">
                  {selectedCompany} Interview Questions
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25 text-[10px] font-semibold font-mono">
                  {companyQuestionsData?.totalCount || 0} questions
                </span>
              </div>
              <span className="text-[11px] text-[#707784] font-mono">
                Ranked by interview frequency
              </span>
            </div>

            {isCompanyLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[#2F80ED] border-t-transparent animate-spin" />
                <p className="text-xs text-[#A1A7B3] font-mono">Loading {selectedCompany} questions...</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E2229]">
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
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#191C22] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#F5F7FA] text-xs sm:text-sm">
                            {q.title}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                              q.difficulty === "EASY"
                                ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25"
                                : q.difficulty === "MEDIUM"
                                ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25"
                                : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25"
                            )}
                          >
                            {q.difficulty}
                          </span>
                          {q.isNative && (
                            <span className="px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/25 text-[10px] font-semibold">
                              ⚡ Native Runner
                            </span>
                          )}
                        </div>

                        {/* Topics */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {q.topics.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-[#101216] text-[#A1A7B3] text-[10px] font-mono border border-[#1E2229]"
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
                            <span className="text-[10px] text-[#707784] font-mono block">Ask Rate</span>
                            <span className="text-xs font-bold text-[#F59E0B] font-mono">
                              {q.frequency}%
                            </span>
                          </div>
                        )}

                        {q.isNative ? (
                          <Link
                            to={`/coding/${q.slug}`}
                            className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                            q.isNative
                              ? "bg-[#101216] hover:bg-[#191C22] text-[#A1A7B3] hover:text-[#F5F7FA] border border-[#1E2229]"
                              : "bg-[#2F80ED] hover:bg-[#3B9CFF] text-white font-semibold shadow-sm"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mode Selector Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-semibold text-[#A1A7B3] uppercase tracking-wider mb-2">
              Select Interview Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INTERVIEW_MODES.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => setInterviewMode(mode.id)}
                  className={cn(
                    "p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
                    interviewMode === mode.id
                      ? "bg-[#191C22] border-[#2F80ED] shadow-sm"
                      : "bg-[#14161B] border-[#272B33] hover:border-[#3B9CFF]/50"
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        interviewMode === mode.id
                          ? "bg-[#2F80ED] text-white"
                          : "bg-[#101216] text-[#A1A7B3] border border-[#1E2229]"
                      )}
                    >
                      <mode.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-[#F5F7FA] text-sm mb-1">{mode.label}</h3>
                    <p className="text-[#A1A7B3] text-xs leading-relaxed">{mode.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1E2229] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#22C55E] font-semibold">READY</span>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        interviewMode === mode.id ? "bg-[#2F80ED]" : "bg-[#272B33]"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Evaluation Rubric Card */}
            <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] mt-6">
              <h3 className="text-sm font-semibold text-[#F5F7FA] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                Multi-Dimensional AI Evaluation Engine
              </h3>
              <p className="text-[#A1A7B3] text-xs leading-relaxed mb-4">
                After each interview session, our AI evaluation engine scores your performance across 4 core dimensions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <p className="text-xs font-semibold text-[#F5F7FA]">Technical Accuracy</p>
                  <p className="text-[10px] text-[#A1A7B3] mt-1">Core CS correctness</p>
                </div>
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <p className="text-xs font-semibold text-[#F5F7FA]">Communication</p>
                  <p className="text-[10px] text-[#A1A7B3] mt-1">Clarity & structure</p>
                </div>
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <p className="text-xs font-semibold text-[#F5F7FA]">Problem Solving</p>
                  <p className="text-[10px] text-[#A1A7B3] mt-1">Trade-off analysis</p>
                </div>
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <p className="text-xs font-semibold text-[#F5F7FA]">Edge Cases</p>
                  <p className="text-[10px] text-[#A1A7B3] mt-1">Robust thinking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Launcher Sidebar */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-xs font-semibold text-[#A1A7B3] uppercase tracking-wider">
                Session Configuration
              </h2>

              <div>
                <label className="text-xs font-medium text-[#A1A7B3] block mb-1.5">
                  Target Engineering Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#101216] border border-[#272B33] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#2F80ED] cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#14161B]">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A7B3] block mb-1.5">
                  Seniority / Experience Level
                </label>
                <div className="space-y-1.5">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setLevel(lvl.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                        level === lvl.id
                          ? "bg-[#2F80ED]/10 text-[#3B9CFF] border-[#2F80ED]/30"
                          : "bg-[#101216] text-[#A1A7B3] border-[#1E2229] hover:text-[#F5F7FA]"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#1E2229]">
              <button
                onClick={startInterview}
                className="w-full py-2.5 rounded-lg bg-[#2F80ED] hover:bg-[#3B9CFF] text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
              className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] hover:border-[#3B9CFF]/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2F80ED]/10 border border-[#2F80ED]/25 flex items-center justify-center text-[#3B9CFF]">
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#F5F7FA] mb-2">{mod.title}</h3>
                <p className="text-[#A1A7B3] text-xs leading-relaxed mb-4">{mod.desc}</p>
              </div>

              <div className="pt-4 border-t border-[#1E2229] flex items-center justify-between">
                <span className="text-xs font-mono text-[#707784]">{mod.questions} MCQs & Concepts</span>
                <Link
                  to="/rooms"
                  className="text-xs font-medium text-[#2F80ED] hover:text-[#3B9CFF] flex items-center gap-1"
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