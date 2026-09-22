import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviews } from "@/hooks/useInterviews";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  completed: "text-emerald-400 border-emerald-900/50 bg-emerald-950/20",
  active: "text-blue-400 border-blue-900/50 bg-blue-950/20",
  abandoned: "text-zinc-500 border-zinc-800 bg-zinc-900/50",
};

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"contests" | "interviews">("contests");
  const [contestFilter, setContestFilter] = useState<"all" | "won" | "coding" | "aptitude">("all");
  const [contests, setContests] = useState<ContestHistoryItem[]>([]);
  const [isContestsLoading, setIsContestsLoading] = useState(true);

  const { data: interviews, isLoading: isInterviewsLoading } = useInterviews();

  useEffect(() => {
    async function loadContests() {
      try {
        const res = await api.get("/rooms/history");
        setContests(res.data.contests || []);
      } catch (err) {
        console.error("Failed to load contest history:", err);
      } finally {
        setIsContestsLoading(false);
      }
    }
    loadContests();
  }, []);

  const filteredContests = contests.filter((c) => {
    if (contestFilter === "won") return c.myRank === 1;
    if (contestFilter === "coding") return c.type === "CODING";
    if (contestFilter === "aptitude") return c.type === "APTITUDE";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 p-6 sm:p-10 font-sans selection:bg-blue-600/30">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Contest & Interview History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Track past battle rankings, question-by-question scorecards, and AI interview evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/rooms">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-2 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
                <Swords className="w-3.5 h-3.5" />
                Battle Arena
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Selector & Contest Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-[#0D0F14] border border-zinc-800/90 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("contests")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "contests"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Contest Battles</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono text-zinc-400">
                {contests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("interviews")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "interviews"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>AI Mock Interviews</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono text-zinc-400">
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
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium capitalize border transition-all ${
                    contestFilter === fKey
                      ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                      : "bg-black/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
                <div className="py-20 text-center text-xs text-zinc-500 font-mono">
                  Loading contest battles...
                </div>
              ) : filteredContests.length === 0 ? (
                <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Swords className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">No battle records found</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Host a competition or join a friend's room code to start practicing aptitude and coding tests.
                    </p>
                  </div>
                  <Link to="/rooms">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl">
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
                        className={`rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 group relative overflow-hidden border ${
                          isChampion
                            ? "bg-[#0E1017] border-amber-500/40 hover:border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
                            : "bg-[#0D0F14] border-zinc-800/90 hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)]"
                        }`}
                      >
                        {/* 1st Place Amber Highlight Line */}
                        {isChampion && (
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        )}

                        <div className="space-y-3">
                          {/* Top Row: Room Code, Type, Host, Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-black/50 border border-zinc-800 text-zinc-300">
                                {c.code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-zinc-800 bg-black/30 text-zinc-400 font-medium uppercase"
                              >
                                {c.type}
                              </Badge>
                              {c.role === "HOST" && (
                                <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  Host
                                </span>
                              )}
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                c.status === "FINISHED"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : c.status === "ACTIVE"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400 animate-pulse"
                                  : "border-zinc-700 text-zinc-400"
                              }`}
                            >
                              {c.status}
                            </Badge>
                          </div>

                          {/* Room Title */}
                          <div>
                            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {c.title}
                            </h3>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 font-mono">
                              <span className="flex items-center gap-1 font-sans">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {new Date(c.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                {c.duration}m
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Strip */}
                        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-4 font-mono text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-500 block font-sans uppercase font-medium">Rank</span>
                              <span
                                className={`font-bold ${
                                  c.myRank === 1
                                    ? "text-amber-400"
                                    : c.myRank === 2
                                    ? "text-zinc-200"
                                    : "text-white"
                                }`}
                              >
                                {c.myRank === 1 ? "🥇 #1" : c.myRank === 2 ? "🥈 #2" : c.myRank === 3 ? "🥉 #3" : `#${c.myRank}`}
                                {!isSolo && <span className="text-[10px] text-zinc-500 font-normal"> / {c.totalParticipants}</span>}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-zinc-500 block font-sans uppercase font-medium">Score</span>
                              <span className="font-bold text-white">
                                {c.myScore} <span className="text-[10px] text-zinc-500">pts</span>
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-zinc-500 block font-sans uppercase font-medium">Solved</span>
                              <span className="font-bold text-emerald-400">
                                {c.mySolvedCount} <span className="text-[10px] text-zinc-500 font-normal">/ {c.totalQuestions}</span>
                              </span>
                            </div>
                          </div>

                          <Link to={`/rooms/${c.code}/results`}>
                            <Button
                              size="sm"
                              className="text-xs bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-500/60 rounded-xl gap-1 h-8 px-3 transition-all"
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
                <div className="py-20 text-center text-xs text-zinc-500 font-mono">
                  Loading interview history...
                </div>
              ) : !interviews || interviews.length === 0 ? (
                <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">No interview sessions yet</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Start your first AI mock interview session to practice behavioral and technical questions.
                    </p>
                  </div>
                  <Link to="/setup">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl">
                      Start New Interview
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviews.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-[#0D0F14] border border-zinc-800/90 hover:border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between gap-4 transition-all duration-300 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
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

                        <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {item.role}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
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

                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                        <div>
                          {item.score !== null && (
                            <span className="text-xs font-mono">
                              Score: <strong className="text-white text-sm">{item.score}/100</strong>
                            </span>
                          )}
                        </div>

                        <Link to={`/interview/${item.id}/evaluation`}>
                          <Button
                            size="sm"
                            className="text-xs bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl gap-1 h-8 px-3"
                          >
                            Evaluation
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
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