import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Code2, Folder, Loader2, Compass, Clock, X } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { openProductTour } from "@/components/shared/ProductTourModal";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from "@/lib/localCache";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export const getSheetPracticePath = (sheetSlug: string) =>
  `/practice?${new URLSearchParams({ view: "sheet_practice", sheet: sheetSlug }).toString()}`;

export function CommandPalette() {
  const { isOpen, returnFocus, setIsOpen } = useCommandPalette();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches(userId));
  const activeControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedQuery = query.trim();
    const timeout = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 300);
    return () => {
      window.clearTimeout(timeout);
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
    };
  }, [query]);

  useEffect(() => {
    setRecentSearches(getRecentSearches(userId));
    if (!isOpen && activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
  }, [isOpen, userId]);

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
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["globalSearch", debouncedQuery],
    queryFn: async ({ signal }) => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeControllerRef.current = controller;

      const onAbort = () => controller.abort();
      if (signal) {
        if (signal.aborted) controller.abort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal,
        });
        return res.data;
      } finally {
        signal?.removeEventListener("abort", onAbort);
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });
  const normalizedQuery = query.trim();
  const isWaitingForDebounce = normalizedQuery.length >= 2 && normalizedQuery !== debouncedQuery;
  const isSearching = isWaitingForDebounce || isFetching;
  const visibleData = isWaitingForDebounce ? undefined : data;

  const runCommand = (command: () => void, searchToSave?: string) => {
    if (searchToSave && searchToSave.trim().length >= 2) {
      setRecentSearches(addRecentSearch(userId, searchToSave));
    }
    setIsOpen(false);
    command();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus?.focus();
        }}
        className="top-[20vh] max-w-2xl translate-y-0 gap-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-0 text-[var(--text-primary)] shadow-2xl"
      >
        <DialogTitle className="sr-only">Search Intervue</DialogTitle>
        <DialogDescription className="sr-only">
          Search published problems and practice sheets, or choose a quick action.
        </DialogDescription>
        <Command 
          shouldFilter={false} 
          className="flex flex-col h-full w-full"
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
            {isSearching && <Loader2 aria-label="Searching" className="w-4 h-4 text-[var(--action-primary)] animate-spin" />}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[var(--surface-muted)] border border-[var(--border-control)] text-[10px] font-mono text-[var(--text-secondary)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {query.length < 2 && (
              <div className="p-2 space-y-2">
                {recentSearches.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearRecentSearches(userId);
                          setRecentSearches([]);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] cursor-pointer transition-colors"
                        >
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
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
              </div>
            )}

            {isError && !isWaitingForDebounce && (
              <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Search is temporarily unavailable.</p>
                <p className="text-xs text-[var(--text-secondary)]">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-lg border border-[var(--border-control)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                >
                  Try again
                </button>
              </div>
            )}

            {!isSearching && !isError && normalizedQuery.length >= 2 && visibleData?.problems?.length === 0 && visibleData?.sheets?.length === 0 && (
              <Command.Empty className="py-14 text-center text-sm text-[var(--text-muted)]">
                No results found.
              </Command.Empty>
            )}

            {/* Sheets Section */}
            {!isError && visibleData?.sheets && visibleData.sheets.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sheets</div>}>
                {visibleData.sheets.map((sheet: any) => (
                  <Command.Item
                    key={sheet.slug}
                    onSelect={() => runCommand(() => navigate(getSheetPracticePath(sheet.slug)), debouncedQuery)}
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
            {!isError && visibleData?.problems && visibleData.problems.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2">Problems</div>}>
                {visibleData.problems.map((prob: any) => (
                  <Command.Item
                    key={prob.id}
                    onSelect={() => runCommand(() => window.open(`https://leetcode.com/problems/${prob.slug}`, "_blank"), debouncedQuery)}
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
      </DialogContent>
    </Dialog>
  );
}
