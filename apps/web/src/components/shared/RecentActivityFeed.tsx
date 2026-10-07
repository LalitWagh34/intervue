import { Activity, Clock, CheckCircle2, ExternalLink, Code2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { useRecentActivity } from "@/hooks/useReadiness";
import { Link } from "react-router-dom";

export function RecentActivityFeed() {
  const { data: activity = [], isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-[#0D0F14] border border-zinc-800/80 animate-pulse space-y-3">
        <div className="h-5 bg-zinc-800/60 rounded w-1/4" />
        <div className="h-12 bg-zinc-800/40 rounded-xl" />
        <div className="h-12 bg-zinc-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0D0F14] border border-zinc-800/90 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Recent Activity Feed</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-normal">
                Live Solved
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Your chronological submissions and solved questions
            </p>
          </div>
        </div>

        <Link
          to="/practice"
          className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Practice More →
        </Link>
      </div>

      {/* Activity List */}
      {activity.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-xs space-y-2">
          <Code2 className="w-8 h-8 mx-auto text-zinc-700" />
          <p>No problems solved yet today.</p>
          <p className="text-zinc-600">Solve a question in Practice Hub or Arena to start your feed!</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {activity.map((item) => {
            const diff = item.difficulty?.toUpperCase();
            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-900/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          diff === "EASY"
                            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            : diff === "MEDIUM"
                            ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                            : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                        }`}
                      >
                        {diff}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 font-mono">
                      <span className="text-zinc-400">{item.platform}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {formatDistanceToNow(new Date(item.solvedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://leetcode.com/problems/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="View Problem on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
