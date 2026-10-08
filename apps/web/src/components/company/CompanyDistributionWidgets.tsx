import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface PatternSlice {
  topic: string;
  percentage: number;
  count: number;
  color: string;
}

interface PatternDonutProps {
  patterns: PatternSlice[];
  totalQuestions: number;
}

export function InterviewPatternDonut({ patterns, totalQuestions }: PatternDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Compute accumulated stroke dash offsets
  let accumulatedPercent = 0;
  const segments = patterns.map((p) => {
    const strokeDasharray = `${(p.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += p.percentage;
    return {
      ...p,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredIndex !== null ? patterns[hoveredIndex] : patterns[0];

  return (
    <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#181A20]/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Interview Pattern Distribution</h3>
          <p className="text-[11px] text-[#7A808C]">Core topic frequencies asked in technical loops</p>
        </div>

      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#141720"
              strokeWidth={strokeWidth}
            />

            {/* Segment slices */}
            {segments.map((seg, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <circle
                  key={seg.topic}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
            <span className="text-[10px] text-[#7A808C] uppercase font-mono tracking-wider truncate max-w-[90px]">
              {hoveredIndex !== null ? activeItem.topic : "Top Pattern"}
            </span>
            <span className="text-lg font-bold font-mono text-white mt-0.5">
              {activeItem.percentage}%
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {activeItem.count} questions
            </span>
          </div>
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 gap-2 w-full text-xs">
          {patterns.slice(0, 8).map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={p.topic}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isHovered
                    ? "bg-[#141824] border-blue-500/50 shadow-md"
                    : "bg-[#090B0F] border-[#181A20] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[11px] font-medium text-zinc-200 truncate">
                    {p.topic}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 shrink-0 ml-1">
                  {p.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DifficultyGaugeProps {
  total: number;
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
  companyName: string;
}

export function DifficultyDistributionGauge({
  total,
  easy,
  medium,
  hard,
  companyName,
}: DifficultyGaugeProps) {
  const totalSolved = easy.solved + medium.solved + hard.solved;
  const progressPercent = total > 0 ? Math.round((totalSolved / total) * 100) : 0;

  return (
    <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#181A20]/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Difficulty Wise Distribution</h3>
          <p className="text-[11px] text-[#7A808C]">Target problem volume & candidate readiness</p>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-400">
          {progressPercent}% Complete
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
        {/* Circular Gauge Center */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="transparent"
              stroke="#141720"
              strokeWidth="14"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="transparent"
              stroke="#3B82F6"
              strokeWidth="14"
              strokeDasharray={`${(progressPercent / 100) * 301.6} 301.6`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {total}
            </span>
            <span className="text-[10px] text-[#7A808C] uppercase font-mono tracking-wider mt-0.5">
              Problems
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-2.5 flex-1 w-full text-xs">
          {/* Easy */}
          <div className="p-2.5 rounded-xl bg-[#090B0F] border border-[#181A20]">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Easy
              </span>
              <span className="text-zinc-300 text-[11px]">
                <strong className="text-emerald-400">{easy.solved}</strong> / {easy.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${easy.total > 0 ? (easy.solved / easy.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-2.5 rounded-xl bg-[#090B0F] border border-[#181A20]">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Medium
              </span>
              <span className="text-zinc-300 text-[11px]">
                <strong className="text-amber-400">{medium.solved}</strong> / {medium.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${medium.total > 0 ? (medium.solved / medium.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="p-2.5 rounded-xl bg-[#090B0F] border border-[#181A20]">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Hard
              </span>
              <span className="text-zinc-300 text-[11px]">
                <strong className="text-rose-400">{hard.solved}</strong> / {hard.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${hard.total > 0 ? (hard.solved / hard.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
