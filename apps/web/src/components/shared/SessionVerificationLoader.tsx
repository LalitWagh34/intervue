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
    if (elapsed < 5000) {
      return "Connecting to secure cloud engine...";
    }
    return "Waking up cloud service (first load may take a moment)...";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060709] text-white px-4 select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(50,124,246,0.12)_0%,rgba(6,7,9,0)_65%)] pointer-events-none" />

      {/* Center Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Tile with Pulsing Radar Rings */}
        <div className="relative mb-6">
          {/* Subtle Outer Pulsing Wave */}
          <div className="absolute -inset-2.5 rounded-2xl bg-[#327CF6]/20 blur-md animate-pulse" />
          <div className="absolute -inset-5 rounded-3xl bg-[#327CF6]/10 animate-ping opacity-35" style={{ animationDuration: "2.5s" }} />

          {/* Core Brand Tile */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/50 flex items-center justify-center shadow-xl shadow-[#327CF6]/25">
            <BrandIcon className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2">
          {title}
        </h2>

        {/* Dynamic Context Message */}
        <p className="text-xs text-[#8B92A0] max-w-[280px] leading-relaxed mb-6 min-h-[36px] flex items-center justify-center transition-opacity duration-300">
          {getProgressiveMessage()}
        </p>

        {/* Sleek Indeterminate Progress Bar */}
        <div className="w-48 h-1 bg-[#12141A] rounded-full overflow-hidden border border-[#181A20] relative mb-6">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#327CF6] to-transparent rounded-full animate-[progressSlide_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D0E12] border border-[#181A20] text-[11px] text-[#7A808C]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL Encrypted Verification</span>
        </div>

        {/* Escape Hatch (Appears if Render cold-start takes > 7s) */}
        {showEscape && (
          <div className="mt-8 pt-4 border-t border-[#181A20]/60 flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <p className="text-[11px] text-zinc-500">
              Taking longer than usual?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 text-xs text-[#8B92A0] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload</span>
              </button>
              <span className="text-zinc-600">•</span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-[#327CF6] hover:text-[#5B95F7] font-medium transition-colors"
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
