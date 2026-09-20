import { useState, useMemo } from "react";
import { useProfile, useProfileStats } from "@/hooks/useProfile";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: stats, isLoading: isStatsLoading } = useProfileStats();

  const [activePlatform, setActivePlatform] = useState<"ALL" | "INTERVUE" | "LEETCODE" | "CODEFORCES">("ALL");
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // Group calendar days into 52 columns of 7 days
  const calendarWeeks = useMemo(() => {
    if (!stats?.consistency?.calendarDays) return [];
    const days = stats.consistency.calendarDays;
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
  }, [stats?.consistency?.calendarDays]);

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

  // Dynamic metrics
  const totalSolved = stats?.dsaProgress?.totalSolved ?? 0;
  const totalProblems = Math.max(stats?.dsaProgress?.totalProblems ?? 1, 1);
  const easy = stats?.dsaProgress?.easy ?? { solved: 0, total: 0 };
  const medium = stats?.dsaProgress?.medium ?? { solved: 0, total: 0 };
  const hard = stats?.dsaProgress?.hard ?? { solved: 0, total: 0 };

  const totalSubmissions = stats?.consistency?.totalSubmissions ?? 0;
  const activeDays = stats?.consistency?.activeDays ?? 0;
  const bestStreak = stats?.consistency?.bestStreak ?? 0;
  const currentStreak = stats?.consistency?.currentStreak ?? 0;
  const totalContests = stats?.consistency?.totalContests ?? 0;

  // Max count for topic bars normalization
  const maxTopicCount = Math.max(
    ...(stats?.topicStats?.map((t) => t.count) || [1]),
    1
  );

  // SVG circular progress calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  const easyArc = (easy.solved / totalProblems) * circumference;
  const mediumArc = (medium.solved / totalProblems) * circumference;
  const hardArc = (hard.solved / totalProblems) * circumference;

  const easyOffset = 0;
  const mediumOffset = -easyArc;
  const hardOffset = -(easyArc + mediumArc);

  const displayName = profile?.fullName || stats?.user?.name || "Candidate";
  const displayHandle = profile?.fullName
    ? profile.fullName.toLowerCase().replace(/\s+/g, "_")
    : stats?.user?.email?.split("@")[0] || "member";

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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="text-xs text-slate-400 font-mono">@{displayHandle}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
                  {profile?.targetRole || "Software Engineer"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                <span>{profile?.experienceLevel ? `${profile.experienceLevel.toUpperCase()} LEVEL` : "MEMBER"}</span>
                <span>•</span>
                <span>{profile?.totalSessions ?? 0} interviews recorded</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Profile verified</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            to="/profile-setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tuf-glass hover:bg-white/[0.08] text-slate-200 border border-white/[0.12] transition-all self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Primary Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* ============================================================ */}
          {/* 1. CONSISTENCY & HEATMAP SECTION                             */}
          {/* ============================================================ */}
          <section className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] relative">
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
                  <span className="text-[#38bdf8] font-semibold">
                    {hoveredDay.date}: {hoveredDay.count} submission{hoveredDay.count !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-slate-500">Hover over any square to see activity details</span>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#131620]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1e3a8a]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2563eb]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#38bdf8]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#93c5fd]" />
                <span>More</span>
              </div>
            </div>

            {/* Consistency Footer Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/[0.06]">
              <div>
                <p className="text-lg font-extrabold text-white font-mono">{totalSubmissions}</p>
                <p className="text-[11px] text-slate-400 font-medium">Contributions • 12 mos</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-white font-mono">{activeDays}</p>
                <p className="text-[11px] text-slate-400 font-medium">Active days</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-400 font-mono flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {bestStreak} Days
                </p>
                <p className="text-[11px] text-slate-400 font-medium">Best streak</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-cyan-400 font-mono">{totalContests}</p>
                <p className="text-[11px] text-slate-400 font-medium">Arena Contests</p>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 2. DSA PROGRESS & QUESTION WHEEL                             */}
          {/* ============================================================ */}
          <section className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white tracking-tight">DSA Progress</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-[#38bdf8] border border-blue-500/30">
                Live DB Sync
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Dynamic Circular Gauge Wheel (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                {/* SVG Progress Donut */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#1e2230"
                      strokeWidth="6"
                    />

                    {/* Easy Arc (Basic - Green) */}
                    {easy.solved > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="6"
                        strokeDasharray={`${easyArc} ${circumference}`}
                        strokeDashoffset={easyOffset}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Medium Arc (Core - Yellow) */}
                    {medium.solved > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="6"
                        strokeDasharray={`${mediumArc} ${circumference}`}
                        strokeDashoffset={mediumOffset}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Hard Arc (Pro - Red) */}
                    {hard.solved > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="6"
                        strokeDasharray={`${hardArc} ${circumference}`}
                        strokeDashoffset={hardOffset}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white font-mono leading-none">
                      {totalSolved}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">
                      / {totalProblems}
                    </span>
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                      Solved
                    </span>
                  </div>
                </div>

                {/* Difficulty Category Legend */}
                <div className="grid grid-cols-3 gap-2 w-full mt-5 text-center">
                  <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Basic</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      {easy.solved} <span className="text-[10px] text-slate-400">/{easy.total}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="text-[10px] text-amber-400 font-bold uppercase">Core</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      {medium.solved} <span className="text-[10px] text-slate-400">/{medium.total}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
                    <div className="text-[10px] text-rose-400 font-bold uppercase">Pro</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      {hard.solved} <span className="text-[10px] text-slate-400">/{hard.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Topic-wise Progress Bars (7 cols) */}
              <div className="md:col-span-7">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Topic-wise Analysis</span>
                  <span className="text-[10px] text-slate-400 font-mono">By Question Tags</span>
                </h3>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2">
                  {stats?.topicStats && stats.topicStats.length > 0 ? (
                    stats.topicStats.slice(0, 10).map((t, idx) => {
                      const barPercent = Math.max(
                        Math.round((t.count / maxTopicCount) * 100),
                        t.count > 0 ? 8 : 2
                      );
                      return (
                        <div key={idx} className="group">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                              {t.tag}
                            </span>
                            <span className="font-mono text-[11px] text-blue-400 font-bold">
                              {t.count} solved
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#161b26] overflow-hidden">
                            <div
                              style={{ width: `${barPercent}%` }}
                              className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      Solve problems to populate topic-wise analysis
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* At a Glance Card */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>At a Glance</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Problems Solved</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {totalSolved}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Best Streak</span>
                <span className="text-base font-extrabold text-amber-400 font-mono flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {bestStreak} days
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs text-slate-400">Current Streak</span>
                <span className="text-sm font-extrabold text-cyan-400 font-mono">
                  {currentStreak} days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Arena Contests</span>
                <span className="text-sm font-extrabold text-slate-200 font-mono">
                  {totalContests}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Coding Profiles */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Coding Profiles</span>
            </h2>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                    LC
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">LeetCode</p>
                    <p className="text-[10px] text-slate-400 font-mono">Connected</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Synced
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs font-mono">
                    CF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Codeforces</p>
                    <p className="text-[10px] text-slate-400 font-mono">Connected</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Synced
                </span>
              </div>
            </div>
          </div>

          {/* Social & Professional Links */}
          <div className="p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Social Links
            </h2>

            <div className="space-y-2">
              {profile?.githubUrl ? (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] text-xs text-slate-300 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              ) : (
                <Link
                  to="/profile-setup"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1] hover:border-blue-500/30 text-xs text-slate-400 hover:text-[#38bdf8] transition-all"
                >
                  <span>+ Connect GitHub</span>
                </Link>
              )}

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
              ) : (
                <Link
                  to="/profile-setup"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1] hover:border-blue-500/30 text-xs text-slate-400 hover:text-[#38bdf8] transition-all"
                >
                  <span>+ Connect LinkedIn</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}