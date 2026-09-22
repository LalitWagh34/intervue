import { useState } from "react";
import { useProfile, useProfileStats } from "@/hooks/useProfile";
import { useInterviews } from "@/hooks/useInterviews";
import { Link } from "react-router-dom";
import {
  Code2,
  Flame,
  ArrowRight,
  Clock,
  Swords,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyTask {
  id: string;
  label: string;
  completed: boolean;
  category: string;
}

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: stats } = useProfileStats();
  const { data: interviews, isLoading: interviewsLoading } = useInterviews();

  // Daily Planner State
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: "1", label: "Solve Two Sum & Valid Parentheses", completed: true, category: "Arrays & Stack" },
    { id: "2", label: "Revise DBMS Normalization (1NF to BCNF)", completed: true, category: "Core CS" },
    { id: "3", label: "Practice Kadane's Algorithm & Subarray Sum", completed: false, category: "Dynamic Programming" },
    { id: "4", label: "Compete in a Quick Battle Arena match", completed: false, category: "Contest" },
  ]);

  const toggleTask = (id: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const totalSolved = stats?.dsaProgress?.totalSolved ?? 2;
  const totalProblems = stats?.dsaProgress?.totalProblems ?? 21;
  const progressPercent = Math.round((totalSolved / Math.max(totalProblems, 1)) * 100);
  const currentStreak = stats?.consistency?.currentStreak ?? (profile?.streakCount || 7);

  const firstName = profile?.fullName ? profile.fullName.split(" ")[0] : "Candidate";

  return (
    <div className="min-h-screen bg-[#07080B] text-[#EDEDED] font-sans p-6 sm:p-8 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
      {/* ─── 1. Dashboard TUF Hero ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1B1F27]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30">
              Welcome back
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#8A909E] mt-1">
            You're <span className="text-[#327CF6] font-semibold">{progressPercent}%</span> through your primary DSA roadmap. Keep the momentum going!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/practice"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs font-semibold shadow-md shadow-[#327CF6]/20 transition-all flex items-center gap-1.5"
          >
            <span>Continue Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/rooms"
            className="px-4 py-2.5 rounded-xl bg-[#0D0F14] hover:bg-[#14161B] border border-[#1B1F27] hover:border-[#272B33] text-xs font-semibold text-[#EDEDED] transition-all flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>Battle Arena</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. Compact Stat Cards (TUF Dark Cards) ──────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* DSA Progress */}
        <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] hover:border-[#272B33] transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#8A909E] uppercase tracking-wider">
              DSA Progress
            </span>
            <Layers className="w-4 h-4 text-[#327CF6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {progressPercent}%
          </p>
          <p className="text-xs text-[#10B981] mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% this week
          </p>
        </div>

        {/* Problems Solved */}
        <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] hover:border-[#272B33] transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#8A909E] uppercase tracking-wider">
              Problems Solved
            </span>
            <Code2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {totalSolved}
          </p>
          <p className="text-xs text-[#8A909E] mt-1 font-medium">
            of {totalProblems} core problems
          </p>
        </div>

        {/* Practice Streak */}
        <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] hover:border-[#272B33] transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#8A909E] uppercase tracking-wider">
              Active Streak
            </span>
            <Flame className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#F59E0B] tracking-tight flex items-baseline gap-1 font-mono">
            {currentStreak} <span className="text-xs font-normal text-[#8A909E]">days</span>
          </p>
          <p className="text-xs text-[#8A909E] mt-1 font-medium">consistency bonus</p>
        </div>

        {/* Target Track */}
        <div className="p-5 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] hover:border-[#272B33] transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#8A909E] uppercase tracking-wider">
              Target Track
            </span>
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
            {profile?.targetRole?.split(" ")[0] || "SDE"}
          </p>
          <p className="text-xs text-[#8A909E] mt-1 font-medium capitalize truncate">
            {profile?.experienceLevel || "Mid-Level"}
          </p>
        </div>
      </div>

      {/* ─── 3. Grid: Continue Learning + Today's Plan (matching TUF) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Learning Card */}
        <div className="p-6 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] shadow-sm flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#8A909E] uppercase tracking-wider">
                Continue Learning
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30">
                In Progress
              </span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
              Step 3: Arrays & Sliding Window
            </h2>
            <p className="text-xs text-[#8A909E] mb-5">
              Kadane's algorithm, prefix sums, and two-pointer interview patterns.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8A909E] font-medium">Topic Completion</span>
                <span className="font-mono text-white font-bold">78%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1B1F27] overflow-hidden">
                <div
                  className="h-full bg-[#327CF6] rounded-full transition-all duration-500"
                  style={{ width: "78%" }}
                />
              </div>
              <span className="text-[11px] text-[#707784] font-mono block">23 of 30 problems completed</span>
            </div>
          </div>

          <Link
            to="/coding/maximum-subarray"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0C10] border border-[#1B1F27] hover:border-[#327CF6]/40 text-xs font-semibold text-white transition-all group-hover:bg-[#12151D]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Next: Maximum Subarray (Kadane's Algorithm)</span>
            </div>
            <div className="flex items-center gap-1 text-[#327CF6] group-hover:translate-x-1 transition-transform">
              <span>Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Planly Daily Planner (matching TUF planly.png) */}
        <div className="p-6 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#8A909E] uppercase tracking-wider">
                Planly Planner
              </span>
              <span className="text-xs font-mono text-[#8A909E]">
                {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length} Completed
              </span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight mb-4">
              Today's Task Checklist
            </h2>

            <div className="space-y-2.5">
              {dailyTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    task.completed
                      ? "bg-[#0A0C10]/60 border-[#1B1F27] opacity-60"
                      : "bg-[#0A0C10] border-[#1B1F27] hover:border-[#327CF6]/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-md border border-[#707784] hover:border-[#327CF6] shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        task.completed ? "line-through text-[#707784]" : "text-[#EDEDED]"
                      )}
                    >
                      {task.label}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#707784] bg-[#07080B] px-2 py-0.5 rounded border border-[#1B1F27]">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1B1F27] flex items-center justify-between text-[11px] text-[#707784]">
            <span>Click any item to toggle completion</span>
            <Link to="/practice" className="text-[#327CF6] hover:underline font-semibold">
              Browse More Tasks →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 4. Quick Arena Challenge Banner ─────────────────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0D0F14] via-[#0E1526] to-[#0D0F14] border border-[#327CF6]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#327CF6]/15 border border-[#327CF6]/30 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6 text-[#327CF6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Competitive Battle Arena
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#8A909E] mt-0.5">
              Host or join assessment rooms with real-time countdown timers and live leaderboards.
            </p>
          </div>
        </div>

        <Link
          to="/rooms"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs font-semibold shadow-md shadow-[#327CF6]/20 transition-all flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
        >
          <Swords className="w-3.5 h-3.5 text-cyan-300" />
          <span>Join a Battle Room</span>
        </Link>
      </div>

      {/* ─── 5. Recent Sessions / Activity ───────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0D0F14] border border-[#1B1F27] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#327CF6]" />
            <span>Recent Sessions & Interview Logs</span>
          </h3>
          <Link to="/history" className="text-xs text-[#327CF6] hover:underline font-semibold">
            View All History →
          </Link>
        </div>

        {interviewsLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#327CF6] border-t-transparent animate-spin" />
          </div>
        ) : !interviews?.length ? (
          <div className="py-8 text-center text-xs text-[#707784]">
            No interview sessions yet. Launch your first mock interview in the Prep Hub!
          </div>
        ) : (
          <div className="divide-y divide-[#1B1F27]">
            {interviews.slice(0, 4).map((item: any) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between text-xs hover:bg-[#12151D] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === "completed" ? "bg-[#10B981]" : "bg-[#F59E0B]"
                    )}
                  />
                  <div>
                    <p className="font-semibold text-white">{item.role}</p>
                    <p className="text-[10px] text-[#707784] font-mono capitalize">
                      {item.difficulty} • {item.mode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.score !== null && item.score !== undefined && (
                    <span className="font-mono text-xs font-bold text-[#10B981]">
                      {item.score}/10
                    </span>
                  )}
                  <Link
                    to={item.status === "completed" ? `/results/${item.id}` : `/interview/${item.id}`}
                    className="text-[#327CF6] hover:underline font-semibold"
                  >
                    {item.status === "completed" ? "Review →" : "Resume →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}