import { useState, useMemo, useEffect } from "react";
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
  const [pendingAction, setPendingAction] = useState<
    | { type: "select"; slug: string; content: string }
    | { type: "back" }
    | null
  >(null);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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

  const applySelect = (slug: string, content: string) => {
    setSelectedSlug(slug);
    setEditContent(content);
    setIsDirty(false);
    setPendingAction(null);
  };

  const handleSelect = (slug: string, content: string) => {
    if (slug === selectedSlug) return;
    if (isDirty) {
      setPendingAction({ type: "select", slug, content });
      return;
    }
    applySelect(slug, content);
  };

  const handleBackToList = () => {
    if (isDirty) {
      setPendingAction({ type: "back" });
      return;
    }
    setSelectedSlug(null);
    setPendingAction(null);
  };

  const handleConfirmDiscard = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "select") {
      applySelect(pendingAction.slug, pendingAction.content);
    } else {
      setSelectedSlug(null);
      setEditContent("");
      setIsDirty(false);
      setPendingAction(null);
    }
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

  const handleDelete = async (note: {
    problemSlug: string;
    problemTitle: string;
    content: string;
  }) => {
    try {
      await deleteNote.mutateAsync(note.problemSlug);
      if (selectedSlug === note.problemSlug) {
        setSelectedSlug(null);
        setEditContent("");
        setIsDirty(false);
        setPendingAction(null);
      }
      toast.success(`Deleted note for ${note.problemTitle}`, {
        action: {
          label: "Undo",
          onClick: () => {
            saveNote.mutate({
              slug: note.problemSlug,
              content: note.content,
              problemTitle: note.problemTitle,
            });
          },
        },
      });
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto h-[calc(100dvh-64px)] flex flex-col overflow-hidden text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[var(--status-warning-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
          <NotebookPen className="w-4.5 h-4.5 text-[var(--status-warning)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Notes & Hints</h1>
          <p className="text-xs text-[var(--text-secondary)]">{notes.length} saved notes across your practice</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by problem or keyword..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors"
            />
          </div>

          {/* Note Cards */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 text-[var(--accent-text)] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                <StickyNote className="w-8 h-8 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-secondary)]">
                  {search ? "No notes match your search" : "No notes yet. Add hints while practicing!"}
                </p>
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.problemSlug}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all group flex items-start gap-2",
                    selectedSlug === note.problemSlug
                      ? "bg-[var(--surface-selected)] border-[var(--action-primary)] shadow-sm"
                      : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(note.problemSlug, note.content)}
                    aria-current={selectedSlug === note.problemSlug ? "true" : undefined}
                    className="flex-1 min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]"
                  >
                    <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                      {note.problemTitle}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">{note.problemSlug}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    aria-label={`Delete note for ${note.problemTitle}`}
                    title="Delete Note"
                    className="opacity-75 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--status-danger)] cursor-pointer shrink-0 p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div
          className={cn(
            "flex-1 flex flex-col rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] overflow-hidden min-h-0 shadow-sm",
            !selectedSlug ? "hidden md:flex" : "flex"
          )}
        >
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="md:hidden p-1.5 rounded-lg bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
                    title="Back to notes list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{selectedNote.problemTitle}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">{selectedNote.problemSlug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isDirty && (
                    <span className="text-[11px] font-medium text-[var(--status-warning)]">Unsaved</span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saveNote.isPending || !isDirty}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-xs font-semibold text-[var(--on-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {saveNote.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>
              {pendingAction && (
                <div
                  role="alertdialog"
                  aria-label="Unsaved note changes"
                  className="px-4 sm:px-5 py-2.5 bg-[var(--status-warning-subtle)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="text-[var(--status-warning)] font-medium">
                    You have unsaved changes. Discard them?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingAction(null)}
                      className="px-2.5 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-[var(--text-primary)] font-medium cursor-pointer"
                    >
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDiscard}
                      className="px-2.5 py-1 rounded-md bg-[var(--status-danger-subtle)] hover:opacity-90 text-[var(--status-danger)] border border-[var(--border-subtle)] font-semibold cursor-pointer"
                    >
                      Discard changes
                    </button>
                  </div>
                </div>
              )}
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 w-full bg-transparent p-4 sm:p-5 text-sm text-[var(--text-primary)] font-mono resize-none outline-none leading-relaxed placeholder:text-[var(--text-muted)]"
                placeholder="Write your hint, approach, complexity notes..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <NotebookPen className="w-10 h-10 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">Select a note to view or edit</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Open any problem in the Practice Hub and select the notes icon to add hints.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
