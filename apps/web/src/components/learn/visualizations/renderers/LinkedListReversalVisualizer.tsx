import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LINKED_LIST_PRESETS,
  LinkedListPreset,
  LinkedListStep,
  generateLinkedListSteps,
} from "@/lib/visualizations/algorithms/linkedListReversal";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function LinkedListReversalVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("list-5-nodes");

  const activePreset = useMemo(
    () =>
      LINKED_LIST_PRESETS.find((p) => p.id === selectedPresetId) ||
      LINKED_LIST_PRESETS[0],
    [selectedPresetId]
  );

  const steps: LinkedListStep[] = useMemo(
    () => generateLinkedListSteps(activePreset),
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
    nodes,
    prevId,
    currId,
    nextTempId,
    phase,
    values,
    title,
    explanation,
  } = currentStep;

  const isTerminal = phase === "done";

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
              In-Place Reversal &bull; O(N) Time &bull; O(1) Auxiliary Space
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Linked List: Iterative 3-Pointer In-Place Reversal
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Watch the 4-step pointer invariant: save next, reverse arrow, advance prev, and advance curr.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {LINKED_LIST_PRESETS.map((preset) => (
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
            Pointer: prev
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {prevId !== null ? `Node(${nodes[prevId].val})` : "null"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {isTerminal ? "Newly Established Head!" : "Reversed slice tail"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Pointer: curr
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-[var(--action-primary)]">
            {currId !== null ? `Node(${nodes[currId].val})` : "null"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {currId !== null ? "Node being reversed" : "Reached end of list"}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Pointer: nextTemp
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
            {nextTempId !== null ? `Node(${nodes[nextTempId].val})` : "null / unsaved"}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Saved forward reference
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Phase
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            {isTerminal ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Done
              </Badge>
            ) : phase === "reverse_edge" ? (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                Reverse Link
              </Badge>
            ) : phase === "save_next" ? (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
                Save Next
              </Badge>
            ) : (
              <Badge className="bg-[var(--action-primary)]/10 text-[var(--action-primary)] border-[var(--action-primary)]/20 text-xs">
                Advance
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Visual Canvas: Singly Linked List Node Nodes */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>Linked Node Chain</span>
          <span>{isTerminal ? "Reversed List" : "In-Flight Node Mutation"}</span>
        </div>

        {/* Responsive Horizontal Container */}
        <div className="w-full overflow-x-auto pb-4 pt-6">
          <div className="inline-flex flex-col items-center min-w-full px-4">
            {/* Top Pointer Badges Row */}
            <div className="flex items-center gap-4 sm:gap-6 mb-2">
              {nodes.map((node) => {
                const isPrev = prevId === node.id;
                const isCurr = currId === node.id;
                const isNext = nextTempId === node.id;

                const badges = [];
                if (isPrev) badges.push({ label: "prev", color: "bg-emerald-600" });
                if (isCurr) badges.push({ label: "curr", color: "bg-[var(--action-primary)]" });
                if (isNext) badges.push({ label: "nextTemp", color: "bg-blue-500" });

                return (
                  <div
                    key={`ptr-${node.id}`}
                    className="w-20 sm:w-24 h-6 flex items-center justify-center gap-1 font-mono text-xs font-bold"
                  >
                    {badges.map((b) => (
                      <span
                        key={b.label}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] text-white shadow-xs",
                          b.color
                        )}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Nodes Row with Animated Connection Links */}
            <div className="relative flex items-center gap-4 sm:gap-6 py-2">
              {nodes.map((node, idx) => {
                const isCurr = currId === node.id;
                const isPrev = prevId === node.id;
                const isTarget = node.nextId !== null;
                const pointsBackward = node.nextId !== null && node.nextId < node.id;
                const pointsForward = node.nextId !== null && node.nextId > node.id;

                return (
                  <div key={`node-wrapper-${node.id}`} className="relative flex items-center">
                    {/* Node Box */}
                    <motion.div
                      layout
                      className={cn(
                        "relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl border-2 font-mono flex flex-col items-center justify-center select-none shadow-xs transition-all",
                        isCurr
                          ? "border-[var(--action-primary)] bg-[var(--surface)] text-[var(--text-primary)] shadow-md ring-2 ring-[var(--action-primary)]/40 scale-105"
                          : isPrev
                          ? "border-emerald-500/60 bg-emerald-500/10 text-[var(--text-primary)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold">{node.val}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        node #{node.id}
                      </span>

                      {/* Direction indicator badge inside node */}
                      <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-0.5 mt-0.5">
                        <span>next:</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {node.nextId !== null ? `Node(${nodes[node.nextId].val})` : "null"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Edge Link Arrow to the next node in sequential layout */}
                    {idx < nodes.length - 1 && (
                      <div className="w-4 sm:w-6 flex items-center justify-center">
                        {pointsForward ? (
                          <ArrowRight className="h-4 w-4 text-[var(--action-primary)] animate-pulse" />
                        ) : pointsBackward ? (
                          <ArrowLeft className="h-4 w-4 text-emerald-500 font-bold" />
                        ) : (
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">×</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Invariant Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-600" />
                prev (Tail of reversed sublist)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-[var(--action-primary)]" />
                curr (Active node undergoing reversal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-blue-500" />
                nextTemp (Preserved forward reference)
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
