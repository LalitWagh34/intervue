import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { BrandIcon } from "./BrandLogo";

interface SessionVerificationLoaderProps {
  title?: string;
  subtitle?: string;
  showEscapeHatchAfterMs?: number;
}

export function SessionVerificationLoader({
  title = "Checking your session...",
  subtitle,
  showEscapeHatchAfterMs = 7000,
}: SessionVerificationLoaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showEscape, setShowEscape] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      setElapsed(diff);
      if (diff >= showEscapeHatchAfterMs) {
        setShowEscape(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [showEscapeHatchAfterMs]);

  // Progressive descriptive hints based on wait time
  const getProgressiveMessage = () => {
    if (subtitle) return subtitle;
    if (elapsed < 2000) {
      return "Verifying secure credentials & workspace...";
    }

    return "Waking up cloud service (first load may take a moment)...";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 select-none">
      {/* Center Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Tile with Pulsing Radar Rings */}
        <div className="relative mb-6">
          {/* Subtle Outer Pulsing Wave */}
          <div className="absolute -inset-2.5 rounded-2xl bg-[var(--surface-muted)] blur-md animate-pulse" />
          <div className="absolute -inset-5 rounded-3xl bg-[var(--border-subtle)] animate-ping opacity-35" style={{ animationDuration: "2.5s" }} />

          {/* Core Brand Tile */}
          <div className="relative w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-control)] flex items-center justify-center shadow-lg">
            <BrandIcon className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight mb-2">
          {title}
        </h2>

        {/* Dynamic Context Message */}
        <p className="text-xs text-[var(--text-secondary)] max-w-[280px] leading-relaxed mb-6 min-h-[36px] flex items-center justify-center transition-opacity duration-300">
          {getProgressiveMessage()}
        </p>

        {/* Sleek Indeterminate Progress Bar */}
        <div className="w-48 h-1 bg-[var(--surface-muted)] rounded-full overflow-hidden border border-[var(--border-subtle)] relative mb-6">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[var(--text-primary)] to-transparent rounded-full animate-[progressSlide_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Security Badge */}


        {/* Escape Hatch (Appears if Render cold-start takes > 7s) */}
        {showEscape && (
          <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <p className="text-[11px] text-[var(--text-muted)]">
              Taking longer than usual?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload</span>
              </button>
              <span className="text-[var(--text-muted)]">•</span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-[var(--accent-text)] hover:underline font-medium transition-colors"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe animation inline style for smooth progress sliding */}
      <style>{`
        @keyframes progressSlide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}

export default SessionVerificationLoader;
