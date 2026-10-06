import { useState, useRef, useEffect } from "react";
import { Filter, Search, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <Search className="w-3.5 h-3.5 text-[#525866] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search problems, topics, companies..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="w-full bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#525866] outline-none transition-all font-sans"
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-[#7A808C]">
        <span className="font-mono hidden sm:inline-block">{resultCount} questions</span>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1.5 rounded-lg border transition-colors flex items-center gap-1.5",
              activeFilterCount > 0
                ? "bg-[#327CF6]/10 border-[#327CF6]/30 text-[#327CF6]"
                : "bg-[#0D0E12] border-[#181A20] hover:text-white"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>

          {/* Popover Menu */}
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-[#0D0E12] border border-[#181A20] rounded-xl shadow-xl z-50 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#181A20]">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[11px] text-[#8B92A0] hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {/* Status */}
                <div>
                  <h4 className="text-[11px] font-semibold text-[#525866] mb-2 uppercase tracking-wider">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleArrayItem("status", s)}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] transition-colors flex items-center gap-1",
                          filters.status.includes(s)
                            ? "bg-[#327CF6]/15 border-[#327CF6]/40 text-[#327CF6]"
                            : "bg-[#060709] border-[#181A20] text-[#8B92A0] hover:border-[#262933]"
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
                  <h4 className="text-[11px] font-semibold text-[#525866] mb-2 uppercase tracking-wider">Difficulty</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.difficulties.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleArrayItem("difficulty", d)}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] transition-colors flex items-center gap-1",
                          filters.difficulty.includes(d)
                            ? d === "Basic" ? "bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]"
                              : d === "Core" ? "bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]"
                              : "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
                            : "bg-[#060709] border-[#181A20] text-[#8B92A0] hover:border-[#262933]"
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
                    <h4 className="text-[11px] font-semibold text-[#525866] mb-2 uppercase tracking-wider">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {options.topics.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleArrayItem("topics", t)}
                          className={cn(
                            "px-2.5 py-1 rounded-md border text-[11px] transition-colors",
                            filters.topics.includes(t)
                              ? "bg-[#327CF6]/15 border-[#327CF6]/40 text-[#327CF6]"
                              : "bg-[#060709] border-[#181A20] text-[#8B92A0] hover:border-[#262933]"
                          )}
                        >
                          {t}
                        </button>
                      ))}
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
