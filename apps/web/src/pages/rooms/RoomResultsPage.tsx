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
    loadAllResults();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080B] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono tracking-wide text-zinc-300">Generating Master Scorecard...</span>
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
    <div className="min-h-screen bg-[#07080B] text-zinc-100 p-6 sm:p-10 selection:bg-blue-600/30">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/history"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to History</span>
            </Link>
            <span className="text-zinc-600">•</span>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-xs">
              Room {room?.code || code}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {roomStatus === "ACTIVE" ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Standings (Active Contest)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Official Final Scorecard
              </span>
            )}
          </div>
        </div>

        {/* Hero Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {room?.title || "Contest Performance"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            {roomStatus === "ACTIVE"
              ? "Your test has been finalized. Review your question solutions below while other contestants conclude."
              : "Review your comprehensive score, solution breakdown, testcase outcomes, and official ranking."}
          </p>
        </div>

        {/* ─── KEY METRICS TILES ───────────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {/* Rank Card */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Your Rank
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-mono font-extrabold ${summary.rank === 1 ? "text-amber-400" : "text-white"}`}>
                  #{summary.rank}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  / {room?.totalParticipants || leaderboard.length}
                </span>
              </div>
            </div>

            {/* Total Score */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Total Score
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-blue-400">
                  {summary.score}
                </span>
                <span className="text-xs font-mono text-zinc-400 ml-1">pts</span>
              </div>
            </div>

            {/* Solved Count */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Questions Solved
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">
                  {summary.solvedCount}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  / {summary.totalQuestions}
                </span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Accuracy
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-white">
                  {summary.accuracy}%
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  {summary.totalAnswered} attempted
                </span>
              </div>
            </div>

            {/* Penalty Time */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-zinc-800 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Tie Penalty
              </span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-extrabold text-zinc-300">
                  {summary.penaltyTime}m
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Speed factor
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB NAVIGATION BAR ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
          <div className="flex items-center gap-2 p-1 bg-[#0D0F14] border border-zinc-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "review"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Questions & Solutions Review</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-zinc-400">
                {scorecard?.questions.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("standings")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "standings"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Podium & Full Leaderboard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-zinc-400">
                {leaderboard.length}
              </span>
            </button>
          </div>

          {/* Question Filter dropdown if on Review tab */}
          {activeTab === "review" && (
            <div className="flex items-center gap-1.5 text-xs">
              {(["all", "correct", "incorrect", "unattempted"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setQuestionFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize border transition-all ${
                    questionFilter === filterKey
                      ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                      : "bg-black/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
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
                <div className="p-12 text-center text-xs text-zinc-500 border border-zinc-800 rounded-2xl bg-[#0D0F14]">
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
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isSuccess
                          ? "bg-[#0A100D]/80 border-emerald-500/30 hover:border-emerald-500/50"
                          : isAttempted
                          ? "bg-[#120A0A]/80 border-red-500/30 hover:border-red-500/50"
                          : "bg-[#0D0F14] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-5 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isSuccess
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isAttempted
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono border-zinc-800 bg-black/40 text-zinc-400"
                              >
                                {isCoding ? "CODING" : q.assessmentQuestion?.subject || "MCQ"}
                              </Badge>
                              {q.assessmentQuestion?.topic && (
                                <span className="text-xs text-zinc-400 truncate">
                                  {q.assessmentQuestion.topic}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-blue-400 font-semibold">
                                {q.points} pts
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-white mt-1 truncate max-w-xl">
                              {isCoding
                                ? q.problem?.title
                                : q.assessmentQuestion?.question}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isSuccess ? (
                            <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 text-xs font-semibold gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              +{q.points} pts
                            </Badge>
                          ) : isAttempted ? (
                            <Badge className="bg-red-500/20 border-red-500/30 text-red-300 text-xs font-semibold gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              {isCoding ? "Failed" : "-1 pt"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs">
                              Unattempted
                            </Badge>
                          )}

                          <button className="p-1 text-zinc-400 hover:text-white">
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
                            className="border-t border-zinc-800/80 p-5 space-y-4 bg-black/40 text-xs"
                          >
                            {isCoding && q.problem ? (
                              // Coding Problem Solution Review
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-zinc-300">
                                    Difficulty: {q.problem.difficulty}
                                  </span>
                                  <div className="flex items-center gap-4 text-zinc-400 font-mono">
                                    <span>Verdict: <strong className={isSuccess ? "text-emerald-400" : "text-red-400"}>{q.bestVerdict}</strong></span>
                                    {q.latestRuntime !== undefined && <span>Runtime: {q.latestRuntime}ms</span>}
                                    {q.latestMemory !== undefined && <span>Memory: {q.latestMemory}KB</span>}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 leading-relaxed">
                                  Total submissions made: <strong>{q.submissionsCount || 0}</strong>.
                                  {isSuccess
                                    ? " Solution passed all test cases successfully."
                                    : " Problem was not solved within the contest limits."}
                                </div>
                              </div>
                            ) : q.assessmentQuestion ? (
                              // MCQ Solution Review
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                                              ? "bg-emerald-500/15 border-emerald-500/50 text-white font-medium"
                                              : isSelected
                                              ? "bg-red-500/15 border-red-500/50 text-red-200"
                                              : "bg-black/30 border-zinc-800 text-zinc-400"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center font-mono text-[10px]">
                                              {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span>{opt}</span>
                                          </div>

                                          <div className="flex items-center gap-2 font-mono text-[10px]">
                                            {isCorrectOpt && (
                                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Correct Answer
                                              </span>
                                            )}
                                            {isSelected && !isCorrectOpt && (
                                              <span className="text-red-400 font-bold flex items-center gap-1">
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
                                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed space-y-1">
                                    <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                                      <Brain className="w-4 h-4 text-blue-400" />
                                      Detailed Explanation:
                                    </div>
                                    <p>{q.assessmentQuestion.explanation}</p>
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
              {/* Top 3 Podium */}
              {leaderboard.length > 0 && (
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 items-end">
                  {/* 2nd Place */}
                  {top2 ? (
                    <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between h-48 order-1">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                          🥈
                        </div>
                        <div className="truncate max-w-[130px] font-semibold text-xs text-zinc-200">
                          {top2.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-base font-bold text-white">
                          {top2.score} pts
                        </span>
                        <p className="text-[11px] text-zinc-500 font-mono">{top2.solvedCount} solved</p>
                      </div>
                    </div>
                  ) : <div className="order-1" />}

                  {/* 1st Place Champion */}
                  {top1 && (
                    <div className="bg-[#0E1117] border border-amber-500/40 rounded-2xl p-6 text-center flex flex-col items-center justify-between h-56 shadow-[0_0_30px_rgba(245,158,11,0.1)] order-2">
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-lg font-bold text-amber-400">
                          🥇
                        </div>
                        <div className="truncate max-w-[150px] font-bold text-sm text-white">
                          {top1.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xl font-extrabold text-amber-400">
                          {top1.score} pts
                        </span>
                        <p className="text-xs text-zinc-400 font-mono">{top1.solvedCount} solved</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3 ? (
                    <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between h-44 order-3">
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                          🥉
                        </div>
                        <div className="truncate max-w-[130px] font-semibold text-xs text-zinc-300">
                          {top3.name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-base font-bold text-white">
                          {top3.score} pts
                        </span>
                        <p className="text-[11px] text-zinc-500 font-mono">{top3.solvedCount} solved</p>
                      </div>
                    </div>
                  ) : <div className="order-3" />}
                </div>
              )}

              {/* Full Standings Table */}
              <div className="border border-zinc-800/90 rounded-2xl overflow-hidden bg-[#0D0F14]">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Complete Ranked Standings
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    {leaderboard.length} Competitors
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4 font-mono w-16">Rank</th>
                      <th className="py-3.5 px-4">Competitor</th>
                      <th className="py-3.5 px-4 text-center">Solved</th>
                      <th className="py-3.5 px-4 text-center font-mono">Penalty</th>
                      <th className="py-3.5 px-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {leaderboard.map((entry) => {
                      const isMe = entry.userId === session?.user?.id;

                      return (
                        <tr
                          key={entry.userId}
                          className={`transition-colors ${
                            isMe
                              ? "bg-blue-600/15 text-white font-medium"
                              : "hover:bg-zinc-900/40 text-zinc-300"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-400">
                            #{entry.rank}
                          </td>
                          <td className="py-3.5 px-4 flex items-center gap-2.5">
                            {entry.image ? (
                              <img src={entry.image} className="w-6 h-6 rounded-full border border-zinc-700" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
                                {entry.name?.[0] || "U"}
                              </div>
                            )}
                            <span>
                              {entry.name} {isMe && <span className="text-blue-400 text-[11px] font-semibold">(You)</span>}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {entry.solvedCount}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-400">
                            {entry.penaltyTime}m
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
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
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-zinc-800/80">
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="border-zinc-800 bg-[#0D0F14] text-zinc-300 hover:bg-zinc-800 rounded-xl"
          >
            All Activity History
          </Button>

          <Button
            onClick={() => navigate("/rooms")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2"
          >
            <Swords className="w-4 h-4" />
            Battle Arena Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
