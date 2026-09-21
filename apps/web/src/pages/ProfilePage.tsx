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
          <div className="w-8 h-8 rounded-full border-2 border-[#2F80ED] border-t-transparent animate-spin" />
          <p className="text-xs text-[#A1A7B3] font-mono">Loading profile & activity metrics...</p>
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
    wheelTotalAvailable = 3300;
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-[#F5F7FA] font-sans">
      {/* ─── Profile Brief & Header ───────────────────────────────────── */}
      <div className="rounded-xl border border-[#272B33] bg-[#14161B] overflow-hidden mb-8 shadow-sm">
        {/* Cover Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#101216] via-[#1A2234] to-[#101216] relative border-b border-[#1E2229]">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2F80ED_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#101216] border-2 border-[#272B33] p-1 shadow-lg shrink-0 overflow-hidden">
              {profile?.avatarUrl || stats?.user?.image ? (
                <img
                  src={profile?.avatarUrl || stats?.user?.image || ""}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-[#2F80ED] flex items-center justify-center text-3xl font-bold text-white">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* User Meta */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F5F7FA] tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25 text-[11px] font-semibold">
                  PRO
                </span>
              </div>
              <p className="text-xs text-[#707784] font-mono mt-0.5">@{displayHandle}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-[#A1A7B3] font-medium flex items-center gap-1.5 bg-[#101216] px-2.5 py-1 rounded-md border border-[#1E2229]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  {profile?.targetRole || "Software Engineer"}
                </span>
                <span className="text-xs text-[#A1A7B3] bg-[#101216] px-2.5 py-1 rounded-md border border-[#1E2229] capitalize">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101216] border border-[#272B33] hover:bg-[#191C22] text-xs font-medium text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors cursor-pointer disabled:opacity-50"
              title="Sync all connected platforms"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", syncAllMutation.isPending && "animate-spin text-[#2F80ED]")}
              />
              <span>{syncAllMutation.isPending ? "Syncing..." : "Sync All"}</span>
            </button>
            <Link
              to="/profile-setup"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2F80ED] hover:bg-[#3B9CFF] text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Grid Layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Heatmap + Donut Wheel + Topic Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Consistency 52-Week Heatmap */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2F80ED]" />
                <h2 className="text-base font-semibold text-[#F5F7FA] tracking-tight">Consistency</h2>
                <span className="text-xs text-[#707784] font-mono ml-2">
                  (52-Week Activity)
                </span>
              </div>

              {/* Platform Radio Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#101216] border border-[#1E2229] text-xs">
                {(["ALL", "INTERVUE", "LEETCODE", "CODEFORCES"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlatform(p)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                      activePlatform === p
                        ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
                        : "text-[#A1A7B3] hover:text-[#F5F7FA]"
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
                <div className="flex text-[10px] text-[#707784] font-mono mb-2 pl-4">
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
                        // Level colors
                        const levelBg =
                          day.level === 0
                            ? "bg-[#101216] border border-[#1E2229]"
                            : day.level === 1
                            ? "bg-[#1D3557]"
                            : day.level === 2
                            ? "bg-[#1D4ED8]"
                            : day.level === 3
                            ? "bg-[#2F80ED]"
                            : "bg-[#3B9CFF]";

                        return (
                          <div
                            key={dIdx}
                            onMouseEnter={() => setHoveredDay({ date: day.date, count: day.count })}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={cn(
                              "w-[11px] h-[11px] rounded-[2px] transition-colors cursor-pointer",
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
            <div className="h-5 mt-2 text-[11px] text-[#A1A7B3] font-mono flex items-center justify-between">
              <div>
                {hoveredDay ? (
                  <span>
                    <strong className="text-[#F5F7FA]">{hoveredDay.count}</strong> submissions on{" "}
                    {hoveredDay.date}
                  </span>
                ) : (
                  <span className="text-[#707784]">Hover over any cell to view daily submissions</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#707784] font-mono">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#101216] border border-[#1E2229]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1D3557]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1D4ED8]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2F80ED]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B9CFF]" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Live Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1E2229]">
              <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                <p className="text-[11px] text-[#A1A7B3] font-medium">Submissions ({activePlatform})</p>
                <p className="text-lg font-bold text-[#F5F7FA] mt-0.5">{totalSubmissions}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                <p className="text-[11px] text-[#A1A7B3] font-medium">Current Streak</p>
                <p className="text-lg font-bold text-[#F59E0B] mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-[#F59E0B]/20" />
                  {currentStreak} <span className="text-xs font-normal text-[#707784]">days</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                <p className="text-[11px] text-[#A1A7B3] font-medium">Best Streak</p>
                <p className="text-lg font-bold text-[#F5F7FA] mt-0.5">
                  {bestStreak} <span className="text-xs font-normal text-[#707784]">days</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                <p className="text-[11px] text-[#A1A7B3] font-medium">Active Days</p>
                <p className="text-lg font-bold text-[#2F80ED] mt-0.5">
                  {activeDays} <span className="text-xs font-normal text-[#707784]">days</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. Question Wheel + Topic Progress */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <h2 className="text-base font-semibold text-[#F5F7FA] tracking-tight">
                  Problem Solving Progress
                </h2>
              </div>

              {/* Question Wheel Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#101216] border border-[#1E2229] text-xs">
                {(["INTERVUE", "LEETCODE", "COMBINED"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setWheelMode(m)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                      wheelMode === m
                        ? "bg-[#2F80ED] text-white shadow-sm font-semibold"
                        : "text-[#A1A7B3] hover:text-[#F5F7FA]"
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
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#1E2229"
                      strokeWidth="9"
                    />

                    {/* Basic (Easy) - Emerald Green */}
                    {wheelEasy > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#22C55E"
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
                        stroke="#F59E0B"
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
                        stroke="#EF4444"
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
                    <span className="text-3xl font-bold text-[#F5F7FA] tracking-tight">
                      {wheelTotalSolved}
                    </span>
                    <span className="text-[11px] font-mono text-[#707784]">
                      {wheelMode === "LEETCODE"
                        ? "LC Solved"
                        : wheelMode === "COMBINED"
                        ? "Total Solved"
                        : `/ ${wheelTotalAvailable} Solved`}
                    </span>
                    <span className="text-[10px] font-semibold text-[#2F80ED] mt-1 uppercase tracking-wider">
                      {Math.round((wheelTotalSolved / wheelTotalAvailable) * 100)}% Complete
                    </span>
                  </div>
                </div>
              </div>

              {/* Difficulty Breakdown Bars */}
              <div className="space-y-3">
                {/* Basic (Easy) */}
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#22C55E] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      Basic (Easy)
                    </span>
                    <span className="font-mono text-[#F5F7FA] font-medium">
                      {wheelEasy}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#14161B] overflow-hidden">
                    <div
                      className="h-full bg-[#22C55E] rounded-full transition-all duration-500"
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
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#F59E0B] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      Core (Medium)
                    </span>
                    <span className="font-mono text-[#F5F7FA] font-medium">
                      {wheelMedium}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#14161B] overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
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
                <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#EF4444] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      Pro (Hard)
                    </span>
                    <span className="font-mono text-[#F5F7FA] font-medium">
                      {wheelHard}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#14161B] overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
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
                  <div className="p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#2F80ED] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2F80ED]" />
                        Codeforces Solved
                      </span>
                      <span className="font-mono text-[#F5F7FA] font-medium">
                        {cfStats.solvedCount}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 3. Topic-wise Solved Breakdown */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2F80ED]" />
                <h2 className="text-base font-semibold text-[#F5F7FA] tracking-tight">
                  Topic-Wise Solved Breakdown
                </h2>
              </div>
              <span className="text-xs text-[#707784] font-mono">
                {stats?.topicStats?.filter((t) => t.count > 0).length || 0} active topics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats?.topicStats?.slice(0, 10).map((topic, i) => {
                const percent = Math.round((topic.count / maxTopicCount) * 100);
                return (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#101216] border border-[#1E2229] hover:border-[#272B33] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-[#F5F7FA]">{topic.tag}</span>
                      <span className="font-mono text-xs text-[#707784]">
                        <strong className="text-[#F5F7FA]">{topic.count}</strong> solved
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#14161B] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          topic.count > 0 ? "bg-[#2F80ED]" : "bg-transparent"
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
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center text-[#F59E0B] font-bold text-xs font-mono">
                  LC
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA]">LeetCode</h3>
                  <p className="text-[11px] text-[#707784] font-mono">
                    {lcStats?.handle ? `@${lcStats.handle}` : "Not connected"}
                  </p>
                </div>
              </div>

              {lcStats?.handle ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25">
                    Live
                  </span>
                  <button
                    onClick={() => disconnectMutation.mutate({ platform: "leetcode" })}
                    className="p-1 text-[#707784] hover:text-[#EF4444] transition-colors cursor-pointer"
                    title="Disconnect LeetCode"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnect("leetcode")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#F59E0B] hover:text-amber-300 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 px-2.5 py-1 rounded-md border border-[#F59E0B]/25 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Connect
                </button>
              )}
            </div>

            {lcStats?.handle ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <span className="text-xs text-[#A1A7B3]">Total Solved</span>
                  <span className="text-lg font-bold text-[#F5F7FA]">{lcStats.totalSolved}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/20">
                    <p className="text-[10px] text-[#22C55E] font-semibold">Easy</p>
                    <p className="font-bold text-[#F5F7FA] mt-0.5">{lcStats.easySolved}</p>
                  </div>
                  <div className="p-2 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <p className="text-[10px] text-[#F59E0B] font-semibold">Medium</p>
                    <p className="font-bold text-[#F5F7FA] mt-0.5">{lcStats.mediumSolved}</p>
                  </div>
                  <div className="p-2 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20">
                    <p className="text-[10px] text-[#EF4444] font-semibold">Hard</p>
                    <p className="font-bold text-[#F5F7FA] mt-0.5">{lcStats.hardSolved}</p>
                  </div>
                </div>
                {lcStats.ranking > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-[#A1A7B3] pt-1">
                    <span>Global Rank</span>
                    <span className="font-mono text-[#F5F7FA] font-medium">
                      #{lcStats.ranking.toLocaleString()}
                    </span>
                  </div>
                )}
                <a
                  href={`https://leetcode.com/u/${lcStats.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#101216] border border-[#1E2229] hover:bg-[#191C22] text-xs font-medium text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors"
                >
                  <span>View LeetCode Profile</span>
                  <ExternalLink className="w-3 h-3 text-[#707784]" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#707784] mt-2">
                Connect your LeetCode username to sync your solved questions, ranking, and activity heatmap.
              </p>
            )}
          </div>

          {/* Codeforces Dedicated Counter Card */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2F80ED]/10 border border-[#2F80ED]/25 flex items-center justify-center text-[#3B9CFF] font-bold text-xs font-mono">
                  CF
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA]">Codeforces</h3>
                  <p className="text-[11px] text-[#707784] font-mono">
                    {cfStats?.handle ? `@${cfStats.handle}` : "Not connected"}
                  </p>
                </div>
              </div>

              {cfStats?.handle ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-[#2F80ED]/10 text-[#3B9CFF] border border-[#2F80ED]/25">
                    Live
                  </span>
                  <button
                    onClick={() => disconnectMutation.mutate({ platform: "codeforces" })}
                    className="p-1 text-[#707784] hover:text-[#EF4444] transition-colors cursor-pointer"
                    title="Disconnect Codeforces"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnect("codeforces")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#3B9CFF] hover:text-blue-300 bg-[#2F80ED]/10 hover:bg-[#2F80ED]/20 px-2.5 py-1 rounded-md border border-[#2F80ED]/25 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Connect
                </button>
              )}
            </div>

            {cfStats?.handle ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#101216] border border-[#1E2229]">
                  <div>
                    <p className="text-[11px] text-[#A1A7B3]">Contest Rating</p>
                    <p className="text-lg font-bold text-[#3B9CFF] mt-0.5">{cfStats.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#A1A7B3]">Rank</p>
                    <p className="text-xs font-semibold text-[#22C55E] capitalize mt-1">{cfStats.rank}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-md bg-[#101216] border border-[#1E2229]">
                    <p className="text-[10px] text-[#707784]">Max Rating</p>
                    <p className="font-bold text-[#F5F7FA] mt-0.5">{cfStats.maxRating}</p>
                  </div>
                  <div className="p-2 rounded-md bg-[#101216] border border-[#1E2229]">
                    <p className="text-[10px] text-[#707784]">Problems Solved</p>
                    <p className="font-bold text-[#F5F7FA] mt-0.5">{cfStats.solvedCount}</p>
                  </div>
                </div>
                <a
                  href={`https://codeforces.com/profile/${cfStats.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#101216] border border-[#1E2229] hover:bg-[#191C22] text-xs font-medium text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors"
                >
                  <span>View Codeforces Profile</span>
                  <ExternalLink className="w-3 h-3 text-[#707784]" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#707784] mt-2">
                Connect your Codeforces handle to track contest rating, max rating, and submission activity.
              </p>
            )}
          </div>

          {/* At a Glance Card */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33]">
            <h2 className="text-xs font-semibold text-[#A1A7B3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#2F80ED]" />
              <span>At a Glance</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1E2229] text-xs">
                <span className="text-[#A1A7B3]">Target Role</span>
                <span className="font-semibold text-[#F5F7FA]">{profile?.targetRole || "Software Engineer"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1E2229] text-xs">
                <span className="text-[#A1A7B3]">Experience</span>
                <span className="font-semibold text-[#F5F7FA] capitalize">
                  {profile?.experienceLevel || "Mid-Level"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1E2229] text-xs">
                <span className="text-[#A1A7B3]">Contests Participated</span>
                <span className="font-semibold text-[#2F80ED]">{totalContests}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-[#A1A7B3]">Member Since</span>
                <span className="font-mono text-[#707784]">2026</span>
              </div>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="p-6 rounded-xl bg-[#14161B] border border-[#272B33]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[#A1A7B3] uppercase tracking-wider">
                Social Profiles
              </h2>
              {!ghStats?.handle && (
                <button
                  onClick={() => handleOpenConnect("github")}
                  className="text-[11px] font-semibold text-[#2F80ED] hover:text-[#3B9CFF] transition-colors cursor-pointer"
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
                  className="flex items-center justify-between p-3 rounded-lg bg-[#101216] border border-[#1E2229] hover:border-[#272B33] text-xs text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#707784]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub ({ghStats?.handle || "Linked"})
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#707784]" />
                </a>
              ) : null}

              {/* LinkedIn */}
              {profile?.linkedinUrl ? (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#101216] border border-[#1E2229] hover:border-[#272B33] text-xs text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#2F80ED]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#707784]" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Connect Platform Modal ────────────────────────────────────── */}
      {connectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-[#181B21] border border-[#272B33] p-6 shadow-2xl relative">
            <button
              onClick={() => setConnectModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-[#707784] hover:text-[#F5F7FA] p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm font-mono border",
                  connectModal.platform === "leetcode"
                    ? "bg-[#F59E0B]/10 border-[#F59E0B]/25 text-[#F59E0B]"
                    : connectModal.platform === "codeforces"
                    ? "bg-[#2F80ED]/10 border-[#2F80ED]/25 text-[#3B9CFF]"
                    : "bg-[#101216] border-[#272B33] text-white"
                )}
              >
                {connectModal.platform === "leetcode"
                  ? "LC"
                  : connectModal.platform === "codeforces"
                  ? "CF"
                  : "GH"}
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#F5F7FA] capitalize">
                  Connect {connectModal.platform}
                </h3>
                <p className="text-xs text-[#707784]">
                  Enter your public username to sync live data
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A1A7B3] block mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#101216] border border-[#272B33] focus:border-[#2F80ED] focus:outline-none text-sm text-[#F5F7FA] placeholder:text-[#707784] font-mono transition-colors"
                  autoFocus
                />
              </div>

              {connectModal.error && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25 p-2.5 rounded-md">
                  {connectModal.error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#707784] hover:text-[#F5F7FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectPlatformMutation.isPending || !connectModal.handle.trim()}
                  className="px-5 py-2 rounded-lg bg-[#2F80ED] hover:bg-[#3B9CFF] text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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