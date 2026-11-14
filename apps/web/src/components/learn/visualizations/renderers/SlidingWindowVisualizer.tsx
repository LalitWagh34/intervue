import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Maximize2, Minimize2, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SLIDING_WINDOW_PRESETS,
  SlidingWindowPreset,
  SlidingWindowStep,
  generateSlidingWindowSteps,
} from "@/lib/visualizations/algorithms/slidingWindow";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function SlidingWindowVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("fixed-max-sum");

  const activePreset = useMemo(
    () =>
      SLIDING_WINDOW_PRESETS.find((p) => p.id === selectedPresetId) ||
      SLIDING_WINDOW_PRESETS[0],
    [selectedPresetId]
  );

  const steps: SlidingWindowStep[] = useMemo(
    () => generateSlidingWindowSteps(activePreset),
    [activePreset]
  );

  const totalSteps = steps.length;

  const {
    currentStepIndex,
    setCurrentStepIndex,
    isPlaying,
    speed,
    setSpeed,
    isFinished,
    handleStepChange,
    handleNext,
    handlePrev,
    handleReset,
    handleTogglePlay,
  } = useVisualizationPlayback({ totalSteps, baseIntervalMs: 1400 });

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    handleReset();
  }, [selectedPresetId, handleReset]);

  const {
    windowStart,
    windowEnd,
    currentSum,
    bestValue,
    bestWindow,
    action,
    status,
    title,
    explanation,
    values,
    paramK,
    type,
  } = currentStep;

  const isWindowActive = windowEnd >= windowStart && windowStart >= 0;
  const windowLength = isWindowActive ? windowEnd - windowStart + 1 : 0;

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-7 shadow-xs">
      {/* Visualizer Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Visualization
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Amortized O(N) Time &bull; O(1) Extra Space
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Sliding Window: Contiguous Range Coordination
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Observe how maintaining an incremental running state across [left, right] eliminates nested O(N²) scans.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {SLIDING_WINDOW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                selectedPresetId === preset.id
                  ? "bg-[var(--action-primary)] text-[var(--on-primary)] border-[var(--action-primary)] shadow-xs font-semibold"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Live Variable & Condition Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Window Bounds
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {isWindowActive ? `[${windowStart} ... ${windowEnd}]` : "Empty"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Length: {windowLength} element{windowLength === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Current Window Sum
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {currentSum}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {type === "fixed"
              ? `Target Size K = ${paramK}`
              : type === "variable_min"
              ? `Constraint: Sum ≥ ${paramK}`
              : `Constraint: Sum ≤ ${paramK}`}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {type === "fixed"
              ? "Max Sum So Far"
              : type === "variable_min"
              ? "Min Length Record"
              : "Max Length Record"}
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">
            {bestValue === 0 && type === "variable_min" ? "Searching..." : bestValue}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {bestWindow ? `At [${bestWindow[0]} ... ${bestWindow[1]}]` : "Evaluating..."}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Action / State
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            {status === "completed" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                Completed
              </Badge>
            ) : status === "optimal" ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                Feasible / Record
              </Badge>
            ) : status === "invalid" ? (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
                Violated
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                {action.toUpperCase()}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Visual Canvas: Array Grid with Framer Motion Sliding Window Box */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>Contiguous Array State</span>
          <span>Window: [L={windowStart >= 0 ? windowStart : "—"}, R={windowEnd >= 0 ? windowEnd : "—"}]</span>
        </div>

        {/* Responsive Horizontal Container */}
        <div className="w-full overflow-x-auto pb-4 pt-6">
          <div className="inline-flex flex-col items-center min-w-full px-4">
            {/* Top Pointer Badges: Left and Right Indicators */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {values.map((_, idx) => {
                const isLeft = idx === windowStart;
                const isRight = idx === windowEnd;

                return (
                  <div
                    key={`ptr-${idx}`}
                    className="w-12 sm:w-16 h-6 flex items-center justify-center font-mono text-xs font-bold"
                  >
                    {isLeft && isRight ? (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--action-primary)] text-[var(--on-primary)] shadow-xs text-[10px]">
                        L, R
                      </span>
                    ) : isLeft ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-xs text-[10px]">
                        L
                      </span>
                    ) : isRight ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs text-[10px]">
                        R
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Array Cells Row */}
            <div className="relative flex items-center gap-2 sm:gap-3 py-1">
              {values.map((val, idx) => {
                const inWindow = isWindowActive && idx >= windowStart && idx <= windowEnd;
                const isLeft = idx === windowStart;
                const isRight = idx === windowEnd;

                return (
                  <motion.div
                    key={`cell-${idx}`}
                    layout
                    className={cn(
                      "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                      inWindow
                        ? "border-[var(--action-primary)] bg-[var(--surface)] text-[var(--text-primary)] shadow-md"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] opacity-60"
                    )}
                  >
                    <span className="text-base sm:text-xl font-bold">{val}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      idx {idx}
                    </span>

                    {/* Window Edge Accent Bars */}
                    {isLeft && (
                      <div className="absolute left-0 inset-y-0 w-1 bg-blue-500 rounded-l" />
                    )}
                    {isRight && (
                      <div className="absolute right-0 inset-y-0 w-1 bg-amber-500 rounded-r" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Sub-label: Active Window Highlight Span */}
            <div className="mt-3 text-center">
              {isWindowActive ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
                  <span>Current Slice:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    [{values.slice(windowStart, windowEnd + 1).join(", ")}]
                  </span>
                  <span>&rarr; Sum:</span>
                  <span className="font-bold text-[var(--action-primary)]">
                    {currentSum}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Initializing Window...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Explanation Card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-4.5 sm:p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-xs font-bold">
            {currentStepIndex + 1}
          </span>
          <h3>{title}</h3>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] pl-7">
          {explanation}
        </p>
      </div>

      {/* Playback Controls Component */}
      <PlaybackControls
        totalSteps={totalSteps}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        isFinished={isFinished}
        speed={speed}
        onStepChange={handleStepChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
