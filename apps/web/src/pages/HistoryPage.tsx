import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviews } from "@/hooks/useInterviews";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInterviewScore } from "@/lib/score";
import {
  Swords,
  Calendar,
  Clock,
  ArrowRight,
  Code2,
  Brain,
  History,
  Sparkles,
  Trophy,
  Medal,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ContestHistoryItem {
  id: string;
  code: string;
  title: string;
  type: "CODING" | "APTITUDE" | "MIXED";
  status: "WAITING" | "ACTIVE" | "FINISHED";
  duration: number;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  joinedAt: string;
  role: "HOST" | "PARTICIPANT";
  myScore: number;
  mySolvedCount: number;
  myRank: number;
  totalParticipants: number;
  totalQuestions: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-[var(--status-success)] border-[var(--status-success)]/30 bg-[var(--status-success-subtle)]",
  active: "text-[var(--accent-text)] border-[var(--border-subtle)] bg-[var(--surface-selected)]",
  abandoned: "text-[var(--text-muted)] border-[var(--border-subtle)] bg-[var(--surface-muted)]",
};

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"contests" | "interviews">("contests");
  const [contestFilter, setContestFilter] = useState<"all" | "won" | "coding" | "aptitude">("all");
  const [contests, setContests] = useState<ContestHistoryItem[]>([]);
  const [isContestsLoading, setIsContestsLoading] = useState(true);
  const [contestsError, setContestsError] = useState<string | null>(null);

  const {
    data: interviews,
    isLoading: isInterviewsLoading,
    isError: isInterviewsError,
    refetch: refetchInterviews,
  } = useInterviews();

  const loadContests = useCallback(async () => {
    try {
      setIsContestsLoading(true);
      setContestsError(null);
      const res = await api.get("/rooms/history");
      setContests(res.data.contests || []);
    } catch (err) {
      console.error("Failed to load contest history:", err);
      setContestsError("Unable to load contest history right now.");
    } finally {
      setIsContestsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  const filteredContests = contests.filter((c) => {
    if (contestFilter === "won") return c.myRank === 1;
    if (contestFilter === "coding") return c.type === "CODING";
    if (contestFilter === "aptitude") return c.type === "APTITUDE";
    return true;
  });

  return (
    <div className="min-h-full bg-[var(--canvas)] text-[var(--text-primary)] p-6 sm:p-10 font-sans selection:bg-[var(--surface-selected)]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-subtle)] text-[var(--accent-text)]">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Contest & Interview History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Track past battle rankings, question-by-question scorecards, and AI interview evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/rooms">
              <Button size="sm" className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs gap-2 rounded-lg shadow-sm transition-colors">
                <Swords className="w-3.5 h-3.5" />
                Battle Arena
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Selector & Contest Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("contests")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "contests"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Contest Battles</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] font-mono text-[var(--text-muted)]">
                {contests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("interviews")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "interviews"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--border-subtle)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>AI Mock Interviews</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] font-mono text-[var(--text-muted)]">
                {interviews?.length || 0}
              </span>
            </button>
          </div>

          {activeTab === "contests" && contests.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              {(["all", "won", "coding", "aptitude"] as const).map((fKey) => (
                <button
                  key={fKey}
                  onClick={() => setContestFilter(fKey)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium capitalize border transition-colors cursor-pointer ${
                    contestFilter === fKey
                      ? "bg-[var(--surface-selected)] border-[var(--border-control)] text-[var(--accent-text)] font-semibold"
                      : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-control)]"
                  }`}
                >
                  {fKey === "won" ? "🏆 1st Place" : fKey}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "contests" ? (
            <motion.div
              key="contests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {isContestsLoading ? (
                <div className="py-20 text-center text-xs text-[var(--text-muted)] font-mono">
                  Loading contest battles...
                </div>
              ) : contestsError ? (
                <div
                  role="alert"
                  className="bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/30 rounded-xl p-8 text-center space-y-3"
                >
                  <AlertCircle className="w-6 h-6 text-[var(--status-danger)] mx-auto" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Failed to load contest battles</p>
                  <p className="text-xs text-[var(--text-secondary)]">{contestsError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadContests}
                    className="border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </Button>
                </div>
              ) : filteredContests.length === 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                    <Swords className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">No battle records found</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                      Host a competition or join a friend's room code to start practicing aptitude and coding tests.
                    </p>
                  </div>
                  <Link to="/rooms">
                    <Button size="sm" className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs rounded-lg">
                      Enter Battle Arena
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContests.map((c) => {
                    const isChampion = c.myRank === 1 && c.totalParticipants > 1;
                    const isSolo = c.totalParticipants === 1;

                    return (
                      <div
                        key={c.id}
                        className={`rounded-xl p-6 flex flex-col justify-between gap-5 transition-all duration-200 group relative overflow-hidden border shadow-sm ${
                          isChampion
                            ? "bg-[var(--surface)] border-[var(--status-warning)]/40 hover:border-[var(--status-warning)]/70"
                            : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-control)]"
                        }`}
                      >
                        {/* 1st Place Amber Highlight Line */}
                        {isChampion && (
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--status-warning)] to-transparent" />
                        )}

                        <div className="space-y-3">
                          {/* Top Row: Room Code, Type, Host, Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                                {c.code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium uppercase"
                              >
                                {c.type}
                              </Badge>
                              {c.role === "HOST" && (
                                <span className="text-[10px] font-medium text-[var(--status-warning)] bg-[var(--status-warning-subtle)] px-2 py-0.5 rounded-md border border-[var(--status-warning)]/30">
                                  Host
                                </span>
                              )}
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                c.status === "FINISHED"
                                  ? "border-[var(--status-success)]/30 bg-[var(--status-success-subtle)] text-[var(--status-success)]"
                                  : c.status === "ACTIVE"
                                  ? "border-[var(--border-subtle)] bg-[var(--surface-selected)] text-[var(--accent-text)]"
                                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                              }`}
                            >
                              {c.status}
                            </Badge>
                          </div>

                          {/* Room Title */}
                          <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                              {c.title}
                            </h3>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                              <span className="flex items-center gap-1 font-sans">
                                <Calendar className="w-3 h-3" />
                                {new Date(c.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {c.duration}m
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Strip */}
                        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                          <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                            <div>
                              <span className="text-[10px] text-[var(--text-muted)] block font-sans uppercase font-medium">Rank</span>
                              <span
                                className={`font-bold ${
                                  c.myRank === 1
                                    ? "text-[var(--status-warning)]"
                                    : "text-[var(--text-primary)]"
                                }`}
                              >
                                {c.myRank === 1 ? "🥇 #1" : c.myRank === 2 ? "🥈 #2" : c.myRank === 3 ? "🥉 #3" : `#${c.myRank}`}
                                {!isSolo && <span className="text-[10px] text-[var(--text-muted)] font-normal"> / {c.totalParticipants}</span>}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[var(--text-muted)] block font-sans uppercase font-medium">Score</span>
                              <span className="font-bold text-[var(--text-primary)]">
                                {c.myScore} <span className="text-[10px] text-[var(--text-muted)]">pts</span>
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[var(--text-muted)] block font-sans uppercase font-medium">Solved</span>
                              <span className="font-bold text-[var(--status-success)]">
                                {c.mySolvedCount} <span className="text-[10px] text-[var(--text-muted)] font-normal">/ {c.totalQuestions}</span>
                              </span>
                            </div>
                          </div>

                          <Link to={`/rooms/${c.code}/results`}>
                            <Button
                              size="sm"
                              className="text-xs bg-[var(--surface-selected)] hover:opacity-90 text-[var(--accent-text)] border border-[var(--border-subtle)] rounded-lg gap-1 h-8 px-3 transition-all"
                            >
                              <span>Master Scorecard</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="interviews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {isInterviewsLoading ? (
                <div className="py-20 text-center text-xs text-[var(--text-muted)] font-mono">
                  Loading interview history...
                </div>
              ) : isInterviewsError ? (
                <div
                  role="alert"
                  className="bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/30 rounded-xl p-8 text-center space-y-3"
                >
                  <AlertCircle className="w-6 h-6 text-[var(--status-danger)] mx-auto" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Failed to load interview history</p>
                  <p className="text-xs text-[var(--text-secondary)]">Unable to fetch your past AI mock interviews right now.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchInterviews()}
                    className="border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </Button>
                </div>
              ) : !interviews || interviews.length === 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">No interview sessions yet</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                      Start your first AI mock interview session to practice behavioral and technical questions.
                    </p>
                  </div>
                  <Link to="/interview">
                    <Button size="sm" className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs rounded-lg">
                      Start New Interview
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviews.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] rounded-xl p-6 flex flex-col justify-between gap-4 transition-all duration-200 group shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-text)] font-semibold">
                            {item.mode} Interview
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              STATUS_COLORS[item.status.toLowerCase()] || STATUS_COLORS.abandoned
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                          {item.role}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
                          <span>{item.difficulty}</span>
                          <span>•</span>
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <div>
                          {formatInterviewScore(item.score) && (
                            <span className="text-xs font-mono text-[var(--text-secondary)]">
                              Score: <strong className="text-[var(--text-primary)] text-sm tabular-nums">{formatInterviewScore(item.score)!.formatted}</strong>
                            </span>
                          )}
                        </div>

                        {item.status?.toLowerCase() === "completed" ? (
                          <Link to={`/results/${item.id}`}>
                            <Button
                              size="sm"
                              className="text-xs bg-[var(--surface-selected)] hover:opacity-90 text-[var(--accent-text)] border border-[var(--border-subtle)] rounded-lg gap-1 h-8 px-3"
                            >
                              Evaluation
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {item.status?.toLowerCase() === "abandoned" ? "Not evaluated" : "In progress"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}