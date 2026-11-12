import { useState } from "react";

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
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const gapPx = 3; // Crisp precision gap between slices

  // Compute accumulated stroke dash offsets with precise gap separation
  let accumulatedPercent = 0;
  const segments = patterns.map((p) => {
    const rawLen = (p.percentage / 100) * circumference;
    const dashLength = Math.max(1, rawLen - gapPx);
    const strokeDasharray = `${dashLength} ${circumference}`;
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
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between h-full shadow-sm relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: activeItem?.color || "#3B82F6" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)] relative z-10">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>Interview Pattern Distribution</span>
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Topic frequency breakdown asked in target interview loops
          </p>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
          {patterns.length} Patterns
        </span>
      </div>

      {/* Interactive Donut & Legend Container */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 relative z-10">
        {/* SVG Donut Centerpiece */}
        <div className="relative w-48 h-48 shrink-0 flex items-center justify-center group">
          <svg className="w-full h-full -rotate-90 filter drop-shadow-sm" viewBox="0 0 160 160">
            {/* Background circular track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="var(--surface-muted)"
              strokeWidth={strokeWidth}
            />

            {/* Precision segment slices without overlapping blobs */}
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
                  strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 8px ${seg.color})`
                      : "none",
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.65,
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Central Callout Plate */}
          <div className="absolute inset-[24px] rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-md flex flex-col items-center justify-center text-center p-2.5 pointer-events-none transition-all">
            <div className="flex items-center gap-1.5 mb-0.5 max-w-[105px] truncate">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                style={{
                  backgroundColor: activeItem.color,
                  boxShadow: `0 0 6px ${activeItem.color}`,
                }}
              />
              <span className="text-[10px] uppercase font-mono tracking-wider truncate text-[var(--text-secondary)]">
                {hoveredIndex !== null ? activeItem.topic : "Top Pattern"}
              </span>
            </div>
            <span
              className="text-2xl font-black font-mono tracking-tight transition-colors duration-300"
              style={{ color: activeItem.color }}
            >
              {activeItem.percentage}%
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
              {activeItem.count} questions
            </span>
          </div>
        </div>

        {/* Legend Grid with Responsive Interactive Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full flex-1">
          {patterns.slice(0, 8).map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={p.topic}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                  isHovered
                    ? "bg-[var(--surface-hover)] border-[var(--border-control)] shadow-sm scale-[1.01]"
                    : "bg-[var(--surface-muted)]/70 border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: p.color,
                      boxShadow: isHovered ? `0 0 8px ${p.color}` : "none",
                    }}
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate transition-colors">
                    {p.topic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)]"
                    style={{ color: p.color }}
                  >
                    {p.percentage}%
                  </span>
                </div>
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
  const radius = 50;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;
  const solvedOffset = ((100 - progressPercent) / 100) * circumference;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between h-full shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)] relative z-10">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Difficulty Wise Distribution</h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Target problem volume & candidate readiness</p>
        </div>
        <span className="text-xs font-mono font-semibold text-[var(--status-success)] px-2 py-0.5 rounded-full bg-[var(--status-success)]/10 border border-[var(--status-success)]/25">
          {progressPercent}% Complete
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-4 relative z-10">
        {/* Circular Center Progress Gauge */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 filter drop-shadow-sm" viewBox="0 0 140 140">
            {/* Background track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="var(--surface-muted)"
              strokeWidth={strokeWidth}
            />
            {/* Completed progress stroke */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="var(--status-success)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={solvedOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight">
              {total}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono tracking-wider mt-0.5">
              Problems
            </span>
            <span className="text-[11px] font-mono text-[var(--status-success)] font-semibold mt-0.5">
              {totalSolved} Solved
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-2.5 flex-1 w-full text-xs">
          {/* Easy */}
          <div className="p-2.5 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-colors">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--status-success)] font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
                Easy
              </span>
              <span className="text-[var(--text-secondary)] text-[11px]">
                <strong className="text-[var(--status-success)]">{easy.solved}</strong> / {easy.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--status-success)] rounded-full transition-all duration-500"
                style={{ width: `${easy.total > 0 ? (easy.solved / easy.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-2.5 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-colors">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--status-warning)] font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[var(--status-warning)]" />
                Medium
              </span>
              <span className="text-[var(--text-secondary)] text-[11px]">
                <strong className="text-[var(--status-warning)]">{medium.solved}</strong> / {medium.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--status-warning)] rounded-full transition-all duration-500"
                style={{ width: `${medium.total > 0 ? (medium.solved / medium.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="p-2.5 rounded-xl bg-[var(--surface-muted)]/70 border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-colors">
            <div className="flex items-center justify-between font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--status-danger)] font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[var(--status-danger)]" />
                Hard
              </span>
              <span className="text-[var(--text-secondary)] text-[11px]">
                <strong className="text-[var(--status-danger)]">{hard.solved}</strong> / {hard.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--status-danger)] rounded-full transition-all duration-500"
                style={{ width: `${hard.total > 0 ? (hard.solved / hard.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
