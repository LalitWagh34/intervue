import { useState, useEffect, useCallback, useRef } from "react";

interface UseAntiCheatOptions {
  enabled?: boolean;
  maxStrikes?: number;
  onMaxStrikesReached?: () => void;
  onStrike?: (strikeCount: number, reason: string) => void;
}

function playWarningSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
}

export function useAntiCheat({
  enabled = true,
  maxStrikes = 3,
  onMaxStrikesReached,
  onStrike,
}: UseAntiCheatOptions = {}) {
  const [strikes, setStrikes] = useState<number>(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentReason, setCurrentReason] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);

  const strikesRef = useRef(0);
  strikesRef.current = strikes;

  const onMaxStrikesReachedRef = useRef(onMaxStrikesReached);
  onMaxStrikesReachedRef.current = onMaxStrikesReached;

  const onStrikeRef = useRef(onStrike);
  onStrikeRef.current = onStrike;

  // Record a strike safely
  const triggerStrike = useCallback(
    (reason: string) => {
      if (!enabled || isTerminated) return;

      const newStrikes = strikesRef.current + 1;
      setStrikes(newStrikes);
      setCurrentReason(reason);
      setWarningModalOpen(true);

      // Play subtle warning audio chime
      playWarningSound();

      // Change browser title to draw attention
      try {
        document.title = `⚠️ STRIKE ${newStrikes}/3: Tab Switch Detected!`;
      } catch (_) {}

      onStrikeRef.current?.(newStrikes, reason);

      if (newStrikes >= maxStrikes) {
        setIsTerminated(true);
        onMaxStrikesReachedRef.current?.();
      }
    },
    [enabled, isTerminated, maxStrikes]
  );

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Monitor visibility & blur events
  useEffect(() => {
    if (!enabled || isTerminated) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerStrike("Switched browser tab or minimized window");
        }, 300);
      }
    };

    const handleWindowBlur = () => {
      // Small timeout to avoid triggering on certain browser focus quirks
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (document.hidden) return; // already caught by visibilitychange
        triggerStrike("Application lost focus (switched window or opened dev tools)");
      }, 400);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, isTerminated, triggerStrike]);

  const dismissWarning = useCallback(() => {
    setWarningModalOpen(false);
    try {
      document.title = "Contest Battle Arena";
    } catch (_) {}
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request declined or unsupported", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Exit fullscreen error", err);
    }
  }, []);

  return {
    strikes,
    maxStrikes,
    warningModalOpen,
    currentReason,
    dismissWarning,
    isFullscreen,
    isTerminated,
    requestFullscreen,
    exitFullscreen,
  };
}
