import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Code2, Folder, Loader2 } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-[#0D0E12] border border-[#181A20] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#181A20]">
            <Search className="w-5 h-5 text-[#525866]" />
            <Command.Input 
              autoFocus
              placeholder="Search problems, sheets, tracks..."
              value={query}
              onValueChange={setQuery}
              className="flex-1 bg-transparent text-white placeholder-[#525866] outline-none font-sans text-sm"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-[#327CF6] animate-spin" />}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#111318] border border-[#181A20] text-[10px] font-mono text-[#8B92A0]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {query.length < 2 && (
              <div className="py-14 text-center text-sm text-[#525866]">
                Type at least 2 characters to search...
              </div>
            )}

            {!isLoading && query.length >= 2 && data?.problems?.length === 0 && data?.sheets?.length === 0 && (
              <Command.Empty className="py-14 text-center text-sm text-[#525866]">
                No results found.
              </Command.Empty>
            )}

            {/* Sheets Section */}
            {data?.sheets && data.sheets.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[#525866] uppercase tracking-wider">Sheets</div>}>
                {data.sheets.map((sheet: any) => (
                  <Command.Item
                    key={sheet.slug}
                    onSelect={() => runCommand(() => navigate("/practice"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-[#111318] text-sm text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{sheet.title}</span>
                      <span className="text-xs text-[#7A808C] truncate">Practice Hub</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Problems Section */}
            {data?.problems && data.problems.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1.5 text-xs font-semibold text-[#525866] uppercase tracking-wider mt-2">Problems</div>}>
                {data.problems.map((prob: any) => (
                  <Command.Item
                    key={prob.id}
                    onSelect={() => runCommand(() => window.open(`https://leetcode.com/problems/${prob.slug}`, "_blank"))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-[#111318] text-sm text-white transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#327CF6]/10 flex items-center justify-center text-[#327CF6] shrink-0 group-aria-selected:bg-[#327CF6]/20">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium truncate group-aria-selected:text-[#327CF6] transition-colors">{prob.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {prob.company && prob.company.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-[#14161C] border-[#1E2229] text-[#8B92A0]">
                          {prob.company[0]}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium border",
                        prob.difficulty === "EASY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        prob.difficulty === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
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
