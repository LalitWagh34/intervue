import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Search, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BINARY_SEARCH_PRESETS,
  BinarySearchPreset,
  BinarySearchStep,
  generateBinarySearchSteps,
} from "@/lib/visualizations/algorithms/binarySearch";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function BinarySearchVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("target-12");

  const activePreset = useMemo(
    () =>
      BINARY_SEARCH_PRESETS.find((p) => p.id === selectedPresetId) ||
      BINARY_SEARCH_PRESETS[0],
    [selectedPresetId]
  );

  const steps: BinarySearchStep[] = useMemo(
    () => generateBinarySearchSteps(activePreset),
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
  } = useVisualizationPlayback({ totalSteps, baseIntervalMs: 1500 });

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    handleReset();
  }, [selectedPresetId, handleReset]);

  const {
    left,
    right,
    mid,
    midValue,
    target,
    comparison,
    discardedIndices,
    status,
    foundIndex,
    title,
    explanation,
    values,
  } = currentStep;

  const isTerminal = status === "found" || status === "not_found";

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-7 shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Visualization
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Algorithm: O(log N) Time &bull; O(1) Space
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Binary Search: Logarithmic Space Halving
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Observe how comparing against the midpoint element permanently discards half of the sorted search space on each step.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {BINARY_SEARCH_PRESETS.map((preset) => (
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

      {/* Live Variable & Interval Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Active Interval [L ... R]
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {left <= right ? `[${left} ... ${right}]` : "Exhausted (L > R)"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {left <= right ? `${right - left + 1} candidates remaining` : "0 candidates left"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Midpoint Index &amp; Value
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {mid !== null ? `mid=${mid} (arr[${mid}]=${midValue})` : "—"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {mid !== null ? `L + Math.floor((${right} - ${left}) / 2)` : "Calculating..."}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Comparison vs Target ({target})
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold">
            {comparison === "equal" ? (
              <span className="text-emerald-600 dark:text-emerald-400">arr[mid] === target</span>
            ) : comparison === "less" ? (
              <span className="text-blue-600 dark:text-blue-400">arr[mid] &lt; target</span>
            ) : comparison === "greater" ? (
              <span className="text-amber-600 dark:text-amber-400">arr[mid] &gt; target</span>
            ) : (
              <span className="text-[var(--text-muted)]">No comparison</span>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {comparison === "less"
              ? "Discard left half"
              : comparison === "greater"
              ? "Discard right half"
              : comparison === "equal"
              ? "Target localized!"
              : "Ready"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Status
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            {status === "found" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Found at #{foundIndex}
              </Badge>
            ) : status === "not_found" ? (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs font-semibold">
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Target Absent
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
                Searching
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Visual Canvas: Array Grid with Pointers and Discard Shading */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>Monotonically Sorted Array Domain</span>
          <span>Target: {target}</span>
        </div>

        {/* Responsive Horizontal Container */}
        <div className="w-full overflow-x-auto pb-4 pt-6">
          <div className="inline-flex flex-col items-center min-w-full px-4">
            {/* Top Pointer Badges: L, M, R */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {values.map((_, idx) => {
                const isL = idx === left;
                const isR = idx === right;
                const isM = idx === mid;

                const badges = [];
                if (isL) badges.push("L");
                if (isM) badges.push("M");
                if (isR) badges.push("R");

                return (
                  <div
                    key={`ptr-${idx}`}
                    className="w-12 sm:w-16 h-6 flex items-center justify-center font-mono text-xs font-bold"
                  >
                    {badges.length > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded shadow-xs text-[10px] text-white",
                          isM && isTerminal
                            ? "bg-emerald-600"
                            : isM
                            ? "bg-amber-500"
                            : "bg-[var(--action-primary)]"
                        )}
                      >
                        {badges.join(", ")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Array Cells Row */}
            <div className="relative flex items-center gap-2 sm:gap-3 py-1">
              {values.map((val, idx) => {
                const isDiscarded = discardedIndices.includes(idx);
                const isMid = idx === mid;
                const isMatch = foundIndex === idx;

                return (
                  <motion.div
                    key={`cell-${idx}`}
                    layout
                    className={cn(
                      "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                      isMatch
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-lg scale-105"
                        : isMid
                        ? "border-amber-500 bg-amber-500/10 text-[var(--text-primary)] shadow-md"
                        : isDiscarded
                        ? "border-[var(--border-subtle)] bg-[var(--surface-muted)]/20 text-[var(--text-muted)] opacity-30 line-through"
                        : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] shadow-xs"
                    )}
                  >
                    <span className="text-base sm:text-xl font-bold">{val}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      idx {idx}
                    </span>

                    {/* Mid Accent indicator */}
                    {isMid && !isMatch && (
                      <div className="absolute -bottom-1 inset-x-2 h-1 bg-amber-500 rounded-full" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend / Info Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-[var(--action-primary)]" />
                Active Interval [L, R]
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-amber-500" />
                Midpoint (M)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                Target Localized
              </span>
              <span className="flex items-center gap-1.5 opacity-60">
                <span className="h-2.5 w-2.5 rounded bg-[var(--text-muted)] line-through" />
                Eliminated Domain
              </span>
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
