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
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] animate-pulse space-y-3">
        <div className="h-5 bg-[var(--surface-muted)] rounded w-1/4" />
        <div className="h-24 bg-[var(--surface-muted)] rounded-xl" />
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
    <div className="space-y-6">
      {/* ─── Header: Target Selection & Management ───────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--action-primary)]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-text)] font-semibold">
              Interview Target Tracker
            </span>
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2 flex-wrap">
            <span>Target Company Coverage</span>
            {hasTarget && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)] font-mono shrink-0">
                {selectedCompanies.length} Active {selectedCompanies.length === 1 ? "Target" : "Targets"}
              </span>
            )}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {hasTarget
              ? "Daily problem challenges and preparation coverage for your target companies"
              : "Select one or more companies you are interviewing with to activate daily practice challenges"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {hasTarget && (
            <Link
              to={`/practice?view=company_kits`}
              className="flex-1 md:flex-initial justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-selected)] hover:opacity-90 text-[var(--accent-text)] border border-[var(--border-subtle)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
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
              className="w-full md:w-auto justify-center flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs text-[var(--text-primary)] transition-all cursor-pointer font-medium whitespace-nowrap"
            >
              <Target className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
              <span>{hasTarget ? "Manage Targets" : "Select Targets"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-[var(--border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Target Companies</span>
                  {selectedCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] text-[var(--status-danger)] hover:opacity-80 font-mono transition-opacity flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search company (e.g. Google, Amazon)..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)] font-sans"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pt-1">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-[11px] text-[var(--text-muted)] py-3 text-center">
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
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)] font-medium"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
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
                              <span className="w-4 text-center text-[var(--text-muted)] font-mono text-[10px] shrink-0">
                                {comp.icon || comp.name.slice(0, 1)}
                              </span>
                            )}
                            <span className="truncate">{comp.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0 ml-1" />}
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
          <span className="text-xs text-[var(--text-secondary)] font-mono">Targeting:</span>
          {selectedCompanies.map((c) => {
            const logo = getCompanyLogo(c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] group"
              >
                {logo ? (
                  <img src={logo} alt="" className="w-3.5 h-3.5 object-contain" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
                <span>{c}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveCompany(c, e)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-subtle)] transition-colors ml-0.5 cursor-pointer"
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
        <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">No Target Company Selected</p>
              <p className="text-[11px] text-[var(--text-secondary)]">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-selected)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs font-medium text-[var(--text-primary)] transition-all cursor-pointer"
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
        <div className="space-y-3 p-4 md:p-5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--status-warning-subtle)] border border-[var(--status-warning)]/30 flex items-center justify-center text-[var(--status-warning)]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                    Today's Target Company Challenges
                  </h4>
                  {isDailyComplete ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success)]/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Complete!</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)] shrink-0">
                      {dailySolvedCount} of {dailyProblems.length} solved
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Curated daily technical questions matching your selected target companies
                </p>
              </div>
            </div>

            {/* Daily Goal Configurator */}
            <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
              <span className="text-[var(--text-muted)] font-mono text-[11px]">Daily Goal:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-[11px] font-mono">
                {[1, 2, 3, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetGoal(count)}
                    className={`px-2 py-0.5 rounded-md transition-all font-semibold cursor-pointer ${
                      dailyGoal === count
                        ? "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border border-[var(--status-warning)]/40"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <span className="text-[var(--text-muted)] font-mono text-[11px]">/ day</span>
            </div>
          </div>

          {/* Daily Problem List */}
          <div className="space-y-2 pt-1">
            {dailyProblems.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
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
                        ? "bg-[var(--status-success-subtle)]/40 border-[var(--status-success)]/30"
                        : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-control)]"
                    }`}
                  >
                    <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Solved Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSolved(p.slug, p.difficulty, e)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isSolved
                            ? "bg-[var(--status-success)] border-[var(--status-success)] text-[var(--on-primary)]"
                            : "border-[var(--border-control)] bg-[var(--surface-muted)] hover:border-[var(--action-primary)]"
                        }`}
                        title={isSolved ? "Mark unsolved" : "Mark as solved"}
                      >
                        {isSolved && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                          {/* Difficulty pill */}
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                              p.difficulty === "EASY"
                                ? "text-[var(--status-success)] border-[var(--status-success)]/30 bg-[var(--status-success-subtle)]"
                                : p.difficulty === "MEDIUM"
                                ? "text-[var(--status-warning)] border-[var(--status-warning)]/30 bg-[var(--status-warning-subtle)]"
                                : "text-[var(--status-danger)] border-[var(--status-danger)]/30 bg-[var(--status-danger-subtle)]"
                            }`}
                          >
                            {p.difficulty}
                          </span>

                          {/* Selected Target Company Badges */}
                          {(p.matchingTargetCompanies || []).map((compName) => {
                            const logo = getCompanyLogo(compName);
                            return (
                              <span
                                key={compName}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]"
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
                          className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors truncate block"
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
                        className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--status-warning-subtle)] hover:opacity-90 border border-[var(--status-warning)]/30 text-[var(--status-warning)] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all group/lc cursor-pointer"
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
        <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-end justify-between text-xs">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                  {percentage}%
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  {percentage >= 70
                    ? "Loop Ready"
                    : percentage >= 40
                    ? "On Track"
                    : "Building Foundations"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 tabular-nums">
                {solved} of {total} total tracked questions completed
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-[var(--action-primary)] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Difficulty breakdown pills */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--status-success)] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                Easy
              </span>
              <span className="text-[var(--text-primary)] text-[11px]">
                {breakdown.easy.solved} / {breakdown.easy.total}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--status-warning)] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)]" />
                Med
              </span>
              <span className="text-[var(--text-primary)] text-[11px]">
                {breakdown.medium.solved} / {breakdown.medium.total}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--status-danger)] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-danger)]" />
                Hard
              </span>
              <span className="text-[var(--text-primary)] text-[11px]">
                {breakdown.hard.solved} / {breakdown.hard.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
