import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlaybackControlsProps {
  totalSteps: number;
  currentStepIndex: number;
  isPlaying: boolean;
  isFinished: boolean;
  speed: number;
  onStepChange: (idx: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackControls({
  totalSteps,
  currentStepIndex,
  isPlaying,
  isFinished,
  speed,
  onStepChange,
  onPrev,
  onNext,
  onTogglePlay,
  onReset,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-3.5 sm:p-4">
      {/* Scrubber dots / progress line */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onStepChange(idx)}
            className={cn(
              "flex-1 h-2 rounded-full transition-all cursor-pointer",
              idx === currentStepIndex
                ? "bg-[var(--action-primary)] ring-2 ring-[var(--action-primary)]/40"
                : idx < currentStepIndex
                ? "bg-emerald-500/80"
                : "bg-[var(--border-control)] hover:bg-[var(--text-muted)]"
            )}
            title={`Jump to step ${idx + 1}`}
          />
        ))}
      </div>

      {/* Toolbar Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs h-8 cursor-pointer"
            title="Reset to step 1 (R)"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentStepIndex === 0}
            onClick={onPrev}
            className="text-xs h-8 cursor-pointer"
            title="Previous Step (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onTogglePlay}
            className="text-xs font-semibold h-8 px-4 cursor-pointer"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </>
            ) : isFinished ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Replay
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Play
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFinished}
            onClick={onNext}
            className="text-xs h-8 cursor-pointer"
            title="Next Step (Right Arrow)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed Selector & Keyboard Hints */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)]">Space</span> play
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)]">&larr; &rarr;</span> step
          </div>

          <div className="flex items-center gap-1 border border-[var(--border-subtle)] rounded-lg p-0.5 bg-[var(--surface)]">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer",
                  speed === s
                    ? "bg-[var(--action-primary)] text-[var(--on-primary)] font-bold shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

