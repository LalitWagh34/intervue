import { useState, useEffect } from "react";
import { X, NotebookPen, Trash2, Save, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setIsDirty(false);
    } else if (!isLoading) {
      setContent("");
      setIsDirty(false);
    }
  }, [note, isLoading, problemSlug]);

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
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0D0E12] border-l border-[#1E2229] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
              <NotebookPen className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F5F7FA] leading-tight">My Note</h2>
              <p className="text-[11px] text-[#707784] font-mono truncate max-w-[240px]">{problemTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707784] hover:text-[#F5F7FA] hover:bg-[#1E2229] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden">
          {/* Quick Template Hints */}
          <div className="flex gap-2 flex-wrap">
            {[
              "?? Key Intuition",
              "? Complexity",
              "?? Edge Case",
              "?? Pattern",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setContent((prev) =>
                    prev ? `${prev}\n\n${tag}: ` : `${tag}: `
                  );
                  setIsDirty(true);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[#14161B] border border-[#272B33] text-[#A1A7B3] hover:text-[#F5F7FA] hover:border-[#327CF6]/40 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Text Area */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#327CF6] animate-spin" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              placeholder={`Write your hint, approach, or edge cases for "${problemTitle}"...\n\nExamples:\n?? Use two pointers — left starts at 0, right at n-1\n? O(n) time, O(1) space\n?? Handle empty array case first`}
              className="flex-1 w-full bg-[#08090C] border border-[#1E2229] focus:border-[#327CF6]/50 rounded-xl p-4 text-sm text-[#E0E2E8] placeholder:text-[#525866] font-mono resize-none outline-none transition-colors leading-relaxed"
              autoFocus
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E2229] shrink-0 gap-3">
          {note ? (
            <button
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-[#707784] hover:text-[#EF4444] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <span className="text-[11px] text-[#525866]">
              {content ? "Unsaved" : "No note yet"}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#707784] hover:text-[#F5F7FA] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveNote.isPending || !isDirty || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#327CF6] hover:bg-[#2563EB] text-xs font-semibold text-white transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
