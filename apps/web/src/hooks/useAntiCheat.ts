import { useState, useEffect, useCallback, useRef } from "react";

export type AntiCheatViolationType = "TAB_SWITCH" | "WINDOW_BLUR" | "SUSPICIOUS_PASTE";

interface UseAntiCheatOptions {
  enabled?: boolean;
  maxStrikes?: number;
  onMaxStrikesReached?: () => void;
  onStrike?: (strikeCount: number, reason: string, type: AntiCheatViolationType) => void;
  onViolation?: (type: AntiCheatViolationType, details?: string) => void;
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
  onViolation,
}: UseAntiCheatOptions = {}) {
  const [strikes, setStrikes] = useState<number>(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentReason, setCurrentReason] = useState<string>("");
  const [currentType, setCurrentType] = useState<AntiCheatViolationType>("TAB_SWITCH");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);

  const strikesRef = useRef(0);
  strikesRef.current = strikes;

  const onMaxStrikesReachedRef = useRef(onMaxStrikesReached);
  onMaxStrikesReachedRef.current = onMaxStrikesReached;

  const onStrikeRef = useRef(onStrike);
  onStrikeRef.current = onStrike;

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  // Record a strike safely
  const triggerStrike = useCallback(
    (type: AntiCheatViolationType, reason: string) => {
      if (!enabled || isTerminated) return;

      const newStrikes = strikesRef.current + 1;
      setStrikes(newStrikes);
      setCurrentReason(reason);
      setCurrentType(type);
      setWarningModalOpen(true);

      // Play audio chime
      playWarningSound();

      // Change browser title to draw attention
      try {
        document.title = `⚠️ STRIKE ${newStrikes}/3: ${reason}`;
      } catch (_) {}

      onStrikeRef.current?.(newStrikes, reason, type);
      onViolationRef.current?.(type, reason);

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

  // Monitor visibility, blur & suspicious paste events
  useEffect(() => {
    if (!enabled || isTerminated) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerStrike("TAB_SWITCH", "Switched browser tab or minimized contest window");
        }, 300);
      }
    };

    const handleWindowBlur = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (document.hidden) return; // already caught by visibilitychange
        triggerStrike("WINDOW_BLUR", "Contest window lost focus (switched screen or opened dev tools)");
      }, 400);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") || "";
      if (text.length > 120) {
        triggerStrike(
          "SUSPICIOUS_PASTE",
          `Suspicious paste: large block of code pasted (${text.length} characters). Code must be authored within the contest.`
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("paste", handlePaste);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("paste", handlePaste);
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
    currentType,
    dismissWarning,
    isFullscreen,
    isTerminated,
    requestFullscreen,
    exitFullscreen,
    triggerStrike,
  };
}
