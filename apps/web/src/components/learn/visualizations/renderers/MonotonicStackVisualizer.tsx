import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Layers, ArrowDown, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MONOTONIC_STACK_PRESETS,
  MonotonicStackPreset,
  MonotonicStackStep,
  generateMonotonicStackSteps,
} from "@/lib/visualizations/algorithms/monotonicStack";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function MonotonicStackVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("next-greater-basic");

  const activePreset = useMemo(
    () =>
      MONOTONIC_STACK_PRESETS.find((p) => p.id === selectedPresetId) ||
      MONOTONIC_STACK_PRESETS[0],
    [selectedPresetId]
  );

  const steps: MonotonicStackStep[] = useMemo(
    () => generateMonotonicStackSteps(activePreset),
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
    currentValue,
    stack,
    result,
    action,
    poppedIndex,
    poppedValue,
    resolvedIndex,
    values,
    title,
    explanation,
  } = currentStep;

  const isTerminal = action === "done";

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
              Amortized O(N) Time &bull; O(N) Space
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Monotonic Stack: Next Greater Element
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Notice how maintaining a strictly decreasing stack resolves nearest boundaries in linear time without nested O(N²) scans.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {MONOTONIC_STACK_PRESETS.map((preset) => (
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
            Current Input Element
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {currentValue !== null ? `arr[${currentIndex}] = ${currentValue}` : isTerminal ? "Completed" : "Starting..."}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {currentIndex >= 0 && currentIndex < values.length ? `Index ${currentIndex} of ${values.length - 1}` : "End of input"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Stack Depth
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--action-primary)]">
            {stack.length} item{stack.length === 1 ? "" : "s"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Top: {stack.length > 0 ? `arr[${stack[stack.length - 1].index}]=${stack[stack.length - 1].value}` : "Empty"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Last Action
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            {action === "pop" ? (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
                POP arr[{poppedIndex}]
              </Badge>
            ) : action === "push" ? (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
                PUSH arr[{currentIndex}]
              </Badge>
            ) : action === "inspect" ? (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                INSPECT
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                COMPLETE
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {resolvedIndex !== undefined ? `Resolved ans[${resolvedIndex}]` : "Evaluating..."}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Progress
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            Step {currentStepIndex + 1} / {totalSteps}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {isTerminal ? "All elements resolved" : "Processing linear stream"}
          </span>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 space-y-6">
        {/* Input Array Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Input Array arr[i]</span>
            <span>Current reader index: {currentIndex >= 0 && currentIndex < values.length ? currentIndex : "Done"}</span>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="inline-flex items-center gap-2 sm:gap-3 py-1 px-2">
              {values.map((val, idx) => {
                const isCurrent = idx === currentIndex;
                const inStack = stack.some((s) => s.index === idx);

                return (
                  <motion.div
                    key={`arr-${idx}`}
                    layout
                    className={cn(
                      "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                      isCurrent
                        ? "border-amber-500 bg-amber-500/15 text-[var(--text-primary)] shadow-md scale-105"
                        : inStack
                        ? "border-[var(--action-primary)] bg-[var(--surface)] text-[var(--action-primary)] shadow-xs"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] opacity-60"
                    )}
                  >
                    <span className="text-base sm:text-xl font-bold">{val}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      idx {idx}
                    </span>

                    {isCurrent && (
                      <div className="absolute -top-2 px-1.5 rounded bg-amber-500 text-[9px] text-white font-bold">
                        Reader
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stack Container Visualization */}
        <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Layers className="h-4 w-4 text-[var(--action-primary)]" />
              LIFO Monotonic Stack (Bottom &rarr; Top)
            </span>
            <span>Invariant: Strictly Decreasing Elements</span>
          </div>

          <div className="rounded-xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--surface)]/70 p-4 min-h-[90px] flex items-center gap-3 overflow-x-auto">
            {stack.length === 0 ? (
              <span className="text-xs font-mono text-[var(--text-muted)] italic px-2">
                Stack is currently empty.
              </span>
            ) : (
              stack.map((item, idx) => {
                const isTop = idx === stack.length - 1;

                return (
                  <motion.div
                    key={`stack-item-${item.index}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      "relative px-4 py-3 rounded-lg border-2 font-mono flex flex-col items-center justify-center shrink-0 shadow-xs",
                      isTop
                        ? "border-[var(--action-primary)] bg-[var(--action-primary)]/10 text-[var(--text-primary)] font-bold ring-2 ring-[var(--action-primary)]/30"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                    )}
                  >
                    <span className="text-sm sm:text-base font-bold">{item.value}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">idx #{item.index}</span>

                    {isTop && (
                      <div className="absolute -top-2.5 px-1.5 rounded bg-[var(--action-primary)] text-[9px] text-[var(--on-primary)] font-bold">
                        TOP
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Result Array Row */}
        <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Result Array (Next Greater Value for each index)</span>
            <span>Target Answer</span>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="inline-flex items-center gap-2 sm:gap-3 py-1 px-2">
              {result.map((resVal, idx) => {
                const isResolved = resVal !== null;
                const isJustResolved = resolvedIndex === idx;

                return (
                  <motion.div
                    key={`res-${idx}`}
                    layout
                    className={cn(
                      "relative w-12 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 select-none",
                      isJustResolved
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-md scale-105"
                        : isResolved
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] opacity-50"
                    )}
                  >
                    <span className="text-base sm:text-xl font-bold">
                      {isResolved ? resVal : "—"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      ans[{idx}]
                    </span>
                  </motion.div>
                );
              })}
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
