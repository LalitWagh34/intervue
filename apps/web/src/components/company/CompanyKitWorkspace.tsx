import { useState, useMemo } from "react";
import {
  ChevronLeft,
  Building2,
  Search,
  CheckCircle2,
  ExternalLink,
  Flame,
  Bookmark,
  NotebookPen,
  Target,
  ArrowRight,
  Filter,
  RotateCcw,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { getCompanyKit } from "@/lib/companyKits";
import { getCompanyLogo } from "@/lib/companyLogos";
import { useCompanyQuestions } from "@/hooks/useCompanies";
import { useSetTargetCompany } from "@/hooks/useReadiness";
import { InterviewPatternDonut, DifficultyDistributionGauge } from "./CompanyDistributionWidgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyKitWorkspaceProps {
  companyName: string;
  onBack: () => void;
  activeTargetCompany?: string;
  targetCompanies?: string[];
  solvedProblems: Record<string, boolean>;
  onToggleSolved: (id: string, e: React.MouseEvent, difficulty?: string) => void;
  isBookmarked: (slug: string) => boolean;
  onToggleBookmark: (slug: string, title?: string, difficulty?: string) => void;
  onOpenNotes: (problem: { slug: string; title: string }) => void;
}

export function CompanyKitWorkspace({
  companyName,
  onBack,
  activeTargetCompany,
  targetCompanies = [],
  solvedProblems,
  onToggleSolved,
  isBookmarked,
  onToggleBookmark,
  onOpenNotes,
}: CompanyKitWorkspaceProps) {
  const kit = getCompanyKit(companyName);
  const logo = getCompanyLogo(companyName) || getCompanyLogo(kit.slug);

  const setTargetMutation = useSetTargetCompany();
  
  const currentTargets = useMemo(() => {
    if (targetCompanies && targetCompanies.length > 0) return targetCompanies;
    if (activeTargetCompany) return [activeTargetCompany];
    return [];
  }, [targetCompanies, activeTargetCompany]);

  const isCurrentTarget = currentTargets.some(
    (c) => c.toLowerCase() === companyName.toLowerCase()
  );

  // Timeframe tabs
  const [timeframe, setTimeframe] = useState<string>("all");
  const TIMEFRAMES = [
    { id: "all", label: "★ All Time Favourite" },
    { id: "thirtyDays", label: "🔥 45 Days (Hot)" },
    { id: "threeMonths", label: "3 Months" },
    { id: "sixMonths", label: "6 Months" },
  ];

  // Fetch real curated questions for this company and timeframe
  const { data: questionsData, isLoading } = useCompanyQuestions(companyName, timeframe);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");
  const [selectedPopularity, setSelectedPopularity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");
  const [scopeMode, setScopeMode] = useState<"TOP_200" | "ALL">("TOP_200");
  const HIGH_YIELD_CAP = 200;

  const rawQuestions = questionsData?.questions || [];

  // If questions are more than 200, cut short to top 200 high-yield questions by default
  const curatedQuestions = useMemo(() => {
    if (scopeMode === "ALL" || rawQuestions.length <= HIGH_YIELD_CAP) {
      return rawQuestions;
    }
    return rawQuestions.slice(0, HIGH_YIELD_CAP);
  }, [rawQuestions, scopeMode]);

  // Extract unique topics from the dataset
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    curatedQuestions.forEach((q) => {
      (q.topics || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [curatedQuestions]);

  // Compute solved counts per difficulty
  const counts = useMemo(() => {
    let easyTotal = 0;
    let easySolved = 0;
    let medTotal = 0;
    let medSolved = 0;
    let hardTotal = 0;
    let hardSolved = 0;

    curatedQuestions.forEach((q) => {
      const isSolved = Boolean(solvedProblems[q.slug] || (q.nativeId && solvedProblems[String(q.nativeId)]));
      if (q.difficulty === "EASY") {
        easyTotal++;
        if (isSolved) easySolved++;
      } else if (q.difficulty === "MEDIUM") {
        medTotal++;
        if (isSolved) medSolved++;
      } else if (q.difficulty === "HARD") {
        hardTotal++;
        if (isSolved) hardSolved++;
      }
    });

    return {
      easy: { total: easyTotal || kit.difficultySplit.easy, solved: easySolved },
      medium: { total: medTotal || kit.difficultySplit.medium, solved: medSolved },
      hard: { total: hardTotal || kit.difficultySplit.hard, solved: hardSolved },
    };
  }, [curatedQuestions, solvedProblems, kit]);

  // Filtered problem rows
  const filteredQuestions = useMemo(() => {
    return curatedQuestions.filter((q) => {
      const isSolved = Boolean(solvedProblems[q.slug] || (q.nativeId && solvedProblems[String(q.nativeId)]));

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesTopic = (q.topics || []).some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTopic) return false;
      }

      if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedTopic !== "ALL" && !(q.topics || []).includes(selectedTopic)) {
        return false;
      }

      if (selectedPopularity === "VERY_HOT" && q.frequency < 2.5) {
        return false;
      }
      if (selectedPopularity === "HOT" && (q.frequency < 1.0 || q.frequency >= 2.5)) {
        return false;
      }

      if (selectedStatus === "SOLVED" && !isSolved) return false;
      if (selectedStatus === "UNSOLVED" && isSolved) return false;

      return true;
    });
  }, [curatedQuestions, search, selectedDifficulty, selectedTopic, selectedPopularity, selectedStatus, solvedProblems]);

  const handleToggleTarget = async () => {
    try {
      if (isCurrentTarget) {
        const next = currentTargets.filter(
          (c) => c.toLowerCase() !== companyName.toLowerCase()
        );
        await setTargetMutation.mutateAsync(next.length > 0 ? next : null);
        toast.success(`Removed ${companyName} from target companies`);
      } else {
        const next = [...currentTargets, companyName];
        await setTargetMutation.mutateAsync(next);
        toast.success(`Added ${companyName} to your target companies!`);
      }
    } catch {
      toast.error("Failed to update target companies");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Breadcrumb Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#181A20]">
        <div className="flex items-center gap-2 text-xs text-[#7A808C]">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Company Kits</span>
          </button>
          <span>/</span>
          <span className="text-white font-semibold flex items-center gap-1.5">
            {logo && <img src={logo} alt="" className="w-3.5 h-3.5 object-contain" />}
            {companyName}
          </span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-zinc-700 text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer font-mono"
        >
          ← All Kits
        </button>
      </div>

      {/* ─── Company Header Banner ───────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#141720] border border-[#222634] p-2.5 flex items-center justify-center shrink-0 shadow-xl">
              {logo ? (
                <img src={logo} alt={companyName} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-7 h-7 text-zinc-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{companyName}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  Verified Interview Loop
                </span>
                <span className="text-[11px] text-[#7A808C] font-mono">
                  Updated 2 days ago
                </span>
              </div>
              <p className="text-xs text-[#8B92A0] mt-1 max-w-2xl leading-relaxed">
                {kit.description}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-[11px] font-mono text-zinc-400">
                <span className="text-blue-400 font-semibold">Format:</span>
                <span>{kit.interviewFormat}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="shrink-0 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleToggleTarget}
              disabled={setTargetMutation.isPending}
              title={isCurrentTarget ? "Click to remove from your target companies" : "Click to add to your target companies"}
              className={`h-9 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isCurrentTarget
                  ? "group bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
              }`}
            >
              {isCurrentTarget ? (
                <>
                  <span className="flex items-center gap-1.5 group-hover:hidden">
                    <Check className="w-3.5 h-3.5" />
                    In Target Companies
                  </span>
                  <span className="hidden items-center gap-1.5 group-hover:flex">
                    <X className="w-3.5 h-3.5" />
                    Remove Target
                  </span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Add as Target Company
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Timeframe Filter Pills ──────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D0E12] border border-[#181A20] w-fit">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              timeframe === tf.id
                ? "bg-[#181C26] text-white border border-blue-500/40 shadow-sm font-semibold"
                : "text-[#7A808C] hover:text-white"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* ─── Dual Intelligence Visual Widgets (Codolio Style) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InterviewPatternDonut
          patterns={kit.topPatterns}
          totalQuestions={kit.totalQuestions}
        />
        <DifficultyDistributionGauge
          total={curatedQuestions.length || kit.totalQuestions}
          easy={counts.easy}
          medium={counts.medium}
          hard={counts.hard}
          companyName={companyName}
        />
      </div>

      {/* ─── Curated Assessment Matrix Table ─────────────────────────── */}
      <div className="space-y-4 pt-2">
        {/* Scope Selector: Top 200 High-Yield (default) vs All Questions */}
        {rawQuestions.length > HIGH_YIELD_CAP && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-mono">Curated Scope:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#0D0E12] border border-[#181A20] text-xs">
                <button
                  type="button"
                  onClick={() => setScopeMode("TOP_200")}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    scopeMode === "TOP_200"
                      ? "bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30 font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ⭐ Top 200 High-Yield (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode("ALL")}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    scopeMode === "ALL"
                      ? "bg-zinc-800 text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All {rawQuestions.length} Questions
                </button>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Filtered by frequency & ask-rate popularity
            </span>
          </div>
        )}

        {/* Table Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0D0E12] border border-[#181A20]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#525866]" />
            <input
              type="text"
              placeholder={`Search ${companyName} questions or topics...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07080B] border border-[#181A20] text-xs text-white placeholder-[#525866] focus:border-blue-500/60 outline-none font-sans"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="h-8 rounded-lg bg-[#07080B] border border-[#181A20] text-xs text-zinc-300 px-2.5 outline-none font-mono"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            {/* Popularity Filter */}
            <select
              value={selectedPopularity}
              onChange={(e) => setSelectedPopularity(e.target.value)}
              className="h-8 rounded-lg bg-[#07080B] border border-[#181A20] text-xs text-zinc-300 px-2.5 outline-none font-mono"
            >
              <option value="ALL">All Ask Rates</option>
              <option value="VERY_HOT">🔥 Very Hot Only</option>
              <option value="HOT">⚡ Hot / Frequent</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="h-8 rounded-lg bg-[#07080B] border border-[#181A20] text-xs text-zinc-300 px-2.5 outline-none font-mono"
            >
              <option value="ALL">All Status</option>
              <option value="SOLVED">Solved</option>
              <option value="UNSOLVED">Unsolved</option>
            </select>

            {/* Topic Filter */}
            {availableTopics.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="h-8 rounded-lg bg-[#07080B] border border-[#181A20] text-xs text-zinc-300 px-2.5 outline-none font-mono max-w-[140px]"
              >
                <option value="ALL">All Topics</option>
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            {(search || selectedDifficulty !== "ALL" || selectedTopic !== "ALL" || selectedPopularity !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedDifficulty("ALL");
                  setSelectedTopic("ALL");
                  setSelectedPopularity("ALL");
                  setSelectedStatus("ALL");
                }}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-1"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Rows */}
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl bg-[#0D0E12] border border-[#181A20] text-xs text-zinc-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading {companyName} curated technical loop problems...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0D0E12] border border-[#181A20] text-xs text-zinc-400">
            No questions found matching your filter criteria.
          </div>
        ) : (
          <div className="rounded-2xl border border-[#181A20] overflow-hidden bg-[#0D0E12]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101217] border-b border-[#181A20] text-zinc-400 font-mono text-[11px]">
                <tr>
                  <th className="p-3.5 w-10 text-center">Status</th>
                  <th className="p-3.5">Problem Title</th>
                  <th className="p-3.5 w-16 text-center">Platform</th>
                  <th className="p-3.5 w-24">Difficulty</th>
                  <th className="p-3.5 w-28">Ask Rate</th>
                  <th className="p-3.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181A20]/70">
                {filteredQuestions.map((q) => {
                  const isSolved = Boolean(
                    solvedProblems[q.slug] || (q.nativeId && solvedProblems[String(q.nativeId)])
                  );
                  const isSaved = isBookmarked(q.slug);
                  const leetcodeUrl =
                    q.link || (q.slug ? `https://leetcode.com/problems/${q.slug}` : "#");

                  // Popularity tag based on frequency
                  const isVeryHot = q.frequency >= 2.5;
                  const isHot = q.frequency >= 1.0 && q.frequency < 2.5;

                  return (
                    <tr
                      key={q.slug}
                      className={`hover:bg-[#12151E]/60 transition-colors ${
                        isSolved ? "bg-[#10B981]/[0.02]" : ""
                      }`}
                    >
                      {/* Solved Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => onToggleSolved(q.slug, e, q.difficulty)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            isSolved
                              ? "bg-emerald-500 border-emerald-500 text-black"
                              : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
                          }`}
                        >
                          {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </button>
                      </td>

                      {/* Problem Title & Topics */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-white hover:text-[#FFA116] transition-colors flex items-center gap-1.5 group"
                          >
                            <span>{q.title}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500 opacity-60 group-hover:opacity-100 group-hover:text-[#FFA116] transition-all" />
                          </a>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(q.topics || []).slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-[#141722] text-[10px] font-mono text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Sleek LeetCode Icon Pill (No text, clickable, visually appealing) */}
                      <td className="p-3.5 text-center">
                        <a
                          href={leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#141620] hover:bg-[#FFA116]/15 border border-[#232736] hover:border-[#FFA116]/50 transition-all shadow-sm group/lc cursor-pointer"
                          title="Open problem on LeetCode"
                        >
                          <img
                            src="/leetcode.svg"
                            alt="LeetCode"
                            className="w-4 h-4 object-contain opacity-75 group-hover/lc:opacity-100 group-hover/lc:scale-115 transition-all"
                          />
                        </a>
                      </td>

                      {/* Difficulty */}
                      <td className="p-3.5 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            q.difficulty === "EASY"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : q.difficulty === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>

                      {/* Ask Rate / Popularity */}
                      <td className="p-3.5">
                        {isVeryHot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <Flame className="w-3 h-3" /> Very Hot
                          </span>
                        ) : isHot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            ⚡ Frequent
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Notes */}
                          <button
                            type="button"
                            onClick={() => onOpenNotes({ slug: q.slug, title: q.title })}
                            className="p-1.5 rounded-lg border border-[#181A20] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                            title="Notes & Hints"
                          >
                            <NotebookPen className="w-3.5 h-3.5" />
                          </button>

                          {/* Bookmark */}
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(q.slug, q.title, q.difficulty)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "border-[#181A20] text-zinc-400 hover:text-white hover:border-zinc-700"
                            }`}
                            title="Bookmark for Revision"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          {/* Solve CTA -> Opens LeetCode */}
                          <a
                            href={leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-[#FFA116]/10 hover:bg-[#FFA116]/20 border border-[#FFA116]/30 hover:border-[#FFA116]/50 text-[#FFA116] text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-[#FFA116]/5 group cursor-pointer"
                            title="Solve on LeetCode"
                          >
                            <span>Solve</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
