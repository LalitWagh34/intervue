import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProblems } from "@/hooks/useProblems";
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
      { id: "p2", title: "Count Digits & Reverse a Number", slug: "two-sum", difficulty: "EASY", companies: ["TCS", "Infosys"] },
      { id: "p3", title: "Check for Prime Number", slug: "two-sum", difficulty: "EASY", companies: ["Wipro", "Cognizant"] },
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
      { id: "p8", title: "Largest & Second Largest Element in Array", slug: "two-sum", difficulty: "EASY", companies: ["Amazon"] },
      { id: "p9", title: "Rotate Array by K Elements", slug: "two-sum", difficulty: "MEDIUM", companies: ["Microsoft", "Uber"] },
      { id: "p10", title: "Maximum Subarray Sum (Kadane's Algorithm)", slug: "two-sum", difficulty: "MEDIUM", companies: ["Google", "Amazon", "Apple"] },
      { id: "p11", title: "Majority Element (> n/2 times)", slug: "two-sum", difficulty: "MEDIUM", companies: ["Meta", "Adobe"] },
      { id: "p12", title: "Next Permutation", slug: "two-sum", difficulty: "HARD", companies: ["Google", "Uber", "Goldman Sachs"] },
      { id: "p13", title: "Trapping Rain Water", slug: "two-sum", difficulty: "HARD", companies: ["Amazon", "Google", "Bloomberg"] },
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
      { id: "p18", title: "Valid Anagram & Palindrome Check", slug: "two-sum", difficulty: "EASY", companies: ["Uber"] },
      { id: "p19", title: "Longest Substring Without Repeating Characters", slug: "two-sum", difficulty: "MEDIUM", companies: ["Amazon", "Google"] },
      { id: "p20", title: "Longest Common Subsequence (LCS)", slug: "two-sum", difficulty: "HARD", companies: ["Microsoft", "Amazon"] },
      { id: "p21", title: "0/1 Knapsack & Subset Sum", slug: "two-sum", difficulty: "HARD", companies: ["Morgan Stanley"] },
    ],
  },
];

const CORE_CS_MODULES = [
  {
    title: "Operating Systems (OS)",
    icon: Cpu,
    desc: "Processes, Threads, CPU Scheduling, Deadlocks, Virtual Memory & Paging",
    questions: 45,
    badge: "High Priority",
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

  const [activeTab, setActiveTab] = useState<"sheets" | "interviews" | "core_cs">("sheets");
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 3: true });
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
              TakeUForward Curriculum
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> SDE Prep Roadmap
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Placement Preparation Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Master Data Structures & Algorithms, test core CS subjects, or launch AI mock interviews.
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
      <div className="flex items-center gap-2 mb-8 p-1.5 rounded-2xl bg-[#0c0d14] border border-white/[0.08] max-w-lg">
        <button
          onClick={() => setActiveTab("sheets")}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeTab === "sheets"
              ? "bg-[#327cf6] text-white shadow-[0_0_15px_rgba(50,124,246,0.35)]"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>DSA Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab("interviews")}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
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
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
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
                  className="rounded-2xl bg-[#0a0b10] border border-white/[0.08] overflow-hidden transition-all shadow-sm"
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-[#38bdf8] font-mono">
                        0{step.id}
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {step.title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono font-medium hidden sm:inline">
                        {filteredProblems.length} Problems
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Problem Table Rows */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] divide-y divide-white/[0.04] bg-[#07080c]/60">
                      {filteredProblems.map((prob) => (
                        <div
                          key={prob.id}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Circle className="w-4 h-4 text-slate-600 shrink-0 hover:text-emerald-400 transition-colors cursor-pointer" />
                            <Link
                              to={`/coding/${prob.slug}`}
                              className="text-xs font-semibold text-slate-200 hover:text-[#38bdf8] truncate transition-colors"
                            >
                              {prob.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {/* Companies */}
                            <div className="hidden md:flex items-center gap-1">
                              {prob.companies.slice(0, 2).map((comp) => (
                                <span
                                  key={comp}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                                >
                                  {comp}
                                </span>
                              ))}
                              {prob.companies.length > 2 && (
                                <span className="text-[10px] text-slate-500">
                                  +{prob.companies.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Difficulty */}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                prob.difficulty === "EASY" &&
                                  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                                prob.difficulty === "MEDIUM" &&
                                  "bg-amber-500/15 text-amber-400 border-amber-500/30",
                                prob.difficulty === "HARD" &&
                                  "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              )}
                            >
                              {prob.difficulty}
                            </span>

                            {/* Solve Action Button */}
                            <Link
                              to={`/coding/${prob.slug}`}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-[#327cf6] hover:bg-[#2563eb] text-white shadow-sm transition-all"
                            >
                              Solve
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

      {/* ─── TAB 2: AI MOCK INTERVIEWS ──────────────────────────────── */}
      {activeTab === "interviews" && (
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Mode */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              1. Select Interview Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INTERVIEW_MODES.map((m) => {
                const isSelected = interviewMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setInterviewMode(m.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#0e1017] border-[#327cf6] shadow-[0_0_20px_rgba(50,124,246,0.2)]"
                        : "bg-[#0a0b10] border-white/[0.08] hover:border-white/[0.18]"
                    )}
                  >
                    <m.icon
                      className={cn(
                        "w-5 h-5 mb-2.5",
                        isSelected ? "text-[#38bdf8]" : "text-slate-400"
                      )}
                    />
                    <h3 className="text-xs font-bold text-white mb-1">{m.label}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Target Role */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              2. Target Role
            </h2>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                    role === r
                      ? "bg-[#327cf6] text-white border-[#327cf6] shadow-sm"
                      : "bg-[#0a0b10] text-slate-300 border-white/[0.08] hover:border-white/[0.18]"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Experience Level */}
          <div className="mb-10">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              3. Experience Level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={cn(
                    "p-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer",
                    level === lvl.id
                      ? "bg-white/[0.12] text-white border-white/[0.25]"
                      : "bg-[#0a0b10] text-slate-400 border-white/[0.08] hover:text-slate-200"
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={startInterview}
            className="w-full py-3.5 rounded-2xl bg-[#327cf6] hover:bg-[#2563eb] text-white font-bold text-sm shadow-[0_0_30px_rgba(50,124,246,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Launch AI Mock Interview Session</span>
          </button>
        </div>
      )}

      {/* ─── TAB 3: CORE CS SUBJECTS ─────────────────────────────────── */}
      {activeTab === "core_cs" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CORE_CS_MODULES.map((m, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] tuf-glass-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <m.icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
                    {m.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{m.desc}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">{m.questions} MCQs & Q&As</span>
                <Link
                  to="/rooms"
                  className="text-xs font-bold text-[#38bdf8] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Practice In Arena →</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}