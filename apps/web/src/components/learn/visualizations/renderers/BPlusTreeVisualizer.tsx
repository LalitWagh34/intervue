import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, HardDrive, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BTREE_PRESETS,
  BTreePreset,
  BTreeStep,
  generateBTreeSteps,
} from "@/lib/visualizations/algorithms/bPlusTree";
import { SAMPLE_BTREE } from "@/lib/visualizations/models/bPlusTree";
import { useVisualizationPlayback } from "../controls/useVisualizationPlayback";
import { PlaybackControls } from "../controls/PlaybackControls";

export function BPlusTreeVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("point-44");

  const activePreset = useMemo(
    () => BTREE_PRESETS.find((p) => p.id === selectedPresetId) || BTREE_PRESETS[0],
    [selectedPresetId]
  );

  const steps: BTreeStep[] = useMemo(
    () => generateBTreeSteps(activePreset, SAMPLE_BTREE),
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

  // Reset when preset changes
  useEffect(() => {
    handleReset();
  }, [selectedPresetId, handleReset]);

  const isNodeActive = (nodeId: string) => currentStep.activeNodeId === nodeId;
  const isNodeVisited = (nodeId: string) => currentStep.visitedNodeIds.includes(nodeId);
  const isLeafScanned = (leafId: string) => currentStep.leafScanIds.includes(leafId);

  const isTerminal =
    currentStep.status === "found" ||
    currentStep.status === "not_found" ||
    currentStep.status === "range_done";

  // Pre-filter leaves for rendering
  const leafNodes = useMemo(() => {
    return [
      SAMPLE_BTREE.nodes["leaf-0"],
      SAMPLE_BTREE.nodes["leaf-1"],
      SAMPLE_BTREE.nodes["leaf-2"],
      SAMPLE_BTREE.nodes["leaf-3"],
      SAMPLE_BTREE.nodes["leaf-4"],
      SAMPLE_BTREE.nodes["leaf-5"],
      SAMPLE_BTREE.nodes["leaf-6"],
      SAMPLE_BTREE.nodes["leaf-7"],
      SAMPLE_BTREE.nodes["leaf-8"],
      SAMPLE_BTREE.nodes["leaf-9"],
    ];
  }, []);

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-7 shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-xs font-mono font-semibold uppercase tracking-wider">
              <Database className="h-3.5 w-3.5" />
              DBMS Storage Visualizer
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              B+ Tree On-Disk Index &bull; O(log_b N)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            B+ Tree Index Traversal &amp; Leaf Range Scan
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Accurate simulation over a real 3-level tree model. Demonstrates root binary routing, leaf membership proofs, and horizontal range scans.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {BTREE_PRESETS.map((preset) => (
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

      {/* Main Interactive B+ Tree Canvas */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/30 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
        {/* Live IO & Engine Metric Badges (Top Right) */}
        <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-xs font-mono flex items-center gap-1.5 shadow-xs">
            <HardDrive className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[var(--text-muted)]">Pages Visited:</span>
            <span className="font-bold text-[var(--text-primary)]">{currentStep.pagesVisited}</span>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hidden sm:inline-flex">
            Root in Buffer Pool (RAM)
          </Badge>
        </div>

        {/* Tree Layout View */}
        <div className="w-full max-w-4xl flex flex-col items-center space-y-6 pt-4">
          {/* LEVEL 0: ROOT NODE */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Level 0: Root Page (Pinned in RAM)
            </span>
            <motion.div
              layout
              className={cn(
                "px-5 py-2.5 rounded-xl border-2 font-mono text-sm font-bold flex items-center gap-3 transition-all",
                isNodeActive("root")
                  ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20 scale-105"
                  : isNodeVisited("root")
                  ? "bg-[var(--surface)] border-blue-500/50 text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-70"
              )}
            >
              <span>Page #1:</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">[ 30 | 70 ]</span>
            </motion.div>
          </div>

          {/* Connectors to Level 1 */}
          <div className="w-full flex justify-around px-8 sm:px-16 text-xs text-[var(--text-muted)] font-mono">
            <span>&darr; &lt; 30</span>
            <span>&darr; 30..69</span>
            <span>&darr; &ge; 70</span>
          </div>

          {/* LEVEL 1: INTERNAL NODES */}
          <div className="w-full flex justify-between gap-3 sm:gap-6 px-2 sm:px-8">
            {/* Left Internal Node */}
            <motion.div
              layout
              className={cn(
                "flex-1 p-3 rounded-xl border-2 font-mono text-xs flex flex-col items-center text-center transition-all",
                isNodeActive("int-left")
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 scale-105"
                  : isNodeVisited("int-left")
                  ? "bg-[var(--surface)] border-amber-500/50 text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60"
              )}
            >
              <span className="text-[10px] text-[var(--text-muted)]">Page #2 (Internal)</span>
              <span className="font-bold pt-1">[ 10 | 20 ]</span>
            </motion.div>

            {/* Middle Internal Node */}
            <motion.div
              layout
              className={cn(
                "flex-1 p-3 rounded-xl border-2 font-mono text-xs flex flex-col items-center text-center transition-all",
                isNodeActive("int-mid")
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 scale-105"
                  : isNodeVisited("int-mid")
                  ? "bg-[var(--surface)] border-amber-500/50 text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60"
              )}
            >
              <span className="text-[10px] text-[var(--text-muted)]">Page #3 (Internal)</span>
              <span className="font-bold pt-1">[ 40 | 50 | 60 ]</span>
            </motion.div>

            {/* Right Internal Node */}
            <motion.div
              layout
              className={cn(
                "flex-1 p-3 rounded-xl border-2 font-mono text-xs flex flex-col items-center text-center transition-all",
                isNodeActive("int-right")
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20 scale-105"
                  : isNodeVisited("int-right")
                  ? "bg-[var(--surface)] border-amber-500/50 text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60"
              )}
            >
              <span className="text-[10px] text-[var(--text-muted)]">Page #4 (Internal)</span>
              <span className="font-bold pt-1">[ 80 | 90 ]</span>
            </motion.div>
          </div>

          {/* LEVEL 2: LEAF NODES (DOUBLY LINKED CHAIN) with horizontal scroll safety */}
          <div className="w-full space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-2">
              <span>Level 2: Leaf Pages (Data Rows + Sibling Pointers)</span>
              <span className="text-emerald-500">Doubly-Linked List Chain (&harr;)</span>
            </div>

            <div className="w-full overflow-x-auto pb-3 pt-1">
              <div className="flex items-center gap-1.5 min-w-max px-2">
                {leafNodes.map((leaf, idx, arr) => {
                  const isActive = isNodeActive(leaf.id);
                  const isScanned = isLeafScanned(leaf.id);
                  const isCurrentMatch = currentStep.isMatch && isActive;

                  return (
                    <div key={leaf.id} className="flex items-center gap-1.5">
                      <motion.div
                        layout
                        className={cn(
                          "w-24 sm:w-28 p-2 rounded-xl border-2 font-mono text-center transition-all",
                          isCurrentMatch
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 scale-105"
                            : isActive
                            ? currentStep.status === "not_found"
                              ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-md scale-102"
                              : "bg-blue-500/20 border-blue-500 text-blue-400 shadow-md scale-102"
                            : isScanned
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60"
                        )}
                      >
                        <div className="text-[10px] text-[var(--text-muted)]">#{leaf.id}</div>
                        <div className="text-xs font-bold pt-0.5">
                          {leaf.keys.map((k) => {
                            // Only highlight keys if this leaf has ALREADY been scanned/visited
                            const isKeyMatched =
                              isScanned && currentStep.matchedKeys.includes(k);

                            return (
                              <span
                                key={k}
                                className={cn(
                                  "mx-0.5",
                                  isKeyMatched &&
                                    "text-emerald-400 font-extrabold underline decoration-2"
                                )}
                              >
                                {k}
                              </span>
                            );
                          })}
                        </div>
                      </motion.div>

                      {idx < arr.length - 1 && (
                        <span className="text-[11px] font-mono text-emerald-500 shrink-0 font-bold">
                          &harr;
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Comparison Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]/70 w-full mt-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Status:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {currentStep.comparisonDetails}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep.status === "found" ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Row Found in O(log n)
              </Badge>
            ) : currentStep.status === "not_found" ? (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[11px]">
                <XCircle className="h-3 w-3 mr-1" />
                Proved Absent in O(log n)
              </Badge>
            ) : currentStep.status === "range_done" ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Range Scan Complete: {currentStep.matchedKeys.length} Rows
              </Badge>
            ) : (
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[11px]">
                Traversing Tree...
              </Badge>
            )}
          </div>
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
