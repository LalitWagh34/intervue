import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Layers,
  Bookmark,
  NotebookPen,
  Sparkles,
  Brain,
} from "lucide-react";
import { useLearnConcept } from "@/hooks/useLearn";
import { useBookmarkSlugs, useToggleBookmark } from "@/hooks/useBookmarks";
import { QuestionNoteDrawer } from "@/components/shared/QuestionNoteDrawer";
import { SafeMarkdown } from "@/components/shared/SafeMarkdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecallModal } from "@/components/learn/RecallModal";
import { TwoPointersVisualizer } from "@/components/learn/visualizations/renderers/TwoPointersVisualizer";
import { BPlusTreeVisualizer } from "@/components/learn/visualizations/renderers/BPlusTreeVisualizer";
import { SlidingWindowVisualizer } from "@/components/learn/visualizations/renderers/SlidingWindowVisualizer";
import { BinarySearchVisualizer } from "@/components/learn/visualizations/renderers/BinarySearchVisualizer";
import { PrefixSumVisualizer } from "@/components/learn/visualizations/renderers/PrefixSumVisualizer";
import { MonotonicStackVisualizer } from "@/components/learn/visualizations/renderers/MonotonicStackVisualizer";
import { LinkedListReversalVisualizer } from "@/components/learn/visualizations/renderers/LinkedListReversalVisualizer";
import { toast } from "sonner";

type ReaderMode = "quick" | "deep" | "visualize";

const DIFFICULTY_STYLES: Record<string, string> = {
  FOUNDATION: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ADVANCED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function ConceptReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [mode, setMode] = useState<ReaderMode>("quick");
  const { data, isLoading, isError } = useLearnConcept(slug);

  // Bookmarks & Notes integration
  const { data: bookmarkedSlugs = [] } = useBookmarkSlugs();
  const toggleBookmark = useToggleBookmark();
  const [isConceptNotesOpen, setIsConceptNotesOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMode("quick");
  }, [slug]);

  if (isLoading) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse">
          <div className="h-4 w-48 rounded bg-[var(--surface-muted)]" />
          <div className="h-9 w-72 rounded bg-[var(--surface-muted)]" />
          <div className="h-16 w-full rounded-xl bg-[var(--surface-muted)]" />
          <div className="h-96 w-full rounded-xl bg-[var(--surface-muted)]" />
        </div>
      </div>
    );
  }

  if (isError || !data?.concept) {
    return (
      <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
            <BookOpen className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Concept not found</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This concept is either unpublished or does not exist yet.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/learn/concepts/two-pointers">Open Two Pointers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { concept, navigation } = data;
  const hasVisualization =
    concept.slug === "two-pointers" ||
    concept.slug === "sliding-window" ||
    concept.slug === "binary-search" ||
    concept.slug === "prefix-sum" ||
    concept.slug === "monotonic-stack" ||
    concept.slug === "linked-list-reversal" ||
    concept.slug === "b-plus-trees";
  const activeMarkdown = mode === "deep" ? concept.deepDiveMd : concept.quickRevisionMd;
  const isConceptBookmarked = bookmarkedSlugs.includes(`learn:${concept.slug}`);

  const handleToggleConceptBookmark = async () => {
    try {
      const res = await toggleBookmark.mutateAsync({
        problemSlug: `learn:${concept.slug}`,
        problemTitle: concept.title,
        difficulty:
          concept.difficulty === "FOUNDATION"
            ? "Easy"
            : concept.difficulty === "INTERMEDIATE"
            ? "Medium"
            : "Hard",
      });
      if (res.bookmarked) {
        toast.success(`Bookmarked "${concept.title}" for revision`);
      } else {
        toast.info(`Removed "${concept.title}" from bookmarks`);
      }
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const mentorQuery = encodeURIComponent(
    `I am revising "${concept.title}" in ${concept.subject.title}. Could you explain the core invariants, when to use it, common trap questions, and key edge cases in technical interviews?`
  );

  return (
    <div className="w-full min-h-full bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/learn" className="hover:text-foreground transition-colors">
            Learn &amp; Revise
          </Link>
          <span>/</span>
          <Link to={`/learn/subjects/${concept.subject.slug}`} className="hover:text-foreground transition-colors">
            {concept.subject.title}
          </Link>
          <span>/</span>
          <Link to={`/learn/subjects/${concept.subject.slug}/modules/${concept.module.slug}`} className="hover:text-foreground transition-colors">
            {concept.module.title}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{concept.title}</span>
        </nav>

        {/* Concept Header */}
        <header className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[11px] font-medium", DIFFICULTY_STYLES[concept.difficulty])}
              >
                {concept.difficulty.charAt(0) + concept.difficulty.slice(1).toLowerCase()}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground font-mono">
                <Clock className="h-3.5 w-3.5" />
                {concept.estimatedMinutes} min
              </span>
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                v{concept.version}
              </span>
            </div>

            {/* Quick Revision vs Deep Dive vs Visualize Toggle */}
            <div
              role="tablist"
              aria-label="Reading mode"
              className="inline-flex rounded-lg border border-border bg-muted/50 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "quick"}
                onClick={() => setMode("quick")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  mode === "quick"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-3.5 w-3.5" />
                Quick Revision
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "deep"}
                onClick={() => setMode("deep")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  mode === "deep"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Deep Dive
              </button>
              {hasVisualization && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "visualize"}
                  onClick={() => setMode("visualize")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    mode === "visualize"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Visualize
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {concept.title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">{concept.summary}</p>
            </div>

            {/* Action Bar: Solve MCQs, Ask AI Mentor, Concept Notes, Bookmark */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsRecallModalOpen(true)}
                className="h-8 gap-1.5 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Brain className="h-3.5 w-3.5" />
                Solve MCQs
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-medium"
              >
                <Link to={`/chat?prompt=${mentorQuery}&autoSend=true`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask AI Mentor
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConceptNotesOpen(true)}
                className="h-8 gap-1.5 border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                title="Concept Notes"
              >
                <NotebookPen className="h-3.5 w-3.5" />
                Notes
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleConceptBookmark}
                className={cn(
                  "h-8 gap-1.5 border-border bg-background text-xs font-medium transition-colors cursor-pointer",
                  isConceptBookmarked
                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={isConceptBookmarked ? "Bookmarked for Revision" : "Bookmark Concept"}
              >
                <Bookmark className={cn("h-3.5 w-3.5", isConceptBookmarked && "fill-current")} />
                {isConceptBookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
            </div>
          </div>
        </header>

        {/* Lesson Body: Visualization OR SafeMarkdown */}
        {mode === "visualize" && hasVisualization ? (
          concept.slug === "b-plus-trees" ? (
            <BPlusTreeVisualizer />
          ) : concept.slug === "sliding-window" ? (
            <SlidingWindowVisualizer />
          ) : concept.slug === "binary-search" ? (
            <BinarySearchVisualizer />
          ) : concept.slug === "prefix-sum" ? (
            <PrefixSumVisualizer />
          ) : concept.slug === "monotonic-stack" ? (
            <MonotonicStackVisualizer />
          ) : concept.slug === "linked-list-reversal" ? (
            <LinkedListReversalVisualizer />
          ) : (
            <TwoPointersVisualizer />
          )
        ) : (
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-6 sm:p-9">
              <SafeMarkdown content={activeMarkdown} />
            </CardContent>
          </Card>
        )}

        {/* Key Takeaways & Common Mistakes (Quick & Deep modes only) */}
        {mode !== "visualize" && (concept.keyTakeaways.length > 0 || concept.commonMistakes.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {concept.keyTakeaways.length > 0 && (
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-5.5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Key Takeaways &amp; Core Invariants
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {concept.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {concept.commonMistakes.length > 0 && (
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-5.5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Common Pitfalls &amp; Interview Traps
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {concept.commonMistakes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Big Action Banner to Launch Active Recall Quiz Modal (Quick & Deep modes only) */}
        {mode !== "visualize" && (
          <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs">
            <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--action-primary)]/10 text-[var(--action-primary)]">
                    <Brain className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    Ready to Test Your Recall?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                  Step through verified interview MCQs with instant reasoning and explanation breakdowns to lock in your mental model for {concept.title}.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsRecallModalOpen(true)}
                className="shrink-0 text-xs sm:text-sm font-semibold px-5 py-2.5 h-auto cursor-pointer flex items-center gap-2 bg-[var(--action-primary)] text-[var(--on-primary)] shadow-sm hover:bg-[var(--action-primary-hover)] transition-all"
              >
                <Brain className="h-4 w-4" />
                Solve MCQs &amp; Active Recall
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Deep Intuition & Follow-up with AI Mentor (Quick & Deep modes only) */}
        {mode !== "visualize" && (
          <Card className="border-border bg-card/60 backdrop-blur-xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Need deeper intuition or have follow-up questions?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Discuss {concept.title} with your dedicated AI Mentor for customized examples, proofs, and interview drill-downs.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 pt-1">
                {[
                  {
                    label: "Invariant Proofs",
                    prompt: `Can you explain the formal invariant proof for ${concept.title}? Why is its correctness guaranteed and what happens if boundaries are off by 1?`,
                  },
                  {
                    label: "Code Templates",
                    prompt: `Give me production-quality code templates for ${concept.title} in Python, C++, and Java with clean edge-case handling.`,
                  },
                  {
                    label: "Tricky Edge Cases",
                    prompt: `What are the most common trap questions and subtle edge cases interviewers use to test candidates on ${concept.title}?`,
                  },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={`/chat?prompt=${encodeURIComponent(item.prompt)}&autoSend=true`}
                    className="flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3 text-left hover:bg-muted/50 hover:border-border transition-colors group"
                  >
                    <span className="text-xs font-medium text-foreground group-hover:text-[var(--action-primary)] transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                      {item.prompt}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prev / Next Navigation */}
        <footer className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {navigation.prev ? (
            <Link
              to={`/learn/concepts/${navigation.prev.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Previous
                </div>
                <div className="text-sm font-medium text-foreground">
                  {navigation.prev.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {navigation.next ? (
            <Link
              to={`/learn/concepts/${navigation.next.slug}`}
              className="flex items-center justify-end gap-3 rounded-xl border border-border bg-card px-4 py-3 text-right hover:bg-muted/40 transition-colors"
            >
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Next
                </div>
                <div className="text-sm font-medium text-foreground">
                  {navigation.next.title}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ) : (
            <div />
          )}
        </footer>
      </div>

      {/* Slide-over Concept Notes Drawer */}
      <QuestionNoteDrawer
        isOpen={isConceptNotesOpen}
        onClose={() => setIsConceptNotesOpen(false)}
        problemSlug={`learn:${concept.slug}`}
        problemTitle={concept.title}
      />

      {/* Global Big Active Recall Quiz Modal with Question Slider */}
      <RecallModal
        isOpen={isRecallModalOpen}
        onClose={() => setIsRecallModalOpen(false)}
        conceptSlug={concept.slug}
        conceptTitle={concept.title}
        subjectTitle={concept.subject.title}
        moduleTitle={concept.module.title}
      />
    </div>
  );
}
