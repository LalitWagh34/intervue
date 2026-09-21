import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import Editor, { type OnMount } from "@monaco-editor/react";
import { toast } from "sonner";
import {
  Clock,
  Trophy,
  Code2,
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Send,
  ChevronRight,
  Terminal,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MonacoEditor = Parameters<OnMount>[0];

const MONACO_LANG_MAP: Record<string, string> = {
  CPP: "cpp",
  PYTHON: "python",
  JAVA: "java",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
};

const DEFAULT_CODE_TEMPLATES: Record<string, string> = {
  CPP: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your solution here\n    return 0;\n}`,
  PYTHON: `import sys\n\ndef main():\n    input_data = sys.stdin.read().split()\n    # Your solution here\n\nif __name__ == '__main__':\n    main()`,
  JAVA: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}`,
  JAVASCRIPT: `const fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\n// Your solution here`,
  TYPESCRIPT: `import * as fs from 'fs';\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\n// Your solution here`,
};

export default function RoomArenaPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();

  // State
  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Coding State
  const [language, setLanguage] = useState("CPP");
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE_TEMPLATES.CPP);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<number>>(new Set());

  // MCQ State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [submittedMcqs, setSubmittedMcqs] = useState<Set<string>>(new Set());
  const [isSubmittingMcq, setIsSubmittingMcq] = useState(false);

  // Real-Time Socket
  const {
    isConnected,
    participants,
    remainingSeconds: socketRemaining,
    roomStatus,
    recentActivities,
  } = useRoomSocket({
    roomCode: code,
    user: session?.user,
    onContestEnd: (finalLeaderboard) => {
      navigate(`/rooms/${code}/results`);
    },
  });

  // Local timer state counting down smoothly between syncs
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (socketRemaining !== null && socketRemaining !== undefined) {
      setSecondsLeft(socketRemaining);
    }
  }, [socketRemaining]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Load authoritative room data
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await api.get(`/rooms/${code}`);
        const data = res.data.room;
        setRoom(data);

        // If contest already finished, navigate to results
        if (data.status === "FINISHED") {
          navigate(`/rooms/${code}/results`);
          return;
        }

        // Initialize code template for first problem if coding
        const firstQ = data.questions[0];
        if (firstQ?.problem?.templates?.length > 0) {
          const cppTemplate = firstQ.problem.templates.find((t: any) => t.language === "CPP");
          if (cppTemplate) {
            setSourceCode(cppTemplate.code);
          }
        }
      } catch (err: any) {
        toast.error("Failed to load contest room");
        navigate("/rooms");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoom();
  }, [code, navigate]);

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const activeQ = room?.questions[activeQuestionIndex];
    if (activeQ?.problem?.templates) {
      const tmpl = activeQ.problem.templates.find((t: any) => t.language === newLang);
      if (tmpl) {
        setSourceCode(tmpl.code);
        return;
      }
    }
    setSourceCode(DEFAULT_CODE_TEMPLATES[newLang] || "");
  };

  // Submit Code
  const handleSubmitCode = async () => {
    const activeQ = room?.questions[activeQuestionIndex];
    if (!activeQ || !activeQ.problem) return;

    setIsSubmitting(true);
    setJudgeResult(null);

    try {
      const res = await api.post(`/rooms/${code}/submit-code`, {
        problemId: activeQ.problem.id,
        sourceCode,
        language,
      });

      setJudgeResult(res.data);

      if (res.data.verdict === "ACCEPTED") {
        setSolvedProblemIds((prev) => new Set([...prev, activeQ.problem.id]));
        toast.success(`Accepted! Solution verified.`, {
          description: `+${res.data.pointsAwarded || activeQ.points} points awarded!`,
        });
      } else {
        toast.error(`Verdict: ${res.data.verdict}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error executing solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit MCQ Answer
  const handleSubmitMcq = async (questionId: string) => {
    const selected = selectedOptions[questionId];
    if (selected === undefined) {
      toast.error("Please select an option first");
      return;
    }

    setIsSubmittingMcq(true);
    try {
      const res = await api.post(`/rooms/${code}/mcq-answer`, {
        questionId,
        selectedOption: selected,
      });

      setSubmittedMcqs((prev) => new Set([...prev, questionId]));

      if (res.data.isCorrect) {
        toast.success("Correct Answer! (+4 points)");
      } else {
        toast.error("Incorrect (-1 point penalty)");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit answer");
    } finally {
      setIsSubmittingMcq(false);
    }
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span className="text-sm font-medium">Entering Arena...</span>
        </div>
      </div>
    );
  }

  const activeQuestion = room.questions[activeQuestionIndex];
  const isCodingQuestion = activeQuestion?.type === "CODING";

  // Format countdown timer
  const formatTime = (secs: number | null) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Find my current rank and score
  const myData = participants.find((p) => p.userId === session?.user?.id);

  return (
    <div className="h-screen bg-[#0B0C0F] text-[#F5F7FA] flex flex-col overflow-hidden font-sans">
      {/* Top Arena Navigation Bar */}
      <header className="h-14 border-b border-[#1E2229] bg-[#101216] px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Room Title & Question Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#1E2229]">
            <span className="font-semibold text-sm tracking-tight text-[#F5F7FA]">
              {room.title}
            </span>
            <Badge variant="outline" className="text-[10px] border-[#272B33] bg-[#14161B] font-mono text-[#A1A7B3]">
              {room.code}
            </Badge>
          </div>

          {/* Question Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {room.questions.map((q: any, idx: number) => {
              const isSolved =
                (q.problem && solvedProblemIds.has(q.problem.id)) ||
                (q.assessmentQuestion && submittedMcqs.has(q.assessmentQuestion.id));
              const isActive = idx === activeQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-[#191C22] text-[#F5F7FA] border border-[#272B33] shadow-sm"
                      : "bg-[#101216] text-[#A1A7B3] hover:text-[#F5F7FA] border border-[#1E2229]"
                  }`}
                >
                  {isSolved && <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />}
                  <span>
                    {q.type === "CODING" ? `Problem ${idx + 1}` : `MCQ ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-[#707784] font-mono">
                    {q.points}pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Authoritative Countdown Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3.5 py-1 rounded-full border flex items-center gap-2 font-mono text-xs font-semibold tracking-wider transition-colors ${
              (secondsLeft ?? 100) < 300
                ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] animate-pulse"
                : "bg-[#14161B] border-[#272B33] text-[#F5F7FA]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Right: Live Standings Toggle & Exit */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
            className={`text-xs h-8 border-[#272B33] flex items-center gap-2 transition-colors ${
              isLeaderboardOpen
                ? "bg-[#191C22] text-[#F5F7FA] border-[#3B9CFF]/40"
                : "bg-[#14161B] text-[#A1A7B3] hover:bg-[#191C22] hover:text-[#F5F7FA]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>
              Rank #{myData?.rank || 1} • {myData?.score || 0} pts
            </span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Are you sure you want to exit the contest?")) {
                navigate("/rooms");
              }
            }}
            className="text-xs h-8 text-[#707784] hover:text-[#F5F7FA] hover:bg-[#14161B]"
          >
            Exit
          </Button>
        </div>
      </header>

      {/* Main Arena Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Workspace Body */}
        {isCodingQuestion ? (
          // ─── CODING SPLIT VIEW ──────────────────────────────────────
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-[#1E2229] overflow-hidden">
            {/* Left: Problem Description */}
            <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#0B0C0F]">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h2 className="text-xl font-semibold text-[#F5F7FA] tracking-tight">
                    {activeQuestion.problem.title}
                  </h2>
                  <Badge
                    variant="outline"
                    className={`text-xs border ${
                      activeQuestion.problem.difficulty === "EASY"
                        ? "border-[#22C55E]/25 text-[#22C55E] bg-[#22C55E]/10"
                        : activeQuestion.problem.difficulty === "MEDIUM"
                        ? "border-[#F59E0B]/25 text-[#F59E0B] bg-[#F59E0B]/10"
                        : "border-[#EF4444]/25 text-[#EF4444] bg-[#EF4444]/10"
                    }`}
                  >
                    {activeQuestion.problem.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                  <span>Points: {activeQuestion.points}</span>
                  <span>•</span>
                  <span>Time Limit: {activeQuestion.problem.timeLimit}ms</span>
                  <span>•</span>
                  <span>Memory: {activeQuestion.problem.memoryLimit}MB</span>
                </div>
              </div>

              {/* Description Body */}
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {activeQuestion.problem.description}
              </div>

              {/* Constraints */}
              {activeQuestion.problem.constraints && (
                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Constraints
                  </h3>
                  <div className="bg-zinc-900/60 rounded-md p-3 font-mono text-xs text-zinc-300 border border-zinc-800/80 whitespace-pre-wrap">
                    {activeQuestion.problem.constraints}
                  </div>
                </div>
              )}

              {/* Examples */}
              {activeQuestion.problem.examples?.length > 0 && (
                <div className="space-y-3 border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Examples
                  </h3>
                  {activeQuestion.problem.examples.map((ex: any, idx: number) => (
                    <div key={idx} className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 font-mono text-[11px]">Input:</span>
                        <pre className="mt-1 font-mono text-zinc-200 bg-zinc-950 p-2 rounded border border-zinc-800">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-mono text-[11px]">Output:</span>
                        <pre className="mt-1 font-mono text-zinc-200 bg-zinc-950 p-2 rounded border border-zinc-800">{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <p className="text-zinc-400 text-xs mt-1">
                          <strong className="text-zinc-300">Explanation:</strong> {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Monaco Code Editor & Execution Console */}
            <div className="h-full flex flex-col bg-[#0e0e11] overflow-hidden">
              {/* Editor Header */}
              <div className="h-10 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-zinc-900 text-zinc-200 border border-zinc-800 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                  >
                    <option value="CPP">C++ (GCC 9.2)</option>
                    <option value="PYTHON">Python 3</option>
                    <option value="JAVA">Java (OpenJDK 13)</option>
                    <option value="JAVASCRIPT">JavaScript (Node.js)</option>
                    <option value="TYPESCRIPT">TypeScript</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitCode}
                    disabled={isSubmitting}
                    className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-white font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Judging..." : "Submit Solution"}
                  </Button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 relative overflow-hidden">
                <Editor
                  height="100%"
                  language={MONACO_LANG_MAP[language] || "cpp"}
                  value={sourceCode}
                  onChange={(val) => setSourceCode(val || "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "JetBrains Mono, Menlo, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    tabSize: 4,
                    padding: { top: 12 },
                    renderLineHighlight: "all",
                  }}
                />
              </div>

              {/* Bottom Test Execution Panel */}
              {judgeResult && (
                <div className="h-44 border-t border-zinc-800 bg-zinc-950 p-4 flex flex-col shrink-0 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Execution Verdict:
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          judgeResult.verdict === "ACCEPTED"
                            ? "border-emerald-800 text-emerald-400 bg-emerald-950/20"
                            : "border-rose-800 text-rose-400 bg-rose-950/20"
                        }`}
                      >
                        {judgeResult.verdict}
                      </Badge>
                    </div>

                    <div className="text-xs font-mono text-zinc-500 flex gap-3">
                      {judgeResult.runtime !== undefined && (
                        <span>Runtime: {judgeResult.runtime}ms</span>
                      )}
                      {judgeResult.memory !== undefined && (
                        <span>Memory: {judgeResult.memory}KB</span>
                      )}
                    </div>
                  </div>

                  {judgeResult.compile_output && (
                    <pre className="text-xs font-mono text-rose-400 bg-zinc-900 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap">
                      {judgeResult.compile_output}
                    </pre>
                  )}

                  {judgeResult.stderr && (
                    <pre className="text-xs font-mono text-rose-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap">
                      {judgeResult.stderr}
                    </pre>
                  )}

                  {judgeResult.stdout && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-500 font-mono">Stdout:</span>
                      <pre className="text-xs font-mono text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800 whitespace-pre-wrap">
                        {judgeResult.stdout}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ─── MCQ CARD VIEW ──────────────────────────────────────────
          <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start bg-[#09090b]">
            <div className="max-w-2xl w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300 text-xs">
                    {activeQuestion.assessmentQuestion.category}
                  </Badge>
                  <span className="text-xs font-medium text-zinc-400">
                    {activeQuestion.assessmentQuestion.subject}: {activeQuestion.assessmentQuestion.topic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  +{activeQuestion.points} points
                </div>
              </div>

              {/* Question Text */}
              <p className="text-base font-medium text-white leading-relaxed">
                {activeQuestion.assessmentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {(activeQuestion.assessmentQuestion.options as string[]).map((optionText, optIdx) => {
                  const qId = activeQuestion.assessmentQuestion.id;
                  const isSelected = selectedOptions[qId] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }))}
                      className={`w-full p-4 rounded-lg border text-left text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-zinc-800 border-zinc-600 text-white shadow-sm"
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center text-xs font-mono text-zinc-400">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{optionText}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-zinc-200" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {submittedMcqs.has(activeQuestion.assessmentQuestion.id)
                    ? "Answer recorded. You can re-submit before time ends."
                    : "Select an option and confirm your answer."}
                </span>

                <Button
                  onClick={() => handleSubmitMcq(activeQuestion.assessmentQuestion.id)}
                  disabled={
                    selectedOptions[activeQuestion.assessmentQuestion.id] === undefined ||
                    isSubmittingMcq
                  }
                  className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium px-6"
                >
                  {isSubmittingMcq ? "Saving..." : "Confirm Answer"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── SLIDING LIVE LEADERBOARD DRAWER ────────────────────────── */}
        {isLeaderboardOpen && (
          <aside className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col shrink-0 z-20 shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Live Standings
                </h3>
              </div>
              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standings Table */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {participants.map((p, idx) => {
                const isMe = p.userId === session?.user?.id;

                return (
                  <div
                    key={p.userId}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                      isMe
                        ? "bg-zinc-800 border-zinc-600 text-white"
                        : "bg-zinc-900/40 border-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-zinc-400 w-4 text-center">
                        #{p.rank || idx + 1}
                      </span>
                      <span className="font-medium truncate max-w-[110px]">
                        {p.name} {isMe && "(You)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-right font-mono">
                      <div>
                        <div className="font-bold text-white">{p.score} pts</div>
                        <div className="text-[10px] text-zinc-500">{p.solvedCount} solved</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Solve Activity Feed */}
            {recentActivities.length > 0 && (
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 max-h-36 overflow-y-auto space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Live Solves
                </span>
                {recentActivities.slice(0, 5).map((act, i) => (
                  <div key={i} className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      <strong className="text-zinc-200">{act.userName}</strong> solved {act.problemTitle} (+{act.pointsAwarded})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
