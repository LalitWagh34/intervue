import { useState, useEffect, useCallback, useRef } from "react";

interface UseVisualizationPlaybackProps {
  totalSteps: number;
  initialSpeed?: number;
  baseIntervalMs?: number;
}

export function useVisualizationPlayback({
  totalSteps,
  initialSpeed = 1,
  baseIntervalMs = 1400,
}: UseVisualizationPlaybackProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(initialSpeed);

  const isFinished = currentStepIndex >= totalSteps - 1;

  // Pause when browser tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Timer-based automatic playback
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const delay = Math.round(baseIntervalMs / speed);
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, speed, totalSteps, baseIntervalMs]);

  // Stepping controls
  const handleStepChange = useCallback((idx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(idx, totalSteps - 1)));
  }, [totalSteps]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isFinished) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [isFinished]);

  // Keyboard navigation scoped to non-interactive active elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs or focusing buttons
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toUpperCase();
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "BUTTON" || target?.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay, handlePrev, handleNext, handleReset]);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    isFinished,
    handleStepChange,
    handleNext,
    handlePrev,
    handleReset,
    handleTogglePlay,
  };
}

