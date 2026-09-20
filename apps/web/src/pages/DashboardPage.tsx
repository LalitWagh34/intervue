import { useProfile } from "@/hooks/useProfile";
import { useInterviews } from "@/hooks/useInterviews";
import { Link } from "react-router-dom";
import {
  Mic,
  Code2,
  MessageSquare,
  Flame,
  ArrowRight,
  Clock,
  Swords,
  Trophy,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_COLORS: Record<string, string> = {
  voice: "text-blue-400",
  text: "text-emerald-400",
  coding: "text-cyan-400",
  system_design: "text-purple-400",
};

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: interviews, isLoading: interviewsLoading } = useInterviews();

  const completed = interviews?.filter((i: any) => i.status === "completed") || [];
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum: number, i: any) => sum + (i.score || 0), 0) /
            completed.length
        )
      : null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto text-slate-100 font-sans">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
              TakeUForward Candidate
            </span>
            <span className="text-slate-400 text-xs font-medium">
              Target: {profile?.targetRole || "Software Development Engineer"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {profile?.fullName ? `Welcome back, ${profile.fullName.split(" ")[0]}` : "Welcome back 👋"}
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Continue your daily practice routine or jump into live Battle Arenas.
          </p>
        </div>

        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 bg-[#327cf6] hover:bg-[#2563eb] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(50,124,246,0.35)] transition-all self-start md:self-auto"
        >
          <Swords className="w-4 h-4 text-cyan-300" />
          <span>Quick Battle Match</span>
        </Link>
      </div>

      {/* ─── Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Sessions",
            value: interviewsLoading ? "—" : interviews?.length ?? 0,
            sub: "mock interviews",
            icon: Zap,
            color: "text-blue-400",
          },
          {
            label: "Average Score",
            value: avgScore !== null ? `${avgScore}/10` : "—",
            sub: "technical evaluation",
            icon: Trophy,
            color: "text-emerald-400",
          },
          {
            label: "Practice Streak",
            value: profileLoading ? "—" : `${profile?.streakCount ?? 1} Days`,
            sub: "consistency bonus",
            icon: Flame,
            color: "text-amber-400",
          },
          {
            label: "Target Role",
            value: profile?.targetRole?.split(" ")[0] || "SDE",
            sub: profile?.experienceLevel || "Level 1",
            icon: Sparkles,
            color: "text-purple-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl bg-[#0a0b10] border border-white/[0.08] relative overflow-hidden tuf-glass-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              {stat.value}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Featured Banner: TakeUForward Battle Arena ─────────────── */}
      <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0e111a] to-violet-950/30 border border-blue-500/30 relative overflow-hidden shadow-[0_0_35px_rgba(50,124,246,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Multiplayer Battle Arena
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Compete Head-to-Head in Live Timed Coding Rooms
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Create a private room with friends or join public matches. Solve curated problems with
              live synchronized timers and real-time scoreboards.
            </p>
          </div>

          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 bg-[#327cf6] hover:bg-[#2563eb] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(50,124,246,0.4)] transition-all shrink-0 self-start sm:self-auto"
          >
            <Swords className="w-4 h-4" />
            <span>Create / Join Room</span>
          </Link>
        </div>
      </div>

      {/* ─── Practice Launchers ─────────────────────────────────────── */}
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        Quick Practice Centers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link to="/practice">
          <div className="p-5 rounded-2xl bg-[#0a0b10] border border-white/[0.08] hover:border-[#327cf6]/50 transition-all tuf-glass-hover group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Striver DSA Sheets</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Step-by-step topic roadmaps from basics to advanced DP and graphs.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[#38bdf8] text-xs font-bold">
              Open Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        <Link to="/coding">
          <div className="p-5 rounded-2xl bg-[#0a0b10] border border-white/[0.08] hover:border-[#327cf6]/50 transition-all tuf-glass-hover group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Monaco Coding IDE</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Live code judge with multi-language starter templates and test breakdown.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-cyan-400 text-xs font-bold">
              Start Solving <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        <Link to="/practice">
          <div className="p-5 rounded-2xl bg-[#0a0b10] border border-white/[0.08] hover:border-[#327cf6]/50 transition-all tuf-glass-hover group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">AI Mock Interviews</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Adaptive role-specific interviewers with automated scorecards.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-purple-400 text-xs font-bold">
              Start Session <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* ─── Recent Sessions ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Recent Activity & Sessions
        </h2>
        <Link to="/history" className="text-xs font-bold text-[#38bdf8] hover:underline">
          View all history →
        </Link>
      </div>

      <div className="rounded-2xl bg-[#0a0b10] border border-white/[0.08] overflow-hidden">
        {interviewsLoading ? (
          <div className="p-6 text-slate-500 text-xs font-mono">Loading sessions...</div>
        ) : interviews?.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-xs">No practice sessions recorded yet</p>
            <Link
              to="/practice"
              className="text-[#38bdf8] text-xs font-bold mt-2 inline-block hover:underline"
            >
              Start your first practice session →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {interviews?.slice(0, 5).map((interview: any) => (
              <Link
                key={interview.id}
                to={`/results/${interview.id}`}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Mic
                      className={cn(
                        "w-4 h-4",
                        MODE_COLORS[interview.mode] || "text-slate-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-bold">
                      {interview.role}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(interview.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{interview.mode} mode</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide",
                      interview.status === "completed"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-slate-400 border-slate-700 bg-white/[0.02]"
                    )}
                  >
                    {interview.status}
                  </span>

                  {interview.score && (
                    <span className="text-[#38bdf8] font-mono font-bold text-xs">
                      {interview.score}/10
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}