import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Calculator, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PREFIX_SUM_PRESETS,
  PrefixSumPreset,
  PrefixSumStep,
  generatePrefixSumSteps,
} from "@/lib/visualizations/algorithms/prefixSum";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function PrefixSumVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("range-query-demo");

  const activePreset = useMemo(
    () =>
      PREFIX_SUM_PRESETS.find((p) => p.id === selectedPresetId) ||
      PREFIX_SUM_PRESETS[0],
    [selectedPresetId]
  );

  const steps: PrefixSumStep[] = useMemo(
    () => generatePrefixSumSteps(activePreset),
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
    currentIndex,
    values,
    prefixArray,
    currentSum,
    bestSum,
    activeRange,
    mode,
    status,
    title,
    explanation,
  } = currentStep;

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
              Prefix Sum: O(1) Range Queries &bull; Kadane: O(N) Max Subarray
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Prefix Sum &amp; Kadane&apos;s Algorithm
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Discover how cumulative accumulators answer range sums in O(1) time and dynamic state restarts find maximum subarrays in O(N).
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {PREFIX_SUM_PRESETS.map((preset) => (
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

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Active Subarray
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {activeRange ? `[${activeRange[0]} ... ${activeRange[1]}]` : currentIndex >= 0 ? `At idx ${currentIndex}` : "Pre-computed"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {activeRange ? `Length: ${activeRange[1] - activeRange[0] + 1}` : "Cumulative table"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {mode === "range_query" ? "Range Sum Result" : "Current Running Sum"}
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--action-primary)]">
            {currentSum}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {mode === "range_query" ? "Computed in O(1)" : "currentSum ending here"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {mode === "range_query" ? "Query Formula" : "Global Max Sum"}
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">
            {mode === "range_query" ? "P[R+1] - P[L]" : bestSum !== undefined ? bestSum : "—"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {mode === "range_query" ? "Subarray subtraction" : "Kadane's optimal"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            State
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            {status === "done" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Optimal
              </Badge>
            ) : status === "optimal" ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                Query Evaluated
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
                Computing
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 space-y-6">
        {/* Original Array Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Original Array arr[i]</span>
            {activeRange && <span>Active Slice: [{activeRange[0]} ... {activeRange[1]}]</span>}
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="inline-flex items-center gap-2 sm:gap-3 py-1 px-2">
              {values.map((val, idx) => {
                const isInRange = activeRange && idx >= activeRange[0] && idx <= activeRange[1];
                const isCurrent = idx === currentIndex;

                return (
                  <motion.div
                    key={`val-${idx}`}
                    layout
                    className={cn(
                      "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                      isInRange
                        ? "border-[var(--action-primary)] bg-[var(--surface)] text-[var(--text-primary)] shadow-md"
                        : isCurrent
                        ? "border-amber-500 bg-amber-500/10 text-[var(--text-primary)] shadow-xs"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] opacity-70"
                    )}
                  >
                    <span className="text-base sm:text-xl font-bold">{val}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      idx {idx}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Prefix Sum Array (Only in Range Query Mode) */}
        {mode === "range_query" && prefixArray && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span>Prefix Sum Array P[i] (Size N+1)</span>
              <span>P[0] = 0</span>
            </div>

            <div className="w-full overflow-x-auto pb-2">
              <div className="inline-flex items-center gap-2 sm:gap-3 py-1 px-2">
                {prefixArray.map((pVal, idx) => {
                  const isQueryL = activeRange && idx === activeRange[0];
                  const isQueryRPlus1 = activeRange && idx === activeRange[1] + 1;

                  return (
                    <motion.div
                      key={`prefix-${idx}`}
                      layout
                      className={cn(
                        "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                        isQueryRPlus1
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-md"
                          : isQueryL
                          ? "border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-md"
                          : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] shadow-xs"
                      )}
                    >
                      <span className="text-base sm:text-xl font-bold">{pVal}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        P[{idx}]
                      </span>

                      {isQueryL && (
                        <div className="absolute -top-2.5 px-1 rounded bg-blue-500 text-[9px] text-white font-bold">
                          P[L]
                        </div>
                      )}
                      {isQueryRPlus1 && (
                        <div className="absolute -top-2.5 px-1 rounded bg-emerald-500 text-[9px] text-white font-bold">
                          P[R+1]
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
