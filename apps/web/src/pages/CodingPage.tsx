import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProblems, useProblem } from "@/hooks/useProblems";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Lightbulb, ChevronLeft } from "lucide-react";

const LANGUAGE_MAP: Record<string, number> = {
  JAVASCRIPT: 63,
  PYTHON: 71,
  CPP: 54,
  JAVA: 62,
  TYPESCRIPT: 74,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-green-400 border-green-900",
  MEDIUM: "text-amber-400 border-amber-900",
  HARD: "text-red-400 border-red-900",
};

export default function CodingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: problems } = useProblems();
  const { data: problem, isLoading } = useProblem(slug);

  const [language, setLanguage] = useState("JAVASCRIPT");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "submissions" | "hints">("description");
  const [results, setResults] = useState<any>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  // Set default code when problem loads
  function getStarterCode() {
    if (!problem?.templates) return "";
    const template = problem.templates.find((t: any) => t.language === language);
    return template?.code || "";
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/code/execute", {
        sourceCode: code || getStarterCode(),
        language,
        languageId: LANGUAGE_MAP[language],
        problemId: problem.id,
        problemSlug: slug,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const aiFeedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/code/evaluate", {
        sourceCode: code || getStarterCode(),
        language,
        problemTitle: problem.title,
        problemDescription: problem.description,
        verdict: results?.verdict,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setAiFeedback(data.feedback);
      setShowFeedback(true);
    },
  });

  // If no slug, show problem list
  if (!slug) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Coding practice</h1>
          <p className="text-zinc-400 text-sm mt-1">Solve problems and get AI feedback</p>
        </div>

        <div className="space-y-3">
          {problems?.map((p: any) => (
            <Link key={p.id} to={`/coding/${p.slug}`}>
              <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer">
                <div>
                  <p className="text-white font-medium">{p.title}</p>
                  <div className="flex gap-2 mt-1">
                    {p.tags?.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-zinc-500 text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.company?.slice(0, 2).map((c: string) => (
                    <span key={c} className="text-zinc-500 text-xs">{c}</span>
                  ))}
                  <Badge variant="outline" className={DIFFICULTY_COLORS[p.difficulty]}>
                    {p.difficulty}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Loading problem...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Problem not found
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/coding")} className="text-zinc-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-medium text-sm">{problem.title}</span>
          <Badge variant="outline" className={DIFFICULTY_COLORS[problem.difficulty]}>
            {problem.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setCode(""); }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none"
          >
            {problem.templates?.map((t: any) => (
              <option key={t.language} value={t.language}>{t.language}</option>
            ))}
          </select>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="bg-green-600 hover:bg-green-500 text-white text-sm"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            {submitMutation.isPending ? "Running..." : "Run code"}
          </Button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — problem */}
        <div className="w-[40%] border-r border-zinc-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(["description", "hints", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-sm capitalize transition-colors",
                  activeTab === tab ? "text-white border-b border-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "description" && (
              <div className="space-y-4">
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </p>

                {problem.examples?.length > 0 && (
                  <div>
                    <p className="text-white font-medium text-sm mb-2">Examples</p>
                    {problem.examples.map((ex: any, i: number) => (
                      <div key={i} className="bg-zinc-900 rounded-lg p-3 mb-2 text-xs font-mono">
                        <p className="text-zinc-400">Input: <span className="text-white">{ex.input}</span></p>
                        <p className="text-zinc-400">Output: <span className="text-white">{ex.output}</span></p>
                        {ex.explanation && <p className="text-zinc-500 mt-1">{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && (
                  <div>
                    <p className="text-white font-medium text-sm mb-2">Constraints</p>
                    <p className="text-zinc-400 text-xs font-mono whitespace-pre-wrap">{problem.constraints}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "hints" && (
              <div className="space-y-2">
                {problem.hints?.length > 0 ? (
                  problem.hints.map((hint: string, i: number) => (
                    <div key={i} className="flex gap-2 p-3 bg-zinc-900 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-zinc-300 text-sm">{hint}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm">No hints available</p>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <p className="text-zinc-500 text-sm">No submissions yet</p>
            )}
          </div>
        </div>

        {/* Right panel — editor + results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language.toLowerCase() === "cpp" ? "cpp" : language.toLowerCase() === "javascript" ? "javascript" : language.toLowerCase()}
              value={code || getStarterCode()}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "JetBrains Mono, Fira Code, monospace",
              }}
            />
          </div>

          {/* Results panel */}
          {results && (
            <div className="border-t border-zinc-800 p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium",
                    results.verdict === "ACCEPTED" ? "text-green-400" : "text-red-400"
                  )}>
                    {results.verdict}
                  </span>
                  {results.runtime && <span className="text-zinc-500 text-xs">{results.runtime}ms</span>}
                  {results.memory && <span className="text-zinc-500 text-xs">{results.memory}KB</span>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 text-xs"
                  onClick={() => aiFeedbackMutation.mutate()}
                  disabled={aiFeedbackMutation.isPending}
                >
                  {aiFeedbackMutation.isPending ? "Analyzing..." : "Get AI feedback"}
                </Button>
              </div>
              {results.stdout && (
                <pre className="text-zinc-300 text-xs font-mono bg-zinc-900 p-2 rounded">{results.stdout}</pre>
              )}
              {results.stderr && (
                <pre className="text-red-400 text-xs font-mono bg-zinc-900 p-2 rounded mt-1">{results.stderr}</pre>
              )}
              {showFeedback && aiFeedback && (
                <div className="mt-2 p-3 bg-zinc-900 rounded-lg">
                  <p className="text-amber-400 text-xs font-medium mb-1">AI Feedback</p>
                  <p className="text-zinc-300 text-xs leading-relaxed">{aiFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}