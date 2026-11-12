import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
  Swords,
  Layers,
  Code2,
  Brain,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  rank: number;
  participantId: string;
  userId: string;
  name: string;
  image?: string | null;
  role: string;
  score: number;
  solvedCount: number;
  penaltyTime: number;
}

interface ScorecardData {
  room: {
    id: string;
    code: string;
    title: string;
    type: "CODING" | "APTITUDE" | "MIXED";
    status: "WAITING" | "ACTIVE" | "FINISHED";
    duration: number;
    startTime?: string | null;
    endTime?: string | null;
    totalParticipants: number;
    totalQuestions: number;
  };
  userSummary: {
    rank: number;
    score: number;
    solvedCount: number;
    penaltyTime: number;
    accuracy: number;
    codingPoints: number;
    mcqPoints: number;
    totalAnswered: number;
    totalQuestions: number;
  };
  questions: Array<{
    id: string;
    orderIndex: number;
    type: "CODING" | "MCQ";
    points: number;
    problem?: {
      id: number;
      title: string;
      slug: string;
      difficulty: string;
    };
    isSolved?: boolean;
    bestVerdict?: string;
    submissionsCount?: number;
    latestRuntime?: number;
    latestMemory?: number;
    assessmentQuestion?: {
      id: string;
      category: string;
      subject: string;
      topic: string;
      difficulty: string;
      question: string;
      options: string[];
      correctOption?: number;
      explanation?: string;
    };
    myAnswer?: {
      selectedOption: number;
      isCorrect: boolean;
      pointsAwarded: number;
      answeredAt: string;
    } | null;
  }>;
}

export default function RoomResultsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<"review" | "standings">("review");
  const [questionFilter, setQuestionFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [roomStatus, setRoomStatus] = useState<"WAITING" | "ACTIVE" | "FINISHED">("FINISHED");
  const [isLoading, setIsLoading] = useState(true);

  // Live WebSocket sync so results page updates live if other participants submit or timer ends
  useRoomSocket({
    roomCode: code,
    user: session?.user,
    onContestEnd: (finalBoard) => {
      setRoomStatus("FINISHED");
      if (finalBoard && finalBoard.length > 0) {
        setLeaderboard(
          finalBoard.map((p, idx) => ({
            rank: p.rank ?? idx + 1,
            participantId: (p as any).participantId || p.userId,
            userId: p.userId,
            name: p.name,
            image: p.image,
            role: p.role,
            score: p.score,
            solvedCount: p.solvedCount,
            penaltyTime: (p as any).penaltyTime ?? 0,
          }))
        );
      }
    },
  });

  const loadAllResults = async () => {
    try {
      const [boardRes, cardRes] = await Promise.all([
        api.get(`/rooms/${code}/leaderboard`),
        api.get(`/rooms/${code}/scorecard`),
      ]);

      setLeaderboard(boardRes.data.leaderboard || []);
      setScorecard(cardRes.data);
      setRoomStatus(cardRes.data.room.status || "FINISHED");
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllResults();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--text-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--action-primary)] border-t-transparent animate-spin" />
          <span className="text-sm font-mono tracking-wide text-[var(--text-primary)]">Generating Master Scorecard...</span>
        </div>
      </div>
    );
  }

  const myEntry = leaderboard.find((p) => p.userId === session?.user?.id);
  const summary = scorecard?.userSummary;
  const room = scorecard?.room;

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Filter questions
  const filteredQuestions = (scorecard?.questions || []).filter((q) => {
    if (questionFilter === "all") return true;
    if (q.type === "CODING") {
      if (questionFilter === "correct") return q.isSolved;
      if (questionFilter === "incorrect") return !q.isSolved && (q.submissionsCount || 0) > 0;
      if (questionFilter === "unattempted") return (q.submissionsCount || 0) === 0;
    } else {
      if (questionFilter === "correct") return q.myAnswer?.isCorrect === true;
      if (questionFilter === "incorrect") return q.myAnswer && q.myAnswer.isCorrect === false;
      if (questionFilter === "unattempted") return !q.myAnswer;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] p-6 sm:p-10 selection:bg-[var(--action-primary)]/20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/history"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to History</span>
            </Link>
            <span className="text-[var(--text-muted)]">•</span>
            <Badge variant="outline" className="border-[var(--accent-text)]/30 bg-[var(--surface-selected)] text-[var(--accent-text)] font-mono text-xs">
              Room {room?.code || code}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {roomStatus === "ACTIVE" ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--status-success)]/10 border border-[var(--status-success)]/25 text-[var(--status-success)]">
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
                Live Standings (Active Contest)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/25 text-[var(--status-warning)]">
                Official Final Scorecard
              </span>
            )}
          </div>
        </div>

        {/* Hero Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            {room?.title || "Contest Performance"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            {roomStatus === "ACTIVE"
              ? "Your test has been finalized. Review your question solutions below while other contestants conclude."
              : "Review your comprehensive score, solution breakdown, testcase outcomes, and official ranking."}
          </p>
        </div>

        {/* ─── KEY METRICS TILES ───────────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {/* Rank Card */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                Your Rank
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-mono font-extrabold ${summary.rank === 1 ? "text-[var(--status-warning)]" : "text-[var(--text-primary)]"}`}>
                  #{summary.rank}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  / {room?.totalParticipants || leaderboard.length}
                </span>
              </div>
            </div>

            {/* Total Score */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                Total Score
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-[var(--accent-text)]">
                  {summary.score}
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)] ml-1">pts</span>
              </div>
            </div>

            {/* Solved Count */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                Questions Solved
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-mono font-extrabold text-[var(--status-success)]">
                  {summary.solvedCount}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  / {summary.totalQuestions}
                </span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                Accuracy
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">
                  {summary.accuracy}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  {summary.totalAnswered} attempted
                </span>
              </div>
            </div>

            {/* Penalty Time */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                Tie Penalty
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">
                  {summary.penaltyTime}m
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Speed factor
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB NAVIGATION BAR ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-3 gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("review")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === "review"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/35 shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Questions Review</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-muted)] font-mono text-[var(--text-secondary)]">
                {scorecard?.questions.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("standings")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === "standings"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/35 shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>Leaderboard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-muted)] font-mono text-[var(--text-secondary)]">
                {leaderboard.length}
              </span>
            </button>
          </div>

          {/* Question Filter buttons if on Review tab */}
          {activeTab === "review" && (
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(["all", "correct", "incorrect", "unattempted"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setQuestionFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize border transition-all shrink-0 cursor-pointer ${
                    questionFilter === filterKey
                      ? "bg-[var(--surface-selected)] border-[var(--border-control)] text-[var(--text-primary)] font-semibold"
                      : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-control)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── TAB CONTENT ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "review" ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl bg-[var(--surface)]">
                  No questions match the "{questionFilter}" filter.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isCoding = q.type === "CODING";
                  const isExpanded = expandedQuestionId === q.id;

                  // Verdict / Correctness badge
                  let isSuccess = false;
                  let isAttempted = false;

                  if (isCoding) {
                    isSuccess = q.isSolved === true;
                    isAttempted = (q.submissionsCount || 0) > 0;
                  } else {
                    isSuccess = q.myAnswer?.isCorrect === true;
                    isAttempted = q.myAnswer != null;
                  }

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-[var(--surface)] ${
                        isSuccess
                          ? "border-[var(--status-success)]/35 hover:border-[var(--status-success)]/55"
                          : isAttempted
                          ? "border-[var(--status-danger)]/35 hover:border-[var(--status-danger)]/55"
                          : "border-[var(--border-subtle)] hover:border-[var(--border-control)]"
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[var(--surface-hover)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isSuccess
                                ? "bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30"
                                : isAttempted
                                ? "bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30"
                                : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                              >
                                {isCoding ? "CODING" : q.assessmentQuestion?.subject || "MCQ"}
                              </Badge>
                              {q.assessmentQuestion?.topic && (
                                <span className="text-xs text-[var(--text-secondary)] truncate">
                                  {q.assessmentQuestion.topic}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-[var(--accent-text)] font-semibold">
                                {q.points} pts
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-1 line-clamp-2 max-w-xl">
                              {isCoding
                                ? q.problem?.title
                                : q.assessmentQuestion?.question}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isSuccess ? (
                            <Badge className="bg-[var(--status-success)]/15 border-[var(--status-success)]/30 text-[var(--status-success)] text-xs font-semibold gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              +{q.points} pts
                            </Badge>
                          ) : isAttempted ? (
                            <Badge className="bg-[var(--status-danger)]/15 border-[var(--status-danger)]/30 text-[var(--status-danger)] text-xs font-semibold gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              {isCoding ? "Failed" : "-1 pt"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-[var(--border-subtle)] text-[var(--text-muted)] text-xs">
                              Unattempted
                            </Badge>
                          )}

                          <button className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Expanded Body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-[var(--border-subtle)] p-5 space-y-4 bg-[var(--surface-muted)]/60 text-xs"
                          >
                            {isCoding && q.problem ? (
                              // Coding Problem Solution Review
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    Difficulty: {q.problem.difficulty}
                                  </span>
                                  <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono">
                                    <span>Verdict: <strong className={isSuccess ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}>{q.bestVerdict}</strong></span>
                                    {q.latestRuntime !== undefined && <span>Runtime: {q.latestRuntime}ms</span>}
                                    {q.latestMemory !== undefined && <span>Memory: {q.latestMemory}KB</span>}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] leading-relaxed">
                                  Total submissions made: <strong className="text-[var(--text-primary)]">{q.submissionsCount || 0}</strong>.
                                  {isSuccess
                                    ? " Solution passed all test cases successfully."
                                    : " Problem was not solved within the contest limits."}
                                </div>
                              </div>
                            ) : q.assessmentQuestion ? (
                              // MCQ Solution Review
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                    Options:
                                  </span>
                                  <div className="space-y-2">
                                    {q.assessmentQuestion.options.map((opt, optIdx) => {
                                      const isSelected = q.myAnswer?.selectedOption === optIdx;
                                      const isCorrectOpt = q.assessmentQuestion?.correctOption === optIdx;

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                            isCorrectOpt
                                              ? "bg-[var(--status-success)]/12 border-[var(--status-success)]/45 text-[var(--text-primary)] font-medium"
                                              : isSelected
                                              ? "bg-[var(--status-danger)]/12 border-[var(--status-danger)]/45 text-[var(--status-danger)]"
                                              : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-md border border-[var(--border-control)] bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center font-mono text-[10px]">
                                              {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span>{opt}</span>
                                          </div>

                                          <div className="flex items-center gap-2 font-mono text-[10px]">
                                            {isCorrectOpt && (
                                              <span className="text-[var(--status-success)] font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Correct Answer
                                              </span>
                                            )}
                                            {isSelected && !isCorrectOpt && (
                                              <span className="text-[var(--status-danger)] font-bold flex items-center gap-1">
                                                <XCircle className="w-3.5 h-3.5" />
                                                Your Choice
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Explanation Card */}
                                {q.assessmentQuestion.explanation && (
                                  <div className="p-4 rounded-xl bg-[var(--surface-selected)] border border-[var(--accent-text)]/25 text-xs text-[var(--text-primary)] leading-relaxed space-y-1">
                                    <div className="font-semibold text-[var(--accent-text)] flex items-center gap-1.5">
                                      <Brain className="w-4 h-4 text-[var(--accent-text)]" />
                                      Detailed Explanation:
                                    </div>
                                    <p className="text-[var(--text-secondary)]">{q.assessmentQuestion.explanation}</p>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </motion.div>
          ) : (
            // ─── STANDINGS TAB ────────────────────────────────────────────
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
            >
              {/* Top 3 Podium or Single Winner Card */}
              {leaderboard.length === 1 && top1 ? (
                <div className="max-w-xs mx-auto pt-4">
                  <div className="bg-[var(--surface)] border border-[var(--status-warning)]/40 rounded-2xl p-6 text-center flex flex-col items-center justify-between shadow-sm gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--status-warning)]/15 border border-[var(--status-warning)]/30 flex items-center justify-center text-lg font-bold text-[var(--status-warning)]">
                      🥇
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)] px-2">
                      {top1.name}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-xl font-extrabold text-[var(--status-warning)]">
                        {top1.score} pts
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{top1.solvedCount} solved</p>
                    </div>
                  </div>
                </div>
              ) : leaderboard.length > 1 ? (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto pt-6 items-end">
                  {/* 2nd Place */}
                  {top2 ? (
                    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-between h-48 order-1">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] border border-[var(--border-control)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                          🥈
                        </div>
                        <div className="truncate max-w-[130px] font-semibold text-xs text-[var(--text-primary)]">
                          {top2.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-sm sm:text-base font-bold text-[var(--text-primary)]">
                          {top2.score} pts
                        </span>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">{top2.solvedCount} solved</p>
                      </div>
                    </div>
                  ) : <div className="order-1" />}

                  {/* 1st Place Champion */}
                  {top1 && (
                    <div className="bg-[var(--surface)] border border-[var(--status-warning)]/40 rounded-2xl p-5 sm:p-6 text-center flex flex-col items-center justify-between h-56 shadow-sm order-2">
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[var(--status-warning)]/15 border border-[var(--status-warning)]/30 flex items-center justify-center text-lg font-bold text-[var(--status-warning)]">
                          🥇
                        </div>
                        <div className="truncate max-w-[150px] font-bold text-sm text-[var(--text-primary)]">
                          {top1.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-lg sm:text-xl font-extrabold text-[var(--status-warning)]">
                          {top1.score} pts
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">{top1.solvedCount} solved</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3 ? (
                    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-between h-44 order-3">
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded-full bg-[var(--surface-muted)] border border-[var(--border-control)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                          🥉
                        </div>
                        <div className="truncate max-w-[130px] font-semibold text-xs text-[var(--text-primary)]">
                          {top3.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-sm sm:text-base font-bold text-[var(--text-primary)]">
                          {top3.score} pts
                        </span>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">{top3.solvedCount} solved</p>
                      </div>
                    </div>
                  ) : <div className="order-3" />}
                </div>
              ) : null}

              {/* Full Standings Table */}
              <div className="border border-[var(--border-subtle)] rounded-2xl overflow-x-auto bg-[var(--surface)]">
                <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Complete Ranked Standings
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {leaderboard.length} Competitors
                  </span>
                </div>

                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="py-3.5 px-4 font-mono w-16">Rank</th>
                      <th className="py-3.5 px-4">Competitor</th>
                      <th className="py-3.5 px-4 text-center">Solved</th>
                      <th className="py-3.5 px-4 text-center font-mono">Penalty</th>
                      <th className="py-3.5 px-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {leaderboard.map((entry) => {
                      const isMe = entry.userId === session?.user?.id;

                      return (
                        <tr
                          key={entry.userId}
                          className={`transition-colors ${
                            isMe
                              ? "bg-[var(--surface-selected)] text-[var(--text-primary)] font-medium"
                              : "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-secondary)]">
                            #{entry.rank}
                          </td>
                          <td className="py-3.5 px-4 flex items-center gap-2.5">
                            {entry.image ? (
                              <img src={entry.image} className="w-6 h-6 rounded-full border border-[var(--border-control)]" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border-control)] flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                                {entry.name?.[0] || "U"}
                              </div>
                            )}
                            <span className="text-[var(--text-primary)]">
                              {entry.name} {isMe && <span className="text-[var(--accent-text)] text-[11px] font-semibold">(You)</span>}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {entry.solvedCount}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[var(--text-secondary)]">
                            {entry.penaltyTime}m
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                            {entry.score} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Action Toolbar */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-[var(--border-subtle)]">
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl"
          >
            All Activity History
          </Button>

          <Button
            onClick={() => navigate("/rooms")}
            className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <Swords className="w-4 h-4" />
            Battle Arena Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
