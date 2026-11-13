import { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
} from "lucide-react";
import {
  useRecallQuestions,
  useSubmitRecall,
  useUpdateConceptProgress,
  RecallResult,
} from "@/hooks/useLearn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptSlug: string;
  conceptTitle: string;
  subjectTitle?: string;
  moduleTitle?: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function RecallModal({
  isOpen,
  onClose,
  conceptSlug,
  conceptTitle,
  subjectTitle,
  moduleTitle,
}: RecallModalProps) {
  const { data, isLoading } = useRecallQuestions(conceptSlug);
  const submitRecall = useSubmitRecall(conceptSlug);
  const updateProgress = useUpdateConceptProgress(conceptSlug);

  const questions = data?.questions || [];
  const progress = data?.progress;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, RecallResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setShowSummary(false);
    }
  }, [isOpen, conceptSlug]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentSelected = currentQuestion ? selectedOptions[currentQuestion.id] : undefined;
  const currentResult = currentQuestion ? results[currentQuestion.id] : undefined;

  const handleSelectOption = (idx: number) => {
    if (currentResult || !currentQuestion) return; // Prevent changing after submission
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestion.id]: idx,
    }));
  };

  const handleSubmitCurrent = async () => {
    if (currentSelected === undefined || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await submitRecall.mutateAsync({
        questionId: currentQuestion.id,
        selectedOption: currentSelected,
      });

      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: res,
      }));

      if (res.isCorrect) {
        toast.success("Correct answer! Great recall.");
      } else {
        toast.error("Not quite. Read the explanation below to reinforce your mental model.");
      }
    } catch {
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r.isCorrect).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl sm:max-w-4xl p-0 overflow-hidden bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl text-[var(--text-primary)]">
        {/* Header Bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 px-6 py-4.5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--action-primary)]/10 text-[var(--action-primary)] text-[10px] font-mono font-semibold uppercase tracking-wider">
                <Brain className="h-3 w-3" />
                Active Recall Check
              </span>
              {(subjectTitle || moduleTitle) && (
                <span className="text-[11px] text-[var(--text-muted)] truncate hidden sm:inline">
                  {subjectTitle} &bull; {moduleTitle}
                </span>
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-[var(--text-primary)] truncate">
              {conceptTitle}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2 shrink-0 pr-6">
            {progress?.status && (
              <Badge variant="outline" className="text-[11px] border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)]">
                Status: {progress.status.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center space-y-3">
            <div className="h-8 w-48 rounded bg-[var(--surface-muted)] mx-auto animate-pulse" />
            <div className="h-24 w-full max-w-lg rounded-xl bg-[var(--surface-muted)] mx-auto animate-pulse" />
            <p className="text-xs text-[var(--text-muted)]">Loading active recall questions...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalQuestions === 0 && (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Recall Questions Coming Soon
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Our curriculum team is authoring verified interview recall questions for this concept. You can manually record your understanding status below.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateProgress.mutate("STUDIED");
                  toast.success("Marked as Studied");
                  onClose();
                }}
              >
                Mark as Studied
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateProgress.mutate("CONFIDENT");
                  toast.success("Marked as Confident");
                  onClose();
                }}
              >
                Mark as Confident
              </Button>
            </div>
          </div>
        )}

        {/* Active Quiz View */}
        {!isLoading && totalQuestions > 0 && !showSummary && currentQuestion && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Slider / Stepper Bar */}
            <div className="space-y-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[var(--text-secondary)] font-mono">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    Answered {answeredCount}/{totalQuestions}
                  </span>
                </div>
              </div>

              {/* Slider Dots / Question Stepper */}
              <div className="flex items-center gap-1.5 pt-1">
                {questions.map((q, idx) => {
                  const res = results[q.id];
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-all cursor-pointer",
                        isCurrent
                          ? "ring-2 ring-[var(--action-primary)] ring-offset-1 ring-offset-[var(--surface)]"
                          : "opacity-75 hover:opacity-100",
                        res
                          ? res.isCorrect
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                          : "bg-[var(--border-control)]"
                      )}
                      title={`Go to Question ${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Slider Arrows & Quick Jump */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-6 w-6 rounded-md text-[11px] font-mono font-medium flex items-center justify-center transition-all cursor-pointer",
                        currentIndex === idx
                          ? "bg-[var(--action-primary)] text-[var(--on-primary)] shadow-xs"
                          : results[questions[idx].id]
                          ? results[questions[idx].id].isCorrect
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          : "bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === totalQuestions - 1 && !currentResult}
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Problem Statement
              </span>
              <h3 className="text-base sm:text-lg font-semibold leading-relaxed text-[var(--text-primary)]">
                {currentQuestion.prompt}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQuestion.options.map((optText, optIdx) => {
                const isSelected = currentSelected === optIdx;
                const hasResult = Boolean(currentResult);
                const isCorrectOption = currentResult?.correctOption === optIdx;
                const isSelectedIncorrect = hasResult && isSelected && !currentResult?.isCorrect;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={hasResult}
                    onClick={() => handleSelectOption(optIdx)}
                    className={cn(
                      "w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 group",
                      !hasResult && (
                        isSelected
                          ? "bg-[var(--action-primary)]/10 border-[var(--action-primary)] shadow-xs"
                          : "bg-[var(--surface-muted)]/50 border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]"
                      ),
                      hasResult && (
                        isCorrectOption
                          ? "bg-emerald-500/15 border-emerald-500/50 text-foreground"
                          : isSelectedIncorrect
                          ? "bg-rose-500/15 border-rose-500/50 text-foreground"
                          : "bg-[var(--surface-muted)]/30 border-[var(--border-subtle)] opacity-50"
                      )
                    )}
                  >
                    <span
                      className={cn(
                        "h-6 w-6 rounded-lg text-xs font-mono font-semibold flex items-center justify-center shrink-0 border transition-colors",
                        !hasResult && (
                          isSelected
                            ? "bg-[var(--action-primary)] text-[var(--on-primary)] border-[var(--action-primary)]"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] group-hover:text-[var(--text-primary)]"
                        ),
                        hasResult && (
                          isCorrectOption
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : isSelectedIncorrect
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                        )
                      )}
                    >
                      {hasResult && isCorrectOption ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        OPTION_LETTERS[optIdx]
                      )}
                    </span>

                    <span className="text-xs sm:text-sm leading-relaxed text-[var(--text-primary)] flex-1 pt-0.5">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation Box (Revealed after submission) */}
            {currentResult && (
              <div
                className={cn(
                  "p-4.5 rounded-xl border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200",
                  currentResult.isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                )}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {currentResult.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">Correct! Mental Model Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-rose-500">Explanation &amp; Correct Answer</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-primary)]">
                  {currentResult.explanation}
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-xs text-[var(--text-secondary)]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Question
              </Button>

              <div className="flex items-center gap-2">
                {!currentResult ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitCurrent}
                    disabled={currentSelected === undefined || isSubmitting}
                    className="text-xs font-semibold px-5"
                  >
                    {isSubmitting ? "Checking..." : "Submit Answer"}
                  </Button>
                ) : currentIndex < totalQuestions - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="text-xs font-semibold px-5"
                  >
                    Next Question
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowSummary(true)}
                    className="text-xs font-semibold px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1.5" />
                    View Results Summary
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Summary View */}
        {!isLoading && showSummary && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              <Trophy className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                Active Recall Completed!
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                You scored <span className="font-semibold text-foreground">{correctCount}</span> out of{" "}
                <span className="font-semibold text-foreground">{totalQuestions}</span> questions correct on{" "}
                <span className="font-semibold text-foreground">{conceptTitle}</span>.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-mono">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>Retention Stage: {progress?.recallAttempts ?? 1} reviews completed</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSummary(false);
                  setCurrentIndex(0);
                }}
                className="text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Review All Questions
              </Button>

              <Button
                size="sm"
                onClick={onClose}
                className="text-xs font-medium px-5"
              >
                Done &amp; Return to Lesson
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
