import { useState, useMemo } from "react";
import { useNotes, useSaveNote, useDeleteNote } from "@/hooks/useNotes";
import { NotebookPen, Search, Trash2, Save, Loader2, StickyNote, ArrowLeft } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { toast } from "sonner";

export default function NotepadPage() {
  const { data: notes = [], isLoading } = useNotes();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();

  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.problemTitle.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.problemSlug.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const selectedNote = notes.find((n) => n.problemSlug === selectedSlug) ?? null;

  const handleSelect = (slug: string, content: string) => {
    setSelectedSlug(slug);
    setEditContent(content);
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    try {
      await saveNote.mutateAsync({
        slug: selectedNote.problemSlug,
        content: editContent,
        problemTitle: selectedNote.problemTitle,
      });
      setIsDirty(false);
      toast.success("Note saved!");
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await deleteNote.mutateAsync(slug);
      if (selectedSlug === slug) {
        setSelectedSlug(null);
        setEditContent("");
      }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto h-[calc(100dvh-64px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center shrink-0">
          <NotebookPen className="w-4.5 h-4.5 text-[#F59E0B]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F5F7FA] tracking-tight">Notes & Hints</h1>
          <p className="text-xs text-[#707784]">{notes.length} saved notes across your practice</p>
        </div>
      </div>

      {/* Two-column Layout: On mobile shows list or editor full-width, on desktop side-by-side */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Note List */}
        <div
          className={cn(
            "w-full md:w-80 shrink-0 flex flex-col gap-3 min-h-0",
            selectedSlug ? "hidden md:flex" : "flex"
          )}
        >
          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#525866]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by problem or keyword..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-[#327CF6]/50 text-xs text-[#F5F7FA] placeholder:text-[#525866] outline-none transition-colors"
            />
          </div>

          {/* Note Cards */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 text-[#327CF6] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                <StickyNote className="w-8 h-8 text-[#525866]" />
                <p className="text-xs text-[#707784]">
                  {search ? "No notes match your search" : "No notes yet. Add hints while practicing!"}
                </p>
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.problemSlug}
                  onClick={() => handleSelect(note.problemSlug, note.content)}
                  className={cn(
                    "p-3.5 rounded-xl border cursor-pointer transition-all group",
                    selectedSlug === note.problemSlug
                      ? "bg-[#14161B] border-[#327CF6]/40 shadow-sm"
                      : "bg-[#0D0E12] border-[#1E2229] hover:border-[#272B33]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#F5F7FA] line-clamp-1 flex-1">
                      {note.problemTitle}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.problemSlug);
                      }}
                      className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity text-[#707784] hover:text-[#EF4444] cursor-pointer shrink-0 p-1"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#707784] font-mono mt-1">{note.problemSlug}</p>
                  <p className="text-[11px] text-[#525866] mt-2 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-[10px] text-[#525866] mt-2 font-mono">
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div
          className={cn(
            "flex-1 flex flex-col rounded-xl bg-[#0D0E12] border border-[#1E2229] overflow-hidden min-h-0",
            !selectedSlug ? "hidden md:flex" : "flex"
          )}
        >
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#1E2229] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(null)}
                    className="md:hidden p-1.5 rounded-lg bg-zinc-800/60 text-zinc-300 hover:text-white shrink-0"
                    title="Back to notes list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F5F7FA] truncate">{selectedNote.problemTitle}</p>
                    <p className="text-[11px] text-[#707784] font-mono truncate">{selectedNote.problemSlug}</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveNote.isPending || !isDirty}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#327CF6] hover:bg-[#2563EB] text-xs font-semibold text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {saveNote.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 w-full bg-transparent p-4 sm:p-5 text-sm text-[#E0E2E8] font-mono resize-none outline-none leading-relaxed placeholder:text-[#525866]"
                placeholder="Write your hint, approach, complexity notes..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <NotebookPen className="w-10 h-10 text-[#525866]" />
              <p className="text-sm font-medium text-[#707784]">Select a note to view or edit</p>
              <p className="text-xs text-[#525866] max-w-xs">
                Hover over any problem in the Practice Hub and click the pen icon to add notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
