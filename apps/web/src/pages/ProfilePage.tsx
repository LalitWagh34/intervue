import { useState, useMemo } from "react";
import {
  useProfile,
  useProfileStats,
  useConnectPlatform,
  useSyncAllPlatforms,
  useDisconnectPlatform,
} from "@/hooks/useProfile";
import { Link } from "react-router-dom";
import {
  Flame,
  Pencil,
  ExternalLink,
  Code2,
  Trophy,
  Swords,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Plus,
  Unlink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: stats, isLoading: isStatsLoading } = useProfileStats();

  const connectPlatformMutation = useConnectPlatform();
  const syncAllMutation = useSyncAllPlatforms();
  const disconnectMutation = useDisconnectPlatform();

  const [activePlatform, setActivePlatform] = useState<
    "ALL" | "INTERVUE" | "LEETCODE" | "CODEFORCES"
  >("ALL");
  const [wheelMode, setWheelMode] = useState<"INTERVUE" | "LEETCODE" | "COMBINED">("INTERVUE");
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // Connect Handle Modal State
  const [connectModal, setConnectModal] = useState<{
    isOpen: boolean;
    platform: "leetcode" | "codeforces" | "github";
    handle: string;
    error: string | null;
  }>({
    isOpen: false,
    platform: "leetcode",
    handle: "",
    error: null,
  });

  // Current calendar metrics based on active platform filter
  const currentCalendar = useMemo(() => {
    if (stats?.calendars?.[activePlatform]) {
      return stats.calendars[activePlatform];
    }
    return stats?.consistency;
  }, [stats, activePlatform]);

  // Group calendar days into 52 columns of 7 days
  const calendarWeeks = useMemo(() => {
    if (!currentCalendar?.calendarDays) return [];
    const days = currentCalendar.calendarDays;
    const weeks: Array<Array<{ date: string; count: number; level: number }>> = [];
    let currentWeek: Array<{ date: string; count: number; level: number }> = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    return weeks;
  }, [currentCalendar?.calendarDays]);

  // Extract month labels at regular column intervals
  const monthLabels = useMemo(() => {
    if (!calendarWeeks.length) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels: Array<{ month: string; colIndex: number }> = [];
    let lastMonth = -1;

    calendarWeeks.forEach((week, colIdx) => {
      const firstDay = week[0];
      if (firstDay) {
        const d = new Date(firstDay.date);
        const m = d.getMonth();
        if (m !== lastMonth && colIdx % 4 === 0) {
          labels.push({ month: months[m], colIndex: colIdx });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [calendarWeeks]);

  if (isProfileLoading || isStatsLoading) {
    return (
      <div className="p-10 max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading profile & activity metrics...</p>
        </div>
      </div>
    );
  }

  // Question Wheel numbers based on wheelMode
  const lcStats = stats?.leetcodeStats;
  const cfStats = stats?.codeforcesStats;
  const ghStats = stats?.githubStats;

  let wheelTotalSolved = stats?.dsaProgress?.totalSolved ?? 0;
  let wheelTotalAvailable = Math.max(stats?.dsaProgress?.totalProblems ?? 1, 1);
  let wheelEasy = stats?.dsaProgress?.easy?.solved ?? 0;
  let wheelMedium = stats?.dsaProgress?.medium?.solved ?? 0;
  let wheelHard = stats?.dsaProgress?.hard?.solved ?? 0;

  if (wheelMode === "LEETCODE") {
    wheelTotalSolved = lcStats?.totalSolved ?? 0;
    wheelTotalAvailable = 3300; // Reference total on LeetCode
    wheelEasy = lcStats?.easySolved ?? 0;
    wheelMedium = lcStats?.mediumSolved ?? 0;
    wheelHard = lcStats?.hardSolved ?? 0;
  } else if (wheelMode === "COMBINED") {
    wheelTotalSolved = stats?.combinedProgress?.totalSolved ?? wheelTotalSolved;
    wheelTotalAvailable = Math.max(
      (stats?.dsaProgress?.totalProblems ?? 0) + (lcStats?.totalSolved ? 3300 : 0),
      wheelTotalSolved || 1
    );
    wheelEasy = stats?.combinedProgress?.easy?.solved ?? wheelEasy;
    wheelMedium = stats?.combinedProgress?.medium?.solved ?? wheelMedium;
    wheelHard = stats?.combinedProgress?.hard?.solved ?? wheelHard;
  }

  // SVG circular progress calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  const easyArc = (wheelEasy / Math.max(wheelTotalAvailable, 1)) * circumference;
  const mediumArc = (wheelMedium / Math.max(wheelTotalAvailable, 1)) * circumference;
  const hardArc = (wheelHard / Math.max(wheelTotalAvailable, 1)) * circumference;

  const easyOffset = 0;
  const mediumOffset = -easyArc;
  const hardOffset = -(easyArc + mediumArc);

  // Dynamic metrics from current calendar
  const totalSubmissions = currentCalendar?.totalSubmissions ?? 0;
  const activeDays = currentCalendar?.activeDays ?? 0;
  const bestStreak = currentCalendar?.bestStreak ?? 0;
  const currentStreak = currentCalendar?.currentStreak ?? 0;
  const totalContests = currentCalendar?.totalContests ?? 0;

  // Max count for topic bars normalization
  const maxTopicCount = Math.max(
    ...(stats?.topicStats?.map((t) => t.count) || [1]),
    1
  );

  const displayName = profile?.fullName || stats?.user?.name || "Candidate";
  const displayHandle = profile?.fullName
    ? profile.fullName.toLowerCase().replace(/\s+/g, "_")
    : stats?.user?.email?.split("@")[0] || "member";

  const handleOpenConnect = (platform: "leetcode" | "codeforces" | "github") => {
    setConnectModal({
      isOpen: true,
      platform,
      handle: "",
      error: null,
    });
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectModal.handle.trim()) return;

    try {
      setConnectModal((prev) => ({ ...prev, error: null }));
      await connectPlatformMutation.mutateAsync({
        platform: connectModal.platform,
        handle: connectModal.handle.trim(),
      });
      setConnectModal({ isOpen: false, platform: "leetcode", handle: "", error: null });
    } catch (err: any) {
      setConnectModal((prev) => ({
        ...prev,
        error: err.response?.data?.error || err.message || "Failed to connect platform",
      }));
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto text-slate-100 font-sans">
      {/* ─── Profile Brief & Header ───────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b10] overflow-hidden mb-8 shadow-sm">
        {/* Cover Banner with Ambient Gradient */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-900/40 via-[#0e121d] to-indigo-950/40 relative border-b border-white/[0.06] overflow-hidden">
          <div className="ambient-glow w-72 h-72 bg-blue-600/20 top-[-20%] right-[10%]" />
          <div className="ambient-glow w-64 h-64 bg-cyan-500/15 bottom-[-40%] left-[20%]" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#08090c] border-2 border-white/[0.12] p-1 shadow-xl shrink-0 overflow-hidden">
              {profile?.avatarUrl || stats?.user?.image ? (
                <img
                  src={profile?.avatarUrl || stats?.user?.image || ""}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-3xl font-extrabold text-white">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* User Meta */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">@{displayHandle}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {profile?.targetRole || "Software Engineer"}
                </span>
                <span className="text-xs text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] capitalize">
                  {profile?.experienceLevel || "Mid-Level"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Sync all connected platforms"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", syncAllMutation.isPending && "animate-spin text-blue-400")}
              />
              <span>{syncAllMutation.isPending ? "Syncing..." : "Sync All"}</span>
            </button>
            <Link
              to="/profile-setup"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Grid Layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Heatmap + Donut Wheel + Topic Breakdown */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Consistency 52-Week Heatmap */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Consistency</h2>
                <span className="text-xs text-slate-500 font-mono ml-2">
                  (52-Week Activity)
                </span>
              </div>

              {/* Platform Radio Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                {(["ALL", "INTERVUE", "LEETCODE", "CODEFORCES"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlatform(p)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      activePlatform === p
                        ? "bg-[#327cf6] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* The 52-Week Heatmap Grid Canvas */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[650px]">
                {/* Month Headers */}
                <div className="flex text-[10px] text-slate-400 font-mono mb-2 pl-4">
                  {monthLabels.map((lbl, i) => (
                    <div
                      key={i}
                      style={{ marginLeft: i === 0 ? "0px" : "36px" }}
                      className="font-medium"
                    >
                      {lbl.month}
                    </div>
                  ))}
                </div>

                {/* Weeks Grid */}
                <div className="flex gap-[3px]">
                  {calendarWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3px]">
                      {week.map((day, dIdx) => {
                        // Level colors (matching TakeUForward signature blue/cyan scale)
                        const levelBg =
                          day.level === 0
                            ? "bg-[#131620] hover:ring-1 hover:ring-slate-500"
                            : day.level === 1
                            ? "bg-[#1e3a8a] shadow-[0_0_4px_rgba(30,58,138,0.5)]"
                            : day.level === 2
                            ? "bg-[#2563eb] shadow-[0_0_6px_rgba(37,99,235,0.7)]"
                            : day.level === 3
                            ? "bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                            : "bg-[#93c5fd] shadow-[0_0_10px_rgba(147,197,253,1)]";

                        return (
                          <div
                            key={dIdx}
                            onMouseEnter={() => setHoveredDay({ date: day.date, count: day.count })}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={cn(
                              "w-[11px] h-[11px] rounded-[2px] transition-all cursor-pointer",
                              levelBg
                            )}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hover Tooltip Bar */}
            <div className="h-5 mt-2 text-[11px] text-slate-300 font-mono flex items-center justify-between">
              <div>
                {hoveredDay ? (
                  <span>
                    <strong className="text-white">{hoveredDay.count}</strong> submissions on{" "}
                    {hoveredDay.date}
                  </span>
                ) : (
                  <span className="text-slate-500">Hover over any cell to view daily submissions</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span>Less</span>
                <span className="w-2 h-2 rounded-[2px] bg-[#131620]" />
                <span className="w-2 h-2 rounded-[2px] bg-[#1e3a8a]" />
                <span className="w-2 h-2 rounded-[2px] bg-[#2563eb]" />
                <span className="w-2 h-2 rounded-[2px] bg-[#38bdf8]" />
                <span className="w-2 h-2 rounded-[2px] bg-[#93c5fd]" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Live Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] text-slate-400 font-medium">Submissions ({activePlatform})</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{totalSubmissions}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] text-slate-400 font-medium">Current Streak</p>
                <p className="text-lg font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-400/20" />
                  {currentStreak} <span className="text-xs font-normal text-slate-400">days</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] text-slate-400 font-medium">Best Streak</p>
                <p className="text-lg font-extrabold text-white mt-0.5">
                  {bestStreak} <span className="text-xs font-normal text-slate-400">days</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] text-slate-400 font-medium">Active Days</p>
                <p className="text-lg font-extrabold text-blue-400 mt-0.5">
                  {activeDays} <span className="text-xs font-normal text-slate-400">days</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. Question Wheel + Topic Progress */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Problem Solving Progress
                </h2>
              </div>

              {/* Question Wheel Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
                {(["INTERVUE", "LEETCODE", "COMBINED"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setWheelMode(m)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      wheelMode === m
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {m === "INTERVUE" ? "Intervue DSA" : m === "LEETCODE" ? "LeetCode" : "Combined"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Concentric SVG Question Wheel Donut */}
              <div className="flex items-center justify-center p-4">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#1e2230"
                      strokeWidth="9"
                    />

                    {/* Basic (Easy) - Emerald Green */}
                    {wheelEasy > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="9"
                        strokeDasharray={`${easyArc} ${circumference}`}
                        strokeDashoffset={easyOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Core (Medium) - Amber Yellow */}
                    {wheelMedium > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="9"
                        strokeDasharray={`${mediumArc} ${circumference}`}
                        strokeDashoffset={mediumOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Pro (Hard) - Rose Red */}
                    {wheelHard > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#f43f5e"
                        strokeWidth="9"
                        strokeDasharray={`${hardArc} ${circumference}`}
                        strokeDashoffset={hardOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </svg>

                  {/* Centered Solved Count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {wheelTotalSolved}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {wheelMode === "LEETCODE"
                        ? "LC Solved"
                        : wheelMode === "COMBINED"
                        ? "Total Solved"
                        : `/ ${wheelTotalAvailable} Solved`}
                    </span>
                    <span className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-wider">
                      {Math.round((wheelTotalSolved / wheelTotalAvailable) * 100)}% Complete
                    </span>
                  </div>
                </div>
              </div>

              {/* Difficulty Breakdown Bars */}
              <div className="space-y-4">
                {/* Basic (Easy) */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Basic (Easy)
                    </span>
                    <span className="font-mono text-slate-300 font-bold">
                      {wheelEasy}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (wheelEasy / Math.max(wheelTotalSolved || 1, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Core (Medium) */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Core (Medium)
                    </span>
                    <span className="font-mono text-slate-300 font-bold">
                      {wheelMedium}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (wheelMedium / Math.max(wheelTotalSolved || 1, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Pro (Hard) */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Pro (Hard)
                    </span>
                    <span className="font-mono text-slate-300 font-bold">
                      {wheelHard}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (wheelHard / Math.max(wheelTotalSolved || 1, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {wheelMode === "COMBINED" && cfStats?.solvedCount ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-blue-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Codeforces Solved
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {cfStats.solvedCount}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 3. Topic-wise Solved Breakdown (Dynamic Tags from Problems) */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Topic-Wise Solved Breakdown
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {stats?.topicStats?.filter((t) => t.count > 0).length || 0} active topics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats?.topicStats?.slice(0, 10).map((topic, i) => {
                const percent = Math.round((topic.count / maxTopicCount) * 100);
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-200">{topic.tag}</span>
                      <span className="font-mono text-xs text-slate-400">
                        <strong className="text-white">{topic.count}</strong> solved
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          topic.count > 0 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-transparent"
                        )}
                        style={{ width: `${Math.max(percent, topic.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Dedicated External Platform Counters & Social Links */}
        <div className="space-y-6">
          {/* LeetCode Dedicated Counter Card */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                  LC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LeetCode</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {lcStats?.handle ? `@${lcStats.handle}` : "Not connected"}
                  </p>
                </div>
              </div>

              {lcStats?.handle ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                  <button
                    onClick={() => disconnectMutation.mutate({ platform: "leetcode" })}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Disconnect LeetCode"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnect("leetcode")}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Connect
                </button>
              )}
            </div>

            {lcStats?.handle ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-xs text-slate-400">Total Solved</span>
                  <span className="text-lg font-black text-white">{lcStats.totalSolved}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-400 font-bold">Easy</p>
                    <p className="font-extrabold text-white mt-0.5">{lcStats.easySolved}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] text-amber-400 font-bold">Medium</p>
                    <p className="font-extrabold text-white mt-0.5">{lcStats.mediumSolved}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[10px] text-rose-400 font-bold">Hard</p>
                    <p className="font-extrabold text-white mt-0.5">{lcStats.hardSolved}</p>
                  </div>
                </div>
                {lcStats.ranking > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Global Rank</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      #{lcStats.ranking.toLocaleString()}
                    </span>
                  </div>
                )}
                <a
                  href={`https://leetcode.com/u/${lcStats.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  <span>View LeetCode Profile</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                Connect your LeetCode username to sync your solved questions, ranking, and activity heatmap.
              </p>
            )}
          </div>

          {/* Codeforces Dedicated Counter Card */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs font-mono">
                  CF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Codeforces</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {cfStats?.handle ? `@${cfStats.handle}` : "Not connected"}
                  </p>
                </div>
              </div>

              {cfStats?.handle ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Live
                  </span>
                  <button
                    onClick={() => disconnectMutation.mutate({ platform: "codeforces" })}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Disconnect Codeforces"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnect("codeforces")}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Connect
                </button>
              )}
            </div>

            {cfStats?.handle ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div>
                    <p className="text-[11px] text-slate-400">Contest Rating</p>
                    <p className="text-lg font-black text-blue-400 mt-0.5">{cfStats.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Rank</p>
                    <p className="text-xs font-bold text-emerald-400 capitalize mt-1">{cfStats.rank}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] text-slate-400">Max Rating</p>
                    <p className="font-extrabold text-white mt-0.5">{cfStats.maxRating}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] text-slate-400">Problems Solved</p>
                    <p className="font-extrabold text-white mt-0.5">{cfStats.solvedCount}</p>
                  </div>
                </div>
                <a
                  href={`https://codeforces.com/profile/${cfStats.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  <span>View Codeforces Profile</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                Connect your Codeforces handle to track contest rating, max rating, and submission activity.
              </p>
            )}
          </div>

          {/* At a Glance Card */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>At a Glance</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04] text-xs">
                <span className="text-slate-400">Target Role</span>
                <span className="font-bold text-white">{profile?.targetRole || "Software Engineer"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04] text-xs">
                <span className="text-slate-400">Experience</span>
                <span className="font-bold text-white capitalize">
                  {profile?.experienceLevel || "Mid-Level"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04] text-xs">
                <span className="text-slate-400">Contests Participated</span>
                <span className="font-bold text-blue-400">{totalContests}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-slate-400">Member Since</span>
                <span className="font-mono text-slate-300">2026</span>
              </div>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Social Profiles
              </h2>
              {!ghStats?.handle && (
                <button
                  onClick={() => handleOpenConnect("github")}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  + Link GitHub
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* GitHub */}
              {ghStats?.handle || profile?.githubUrl ? (
                <a
                  href={ghStats?.profileUrl || profile?.githubUrl || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] text-xs text-slate-300 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub ({ghStats?.handle || "Linked"})
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              ) : null}

              {/* LinkedIn */}
              {profile?.linkedinUrl ? (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] text-xs text-slate-300 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Connect Platform Modal ────────────────────────────────────── */}
      {connectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0d0f17] border border-white/[0.12] p-6 shadow-2xl relative">
            <button
              onClick={() => setConnectModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm font-mono border",
                  connectModal.platform === "leetcode"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : connectModal.platform === "codeforces"
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-slate-500/15 border-slate-500/30 text-white"
                )}
              >
                {connectModal.platform === "leetcode"
                  ? "LC"
                  : connectModal.platform === "codeforces"
                  ? "CF"
                  : "GH"}
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">
                  Connect {connectModal.platform}
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your public username to sync live data
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {connectModal.platform === "leetcode"
                    ? "LeetCode Username"
                    : connectModal.platform === "codeforces"
                    ? "Codeforces Handle"
                    : "GitHub Username"}
                </label>
                <input
                  type="text"
                  value={connectModal.handle}
                  onChange={(e) =>
                    setConnectModal((prev) => ({ ...prev, handle: e.target.value, error: null }))
                  }
                  placeholder={
                    connectModal.platform === "leetcode"
                      ? "e.g. tourist"
                      : connectModal.platform === "codeforces"
                      ? "e.g. tourist"
                      : "e.g. octocat"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-sm text-white placeholder:text-slate-600 font-mono"
                  autoFocus
                />
              </div>

              {connectModal.error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {connectModal.error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectPlatformMutation.isPending || !connectModal.handle.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {connectPlatformMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Sync & Connect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}