import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  generateTwoPointersSteps,
  TWO_POINTERS_PRESETS,
} from "@/lib/visualizations/algorithms/twoPointers";
import { VisualStep } from "@/lib/visualizations/types";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function TwoPointersVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-1");
  const [customTarget, setCustomTarget] = useState<number | null>(null);

  const activePreset = useMemo(
    () =>
      TWO_POINTERS_PRESETS.find((p) => p.id === selectedPresetId) ||
      TWO_POINTERS_PRESETS[0],
    [selectedPresetId]
  );

  const targetValue = customTarget !== null ? customTarget : activePreset.target;

  // Generate steps whenever preset values or target change
  const steps: VisualStep[] = useMemo(
    () => generateTwoPointersSteps(activePreset.values, targetValue),
    [activePreset.values, targetValue]
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

  // Reset step index when preset or target changes
  useEffect(() => {
    handleReset();
  }, [selectedPresetId, targetValue, handleReset]);

  const { arrayState, variables } = currentStep;
  const { values, leftIndex, rightIndex, status } = arrayState;

  const currentSum =
    typeof variables.sum === "number" ? variables.sum : null;

  const isTerminal = status === "found" || status === "exhausted";

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
              Algorithm: O(N) Time &bull; O(1) Extra Space
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Two Pointers: Target Sum Convergence
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Watch how two boundary pointers exploit array sortedness to find pairs in linear time.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {TWO_POINTERS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPresetId(preset.id);
                setCustomTarget(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                selectedPresetId === preset.id && customTarget === null
                  ? "bg-[var(--action-primary)] text-[var(--on-primary)] border-[var(--action-primary)] shadow-xs font-semibold"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              {preset.title.split("(")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
        {/* Target Badge Floating Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-xs font-mono flex items-center gap-1.5 shadow-xs">
            <Target className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[var(--text-muted)]">Target:</span>
            <span className="font-bold text-[var(--text-primary)]">{targetValue}</span>
          </div>
        </div>

        {/* Array Visualization Container with horizontal scroll safety for mobile */}
        <div className="w-full max-w-full overflow-x-auto py-8 flex flex-col items-center">
          <div className="min-w-fit px-4 flex flex-col items-center">
            {/* Top Pointer Indicator: Left Pointer */}
            <div className="w-full flex justify-center pb-2">
              <div className="flex gap-2 sm:gap-3 justify-center items-end">
                {values.map((_, idx) => {
                  const isLeft = idx === leftIndex;
                  return (
                    <div key={idx} className="w-12 sm:w-16 flex flex-col items-center justify-end h-9">
                      {isLeft && (
                        <motion.div
                          layoutId="pointer-left"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          className="flex flex-col items-center"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono text-[11px] font-bold shadow-xs">
                            L = {idx}
                          </span>
                          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-blue-500" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Array Value Boxes */}
            <div className="flex gap-2 sm:gap-3 justify-center items-center">
              {values.map((val, idx) => {
                const isLeft = idx === leftIndex;
                const isRight = idx === rightIndex;
                const isHighlighted = isLeft || isRight;
                const isMatch = status === "found" && isHighlighted;

                return (
                  <motion.div
                    key={idx}
                    layout
                    className={cn(
                      "w-12 sm:w-16 h-14 sm:h-16 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-base sm:text-lg border-2 transition-all relative select-none",
                      isMatch
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20 scale-105"
                        : isLeft
                        ? "bg-blue-500/15 border-blue-500 text-blue-400 shadow-xs"
                        : isRight
                        ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-xs"
                        : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-70"
                    )}
                  >
                    <span>{val}</span>
                    <span className="text-[10px] font-normal text-[var(--text-muted)] absolute bottom-1 font-mono">
                      [{idx}]
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Pointer Indicator: Right Pointer */}
            <div className="w-full flex justify-center pt-2">
              <div className="flex gap-2 sm:gap-3 justify-center items-start">
                {values.map((_, idx) => {
                  const isRight = idx === rightIndex;
                  return (
                    <div key={idx} className="w-12 sm:w-16 flex flex-col items-center justify-start h-9">
                      {isRight && (
                        <motion.div
                          layoutId="pointer-right"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-amber-500" />
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono text-[11px] font-bold shadow-xs">
                            R = {idx}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Variable Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-[var(--border-subtle)]/70 w-full">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-xs font-mono">
            <span className="text-blue-400 font-semibold">arr[L]:</span>
            <span className="font-bold text-[var(--text-primary)]">{values[leftIndex] ?? "—"}</span>
          </div>

          <span className="text-sm font-bold text-[var(--text-muted)]">+</span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-xs font-mono">
            <span className="text-amber-400 font-semibold">arr[R]:</span>
            <span className="font-bold text-[var(--text-primary)]">{values[rightIndex] ?? "—"}</span>
          </div>

          <span className="text-sm font-bold text-[var(--text-muted)]">=</span>

          <div
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1 rounded-lg border text-xs font-mono font-bold transition-colors",
              status === "found"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : status === "too_large"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : status === "too_small"
                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)]"
            )}
          >
            <span>Sum: {currentSum ?? "N/A"}</span>
          </div>

          {currentSum !== null && (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-mono",
                status === "found"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status === "too_large"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : status === "too_small"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              )}
            >
              {status === "found"
                ? "Match!"
                : currentSum > targetValue
                ? `Exceeds target by +${currentSum - targetValue}`
                : `Below target by ${currentSum - targetValue}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Step Explanation Card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-4 sm:p-5 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Step {currentStepIndex + 1} of {totalSteps}: {currentStep.title}
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {isTerminal ? "Completed" : "Running"}
          </span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-primary)]">
          {currentStep.explanation}
        </p>
      </div>

      {/* Shared Playback Controls */}
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
