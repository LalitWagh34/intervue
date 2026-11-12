import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { TargetCompanyTracker } from "@/components/shared/TargetCompanyTracker";
import { DailyTargetTracker } from "@/components/shared/DailyTargetTracker";
import {
  Brain,
  Flame,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Building2,
  History,
  Award,
  Layers,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInterviewScore } from "@/lib/score";

interface DashboardStats {
  streakCount: number;
  solvedCount: number;
  simulationsCount: number;
  recentInterviews: any[];
  avgScore: number;
  trend?: number[];
  skills?: {
    dsa: number;
    systemDesign: number;
    os: number;
    dbms: number;
    networks: number;
    behavioral: number;
  };
  recommendations?: {
    id: string;
    title: string;
    type: string;
    level: string;
    description: string;
    action: string;
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: profileStats } = useProfileStats();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/profile/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      setError("Unable to load your dashboard metrics right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const rawFirstName = session?.user?.name?.split(" ")[0] || "Candidate";
  const firstName = rawFirstName.trim();
  const streak = Math.max(
    profileStats?.profile?.streakCount ?? 0,
    profileStats?.consistency?.currentStreak ?? 0,
    stats?.streakCount ?? 0
  );

  const simulationsCount = stats?.simulationsCount ?? 0;
  const solvedCount = stats?.solvedCount ?? 0;
  const formattedAvg = stats?.avgScore ? formatInterviewScore(stats.avgScore)?.formatted : null;

  const recommendedTitle =
    simulationsCount === 0
      ? "Take your first AI technical interview"
      : solvedCount < 10
      ? "Build momentum on core DSA & company sheets"
      : "Continue your interview & company loop prep";

  const recommendedReason =
    simulationsCount === 0
      ? "Establish an evaluation baseline across problem solving, system design, and communication."
      : solvedCount < 10
      ? `You have logged ${solvedCount} solved problem${solvedCount === 1 ? "" : "s"} so far. Work through curated sheets to sharpen pattern recognition.`
      : `You have logged ${solvedCount} solved problems across ${simulationsCount} mock simulation${simulationsCount === 1 ? "" : "s"}${formattedAvg ? ` (avg ${formattedAvg})` : ""}.`;

  const recommendedHref = simulationsCount === 0 ? "/interview" : "/practice";
  const recommendedCta =
    recommendedHref === "/interview" ? "Start AI Interview" : "Open Practice Hub";

  return (
    <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)] selection:bg-[var(--surface-selected)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ─── Hero Header ───────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Your interview preparation workspace. Focus on today&apos;s next step, track company coverage, and review recent scorecards.
            </p>
          </div>

          {/* Primary Launch Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/practice"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Practice Hub</span>
            </Link>
            <Link
              to="/interview"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>Start AI Interview</span>
            </Link>
          </div>
        </header>

        {/* ─── Today's Practice & Daily Targets ──────────────────── */}
        <section aria-label="Today's practice and daily targets" className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Today's Recommended Next Action */}
          <div className="xl:col-span-7 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-sm flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-subtle)] text-[11px] font-mono font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Today&apos;s Practice
                </span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                    <Flame className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                    {streak}d streak
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {recommendedTitle}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  {recommendedReason}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={recommendedHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <span>{recommendedCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={recommendedHref === "/interview" ? "/practice" : "/interview"}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>{recommendedHref === "/interview" ? "Browse DSA Sheets" : "Run Mock Interview"}</span>
                </Link>
              </div>
            </div>

            {/* Quick Workflow Shortcuts */}
            <div className="pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Link
                to="/practice"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">Company Kits</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              </Link>
              <Link
                to="/interview"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Award className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">Mock Evaluation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              </Link>
              <Link
                to="/chat"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Brain className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">AI Mentor</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              </Link>
            </div>
          </div>

          {/* Right: Integrated Daily Targets */}
          <div className="xl:col-span-5">
            <DailyTargetTracker />
          </div>
        </section>

        {/* ─── Evidence-Based Progress Summary ───────────────────── */}
        {loading && !stats ? (
          <section
            aria-label="Loading dashboard metrics"
            role="status"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] space-y-4 animate-pulse"
              >
                <div className="h-3.5 w-28 rounded bg-[var(--surface-muted)]" />
                <div className="h-9 w-20 rounded bg-[var(--surface-muted)]" />
                <div className="h-3 w-36 rounded bg-[var(--surface-muted)]" />
              </div>
            ))}
          </section>
        ) : error && !stats ? (
          <section
            role="alert"
            className="p-5 rounded-xl bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--status-danger)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Failed to load dashboard metrics</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </section>
        ) : (
        <section aria-label="Progress summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1. Interview Average Score */}
          <Link
            to="/history"
            className="group p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold tracking-wide">
                Interview Score
              </span>
              <TrendingUp className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                {formatInterviewScore(stats?.avgScore ?? 0)?.value ?? 0}
              </span>
              <span className="text-sm font-mono text-[var(--text-muted)]">
                / {formatInterviewScore(stats?.avgScore ?? 0)?.max ?? 10}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Based on completed simulations</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-text)]" />
            </div>
          </Link>

          {/* 2. Practice Streak */}
          <Link
            to="/practice"
            className="group p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold tracking-wide">
                Practice Streak
              </span>
              <Flame className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--status-warning)] transition-colors" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                {streak}
              </span>
              <span className="text-sm text-[var(--text-secondary)] font-medium">
                {streak === 1 ? "consecutive day" : "consecutive days"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Keep your momentum alive</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-text)]" />
            </div>
          </Link>

          {/* 3. Problems Solved */}
          <Link
            to="/practice"
            className="group p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold tracking-wide">
                Problems Solved
              </span>
              <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--status-success)] transition-colors" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                {stats?.solvedCount || 0}
              </span>
              <span className="text-sm text-[var(--text-muted)] font-mono">solved</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Logged &amp; self-tracked problems</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-text)]" />
            </div>
          </Link>

          {/* 4. Full AI Simulations */}
          <Link
            to="/history"
            className="group p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold tracking-wide">
                Full Simulations
              </span>
              <Brain className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                {stats?.simulationsCount || 0}
              </span>
              <span className="text-sm text-[var(--text-muted)] font-mono">rounds</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Detailed scorecards logged</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-text)]" />
            </div>
          </Link>
        </section>
        )}

        {/* ─── Compact Company Coverage ──────────────────────────── */}
        <section className="rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-sm">
          <TargetCompanyTracker />
        </section>

        {/* ─── Recent Interview Scorecards (Direct Links) ────────── */}
        <section className="p-5 sm:p-6 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--accent-text)]" />
                Recent Interview Scorecards
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Evaluated AI interviews and direct links to performance breakdowns
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs text-[var(--accent-text)] hover:opacity-80 font-semibold flex items-center gap-1 transition-opacity"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading && !stats ? (
            <div className="space-y-3 pt-1" role="status" aria-label="Loading recent interviews">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] animate-pulse flex items-center justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-44 rounded bg-[var(--surface-hover)]" />
                    <div className="h-3 w-32 rounded bg-[var(--surface-hover)]" />
                  </div>
                  <div className="h-6 w-14 rounded bg-[var(--surface-hover)]" />
                </div>
              ))}
            </div>
          ) : error && !stats ? (
            <div className="p-6 rounded-xl bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/30 text-center space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">{error}</p>
              <button
                type="button"
                onClick={fetchStats}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : stats?.recentInterviews && stats.recentInterviews.length > 0 ? (
            <div className="space-y-3 pt-1">
              {stats.recentInterviews.map((int: any) => {
                const score = int.scorecard?.overallScore ?? int.score;
                const formattedScore = formatInterviewScore(score);
                const isCompleted = int.status === "completed" || int.status === "COMPLETED";
                const targetTo = isCompleted && int.id ? `/results/${int.id}` : "/history";

                return (
                  <Link
                    key={int.id}
                    to={targetTo}
                    className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                          {int.role || int.title || "Technical Round"}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border",
                            isCompleted
                              ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30"
                              : "bg-[var(--surface-selected)] text-[var(--accent-text)] border-[var(--border-subtle)]"
                          )}
                        >
                          {int.status || "Completed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          {int.createdAt ? new Date(int.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                        <span>•</span>
                        <span>{int.difficulty || "Standard"} Loop</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {formattedScore && (
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-[var(--text-primary)] tabular-nums">
                            {formattedScore.formatted}
                          </span>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase font-mono">
                            Overall Score
                          </p>
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--on-primary)] group-hover:bg-[var(--action-primary)] transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty state when no interviews yet */
            <div className="p-8 rounded-xl bg-[var(--surface-muted)] border border-dashed border-[var(--border-subtle)] text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-selected)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-text)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  No interview simulations yet
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Take your first full-length AI mock session to receive an instant comprehensive scorecard and feedback breakdown.
                </p>
              </div>
              <Link
                to="/interview"
                className="mt-2 px-4 py-2 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs font-semibold transition-colors shadow-sm"
              >
                Simulate Technical Interview
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
