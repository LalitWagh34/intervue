import { useProfile } from "@/hooks/useProfile";
import { useInterviews } from "@/hooks/useInterviews";
import { Link } from "react-router-dom";
import { Mic, Code2, MessageSquare, Flame, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_COLORS: Record<string, string> = {
  voice: "text-blue-400",
  text: "text-green-400",
  coding: "text-amber-400",
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
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {profile?.fullName ? `Hey, ${profile.fullName.split(" ")[0]} 👋` : "Welcome back 👋"}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Ready to practice? Pick a mode and get started.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Total sessions",
            value: interviewsLoading ? "—" : interviews?.length ?? 0,
            sub: "all time",
          },
          {
            label: "Avg score",
            value: avgScore !== null ? `${avgScore}/10` : "—",
            sub: "completed sessions",
          },
          {
            label: "Streak",
            value: profileLoading ? "—" : `${profile?.streakCount ?? 0}d`,
            sub: "keep it up",
            icon: Flame,
          },
          {
            label: "Target role",
            value: profile?.targetRole?.split(" ")[0] || "—",
            sub: profile?.experienceLevel || "set in profile",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-950 border border-zinc-900 rounded-xl p-5"
          >
            <p className="text-zinc-500 text-xs mb-3">{stat.label}</p>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-zinc-600 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Start a session */}
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
        Start a session
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link to="/practice?mode=voice">
          <div className="group bg-zinc-950 border border-zinc-900 hover:border-amber-400/30 rounded-xl p-5 transition-all cursor-pointer">
            <div className="w-9 h-9 bg-blue-400/10 rounded-lg flex items-center justify-center mb-4">
              <Mic className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-white font-medium text-sm mb-1">Voice interview</p>
            <p className="text-zinc-600 text-xs">Speak with an AI interviewer</p>
            <div className="flex items-center gap-1 mt-4 text-amber-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Start <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
        <Link to="/coding">
          <div className="group bg-zinc-950 border border-zinc-900 hover:border-amber-400/30 rounded-xl p-5 transition-all cursor-pointer">
            <div className="w-9 h-9 bg-amber-400/10 rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-white font-medium text-sm mb-1">Coding practice</p>
            <p className="text-zinc-600 text-xs">Solve problems with AI feedback</p>
            <div className="flex items-center gap-1 mt-4 text-amber-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Start <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
        <Link to="/chat">
          <div className="group bg-zinc-950 border border-zinc-900 hover:border-amber-400/30 rounded-xl p-5 transition-all cursor-pointer">
            <div className="w-9 h-9 bg-green-400/10 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-white font-medium text-sm mb-1">AI prep chat</p>
            <p className="text-zinc-600 text-xs">Ask anything about interviews</p>
            <div className="flex items-center gap-1 mt-4 text-amber-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Start <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent sessions */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Recent sessions
        </h2>
        <Link to="/history" className="text-xs text-amber-400 hover:text-amber-300">
          View all →
        </Link>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
        {interviewsLoading ? (
          <div className="p-6 text-zinc-600 text-sm">Loading...</div>
        ) : interviews?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-600 text-sm">No sessions yet</p>
            <Link to="/practice" className="text-amber-400 text-xs mt-1 inline-block hover:text-amber-300">
              Start your first interview →
            </Link>
          </div>
        ) : (
          <div>
            {interviews?.slice(0, 5).map((interview: any, i: number) => (
              <Link
                key={interview.id}
                to={`/results/${interview.id}`}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900 transition-colors",
                  i !== 0 && "border-t border-zinc-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <Mic className={cn("w-3.5 h-3.5", MODE_COLORS[interview.mode] || "text-zinc-400")} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{interview.role}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <p className="text-zinc-600 text-xs">
                        {new Date(interview.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span className="text-zinc-800">·</span>
                      <span className={cn("text-xs capitalize", MODE_COLORS[interview.mode] || "text-zinc-500")}>
                        {interview.mode}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border",
                    interview.status === "completed"
                      ? "text-green-400 border-green-900 bg-green-400/5"
                      : interview.status === "abandoned"
                      ? "text-zinc-600 border-zinc-800"
                      : "text-blue-400 border-blue-900 bg-blue-400/5"
                  )}>
                    {interview.status}
                  </span>
                  {interview.score && (
                    <span className="text-amber-400 font-semibold text-sm">
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