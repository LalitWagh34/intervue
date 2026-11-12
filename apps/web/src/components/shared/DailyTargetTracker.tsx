import { useState } from "react";
import {
  Target,
  Plus,
  Check,
  Trash2,
  Edit2,
  Sparkles,
  Flame,
  CheckCircle2,
  X,
} from "lucide-react";
import { useDailyTargets, DailyTarget } from "@/hooks/useDailyTargets";
import { cn } from "@/lib/utils";

interface DailyTargetTrackerProps {
  className?: string;
  compact?: boolean;
}

export function DailyTargetTracker({ className, compact = false }: DailyTargetTrackerProps) {
  const {
    targets,
    completedCount,
    totalCount,
    progressPercent,
    addTarget,
    toggleTarget,
    editTarget,
    deleteTarget,
  } = useDailyTargets();

  const [inputTitle, setInputTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DailyTarget["category"]>("DSA");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;
    addTarget(inputTitle, selectedCategory);
    setInputTitle("");
  };

  const handleStartEdit = (target: DailyTarget) => {
    setEditingId(target.id);
    setEditingText(target.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editingText.trim()) {
      editTarget(id, editingText);
    }
    setEditingId(null);
  };

  const handleQuickAdd = (title: string, category: DailyTarget["category"]) => {
    addTarget(title, category);
  };

  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-sm space-y-4",
        className
      )}
    >
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-text)]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                Track Daily Targets
                {isAllDone && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success)]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    All Completed!
                  </span>
                )}
              </h3>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Set daily focus goals.
          </p>
        </div>

        {/* Counter Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="text-[var(--text-secondary)]">Progress:</span>
            <span className="text-[var(--text-primary)] font-bold">
              {completedCount}/{totalCount}
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span
              className={cn(
                "font-bold",
                progressPercent === 100
                  ? "text-[var(--status-success)]"
                  : progressPercent > 50
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--status-warning)]"
              )}
            >
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressPercent === 100
              ? "bg-[var(--status-success)]"
              : "bg-[var(--action-primary)]"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Inline Add Target Input */}
      <form onSubmit={handleAdd} className="space-y-2.5 pt-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="Add new daily target (e.g. Solve 2 Trees problems)..."
            style={{ minWidth: 0, flex: 1 }}
            className="min-w-0 flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--accent-text)]/30 focus:outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
          />
          <button
            type="submit"
            style={{ flexShrink: 0 }}
            className="shrink-0 flex-shrink-0 px-4 py-2.5 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </button>
        </div>

        {/* Category Pill selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-[var(--text-muted)] font-mono mr-1">Category:</span>
          {(["DSA", "System Design", "Core CS", "Behavioral", "General"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer border",
                selectedCategory === cat
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border-[var(--action-primary)]/40 font-semibold"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>

      {/* Quick Suggestions Strip */}
      {/* <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
        <span className="text-slate-500 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500" />
          Quick add:
        </span>
        <button
          type="button"
          onClick={() => handleQuickAdd("Solve 2 FAANG Medium Problems", "DSA")}
          className="px-2 py-1 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          + 2 FAANG Mediums
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd("Simulate 1 AI Technical Mock Session", "System Design")}
          className="px-2 py-1 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          + 1 AI Mock Round
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd("Review System Architecture Notes", "Core CS")}
          className="px-2 py-1 rounded-lg bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          + Review Notes
        </button>
      </div> */}

      {/* Target Items List */}
      <div className="space-y-2 pt-2 divide-y divide-[var(--border-subtle)] max-h-44 overflow-y-auto pr-1">
        {targets.length === 0 ? (
          <div className="p-6 rounded-xl bg-[var(--surface-muted)] border border-dashed border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-xs">
            No daily targets set for today. Add your first goal above to start tracking!
          </div>
        ) : (
          targets.map((target) => (
            <div
              key={target.id}
              className={cn(
                "pt-2 first:pt-0 flex items-center justify-between gap-3 group transition-colors",
                target.completed ? "opacity-70" : "opacity-100"
              )}
            >
              {/* Checkbox & Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleTarget(target.id)}
                  className={cn(
                    "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer",
                    target.completed
                      ? "bg-[var(--status-success)] border-[var(--status-success)] text-[var(--on-primary)]"
                      : "border-[var(--border-control)] bg-[var(--surface-muted)] hover:border-[var(--action-primary)] text-transparent"
                  )}
                  title={target.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {editingId === target.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(target.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--action-primary)] text-xs text-[var(--text-primary)] flex-1 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(target.id)}
                      className="p-1 text-[var(--status-success)] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="min-w-0 flex items-center gap-2 flex-1">
                    <span
                      onClick={() => toggleTarget(target.id)}
                      className={cn(
                        "text-xs sm:text-sm cursor-pointer transition-colors select-none truncate",
                        target.completed
                          ? "line-through text-[var(--text-muted)]"
                          : "text-[var(--text-primary)]"
                      )}
                    >
                      {target.title}
                    </span>
                    {target.category && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] shrink-0">
                        {target.category}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleStartEdit(target)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title="Edit target"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteTarget(target.id)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-subtle)] transition-colors cursor-pointer"
                  title="Delete target"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
