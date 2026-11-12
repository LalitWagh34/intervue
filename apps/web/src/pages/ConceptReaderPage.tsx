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
  Code2,
  ExternalLink,
} from "lucide-react";
import { useLearnConcept } from "@/hooks/useLearn";
import { useBookmarkSlugs, useToggleBookmark } from "@/hooks/useBookmarks";
import { QuestionNoteDrawer } from "@/components/shared/QuestionNoteDrawer";
import { SafeMarkdown } from "@/components/shared/SafeMarkdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecallCheckWidget } from "@/components/learn/RecallCheckWidget";
import { CONCEPT_PRACTICE_MAP } from "@/data/conceptPracticeMap";
import { toast } from "sonner";

type ReaderMode = "quick" | "deep";

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
  const [activeProblemNote, setActiveProblemNote] = useState<{
    isOpen: boolean;
    slug: string;
    title: string;
  }>({
    isOpen: false,
    slug: "",
    title: "",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const activeMarkdown = mode === "quick" ? concept.quickRevisionMd : concept.deepDiveMd;
  const isConceptBookmarked = bookmarkedSlugs.includes(`learn:${concept.slug}`);
  const practiceProblems = CONCEPT_PRACTICE_MAP[concept.slug] || [];

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

  const handleToggleProblemBookmark = async (
    problemSlug: string,
    problemTitle: string,
    difficulty: string
  ) => {
    try {
      const res = await toggleBookmark.mutateAsync({
        problemSlug,
        problemTitle,
        difficulty,
      });
      if (res.bookmarked) {
        toast.success(`Bookmarked "${problemTitle}"`);
      } else {
        toast.info(`Removed "${problemTitle}" from bookmarks`);
      }
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const mentorQuery = encodeURIComponent(
    `I am revising "${concept.title}" in ${concept.subject.title}. Could you explain the core invariants, when to use it, common trap questions, and key edge cases in coding interviews?`
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
        <header className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[11px] font-medium", DIFFICULTY_STYLES[concept.difficulty])}
              >
                {concept.difficulty.charAt(0) + concept.difficulty.slice(1).toLowerCase()}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {concept.estimatedMinutes} min
              </span>
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                v{concept.version}
              </span>
            </div>

            {/* Quick Revision vs Deep Dive Toggle */}
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
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
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
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "deep"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Deep Dive
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {concept.title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">{concept.summary}</p>
            </div>

            {/* Action Bar: Ask AI Mentor, Concept Notes, Bookmark */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
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
                className="h-8 gap-1.5 border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  "h-8 gap-1.5 border-border bg-background text-xs font-medium transition-colors",
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

        {/* Lesson Markdown Body */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 sm:p-8">
            <SafeMarkdown content={activeMarkdown} />
          </CardContent>
        </Card>

        {/* Key Takeaways & Common Mistakes */}
        {(concept.keyTakeaways.length > 0 || concept.commonMistakes.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {concept.keyTakeaways.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Key Takeaways
                  </div>
                  <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
                    {concept.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {concept.commonMistakes.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Common Mistakes
                  </div>
                  <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
                    {concept.commonMistakes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Practice & Apply in Coding Interviews */}
        {practiceProblems.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[var(--action-primary)]" />
                  Now Let's Practise
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated problems that test the invariants and edge cases of {concept.title}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                <Link to="/practice?view=sheets_catalog&subject=dsa">
                  For More Similar Problems <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {practiceProblems.map((prob) => {
                const isProbBookmarked = bookmarkedSlugs.includes(prob.slug);
                return (
                  <Card key={prob.slug} className="border-border bg-card hover:border-[var(--border-control)] transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider",
                              prob.difficulty === "Easy"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : prob.difficulty === "Medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}
                          >
                            {prob.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveProblemNote({
                                  isOpen: true,
                                  slug: prob.slug,
                                  title: prob.title,
                                })
                              }
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              title={`Notes for ${prob.title}`}
                            >
                              <NotebookPen className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProblemBookmark(prob.slug, prob.title, prob.difficulty)
                              }
                              className={cn(
                                "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
                                isProbBookmarked && "text-emerald-500"
                              )}
                              title={isProbBookmarked ? "Remove Bookmark" : "Bookmark for Revision"}
                            >
                              <Bookmark className={cn("h-3.5 w-3.5", isProbBookmarked && "fill-current")} />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{prob.title}</h3>
                        {prob.recommendedInvariants && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {prob.recommendedInvariants}
                          </p>
                        )}
                      </div>
                      <a
                        href={prob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--action-primary)] hover:underline pt-1"
                      >
                        Solve on {prob.source}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Interactive Active Recall Check */}
        <RecallCheckWidget conceptSlug={concept.slug} />

        {/* Deep Intuition & Follow-up with AI Mentor */}
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

      {/* Slide-over Problem Notes Drawer */}
      <QuestionNoteDrawer
        isOpen={activeProblemNote.isOpen}
        onClose={() => setActiveProblemNote((prev) => ({ ...prev, isOpen: false }))}
        problemSlug={activeProblemNote.slug}
        problemTitle={activeProblemNote.title}
      />
    </div>
  );
}
