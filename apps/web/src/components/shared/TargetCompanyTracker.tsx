import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Check,
  Search,
  X,
  Target,
  Sparkles,
  Flame,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useCompanyReadiness,
  useSetTargetCompany,
  useClearTargetCompanies,
  type TargetProblem,
} from "@/hooks/useReadiness";
import { getCompanyLogo } from "@/lib/companyLogos";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function TargetCompanyTracker() {
  const { data, isLoading } = useCompanyReadiness();
  const setTargetCompany = useSetTargetCompany();
  const clearTargetCompanies = useClearTargetCompanies();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Daily target problem goal: user selects 1, 2, 3, or 5 problems/day
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("intervue_daily_company_goal");
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });

  const handleSetGoal = (goal: number) => {
    setDailyGoal(goal);
    try {
      localStorage.setItem("intervue_daily_company_goal", String(goal));
    } catch {}
    toast.success(`Daily target set to ${goal} problem${goal > 1 ? "s" : ""} per day`);
  };

  // Local solved state for immediate reactivity
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSolved = async () => {
      try {
        const res = await api.get("/profile/solved-problems");
        setSolvedMap(res.data.solvedProblems || {});
      } catch {}
    };
    fetchSolved();
  }, []);

  const handleToggleSolved = async (slug: string, difficulty: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowSolved = !solvedMap[slug];
    setSolvedMap((prev) => ({ ...prev, [slug]: isNowSolved }));

    try {
      await api.post("/profile/sync-solved", {
        solvedKey: slug,
        isSolved: isNowSolved,
        difficulty,
      });
      if (isNowSolved) {
        toast.success("Problem marked as solved!");
      }
    } catch {
      toast.error("Failed to sync solved status");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedCompanies = data?.targetCompanies || (data?.targetCompany ? [data.targetCompany] : []);
  const hasTarget = Boolean(data?.hasTarget && selectedCompanies.length > 0);

  const handleToggleCompany = async (companyName: string) => {
    const exists = selectedCompanies.some(
      (c) => c.toLowerCase() === companyName.toLowerCase()
    );
    let updated: string[];

    if (exists) {
      updated = selectedCompanies.filter(
        (c) => c.toLowerCase() !== companyName.toLowerCase()
      );
    } else {
      updated = [...selectedCompanies, companyName];
    }

    try {
      if (updated.length === 0) {
        await clearTargetCompanies.mutateAsync();
        toast.info("Target company cleared");
      } else {
        await setTargetCompany.mutateAsync(updated);
        toast.success(
          exists
            ? `Removed ${companyName} from target companies`
            : `Added ${companyName} to target companies`
        );
      }
    } catch {
      toast.error("Failed to update target companies");
    }
  };

  const handleRemoveCompany = async (companyName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedCompanies.filter(
      (c) => c.toLowerCase() !== companyName.toLowerCase()
    );
    try {
      if (updated.length === 0) {
        await clearTargetCompanies.mutateAsync();
        toast.info("All target companies removed");
      } else {
        await setTargetCompany.mutateAsync(updated);
        toast.info(`Removed ${companyName}`);
      }
    } catch {
      toast.error("Failed to remove target company");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearTargetCompanies.mutateAsync();
      setIsDropdownOpen(false);
      toast.info("Cleared all target companies");
    } catch {
      toast.error("Failed to clear target companies");
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-[#0D0F14] border border-zinc-800/70 animate-pulse space-y-3">
        <div className="h-5 bg-zinc-800/60 rounded w-1/4" />
        <div className="h-24 bg-zinc-800/40 rounded-xl" />
      </div>
    );
  }

  const percentage = data?.readinessPercentage || 0;
  const solved = data?.solvedCount || 0;
  const total = data?.totalCount || 0;
  const breakdown = data?.breakdown || {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };

  const dailyProblems = (data?.dailyProblems || []).slice(0, dailyGoal);
  const dailySolvedCount = dailyProblems.filter((p) => solvedMap[p.slug] || p.isSolved).length;
  const isDailyComplete = dailyProblems.length > 0 && dailySolvedCount === dailyProblems.length;

  const filteredAvailable = (data?.availableCompanies || []).filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-[#0C0E14] border border-zinc-800/80 shadow-xl space-y-6">
      {/* ─── Header: Target Selection & Management ───────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
              Interview Target Tracker
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Target Company Readiness</span>
            {hasTarget && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono shrink-0">
                {selectedCompanies.length} Active {selectedCompanies.length === 1 ? "Target" : "Targets"}
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {hasTarget
              ? "Daily problem challenges and interview loop coverage for your target companies"
              : "Select one or more companies you are interviewing with to activate daily loop challenges"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {hasTarget && (
            <Link
              to={`/practice?view=company_kits`}
              className="flex-1 md:flex-initial justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="Open Company Prep Kits"
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Prep Kits ↗</span>
            </Link>
          )}

          {/* Add / Modify Targets Dropdown */}
          <div className="relative flex-1 md:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full md:w-auto justify-center flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12151D] border border-zinc-700/80 hover:border-zinc-600 text-xs text-zinc-200 transition-all cursor-pointer font-medium shadow-sm whitespace-nowrap"
            >
              <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{hasTarget ? "Manage Targets" : "Select Targets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#12151E] border border-zinc-700/90 shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-800">
                  <span className="text-xs font-semibold text-white">Target Companies</span>
                  {selectedCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search company (e.g. Google, Amazon)..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#090B10] border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pt-1">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-[11px] text-zinc-500 py-3 text-center">
                      No matching companies found
                    </div>
                  ) : (
                    filteredAvailable.map((comp) => {
                      const isSelected = selectedCompanies.some(
                        (c) => c.toLowerCase() === comp.name.toLowerCase()
                      );
                      const logo = getCompanyLogo(comp.name) || getCompanyLogo(comp.slug);
                      return (
                        <button
                          key={comp.slug}
                          type="button"
                          onClick={() => handleToggleCompany(comp.name)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-600/20 text-white border border-blue-500/40 font-medium"
                              : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            {logo ? (
                              <img
                                src={logo}
                                alt={comp.name}
                                className="w-4 h-4 object-contain shrink-0"
                              />
                            ) : (
                              <span className="w-4 text-center text-zinc-400 font-mono text-[10px] shrink-0">
                                {comp.icon || comp.name.slice(0, 1)}
                              </span>
                            )}
                            <span className="truncate">{comp.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Selected Companies Chip Rail ────────────────────────────── */}
      {hasTarget ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 font-mono">Targeting:</span>
          {selectedCompanies.map((c) => {
            const logo = getCompanyLogo(c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#141722] border border-[#222736] text-xs font-medium text-white shadow-sm group"
              >
                {logo ? (
                  <img src={logo} alt="" className="w-3.5 h-3.5 object-contain" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{c}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveCompany(c, e)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5 cursor-pointer"
                  title={`Remove ${c}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        /* Empty State Prompt: Quick-Select Presets */
        <div className="p-4 rounded-2xl bg-[#090B10] border border-[#181C26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No Target Company Selected</p>
              <p className="text-[11px] text-zinc-400">
                Click a company below to start receiving daily targeted interview problems!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {["Google", "Amazon", "Meta", "Microsoft", "Apple"].map((name) => {
              const logo = getCompanyLogo(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleToggleCompany(name)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#141722] hover:bg-blue-600/15 border border-[#222736] hover:border-blue-500/40 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {logo && <img src={logo} alt="" className="w-3.5 h-3.5 object-contain" />}
                  <span>+ {name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Daily Target Problem Set (POTD-style) ────────────────────── */}
      {hasTarget && (
        <div className="space-y-3 p-4 md:p-5 rounded-2xl bg-[#08090E] border border-[#1A1E2C] shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFA116]/10 border border-[#FFA116]/30 flex items-center justify-center text-[#FFA116]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Today's Target Company Challenges
                  </h4>
                  {isDailyComplete ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Complete!</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0">
                      {dailySolvedCount} of {dailyProblems.length} solved
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Curated daily technical questions matching your selected target companies
                </p>
              </div>
            </div>

            {/* Daily Goal Configurator */}
            <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
              <span className="text-zinc-500 font-mono text-[11px]">Daily Goal:</span>
              <div className="flex items-center p-0.5 rounded-xl bg-[#12151E] border border-zinc-800 text-[11px] font-mono">
                {[1, 2, 3, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetGoal(count)}
                    className={`px-2 py-0.5 rounded-lg transition-all font-semibold cursor-pointer ${
                      dailyGoal === count
                        ? "bg-[#FFA116]/20 text-[#FFA116] border border-[#FFA116]/40 shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <span className="text-zinc-500 font-mono text-[11px]">/ day</span>
            </div>
          </div>

          {/* Daily Problem List */}
          <div className="space-y-2 pt-1">
            {dailyProblems.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-[#0D0F16] border border-zinc-800 text-xs text-zinc-400">
                No active problems found. Try selecting another target company.
              </div>
            ) : (
              dailyProblems.map((p) => {
                const isSolved = Boolean(solvedMap[p.slug] || p.isSolved);
                const leetcodeUrl = p.link || `https://leetcode.com/problems/${p.slug}`;
                return (
                  <div
                    key={p.slug}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 sm:gap-3 ${
                      isSolved
                        ? "bg-emerald-500/[0.03] border-emerald-500/25"
                        : "bg-[#0E1118] border-[#1E2333] hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Solved Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSolved(p.slug, p.difficulty, e)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isSolved
                            ? "bg-emerald-500 border-emerald-500 text-black shadow-sm"
                            : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
                        }`}
                        title={isSolved ? "Mark unsolved" : "Mark as solved"}
                      >
                        {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                          {/* Difficulty pill */}
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                              p.difficulty === "EASY"
                                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                : p.difficulty === "MEDIUM"
                                ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                            }`}
                          >
                            {p.difficulty}
                          </span>

                          {/* Selected Target Company Badges (Displays all companies that ask this problem!) */}
                          {(p.matchingTargetCompanies || []).map((compName) => {
                            const logo = getCompanyLogo(compName);
                            return (
                              <span
                                key={compName}
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#161A26] border border-[#262B3E] text-[10px] font-mono text-zinc-300"
                              >
                                {logo && (
                                  <img
                                    src={logo}
                                    alt=""
                                    className="w-3 h-3 object-contain shrink-0"
                                  />
                                )}
                                <span>{compName}</span>
                              </span>
                            );
                          })}
                        </div>

                        {/* Title link */}
                        <a
                          href={leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-semibold text-white hover:text-[#FFA116] transition-colors truncate block"
                        >
                          {p.title}
                        </a>
                      </div>
                    </div>

                    {/* Solve CTA */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFA116]/10 hover:bg-[#FFA116]/20 border border-[#FFA116]/30 hover:border-[#FFA116]/50 text-[#FFA116] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm group/lc cursor-pointer"
                        title="Solve on LeetCode"
                      >
                        <img
                          src="/leetcode.svg"
                          alt="LeetCode"
                          className="w-3.5 h-3.5 object-contain group-hover/lc:scale-110 transition-transform"
                        />
                        <span>Solve</span>
                        <ArrowRight className="w-3 h-3 group-hover/lc:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Overall Target Coverage & Breakdown ─────────────────────── */}
      {hasTarget && (
        <div className="space-y-3 pt-1 border-t border-zinc-800/70">
          <div className="flex items-end justify-between text-xs">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {percentage}%
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {percentage >= 70
                    ? "Loop Ready"
                    : percentage >= 40
                    ? "On Track"
                    : "Building Foundations"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                {solved} of {total} total tracked questions completed
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Difficulty breakdown pills */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#090B10] border border-[#181A20] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Easy
              </span>
              <span className="text-zinc-300 text-[11px]">
                {breakdown.easy.solved} / {breakdown.easy.total}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#090B10] border border-[#181A20] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Med
              </span>
              <span className="text-zinc-300 text-[11px]">
                {breakdown.medium.solved} / {breakdown.medium.total}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#090B10] border border-[#181A20] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Hard
              </span>
              <span className="text-zinc-300 text-[11px]">
                {breakdown.hard.solved} / {breakdown.hard.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
