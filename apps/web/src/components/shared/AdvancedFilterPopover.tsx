import { useState, useRef, useEffect } from "react";
import { Filter, Search, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCompanyLogo } from "@/lib/companyLogos";
import type { FilterState } from "@/hooks/useProblemFilter";

interface AdvancedFilterProps {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
  options: {
    topics: string[];
    companies: string[];
    difficulties: string[];
    statuses: string[];
  };
  resultCount: number;
}

export function AdvancedFilterPopover({
  filters,
  updateFilter,
  clearFilters,
  options,
  resultCount,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const activeFilterCount = 
    filters.difficulty.length + 
    filters.status.length + 
    filters.topics.length + 
    filters.companies.length;

  const toggleArrayItem = <K extends "difficulty" | "status" | "topics" | "companies">(
    key: K,
    item: string
  ) => {
    const current = filters[key];
    if (current.includes(item)) {
      updateFilter(key, current.filter((x) => x !== item));
    } else {
      updateFilter(key, [...current, item]);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full" ref={popoverRef}>
      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search problems, topics, companies..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="w-full bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all font-sans"
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span className="font-mono hidden sm:inline-block">{resultCount} questions</span>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer",
              activeFilterCount > 0
                ? "bg-[var(--accent-soft)] border-[var(--action-primary)]/30 text-[var(--accent-text)]"
                : "bg-[var(--surface)] border-[var(--border-control)] hover:text-[var(--text-primary)]"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>

          {/* Popover Menu */}
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {/* Status */}
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleArrayItem("status", s)}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] transition-colors flex items-center gap-1 cursor-pointer",
                          filters.status.includes(s)
                            ? "bg-[var(--accent-soft)] border-[var(--action-primary)]/40 text-[var(--accent-text)]"
                            : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-control)]"
                        )}
                      >
                        {filters.status.includes(s) && <Check className="w-3 h-3" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Difficulty</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.difficulties.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleArrayItem("difficulty", d)}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] transition-colors flex items-center gap-1 cursor-pointer",
                          filters.difficulty.includes(d)
                            ? d === "Basic" ? "bg-[var(--status-success)]/15 border-[var(--status-success)]/40 text-[var(--status-success)]"
                              : d === "Core" ? "bg-[var(--status-warning)]/15 border-[var(--status-warning)]/40 text-[var(--status-warning)]"
                              : "bg-[var(--status-danger)]/15 border-[var(--status-danger)]/40 text-[var(--status-danger)]"
                            : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-control)]"
                        )}
                      >
                        {filters.difficulty.includes(d) && <Check className="w-3 h-3" />}
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                {options.topics.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {options.topics.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleArrayItem("topics", t)}
                          className={cn(
                            "px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer",
                            filters.topics.includes(t)
                              ? "bg-[var(--accent-soft)] border-[var(--action-primary)]/40 text-[var(--accent-text)]"
                              : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-control)]"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies */}
                {options.companies.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Companies</h4>
                    <div className="flex flex-wrap gap-2">
                      {options.companies.map((c) => {
                        const logo = getCompanyLogo(c);
                        return (
                          <button
                            key={c}
                            onClick={() => toggleArrayItem("companies", c)}
                            className={cn(
                              "px-2.5 py-1 rounded-md border text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer",
                              filters.companies.includes(c)
                                ? "bg-[var(--accent-soft)] border-[var(--action-primary)]/40 text-[var(--accent-text)]"
                                : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-control)]"
                            )}
                          >
                            {logo && (
                              <img src={logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                            )}
                            {filters.companies.includes(c) && <Check className="w-3 h-3 text-[var(--accent-text)]" />}
                            <span>{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
