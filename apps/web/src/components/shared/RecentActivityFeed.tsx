import { Activity, Clock, CheckCircle2, ExternalLink, Code2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { useRecentActivity } from "@/hooks/useReadiness";
import { Link } from "react-router-dom";

export function RecentActivityFeed() {
  const { data: activity = [], isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="p-5 rounded-xl bg-[#0D0F14] border border-zinc-800/70 animate-pulse space-y-3">
        <div className="h-4 bg-zinc-800/60 rounded w-1/4" />
        <div className="h-10 bg-zinc-800/40 rounded-lg" />
        <div className="h-10 bg-zinc-800/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 rounded-xl bg-[#0C0E14] border border-zinc-800/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Recent Solved Activity
            </h3>
            <p className="text-xs text-zinc-400">
              Chronological feed of accepted submissions and solutions
            </p>
          </div>
        </div>

        <Link
          to="/practice"
          className="text-xs text-zinc-400 hover:text-white font-medium transition-colors"
        >
          Practice More →
        </Link>
      </div>

      {/* Activity List */}
      {activity.length === 0 ? (
        <div className="py-7 text-center text-zinc-500 text-xs space-y-2">
          <Code2 className="w-7 h-7 mx-auto text-zinc-700" />
          <p>No solved problems recorded yet today.</p>
          <p className="text-zinc-600">Solve problems in Practice Hub or Arena to start your feed!</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {activity.map((item) => {
            const diff = item.difficulty?.toUpperCase();
            return (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 group hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          diff === "EASY"
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                            : diff === "MEDIUM"
                            ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                            : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                        }`}
                      >
                        {diff}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 font-mono">
                      <span>{item.platform}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-zinc-500" />
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
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
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
