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
  Trophy,
  Layers,
  Sparkles,
  Zap,
  CheckSquare,
  Square,
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
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats } = useProfileStats();
  const { data: interviews, isLoading: interviewsLoading } = useInterviews();

  // Daily Planner State (Section 18)
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

  const completed = interviews?.filter((i: any) => i.status === "completed") || [];
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum: number, i: any) => sum + (i.score || 0), 0) /
            completed.length
        )
      : null;

  const totalSolved = stats?.dsaProgress?.totalSolved ?? 1;
  const totalProblems = stats?.dsaProgress?.totalProblems ?? 6;
  const progressPercent = Math.round((totalSolved / Math.max(totalProblems, 1)) * 100);
  const currentStreak = stats?.consistency?.currentStreak ?? (profile?.streakCount || 1);

  const firstName = profile?.fullName ? profile.fullName.split(" ")[0] : "Candidate";

  return (
    <div className="p-6 md:p-10 text-[#f5f7fa] font-sans space-y-8">
      {/* ─── 1. Dashboard Compact Hero (Section 15) ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e2229]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#f5f7fa] tracking-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-sm text-[#a1a7b3] mt-1">
            You're <span className="text-[#3b9cff] font-semibold">{progressPercent}%</span> through your primary DSA roadmap. Keep the momentum going!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/practice"
            className="px-4 py-2 rounded-xl bg-[#2f80ed] hover:bg-[#3b9cff] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(47,128,237,0.3)] transition-all flex items-center gap-1.5"
          >
            <span>Continue Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/rooms"
            className="px-4 py-2 rounded-xl bg-[#14161b] hover:bg-[#191c22] border border-[#272b33] hover:border-[#3b9cff]/40 text-xs font-semibold text-[#f5f7fa] transition-all flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>Battle Arena</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. Compact Stat Cards (Section 16) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* DSA Progress */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#707784] uppercase tracking-wider">
              DSA Progress
            </span>
            <Layers className="w-4 h-4 text-[#3b9cff]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#f5f7fa] tracking-tight">
            {progressPercent}%
          </p>
          <p className="text-xs text-[#22c55e] mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% this week
          </p>
        </div>

        {/* Problems Solved */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#707784] uppercase tracking-wider">
              Problems Solved
            </span>
            <Code2 className="w-4 h-4 text-[#22c55e]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#f5f7fa] tracking-tight">
            {totalSolved}
          </p>
          <p className="text-xs text-[#a1a7b3] mt-1 font-medium">
            of {totalProblems} core problems
          </p>
        </div>

        {/* Practice Streak */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#707784] uppercase tracking-wider">
              Active Streak
            </span>
            <Flame className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]/20" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#f59e0b] tracking-tight flex items-baseline gap-1">
            {currentStreak} <span className="text-sm font-normal text-[#a1a7b3]">days</span>
          </p>
          <p className="text-xs text-[#a1a7b3] mt-1 font-medium">consistency bonus</p>
        </div>

        {/* Target Role & Level */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#707784] uppercase tracking-wider">
              Target Track
            </span>
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#f5f7fa] tracking-tight truncate">
            {profile?.targetRole?.split(" ")[0] || "SDE"}
          </p>
          <p className="text-xs text-[#a1a7b3] mt-1 font-medium capitalize truncate">
            {profile?.experienceLevel || "Mid-Level"}
          </p>
        </div>
      </div>

      {/* ─── 3. Grid: Continue Learning + Today's Plan ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Learning Card (Section 17) */}
        <div className="p-6 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#707784] uppercase tracking-wider">
                Continue Learning
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#2f80ed]/10 text-[#3b9cff] border border-[#2f80ed]/20">
                In Progress
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#f5f7fa] tracking-tight mb-1">
              Step 3: Arrays & Sliding Window
            </h2>
            <p className="text-xs text-[#a1a7b3] mb-5">
              Kadane's algorithm, prefix sums, and two-pointer interview patterns.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#a1a7b3] font-medium">Topic Completion</span>
                <span className="font-mono text-[#f5f7fa] font-bold">78%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1e2229] overflow-hidden">
                <div
                  className="h-full bg-[#2f80ed] rounded-full transition-all duration-500"
                  style={{ width: "78%" }}
                />
              </div>
              <span className="text-[11px] text-[#707784] font-mono block">23 of 30 problems completed</span>
            </div>
          </div>

          <Link
            to="/coding/maximum-subarray"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#101216] border border-[#1e2229] hover:border-[#3b9cff]/40 text-xs font-semibold text-[#f5f7fa] transition-all group-hover:bg-[#191c22]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span>Next: Maximum Subarray (Kadane's Algorithm)</span>
            </div>
            <div className="flex items-center gap-1 text-[#3b9cff] group-hover:translate-x-1 transition-transform">
              <span>Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Today's Daily Planner (Section 18) */}
        <div className="p-6 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#707784] uppercase tracking-wider">
                Today's Plan
              </span>
              <span className="text-xs font-mono text-[#a1a7b3]">
                {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length} Completed
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#f5f7fa] tracking-tight mb-4">
              Focused Daily Checklist
            </h2>

            <div className="space-y-2.5">
              {dailyTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    task.completed
                      ? "bg-[#101216]/60 border-[#1e2229] opacity-75"
                      : "bg-[#101216] border-[#272b33] hover:border-[#3b9cff]/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-md border border-[#707784] hover:border-[#3b9cff] shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        task.completed ? "line-through text-[#707784]" : "text-[#f5f7fa]"
                      )}
                    >
                      {task.label}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#707784] bg-[#14161b] px-2 py-0.5 rounded border border-[#1e2229]">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e2229] flex items-center justify-between text-[11px] text-[#707784]">
            <span>Click any item to toggle completion</span>
            <Link to="/practice" className="text-[#3b9cff] hover:underline font-semibold">
              Browse More Tasks →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 4. Quick Arena Challenge Banner (Section 14) ─────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14161b] via-[#101524] to-[#14161b] border border-[#2f80ed]/30 shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2f80ed]/15 border border-[#2f80ed]/30 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6 text-[#3b9cff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#f5f7fa] tracking-tight">
                Competitive Battle Arena
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#a1a7b3] mt-0.5">
              Host or join assessment rooms with real-time countdown timers and live leaderboards.
            </p>
          </div>
        </div>

        <Link
          to="/rooms"
          className="px-5 py-2.5 rounded-xl bg-[#2f80ed] hover:bg-[#3b9cff] text-white text-xs font-bold shadow-[0_4px_20px_rgba(47,128,237,0.3)] transition-all flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
        >
          <Swords className="w-3.5 h-3.5 text-cyan-200" />
          <span>Join a Battle Room</span>
        </Link>
      </div>

      {/* ─── 5. Recent Sessions / Activity (Section 42) ───────────────── */}
      <div className="p-6 rounded-2xl bg-[#14161b] border border-[#272b33] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#f5f7fa] tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3b9cff]" />
            <span>Recent Sessions & Interview Logs</span>
          </h3>
          <Link to="/history" className="text-xs text-[#3b9cff] hover:underline font-semibold">
            View All History →
          </Link>
        </div>

        {interviewsLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#2f80ed] border-t-transparent animate-spin" />
          </div>
        ) : !interviews?.length ? (
          <div className="py-8 text-center text-xs text-[#707784]">
            No interview sessions yet. Launch your first mock interview above!
          </div>
        ) : (
          <div className="divide-y divide-[#1e2229]">
            {interviews.slice(0, 4).map((item: any) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between text-xs hover:bg-[#191c22]/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === "completed" ? "bg-[#22c55e]" : "bg-[#f59e0b]"
                    )}
                  />
                  <div>
                    <p className="font-semibold text-[#f5f7fa]">{item.role}</p>
                    <p className="text-[10px] text-[#707784] font-mono capitalize">
                      {item.difficulty} • {item.mode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.score !== null && item.score !== undefined && (
                    <span className="font-mono text-xs font-bold text-[#22c55e]">
                      {item.score}/10
                    </span>
                  )}
                  <Link
                    to={item.status === "completed" ? `/results/${item.id}` : `/interview/${item.id}`}
                    className="text-[#3b9cff] hover:underline font-semibold"
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