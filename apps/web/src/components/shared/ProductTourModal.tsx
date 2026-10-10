import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Brain,
  Swords,
  Building2,
  BookOpen,
  Flame,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  ExternalLink,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const TOUR_STORAGE_KEY = "intervue_tour_completed";

export function openProductTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("intervue:open-tour"));
  }
}

interface TourStep {
  step: number;
  badge: string;
  badgeColor: string;
  icon: any;
  title: string;
  headline: string;
  description: string;
  highlights: string[];
  actionLabel?: string;
  actionHref?: string;
  accentGradient: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    badge: "Platform Overview",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    icon: Sparkles,
    title: "Welcome to interVue",
    headline: "Your All-in-One Technical Interview Ecosystem",
    description:
      "interVue combines AI-driven technical mock interviews, real-time 1v1 multiplayer coding arenas, curated FAANG company prep kits, and multi-platform developer profiles into one unified workstation.",
    highlights: [
      "Role-tailored AI technical evaluations with automated scorecards",
      "Live 1v1 coding duels with Monaco editor, anti-cheat & test runner",
      "Unified LeetCode & Codeforces contest rating & heatmap sync",
    ],
    actionLabel: "Start Tour →",
    accentGradient: "from-blue-600/20 via-indigo-600/10 to-transparent",
  },
  {
    step: 2,
    badge: "AI Technical Interviews",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    icon: Brain,
    title: "AI Technical Mock Interviews",
    headline: "Deep Role-Specific Technical & Architectural Rounds",
    description:
      "Practice real technical rounds across Full Stack, Backend, Frontend, and System Design tracks. The AI interviewer challenges your design decisions, probes edge cases, and delivers actionable scorecards.",
    highlights: [
      "Specialized tracks: Full Stack, Backend, Frontend, System Design",
      "Comprehensive scorecards with skill ratings & actionable feedback",
      "Historical scorecard records to track your interview readiness",
    ],
    actionLabel: "Try AI Interview",
    actionHref: "/interview",
    accentGradient: "from-purple-600/20 via-pink-600/10 to-transparent",
  },
  {
    step: 3,
    badge: "Live Multiplayer Arena",
    badgeColor: "text-red-400 bg-red-500/10 border-red-500/25",
    icon: Swords,
    title: "1v1 Live Battle Arena",
    headline: "Compete Live Against Peers in Timed Coding Duels",
    description:
      "Train under real interview time constraints. Battle side-by-side with Monaco editor, run test cases against an automated judge, and track live standings with anti-cheat protection.",
    highlights: [
      "Synchronized real-time testcase runner with immediate verdicts",
      "Anti-cheat tab switch & blur tracking with spectator mode",
      "Head-to-head match analytics, winner celebrations & leaderboards",
    ],
    actionLabel: "Explore Arena",
    actionHref: "/rooms",
    accentGradient: "from-red-600/20 via-orange-600/10 to-transparent",
  },
  {
    step: 4,
    badge: "Targeted Prep",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    icon: Building2,
    title: "FAANG Company Prep Kits",
    headline: "Practice What Top Tech Companies Actually Ask",
    description:
      "Target Google, Meta, Amazon, Microsoft, and Uber with specialized question banks. Explore company tag frequency charts, realistic problem distributions, and interview patterns.",
    highlights: [
      "Company-specific question archives & tag distribution charts",
      "Problem frequency weights and difficulty classifications",
      "One-click workspace opening to code solutions with inline notes",
    ],
    actionLabel: "View Company Kits",
    actionHref: "/practice?view=company_kits",
    accentGradient: "from-amber-600/20 via-yellow-600/10 to-transparent",
  },
  {
    step: 5,
    badge: "Structured Curriculums",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    icon: BookOpen,
    title: "Prep Hub & DSA Roadmaps",
    headline: "Never Guess What Problem to Solve Next",
    description:
      "Master algorithmic patterns with industry-standard roadmaps including Striver's SDE Sheet, NeetCode 150, and Blind 75. Filter problems by data structures, tags, and maintain persistent notes.",
    highlights: [
      "Striver SDE Sheet, NeetCode 150 & Blind 75 built right in",
      "Filter by category, company tags, and acceptance rate",
      "Integrated Notepad to maintain hints, edge cases & approaches",
    ],
    actionLabel: "Open Prep Hub",
    actionHref: "/practice",
    accentGradient: "from-emerald-600/20 via-teal-600/10 to-transparent",
  },
  {
    step: 6,
    badge: "Unified Stats & Heatmap",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    icon: Flame,
    title: "Unified Profile & Activity Heatmap",
    headline: "Connect LeetCode & Codeforces into One Dashboard",
    description:
      "Bring all your coding activity under one roof. Connect your external handles to view a unified 365-day consistency heatmap, live contest ratings, and global rankings in one shareable profile.",
    highlights: [
      "LeetCode contest rating, contest rank & solved count tracking",
      "Codeforces current rating vs peak rating distinction",
      "Unified daily activity heatmap across all platforms with 1-click sync",
    ],
    actionLabel: "Visit Profile",
    actionHref: "/profile",
    accentGradient: "from-cyan-600/20 via-blue-600/10 to-transparent",
  },
];

export function ProductTourModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  // Check if tour should auto-open on first visit
  useEffect(() => {
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completed) {
        // Slight delay so the initial dashboard renders cleanly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Listen to custom event for replaying the tour
  useEffect(() => {
    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener("intervue:open-tour", handleOpen);
    return () => window.removeEventListener("intervue:open-tour", handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setIsOpen(false);
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAction = (href?: string) => {
    handleClose();
    if (href) {
      navigate(href);
    }
  };

  // Keyboard navigation: Escape to close, Left/Right arrows to step
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, handleClose]);

  if (!isOpen) return null;

  const stepData = TOUR_STEPS[currentStep];
  const StepIcon = stepData.icon;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl max-h-[92dvh] overflow-y-auto rounded-2xl bg-[#0E1015] border border-[#232731] shadow-2xl flex flex-col text-left transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glow */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-44 bg-gradient-to-b opacity-40 pointer-events-none transition-all duration-500 rounded-t-2xl",
            stepData.accentGradient
          )}
        />

        {/* Modal Top Bar: Step Indicator & Close Button */}
        <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-[#1E222B]/80 z-10">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border font-mono tracking-wide",
                stepData.badgeColor
              )}
            >
              <Compass className="w-3 h-3" />
              <span>{stepData.badge}</span>
            </span>
            <span className="text-xs text-[#707784] font-medium font-mono">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#707784] hover:text-[#F5F7FA] hover:bg-[#1A1D24] rounded-lg transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <span className="text-[11px] font-medium hidden sm:inline">Skip Tour</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="relative p-5 sm:p-7 space-y-5 z-10 flex-1">
          {/* Header Row: Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#14171F] border border-[#272B35] flex items-center justify-center shrink-0 shadow-inner">
              <StepIcon className="w-6 h-6 text-[#3B9CFF]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FA] tracking-tight">
                {stepData.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#3B9CFF] mt-0.5">
                {stepData.headline}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#A1A7B3] leading-relaxed">
            {stepData.description}
          </p>

          {/* Highlights Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#12141B] border border-[#1E222A] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#707784]">
              Key Highlights
            </p>
            <ul className="space-y-1.5 text-xs text-[#D1D5DB]">
              {stepData.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="relative p-4 sm:p-5 border-t border-[#1E222B] bg-[#0A0C0F]/80 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
          {/* Step Dots Indicator */}
          <div className="flex items-center gap-1.5 order-2 sm:order-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all cursor-pointer",
                  currentStep === idx
                    ? "w-6 bg-[#3B9CFF]"
                    : "w-2 bg-[#232731] hover:bg-[#3D4350]"
                )}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A7B3] hover:text-[#F5F7FA] bg-[#14171F] hover:bg-[#1C202B] border border-[#232731] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {stepData.actionHref && !isFirstStep && (
              <button
                onClick={() => handleAction(stepData.actionHref)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#F5F7FA] bg-[#1E232E] hover:bg-[#252B38] border border-[#2F3543] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{stepData.actionLabel}</span>
                <ExternalLink className="w-3 h-3 text-[#A1A7B3]" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#3B9CFF] hover:from-[#1D4ED8] hover:to-[#2563EB] shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>{isLastStep ? "Get Started 🚀" : isFirstStep ? "Start Tour →" : "Next Step"}</span>
              {!isLastStep && !isFirstStep && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
