import { useState } from "react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  useRecallQuestions,
  useSubmitRecall,
  useUpdateConceptProgress,
  RecallResult,
} from "@/hooks/useLearn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecallCheckWidgetProps {
  conceptSlug: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-muted text-muted-foreground border-border" },
  STUDYING: { label: "Studying", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  STUDIED: { label: "Studied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  NEEDS_REVISION: { label: "Needs Revision", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  CONFIDENT: { label: "Confident", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  DEMONSTRATED_UNDERSTANDING: {
    label: "Mastered",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};

export function RecallCheckWidget({ conceptSlug }: RecallCheckWidgetProps) {
  const { data, isLoading } = useRecallQuestions(conceptSlug);
  const submitRecall = useSubmitRecall(conceptSlug);
  const updateProgress = useUpdateConceptProgress(conceptSlug);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<RecallResult | null>(null);

  const question = data?.questions?.[0];
  const progress = data?.progress;
  const statusMeta = progress?.status ? STATUS_LABELS[progress.status] : null;

  const handleSubmit = async () => {
    if (selectedOption === null || !question) return;

    try {
      const res = await submitRecall.mutateAsync({
        questionId: question.id,
        selectedOption,
      });
      setResult(res);
      if (res.isCorrect) {
        toast.success("Correct answer! Great recall.");
      } else {
        toast.error("Not quite. Review the explanation to reinforce your mental model.");
      }
    } catch {
      toast.error("Failed to submit recall answer.");
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="h-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 animate-pulse" />
    );
  }

  if (!question) {
    return (
      <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Brain className="h-4 w-4 text-[var(--accent-text)]" />
              Recall &amp; Confidence Tracking
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Mark your retention status to schedule this concept into your revision queue.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateProgress.mutate("NEEDS_REVISION")}
              disabled={updateProgress.isPending}
              className="h-8 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
            >
              Needs Revision
            </Button>
            <Button
              size="sm"
              onClick={() => updateProgress.mutate("CONFIDENT")}
              disabled={updateProgress.isPending}
              className="h-8 text-xs font-semibold bg-[#327CF6] hover:bg-[#2563EB] text-white"
            >
              Mark Confident
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAnswered = result !== null;

  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs overflow-hidden">
      <CardContent className="p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Active Recall Check
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Test your conceptual retention before moving to the next pattern.
            </p>
          </div>

          {statusMeta && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">Current Retention:</span>
              <Badge variant="outline" className={cn("text-[11px] font-semibold", statusMeta.color)}>
                {statusMeta.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Question Prompt */}
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#327CF6]/15 font-mono text-xs font-bold text-[#327CF6]">
              Q
            </span>
            <p className="text-sm font-medium leading-6 text-[var(--text-primary)]">
              {question.prompt}
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-2.5 pt-1">
            {(question.options as string[]).map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = isAnswered && result.correctOption === idx;
              const isWrongSelection = isAnswered && isSelected && !result.isCorrect;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered || submitRecall.isPending}
                  onClick={() => setSelectedOption(idx)}
                  className={cn(
                    "w-full text-left rounded-xl p-3.5 text-xs transition-all flex items-start gap-3 border cursor-pointer",
                    !isAnswered && (
                      isSelected
                        ? "border-[#327CF6] bg-[#327CF6]/10 text-[var(--text-primary)] ring-1 ring-[#327CF6]/40"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-hover)] hover:border-[var(--border-control)] text-[var(--text-secondary)]"
                    ),
                    isAnswered && isCorrectAnswer && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium",
                    isAnswered && isWrongSelection && "border-rose-500/50 bg-rose-500/10 text-rose-400 line-through",
                    isAnswered && !isCorrectAnswer && !isWrongSelection && "opacity-50 border-[var(--border-subtle)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-bold mt-0.5",
                      isSelected
                        ? "border-[#327CF6] bg-[#327CF6] text-white"
                        : "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)]",
                      isAnswered && isCorrectAnswer && "border-emerald-500 bg-emerald-500 text-white",
                      isAnswered && isWrongSelection && "border-rose-500 bg-rose-500 text-white"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-5">{opt}</span>

                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isWrongSelection && (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Answer Feedback & Explanation */}
        {isAnswered && (
          <div
            className={cn(
              "rounded-xl border p-4 space-y-2 text-xs leading-relaxed animate-in fade-in-50",
              result.isCorrect
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {result.isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Correct! Active recall reinforced.</span>
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  <span>Reinforce Mental Model:</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-5 text-[var(--text-primary)]">
              {result.explanation}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            {progress?.recallAttempts ? (
              <span>
                Attempts: {progress.recallAttempts} &bull; Correct: {progress.recallCorrect}
              </span>
            ) : (
              <span>Answer to verify your understanding</span>
            )}
          </div>

          {!isAnswered ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={selectedOption === null || submitRecall.isPending}
              className="h-8 px-4 text-xs font-semibold gap-1.5 bg-[#327CF6] hover:bg-[#2563EB] text-white"
            >
              {submitRecall.isPending ? "Grading..." : "Submit Answer"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 px-3 text-xs gap-1.5 border-[var(--border-control)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

