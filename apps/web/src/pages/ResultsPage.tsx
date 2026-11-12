import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useInterview } from "@/hooks/useInterview";
import { useInterviewRecommendations } from "@/hooks/useLearn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, BookOpen, Clock, ArrowRight } from "lucide-react";
import { formatInterviewScore } from "@/lib/score";

export default function ResultsPage() {
  const { id } = useParams();
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: interview, isLoading, isError, refetch } = useInterview(id);
  const { data: recData } = useInterviewRecommendations(id);
  const recommendations = recData?.recommendations || [];

  if (isLoading) {
    return (
      <div className="min-h-full bg-[var(--canvas)] flex items-center justify-center text-[var(--text-secondary)]" role="status">
        Loading interview results...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-full bg-[var(--canvas)] flex items-center justify-center p-6">
        <Card className="bg-[var(--surface)] border-[var(--border-subtle)] max-w-md w-full shadow-sm" role="alert">
          <CardContent className="py-8 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-6 h-6 text-[var(--status-danger)]" />
            <p className="text-[var(--text-primary)] font-medium">Failed to load interview results</p>
            <p className="text-[var(--text-secondary)] text-xs">Please check your connection and try again.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
              <Link to="/history">
                <Button size="sm" variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                  Back to history
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-full bg-[var(--canvas)] flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)] p-6">
        <p>Interview not found</p>
        <Link to="/history">
          <Button size="sm" variant="outline" className="border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
            Back to history
          </Button>
        </Link>
      </div>
    );
  }

  const evaluation = interview.evaluation;
  const isAbandoned = interview.status?.toLowerCase() === "abandoned" && !evaluation;
  const isProcessing = !isAbandoned && (!evaluation || evaluation.status === "processing" || evaluation.status === "pending");
  const isFailed = evaluation?.status === "failed";

  return (
    <div className="min-h-full bg-[var(--canvas)] text-[var(--text-primary)] p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[var(--text-muted)] text-sm">{interview.role} · {interview.difficulty} level · {interview.mode}</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mt-1">Interview Results</h1>
      </div>

      {isAbandoned && (
        <Card className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-6 h-6 text-[var(--text-muted)]" />
            <p className="text-[var(--text-primary)]">Session ended before evaluation</p>
            <p className="text-[var(--text-secondary)] text-sm">This interview was abandoned, so no scorecard was generated.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Link to="/interview">
                <Button size="sm" className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)]">Start New Interview</Button>
              </Link>
              <Link to="/history">
                <Button size="sm" variant="outline" className="border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                  Back to history
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <Loader2 className="w-6 h-6 text-[var(--accent-text)] animate-spin mb-3" />
            <p className="text-[var(--text-primary)]">Evaluating your interview...</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">This usually takes a few seconds</p>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm" role="alert">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-6 h-6 text-[var(--status-danger)]" />
            <p className="text-[var(--text-primary)]">Evaluation failed</p>
            <p className="text-[var(--text-secondary)] text-sm">Something went wrong scoring this interview</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
              <Link to="/history">
                <Button size="sm" variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                  Back to history
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {evaluation?.status === "completed" && (
        <>
          {/* Score */}
          <Card className="bg-[var(--surface)] border-[var(--border-subtle)] mb-6 shadow-sm">
            <CardContent className="py-8 flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Overall score</p>
                <p className="text-4xl font-semibold text-[var(--text-primary)]">{formatInterviewScore(evaluation.score)?.formatted ?? "—"}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-[var(--status-success)]" />
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="bg-[var(--surface)] border-[var(--border-subtle)] mb-6 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-[var(--text-muted)] text-xs mb-2">Summary</p>
              <p className="text-[var(--text-primary)] text-sm leading-relaxed">{evaluation.feedback}</p>
            </CardContent>
          </Card>

          {/* Dimension scores */}
          {evaluation.dimensionScores && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {Object.entries(evaluation.dimensionScores).map(([key, val]) => (
                <Card key={key} className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xl font-semibold text-[var(--text-primary)]">{formatInterviewScore(val as number)?.formatted ?? "—"}</p>
                    <p className="text-[var(--text-muted)] text-xs mt-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Strengths + improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <p className="text-[var(--text-secondary)] text-xs mb-3">Strengths</p>
                <ul className="space-y-2">
                  {evaluation.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                      <span className="text-[var(--status-success)]">+</span> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[var(--surface)] border-[var(--border-subtle)] shadow-sm">
              <CardContent className="pt-6">
                <p className="text-[var(--text-secondary)] text-xs mb-3">Areas to improve</p>
                <ul className="space-y-2">
                  {evaluation.improvements?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                      <span className="text-[var(--status-warning)]">→</span> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Explainable Concept Recommendations from Learn & Revise Hub */}
          {recommendations.length > 0 && !isDismissed && (
            <Card className="bg-[var(--surface)] border-[var(--border-subtle)] mb-6 shadow-sm overflow-hidden">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--action-primary)]/10 text-[var(--action-primary)]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Targeted Concept Revision
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Curated lessons mapped directly from your interview evaluator feedback
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDismissed(true)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                    title="Dismiss recommendations"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.concept.slug}
                      className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 transition-all hover:border-[var(--border-control)]"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                          >
                            {rec.concept.module.subject.title}
                          </Badge>
                          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {rec.concept.estimatedMinutes}m
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                            {rec.concept.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                            {rec.concept.summary}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[var(--surface)]/90 p-2.5 border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--status-warning)]">Evaluator feedback: </span>
                          <span className="italic text-[var(--text-secondary)]">"{rec.matchedFeedback}"</span>
                        </div>
                      </div>

                      <div className="pt-3">
                        <Button asChild size="sm" className="w-full text-xs font-medium cursor-pointer">
                          <Link to={`/learn/concepts/${rec.concept.slug}`}>
                            Revise Concept <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-3 mt-8">
        <Link to="/dashboard">
          <Button variant="outline" className="border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}