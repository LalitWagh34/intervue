import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Code2, Folder, Loader2, Compass } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { openProductTour } from "@/components/shared/ProductTourModal";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Toggle on Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  // Fetch search results
  const { data, isLoading } = useQuery({
    queryKey: ["globalSearch", query],
    queryFn: async () => {
      if (query.length < 2) return { problems: [], sheets: [] };
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return res.data;
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });

  const runCommand = (command: () => void) => {
    setIsOpen(false);
    command();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--overlay-scrim)] backdrop-blur-sm flex items-start justify-center pt-[20vh] px-4" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Command 
          shouldFilter={false} 
          className="flex flex-col h-full w-full"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
        >
          {/* Header Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-subtle)]">
            <Search className="w-5 h-5 text-[var(--text-muted)]" />
            <Command.Input 
              autoFocus
              placeholder="Search problems, sheets, tracks..."
              value={query}
              onValueChange={setQuery}
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-sans text-sm"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-[var(--action-primary)] animate-spin" />}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[var(--surface-muted)] border border-[var(--border-control)] text-[10px] font-mono text-[var(--text-secondary)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {query.length < 2 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Quick Actions
                </div>
                <button
                  type="button"
                  onClick={() => runCommand(() => openProductTour())}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--action-primary)]/20 flex items-center justify-center text-[var(--accent-text)] shrink-0 group-hover:bg-[var(--action-primary)]/20 transition-colors">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-primary)]">Explore Platform Tour</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">Interactive 6-card walkthrough of all features</p>
                  </div>
                </button>
              </div>
            )}

            {!isLoading && query.length >= 2 && data?.problems?.length === 0 && data?.sheets?.length === 0 && (
              <Command.Empty className="py-14 text-center text-sm text-[var(--text-muted)]">
                No results found.
              </Command.Empty>
            )}

            {/* Sheets Section */}
            {data?.sheets && data.sheets.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sheets</div>}>
                {data.sheets.map((sheet: any) => (
                  <Command.Item
                    key={sheet.slug}
                    onSelect={() => runCommand(() => navigate("/practice"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-[var(--surface-selected)] text-sm text-[var(--text-primary)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--status-success)]/10 flex items-center justify-center text-[var(--status-success)] shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{sheet.title}</span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">Practice Hub</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Problems Section */}
            {data?.problems && data.problems.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2">Problems</div>}>
                {data.problems.map((prob: any) => (
                  <Command.Item
                    key={prob.id}
                    onSelect={() => runCommand(() => window.open(`https://leetcode.com/problems/${prob.slug}`, "_blank"))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-[var(--surface-selected)] text-sm text-[var(--text-primary)] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-text)] shrink-0 group-aria-selected:bg-[var(--action-primary)]/20">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium truncate group-aria-selected:text-[var(--accent-text)] transition-colors">{prob.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {prob.company && prob.company.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {prob.company[0]}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium border",
                        prob.difficulty === "EASY" ? "bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/20" :
                        prob.difficulty === "MEDIUM" ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20" :
                        "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/20"
                      )}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
