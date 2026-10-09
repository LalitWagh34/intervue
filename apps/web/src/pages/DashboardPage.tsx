import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../lib/auth";
import { api } from "@/lib/api";
import { TargetCompanyTracker } from "@/components/shared/TargetCompanyTracker";
import {
  Brain,
  Flame,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  BookOpen,
  Swords,
  Building2,
  History,
  NotebookPen,
  Bookmark,
  Award,
  Layers,
  Clock,
  ChevronRight,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = session?.user?.name?.split(" ")[0] || "Candidate";

  return (
    <div className="w-full min-h-screen bg-[#060709] text-[#F3F4F6] selection:bg-[#327CF6]/30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Hero Header & Quick Actions ───────────────────────── */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-[#181A20]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-[#327CF6]/10 text-[#327CF6] border border-[#327CF6]/20 font-mono">
                <Target className="w-3 h-3" />
                Active Readiness Sprint
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">{firstName}</span>.
            </h1>
            <p className="text-sm text-[#8B92A0] max-w-2xl leading-relaxed">
              Your interview prep control center. Track your company readiness loops, review AI evaluations, and hone your technical rounds.
            </p>
          </div>

          {/* Primary Launch Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              to="/interview"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#327CF6]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>Start AI Interview</span>
            </Link>

            <Link
              to="/practice"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0D0E12] hover:bg-[#13161F] border border-[#181A20] hover:border-[#327CF6]/40 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#327CF6]" />
              <span>Prep Hub</span>
            </Link>

            <Link
              to="/rooms"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0D0E12] hover:bg-[#13161F] border border-[#181A20] hover:border-red-500/40 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <Swords className="w-4 h-4 text-red-400" />
              <span>Battle Arena</span>
            </Link>
          </div>
        </header>

        {/* ─── Metric Stat Cards (4-Grid) ────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Interview Average Score */}
          <div
            onClick={() => navigate("/history")}
            className="group p-5 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#327CF6]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[#8B92A0]">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Interview Score
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/20 font-mono">
                Avg Rating
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {stats?.avgScore || 0}
              </span>
              <span className="text-sm font-mono text-zinc-500">/ 100</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Based on completed simulations
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#327CF6]" />
            </div>
          </div>

          {/* 2. Practice Streak */}
          <div
            onClick={() => navigate("/rewards")}
            className="group p-5 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#F59E0B]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[#8B92A0]">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Practice Streak
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
              </div>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {stats?.streakCount || 0}
              </span>
              <span className="text-sm text-[#8B92A0] font-medium">consecutive days</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Keep your momentum alive</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#F59E0B]" />
            </div>
          </div>

          {/* 3. Problems Mastered */}
          <div
            onClick={() => navigate("/practice")}
            className="group p-5 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#10B981]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[#8B92A0]">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Problems Mastered
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {stats?.solvedCount || 0}
              </span>
              <span className="text-sm text-zinc-500 font-mono">solved</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Tracked & verified problems</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#10B981]" />
            </div>
          </div>

          {/* 4. Full AI Simulations */}
          <div
            onClick={() => navigate("/history")}
            className="group p-5 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#8B5CF6]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[#8B92A0]">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Full Simulations
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                <Brain className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {stats?.simulationsCount || 0}
              </span>
              <span className="text-sm text-zinc-500 font-mono">rounds</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Detailed scorecards logged</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#8B5CF6]" />
            </div>
          </div>
        </section>

        {/* ─── Target Company Readiness Tracker ──────────────────── */}
        <section className="rounded-2xl bg-[#0A0C10] border border-[#181A20] p-6 shadow-sm">
          <TargetCompanyTracker />
        </section>

        {/* ─── Dual Column: Recent Evaluations & Skill Readiness ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Recent Interview Scorecards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-[#327CF6]" />
                    Recent Interview Scorecards
                  </h3>
                  <p className="text-xs text-[#8B92A0] mt-0.5">
                    Evaluated AI interviews and performance breakdowns
                  </p>
                </div>
                <Link
                  to="/history"
                  className="text-xs text-[#327CF6] hover:text-[#5B95F8] font-semibold flex items-center gap-1 transition-colors"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {stats?.recentInterviews && stats.recentInterviews.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {stats.recentInterviews.map((int: any) => {
                    const score = int.scorecard?.overallScore ?? int.score;
                    const isCompleted = int.status === "completed" || int.status === "COMPLETED";

                    return (
                      <div
                        key={int.id}
                        onClick={() => navigate("/history")}
                        className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-[#327CF6] transition-colors">
                              {int.role || int.title || "Technical Round"}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                                isCompleted
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                                  : "bg-blue-950/40 text-blue-400 border border-blue-800/40"
                              )}
                            >
                              {int.status || "Completed"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8B92A0] font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {int.createdAt ? new Date(int.createdAt).toLocaleDateString() : "Recent"}
                            </span>
                            <span>•</span>
                            <span>{int.difficulty || "Standard"} Loop</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {score !== null && score !== undefined && (
                            <div className="text-right">
                              <span className="text-lg font-black font-mono text-white">
                                {score}%
                              </span>
                              <p className="text-[10px] text-zinc-500 uppercase font-mono">
                                Overall Score
                              </p>
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-lg bg-[#181A20] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-[#327CF6] transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state when no interviews yet */
                <div className="p-8 rounded-xl bg-[#0D0E12] border border-dashed border-[#181A20] text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#327CF6]/10 border border-[#327CF6]/20 flex items-center justify-center text-[#327CF6]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">
                      No interview simulations yet
                    </h4>
                    <p className="text-xs text-[#8B92A0] max-w-sm">
                      Take your first full-length AI mock session to receive an instant comprehensive scorecard and feedback breakdown.
                    </p>
                  </div>
                  <Link
                    to="/interview"
                    className="mt-2 px-4 py-2 rounded-xl bg-[#327CF6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-all shadow-md shadow-[#327CF6]/20"
                  >
                    Simulate Technical Interview
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Prep Launchpad */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                Quick Launchpad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/practice?view=company_kits"
                  className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-800/40 text-[#8B5CF6] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#327CF6] transition-colors">
                      Company Prep Kits
                    </h4>
                    <p className="text-xs text-[#8B92A0] mt-0.5">
                      Targeted rounds for Google, Amazon, Meta & Microsoft.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/notes"
                  className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <NotebookPen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#F59E0B] transition-colors">
                      Notes & Key Takeaways
                    </h4>
                    <p className="text-xs text-[#8B92A0] mt-0.5">
                      Review personal solution notes, patterns, and cheat-sheets.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/bookmarks"
                  className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[#327CF6] flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#327CF6] transition-colors">
                      Saved Bookmarks
                    </h4>
                    <p className="text-xs text-[#8B92A0] mt-0.5">
                      Quickly review saved high-yield questions before interviews.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/chat"
                  className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#10B981]/40 transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[#10B981] flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#10B981] transition-colors">
                      AI Tech Mentor
                    </h4>
                    <p className="text-xs text-[#8B92A0] mt-0.5">
                      Ask complex architectural, system design, or DSA questions.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Skill Readiness & Recommendations */}
          <div className="space-y-6">
            {/* Domain Mastery Breakdown */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Domain Readiness
                </h3>
                <p className="text-xs text-[#8B92A0] mt-0.5">
                  Performance across core technical pillars
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { label: "Data Structures & Algos", value: stats?.skills?.dsa ?? 75, color: "from-blue-600 to-blue-400" },
                  { label: "System Design & Architecture", value: stats?.skills?.systemDesign ?? 65, color: "from-violet-600 to-violet-400" },
                  { label: "Operating Systems", value: stats?.skills?.os ?? 70, color: "from-emerald-600 to-emerald-400" },
                  { label: "DBMS & Query Optimization", value: stats?.skills?.dbms ?? 80, color: "from-amber-600 to-amber-400" },
                  { label: "Computer Networks", value: stats?.skills?.networks ?? 68, color: "from-cyan-600 to-cyan-400" },
                  { label: "Behavioral & Leadership", value: stats?.skills?.behavioral ?? 72, color: "from-pink-600 to-pink-400" },
                ].map((skill) => (
                  <div key={skill.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">{skill.label}</span>
                      <span className="font-mono font-bold text-white">{skill.value}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#181A20] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", skill.color)}
                        style={{ width: `${Math.min(100, Math.max(5, skill.value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Targeted Next Focus Suggestions */}
            {stats?.recommendations && stats.recommendations.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#327CF6]" />
                    Recommended Next Focus
                  </h3>
                  <p className="text-xs text-[#8B92A0] mt-0.5">
                    Based on your readiness radar
                  </p>
                </div>

                <div className="space-y-2.5">
                  {stats.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => navigate("/practice")}
                      className="p-3.5 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#327CF6] uppercase tracking-wider font-mono">
                          {rec.type}
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {rec.level}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-[#327CF6] transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-[#8B92A0] mt-1 line-clamp-2">
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
