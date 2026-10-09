import { useState, useMemo } from "react";
import { useBookmarks, useToggleBookmark } from "@/hooks/useBookmarks";
import { Bookmark, Search, BookmarkX, ExternalLink, Loader2 } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";

const DIFFICULTY_CONFIG: Record<"Easy" | "Medium" | "Hard", { label: string; color: string }> = {
  Easy: { label: "Easy", color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
  Medium: { label: "Medium", color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  Hard: { label: "Hard", color: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20" },
};

function normalizeDifficulty(diff?: string): "Easy" | "Medium" | "Hard" {
  if (!diff) return "Medium";
  const s = String(diff).toUpperCase().trim();
  if (s === "BASIC" || s === "EASY") return "Easy";
  if (s === "HARD") return "Hard";
  return "Medium";
}

type FilterType = "ALL" | "Easy" | "Medium" | "Hard";

export default function BookmarksPage() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const toggleBookmark = useToggleBookmark();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filtered = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchSearch =
        !search.trim() ||
        b.problemTitle.toLowerCase().includes(search.toLowerCase()) ||
        b.problemSlug.toLowerCase().includes(search.toLowerCase());
      const bDiff = normalizeDifficulty(b.difficulty);
      const matchFilter = filter === "ALL" || bDiff === filter;
      return matchSearch && matchFilter;
    });
  }, [bookmarks, search, filter]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-center justify-center">
          <Bookmark className="w-4.5 h-4.5 text-[#22C55E]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F5F7FA] tracking-tight">Revision Bookmarks</h1>
          <p className="text-xs text-[#707784]">{bookmarks.length} problems saved for revision</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#525866]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarked problems..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-[#327CF6]/50 text-xs text-[#F5F7FA] placeholder:text-[#525866] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D0E12] border border-[#1E2229]">
          {(["ALL", "Easy", "Medium", "Hard"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                filter === f
                  ? "bg-[#327CF6] text-white shadow-sm font-semibold"
                  : "text-[#A1A7B3] hover:text-[#F5F7FA]"
              )}
            >
              {f === "ALL" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-[#327CF6] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <Bookmark className="w-10 h-10 text-[#525866]" />
          <p className="text-sm font-medium text-[#707784]">
            {search || filter !== "ALL" ? "No bookmarks match your filter" : "No bookmarks yet"}
          </p>
          <p className="text-xs text-[#525866] max-w-xs">
            Star any problem in the Practice Hub to add it here for quick revision before interviews.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bookmark) => {
            const bDiff = normalizeDifficulty(bookmark.difficulty);
            const diff = DIFFICULTY_CONFIG[bDiff];
            return (
              <div
                key={bookmark.problemSlug}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0D0E12] border border-[#1E2229] hover:border-[#272B33] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0", diff.color)}>
                    {diff.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#F5F7FA] truncate">{bookmark.problemTitle}</p>
                    <p className="text-[11px] text-[#525866] font-mono mt-0.5">{bookmark.problemSlug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-3">
                  <span className="text-[10px] text-[#525866] font-mono hidden sm:block">
                    {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                  </span>
                  <a
                    href={`https://leetcode.com/problems/${bookmark.problemSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707784] hover:text-[#F5F7FA] hover:bg-[#1E2229] transition-colors"
                    title="Open on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() =>
                      toggleBookmark.mutate({
                        problemSlug: bookmark.problemSlug,
                        problemTitle: bookmark.problemTitle,
                        difficulty: bookmark.difficulty,
                      })
                    }
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#22C55E] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                    title="Remove bookmark"
                  >
                    <BookmarkX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
