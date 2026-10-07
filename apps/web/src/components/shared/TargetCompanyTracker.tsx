import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Flame,
  Check,
} from "lucide-react";
import { useCompanyReadiness, useSetTargetCompany } from "@/hooks/useReadiness";
import { toast } from "sonner";

export function TargetCompanyTracker() {
  const { data, isLoading } = useCompanyReadiness();
  const setTargetCompany = useSetTargetCompany();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectCompany = async (companyName: string) => {
    setIsDropdownOpen(false);
    try {
      await setTargetCompany.mutateAsync(companyName);
      toast.success(`Target company updated to ${companyName}!`);
    } catch {
      toast.error("Failed to update target company");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-[#0D0F14] border border-zinc-800/80 animate-pulse space-y-4">
        <div className="h-6 bg-zinc-800/60 rounded-md w-1/3" />
        <div className="h-20 bg-zinc-800/40 rounded-xl" />
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

  return (
    <div className="p-6 rounded-2xl bg-[#0D0F14] border border-zinc-800/90 shadow-xl relative overflow-hidden space-y-5">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header with Company Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Target Company Readiness</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25 font-normal">
                Verified Bank
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Track question coverage against your target interview loop
            </p>
          </div>
        </div>

        {/* Company Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141720] border border-zinc-700/80 hover:border-zinc-600 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <span>Target:</span>
            <span className="text-blue-400 font-bold">{currentCompany}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#12151D] border border-zinc-700/90 shadow-2xl p-1.5 z-50 space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Select Dream Company
              </div>
              {data?.availableCompanies?.map((comp) => {
                const isSelected =
                  comp.name.toLowerCase() === currentCompany.toLowerCase();
                return (
                  <button
                    key={comp.slug}
                    type="button"
                    onClick={() => handleSelectCompany(comp.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-600/20 text-blue-300 font-semibold"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-[11px] text-zinc-400">
                        {comp.icon}
                      </span>
                      <span>{comp.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Readiness Gauge & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center relative z-10">
        {/* Left: Percentage Meter */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-base font-extrabold text-white leading-none">
                {percentage}%
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Readiness Index
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {percentage >= 70
                ? "Interview Ready 🚀"
                : percentage >= 40
                ? "On Track 🔥"
                : "Building Foundations 💡"}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              <strong className="text-white">{solved}</strong> of {total} solved
            </div>
          </div>
        </div>

        {/* Center: Difficulty Coverage Breakdown */}
        <div className="md:col-span-2 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#10131A] border border-zinc-800/80 text-center">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase font-mono block">
              Easy
            </span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {breakdown.easy.solved}{" "}
              <span className="text-xs text-zinc-500 font-normal">/ {breakdown.easy.total}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{
                  width: `${
                    breakdown.easy.total > 0
                      ? (breakdown.easy.solved / breakdown.easy.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#10131A] border border-zinc-800/80 text-center">
            <span className="text-[10px] font-semibold text-amber-400 uppercase font-mono block">
              Medium
            </span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {breakdown.medium.solved}{" "}
              <span className="text-xs text-zinc-500 font-normal">/ {breakdown.medium.total}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${
                    breakdown.medium.total > 0
                      ? (breakdown.medium.solved / breakdown.medium.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#10131A] border border-zinc-800/80 text-center">
            <span className="text-[10px] font-semibold text-rose-400 uppercase font-mono block">
              Hard
            </span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {breakdown.hard.solved}{" "}
              <span className="text-xs text-zinc-500 font-normal">/ {breakdown.hard.total}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{
                  width: `${
                    breakdown.hard.total > 0
                      ? (breakdown.hard.solved / breakdown.hard.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Next Recommended Problem Callout */}
      {nextQ ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/20 via-[#10131A] to-[#10131A] border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                  Recommended Next For {currentCompany}
                </span>
                <span
                  className={`text-[9px] font-semibold font-mono px-1.5 py-0.2 rounded border ${
                    nextQ.difficulty === "EASY"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : nextQ.difficulty === "MEDIUM"
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                  }`}
                >
                  {nextQ.difficulty}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 tracking-tight">
                {nextQ.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://leetcode.com/problems/${nextQ.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)] shrink-0"
            >
              <span>Solve Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>All tracked questions for {currentCompany} are solved! Outstanding achievement!</span>
        </div>
      )}
    </div>
  );
}
