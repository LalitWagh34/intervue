import { useState, useRef, useEffect } from "react";
import {
  Building2,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Check,
  Search,
} from "lucide-react";
import { useCompanyReadiness, useSetTargetCompany } from "@/hooks/useReadiness";
import { toast } from "sonner";

export function TargetCompanyTracker() {
  const { data, isLoading } = useCompanyReadiness();
  const setTargetCompany = useSetTargetCompany();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelectCompany = async (companyName: string) => {
    setIsDropdownOpen(false);
    setSearchFilter("");
    try {
      await setTargetCompany.mutateAsync(companyName);
      toast.success(`Target company set to ${companyName}`);
    } catch {
      toast.error("Failed to update target company");
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-xl bg-[#0D0F14] border border-zinc-800/70 animate-pulse space-y-3">
        <div className="h-4 bg-zinc-800/60 rounded w-1/4" />
        <div className="h-16 bg-zinc-800/40 rounded-lg" />
      </div>
    );
  }

  const currentCompany = data?.targetCompany || "Google";
  const percentage = data?.readinessPercentage || 0;
  const solved = data?.solvedCount || 0;
  const total = data?.totalCount || 0;
  const breakdown = data?.breakdown || {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };
  const nextQ = data?.nextRecommended;

  const filteredCompanies = (data?.availableCompanies || []).filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="p-5 md:p-6 rounded-xl bg-[#0C0E14] border border-zinc-800/80 shadow-sm space-y-5">
      {/* Header with Title and Refined Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Target Company Readiness
            </h3>
            <p className="text-xs text-zinc-400">
              Coverage for questions asked in technical interview loops
            </p>
          </div>
        </div>

        {/* Clean, Non-flashy Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12151D] border border-zinc-700/70 hover:border-zinc-600 text-xs text-zinc-200 transition-colors"
          >
            <span className="text-zinc-400">Company:</span>
            <span className="font-semibold text-white">{currentCompany}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#12151E] border border-zinc-700/80 shadow-2xl p-2 z-50 space-y-1.5">
              {/* Search input if multiple companies */}
              <div className="relative px-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search company..."
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#0B0D12] border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 font-sans"
                  autoFocus
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pt-1">
                {filteredCompanies.length === 0 ? (
                  <div className="text-[11px] text-zinc-500 py-3 text-center">
                    No matching companies
                  </div>
                ) : (
                  filteredCompanies.map((comp) => {
                    const isSelected =
                      comp.name.toLowerCase() === currentCompany.toLowerCase();
                    return (
                      <button
                        key={comp.slug}
                        type="button"
                        onClick={() => handleSelectCompany(comp.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-zinc-800/90 text-white font-medium"
                            : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 text-center text-zinc-400 font-mono text-[10px]">
                            {comp.icon}
                          </span>
                          <span>{comp.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-300" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Stats Row */}
      <div className="space-y-3">
        {/* Progress Bar & Header */}
        <div className="flex items-end justify-between text-xs">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {percentage}%
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {percentage >= 70
                  ? "Interview Ready"
                  : percentage >= 40
                  ? "On Track"
                  : "In Progress"}
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            <span className="text-zinc-200 font-semibold">{solved}</span> of {total} solved
          </div>
        </div>

        {/* Sleek Horizontal Progress Bar */}
        <div className="w-full h-2 bg-zinc-800/90 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Subtle Difficulty Coverage Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="px-3 py-2 rounded-lg bg-[#111319] border border-zinc-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Easy
            </span>
            <span className="text-zinc-300">
              {breakdown.easy.solved} / {breakdown.easy.total}
            </span>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[#111319] border border-zinc-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Medium
            </span>
            <span className="text-zinc-300">
              {breakdown.medium.solved} / {breakdown.medium.total}
            </span>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[#111319] border border-zinc-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Hard
            </span>
            <span className="text-zinc-300">
              {breakdown.hard.solved} / {breakdown.hard.total}
            </span>
          </div>
        </div>
      </div>

      {/* Next Recommended Problem */}
      {nextQ ? (
        <div className="p-3.5 rounded-lg bg-[#101217] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Next Recommendation
              </span>
              <span
                className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  nextQ.difficulty === "EASY"
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                    : nextQ.difficulty === "MEDIUM"
                    ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                    : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                }`}
              >
                {nextQ.difficulty}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-200 truncate">
              {nextQ.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://leetcode.com/problems/${nextQ.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            >
              <span>Solve Question</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>All tracked questions for {currentCompany} have been completed.</span>
        </div>
      )}
    </div>
  );
}
