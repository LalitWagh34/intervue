import { useParams, Link } from "react-router-dom";
import { useInterview } from "@/hooks/useInterview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ResultsPage() {
  const { id } = useParams();
  const { data: interview, isLoading } = useInterview(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Interview not found
      </div>
    );
  }

  const evaluation = interview.evaluation;
  const isProcessing = !evaluation || evaluation.status === "processing" || evaluation.status === "pending";
  const isFailed = evaluation?.status === "failed";

  return (
    <div className="min-h-screen bg-black p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-zinc-500 text-sm">{interview.role} · {interview.difficulty} level · {interview.mode}</p>
        <h1 className="text-2xl font-semibold text-white mt-1">Interview Results</h1>
      </div>

      {isProcessing && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mb-3" />
            <p className="text-white">Evaluating your interview...</p>
            <p className="text-zinc-500 text-sm mt-1">This usually takes a few seconds</p>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mb-3" />
            <p className="text-white">Evaluation failed</p>
            <p className="text-zinc-500 text-sm mt-1">Something went wrong scoring this interview</p>
          </CardContent>
        </Card>
      )}

      {evaluation?.status === "completed" && (
        <>
          {/* Score */}
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="py-8 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Overall score</p>
                <p className="text-4xl font-semibold text-white">{evaluation.score}/10</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-xs mb-2">Summary</p>
              <p className="text-white text-sm leading-relaxed">{evaluation.feedback}</p>
            </CardContent>
          </Card>

          {/* Dimension scores */}
          {evaluation.dimensionScores && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(evaluation.dimensionScores).map(([key, val]) => (
                <Card key={key} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xl font-semibold text-white">{val as number}/10</p>
                    <p className="text-zinc-500 text-xs mt-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Strengths + improvements */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-zinc-400 text-xs mb-3">Strengths</p>
                <ul className="space-y-2">
                  {evaluation.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-200 flex gap-2">
                      <span className="text-green-500">+</span> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-zinc-400 text-xs mb-3">Areas to improve</p>
                <ul className="space-y-2">
                  {evaluation.improvements?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-200 flex gap-2">
                      <span className="text-amber-500">→</span> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div># add badges below if needed
        </>
      )}

      <div className="flex gap-3 mt-8">
        <Link to="/dashboard">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}