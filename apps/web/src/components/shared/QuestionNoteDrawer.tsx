import { useState, useEffect } from "react";
import {
  X,
  NotebookPen,
  Trash2,
  Save,
  Loader2,
  Lightbulb,
  Clock,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNote, useSaveNote, useDeleteNote } from "@/hooks/useNotes";
import { toast } from "sonner";

interface QuestionNoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problemSlug: string;
  problemTitle: string;
}

export function QuestionNoteDrawer({
  isOpen,
  onClose,
  problemSlug,
  problemTitle,
}: QuestionNoteDrawerProps) {
  const { data: note, isLoading } = useNote(problemSlug);
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    setShowDiscardConfirm(false);
    setIsDirty(false);
    setContent(note?.content ?? "");
  }, [problemSlug, isOpen]);

  useEffect(() => {
    if (isDirty) return;
    if (note) {
      setContent(note.content);
    } else if (!isLoading) {
      setContent("");
    }
  }, [note?.content, isLoading, isDirty]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isOpen, isDirty]);

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setIsDirty(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      await saveNote.mutateAsync({ slug: problemSlug, content, problemTitle });
      setIsDirty(false);
      toast.success("Note saved!");
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || "Failed to save note"; console.error("Save note error:", err); toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote.mutateAsync(problemSlug);
      setContent("");
      setIsDirty(false);
      toast.success("Note deleted");
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || "Failed to delete note"; console.error("Delete note error:", err); toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleRequestClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/25 flex items-center justify-center">
              <NotebookPen className="w-4 h-4 text-[var(--status-warning)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">My Note</h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate max-w-[240px]">{problemTitle}</p>
            </div>
          </div>
          <button
            onClick={handleRequestClose}
            aria-label="Close note drawer"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showDiscardConfirm && (
          <div
            role="alertdialog"
            aria-label="Unsaved note changes"
            className="px-5 py-3 bg-[var(--status-warning)]/10 border-b border-[var(--status-warning)]/30 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0"
          >
            <span className="text-[var(--status-warning)] font-medium">
              You have unsaved changes. Discard them?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-2.5 py-1 rounded-md bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] font-medium cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-2.5 py-1 rounded-md bg-[var(--status-danger)]/15 hover:bg-[var(--status-danger)]/25 text-[var(--status-danger)] border border-[var(--status-danger)]/30 font-semibold cursor-pointer"
              >
                Discard &amp; close
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden">
          {/* Quick Template Hints */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Key Intuition", icon: Lightbulb, color: "text-amber-500", insert: "💡 Key Intuition: " },
              { label: "Complexity", icon: Clock, color: "text-blue-500", insert: "⏱️ Complexity: " },
              { label: "Edge Case", icon: AlertTriangle, color: "text-rose-500", insert: "⚠️ Edge Case: " },
              { label: "Pattern", icon: Layers, color: "text-purple-500", insert: "🧩 Pattern: " },
            ].map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setContent((prev) =>
                    prev ? `${prev}\n\n${tpl.insert}` : `${tpl.insert}`
                  );
                  setIsDirty(true);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-control)] transition-colors cursor-pointer"
              >
                <tpl.icon className={cn("w-3.5 h-3.5", tpl.color)} />
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>

          {/* Text Area */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[var(--accent-text)] animate-spin" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              placeholder={`Write your hint, approach, or edge cases for "${problemTitle}"...\n\nExamples:\n• Use two pointers — left starts at 0, right at n-1\n• O(n) time, O(1) space\n• Handle empty array case first`}
              className="flex-1 w-full bg-[var(--surface-muted)] border border-[var(--border-control)] focus:border-[var(--action-primary)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono resize-none outline-none transition-colors leading-relaxed"
              autoFocus
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border-subtle)] shrink-0 gap-3">
          {note ? (
            <button
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--status-danger)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">
              {content ? "Unsaved" : "No note yet"}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveNote.isPending || !isDirty || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-xs font-semibold text-[var(--on-primary)] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {saveNote.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
