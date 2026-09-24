import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import Editor, { type OnMount } from "@monaco-editor/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield,
  ShieldAlert,
  HelpCircle,
  Flame,
  ArrowRight,
  LogOut,
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

  // Room State
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

  // Modal States replacing native browser alerts
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isForceEndModalOpen, setIsForceEndModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

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
    onContestEnd: () => {
      navigate(`/rooms/${code}/results`);
    },
  });

  // Local Authoritative Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (socketRemaining !== null && socketRemaining !== undefined) {
      setSecondsLeft(socketRemaining);
    }
  }, [socketRemaining]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Anti-Cheat System
  const {
    strikes,
    maxStrikes,
    warningModalOpen,
    currentReason,
    dismissWarning,
    isFullscreen,
    isTerminated,
    requestFullscreen,
    exitFullscreen,
  } = useAntiCheat({
    enabled: room?.status === "ACTIVE",
    maxStrikes: 3,
    onMaxStrikesReached: async () => {
      toast.error("Disqualified: 3 Anti-Cheat Strikes Reached");
      try {
        await api.post(`/rooms/${code}/finish`);
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        navigate(`/rooms/${code}/results`);
      }, 3000);
    },
    onStrike: (count, reason) => {
      toast.error(`Anti-Cheat Warning (${count}/${maxStrikes})`, {
        description: reason,
      });
    },
  });

  // Load authoritative room data
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await api.get(`/rooms/${code}`);
        const data = res.data.room;

        // Strictly verify that current user is an authorized participant or host
        const isParticipant =
          data.isHost ||
          !!data.currentParticipantId ||
          data.participants?.some((p: any) => p.userId === session?.user?.id);

        if (!isParticipant || res.data.requiresJoin) {
          toast.error("Access Denied: Not a Participant", {
            description: "You must join this contest room before entering the arena.",
          });
          navigate(`/rooms/${code}/lobby`);
          return;
        }

        setRoom(data);

        if (data.status === "FINISHED") {
          navigate(`/rooms/${code}/results`);
          return;
        }

        const firstQ = data.questions?.[0];
        if (firstQ?.problem?.templates?.length > 0) {
          const cppTemplate = firstQ.problem.templates.find((t: any) => t.language === "CPP");
          if (cppTemplate) {
            setSourceCode(cppTemplate.code);
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 403) {
          toast.error("Access Denied", {
            description: err?.response?.data?.error || "You are not a registered participant in this contest.",
          });
          navigate(`/rooms/${code}/lobby`);
          return;
        }
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

  // Keyboard shortcut listener for MCQs (A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in editor or input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.closest(".monaco-editor")) {
        return;
      }

      const activeQ = room?.questions?.[activeQuestionIndex];
      if (activeQ?.assessmentQuestion) {
        const key = e.key.toUpperCase();
        const keyIndex = ["A", "B", "C", "D"].indexOf(key);
        if (keyIndex !== -1) {
          const options = activeQ.assessmentQuestion.options as string[];
          if (options && keyIndex < options.length) {
            setSelectedOptions((prev) => ({
              ...prev,
              [activeQ.assessmentQuestion.id]: keyIndex,
            }));
          }
        } else if (e.key === "Enter") {
          handleSubmitMcq(activeQ.assessmentQuestion.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [room, activeQuestionIndex, selectedOptions]);

  // Finish assessment submit handler
  const confirmFinishMyTest = async () => {
    if (!code) return;
    setIsSubmittingTest(true);
    try {
      await api.post(`/rooms/${code}/finish`);
      toast.success("Assessment submitted successfully!");
      setIsFinishModalOpen(false);
      navigate(`/rooms/${code}/results`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit assessment");
      setIsSubmittingTest(false);
    }
  };

  // Host emergency force end handler
  const confirmHostForceEnd = async () => {
    if (!code) return;
    try {
      await api.post(`/rooms/${code}/end`);
      setIsForceEndModalOpen(false);
      navigate(`/rooms/${code}/results`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to end contest");
    }
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-[#07080B] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono tracking-wide text-zinc-300">Synchronizing Battle Arena...</span>
        </div>
      </div>
    );
  }

  if (!room.questions || room.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#07080B] flex flex-col items-center justify-center text-zinc-400 gap-4 p-6">
        <div className="p-8 bg-[#0D0F14] border border-zinc-800 rounded-2xl max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">No Questions in Contest</h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This contest room has no questions assigned. Please create a new contest room with available subjects or problems.
            </p>
          </div>
          <Button
            onClick={() => navigate("/rooms")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            Back to Contest Hub
          </Button>
        </div>
      </div>
    );
  }

  const activeQuestion = room.questions[activeQuestionIndex] || room.questions[0];
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

  // Completed questions breakdown
  const totalQuestions = room?.questions?.length || 0;
  const completedCount = solvedProblemIds.size + submittedMcqs.size;
  const remainingCount = Math.max(0, totalQuestions - completedCount);

  return (
    <div className="h-screen bg-[#07080B] text-zinc-100 flex flex-col overflow-hidden font-sans selection:bg-blue-600/30">
      {/* ─── TOP ARENA HUD ───────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800/90 bg-[#0C0E13]/95 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-20">
        {/* Left: Room Title & Question Matrix Tabs */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 pr-3 border-r border-zinc-800 shrink-0">
            <span className="font-bold text-sm tracking-tight text-white truncate max-w-[150px] sm:max-w-[200px]">
              {room.title}
            </span>
            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-black/40 font-mono text-zinc-400">
              {room.code}
            </Badge>
          </div>

          {/* Question Matrix Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {room.questions.map((q: any, idx: number) => {
              const isSolved =
                (q.problem && solvedProblemIds.has(q.problem.id)) ||
                (q.assessmentQuestion && submittedMcqs.has(q.assessmentQuestion.id));
              const isActive = idx === activeQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                      : isSolved
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-[#11141A] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  {isSolved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : q.type === "CODING" ? (
                    <Code2 className="w-3 h-3 text-zinc-400" />
                  ) : (
                    <Brain className="w-3 h-3 text-zinc-400" />
                  )}
                  <span>
                    {q.type === "CODING" ? `Q${idx + 1}` : `MCQ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">
                    {q.points}p
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Authoritative Countdown Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-1 rounded-full border flex items-center gap-2 font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              (secondsLeft ?? 100) < 300
                ? "bg-red-500/15 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                : "bg-black/50 border-zinc-800 text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Right: Proctor Status, Fullscreen, Standings, Finish Test & Host Controls */}
        <div className="flex items-center gap-2">
          {/* Proctoring Status Indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium ${
              strikes === 0
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : strikes === 1
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
            }`}
            title={`Anti-Cheat Proctoring Active. ${strikes}/${maxStrikes} strikes.`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Proctor ({strikes}/{maxStrikes})</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={isFullscreen ? exitFullscreen : requestFullscreen}
            className="p-1.5 rounded-lg border border-zinc-800 bg-[#11141A] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Standings Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
            className={`text-xs h-8 border-zinc-800 flex items-center gap-2 rounded-xl transition-all ${
              isLeaderboardOpen
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                : "bg-[#11141A] text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">
              #{myData?.rank || 1} • {myData?.score || 0} pts
            </span>
          </Button>

          {/* Finish Assessment Button (Opens Modern Animated Modal) */}
          <Button
            size="sm"
            onClick={() => setIsFinishModalOpen(true)}
            className="text-xs h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finish Test</span>
          </Button>

          {/* Host Emergency Force End All */}
          {room.isHost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsForceEndModalOpen(true)}
              className="text-xs h-8 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl"
              title="End the contest for all players immediately"
            >
              Force End All
            </Button>
          )}

          {/* Exit Contest */}
          <button
            onClick={() => setIsExitModalOpen(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Exit Contest"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN ARENA WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Workspace Body */}
        {isCodingQuestion && activeQuestion?.problem ? (
          // ─── CODING SPLIT VIEW ──────────────────────────────────────
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-zinc-800/90 overflow-hidden">
            {/* Left: Problem Description */}
            <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#090B0E] custom-scrollbar">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeQuestion.problem.title}
                  </h2>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                      activeQuestion.problem.difficulty === "EASY"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : activeQuestion.problem.difficulty === "MEDIUM"
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-red-500/30 text-red-400 bg-red-500/10"
                    }`}
                  >
                    {activeQuestion.problem.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="text-blue-400 font-semibold">{activeQuestion.points} Points</span>
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
                  <div className="bg-black/40 rounded-xl p-3.5 font-mono text-xs text-zinc-300 border border-zinc-800/80 whitespace-pre-wrap">
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
                    <div key={idx} className="bg-black/40 rounded-xl p-4 border border-zinc-800/80 space-y-2.5 text-xs">
                      <div>
                        <span className="text-zinc-500 font-mono text-[11px]">Input:</span>
                        <pre className="mt-1 font-mono text-zinc-200 bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800/60 overflow-x-auto">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-mono text-[11px]">Output:</span>
                        <pre className="mt-1 font-mono text-zinc-200 bg-[#0C0E13] p-2.5 rounded-lg border border-zinc-800/60 overflow-x-auto">{ex.output}</pre>
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
            <div className="h-full flex flex-col bg-[#0A0C10] overflow-hidden">
              {/* Editor Header Toolbar */}
              <div className="h-11 border-b border-zinc-800/90 bg-[#0E1015] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-black/50 text-zinc-200 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
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
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.25)] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Executing..." : "Submit Solution"}
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
                <div className="h-48 border-t border-zinc-800 bg-[#090B0E] p-4 flex flex-col shrink-0 overflow-y-auto space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Verdict:
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold ${
                          judgeResult.verdict === "ACCEPTED"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {judgeResult.verdict}
                      </Badge>

                      {judgeResult.totalTestCases != null && (
                        <span className="text-xs font-mono text-zinc-400 ml-1">
                          ({judgeResult.passedCount ?? 0}/{judgeResult.totalTestCases} test cases passed)
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
                      {judgeResult.runtime != null && (
                        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          ⚡ {judgeResult.runtime}ms
                          {judgeResult.runtimePercentile && ` (Beats ${judgeResult.runtimePercentile}%)`}
                        </span>
                      )}
                      {judgeResult.memory != null && (
                        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          💾 {judgeResult.memory}KB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-Testcase Mini-Pills */}
                  {judgeResult.results && judgeResult.results.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {judgeResult.results.map((tc: any, i: number) => {
                        const passed = tc.verdict === "ACCEPTED";
                        return (
                          <div
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                              passed
                                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                                : "bg-rose-950/40 border-rose-800/40 text-rose-400"
                            }`}
                          >
                            <span>Case {i + 1}</span>
                            <span>{passed ? "✓" : "✗"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {judgeResult.compileOutput && (
                    <pre className="text-xs font-mono text-rose-300 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 whitespace-pre-wrap max-h-28 overflow-y-auto">
                      {judgeResult.compileOutput}
                    </pre>
                  )}

                  {judgeResult.stderr && (
                    <pre className="text-xs font-mono text-rose-300 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 whitespace-pre-wrap max-h-28 overflow-y-auto">
                      {judgeResult.stderr}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeQuestion?.assessmentQuestion ? (
          // ─── MCQ CARD VIEW ──────────────────────────────────────────
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center items-start bg-[#07080B]">
            <motion.div
              key={activeQuestion.assessmentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl w-full rounded-2xl bg-[#0D0F14] border border-zinc-800/90 p-8 space-y-7 shadow-2xl"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs">
                    {activeQuestion.assessmentQuestion.category || "MCQ"}
                  </Badge>
                  <span className="text-xs font-medium text-zinc-400">
                    {activeQuestion.assessmentQuestion.subject} • {activeQuestion.assessmentQuestion.topic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                  +{activeQuestion.points} points
                </div>
              </div>

              {/* Question Text */}
              <p className="text-lg font-medium text-white leading-relaxed">
                {activeQuestion.assessmentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {((activeQuestion.assessmentQuestion.options as string[]) || []).map((optionText, optIdx) => {
                  const qId = activeQuestion.assessmentQuestion!.id;
                  const isSelected = selectedOptions[qId] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }))}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500/60 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                          : "bg-black/30 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-normal">{optionText}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit & Navigation Bar */}
              <div className="pt-5 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                    Hotkeys: A, B, C, D • Enter
                  </span>
                  {submittedMcqs.has(activeQuestion.assessmentQuestion.id) && (
                    <span className="text-emerald-400 font-medium">✓ Recorded</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSubmitMcq(activeQuestion.assessmentQuestion!.id)}
                    disabled={
                      selectedOptions[activeQuestion.assessmentQuestion.id] === undefined ||
                      isSubmittingMcq
                    }
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.25)] transition-all disabled:opacity-40"
                  >
                    {isSubmittingMcq ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Confirm Answer"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-zinc-500 text-sm">
            Question data unavailable for this slot.
          </div>
        )}

        {/* ─── SLIDING LIVE LEADERBOARD DRAWER ────────────────────────── */}
        <AnimatePresence>
          {isLeaderboardOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ duration: 0.25 }}
              className="w-80 border-l border-zinc-800 bg-[#0B0D12] flex flex-col shrink-0 z-30 shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Live Standings
                  </h3>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Standings Table */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {participants.map((p, idx) => {
                  const isMe = p.userId === session?.user?.id;

                  return (
                    <div
                      key={p.userId}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isMe
                          ? "bg-blue-600/15 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : "bg-black/30 border-zinc-800 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-zinc-400 w-5 text-center">
                          #{p.rank || idx + 1}
                        </span>
                        <span className="font-medium truncate max-w-[120px]">
                          {p.name} {isMe && "(You)"}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-white">{p.score} pts</div>
                        <div className="text-[10px] text-zinc-500">{p.solvedCount} solved</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Solve Activity Feed */}
              {recentActivities.length > 0 && (
                <div className="p-3 border-t border-zinc-800 bg-black/40 max-h-36 overflow-y-auto space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
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
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ─── MODERN ANIMATED FINISH ASSESSMENT MODAL ────────────────── */}
      <AnimatePresence>
        {isFinishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#0D0F14] border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 md:p-7 space-y-6 text-zinc-100 overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Submit Assessment?
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Review your contest progress before finalizing.
                  </p>
                </div>
              </div>

              {/* Progress Summary Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total</div>
                  <div className="text-xl font-mono font-bold text-white mt-1">{totalQuestions}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Completed</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{completedCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Unanswered</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">{remainingCount}</div>
                </div>
              </div>

              {/* Note / Warning */}
              {remainingCount > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    You have <strong>{remainingCount} unanswered question{remainingCount > 1 ? "s" : ""}</strong>. You can still return to solve them before time runs out.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    Awesome! You have answered all questions in this test session.
                  </span>
                </div>
              )}

              <p className="text-xs text-zinc-400 leading-relaxed">
                Once submitted, your responses are finalized and you will be directed to the podium rankings. Other players will continue their test undisturbed.
              </p>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsFinishModalOpen(false)}
                  disabled={isSubmittingTest}
                  className="rounded-xl text-zinc-400 hover:text-white"
                >
                  Continue Test
                </Button>
                <Button
                  onClick={confirmFinishMyTest}
                  disabled={isSubmittingTest}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  {isSubmittingTest ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Assessment"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODERN ANIMATED HOST FORCE END ALL MODAL ───────────────── */}
      <AnimatePresence>
        {isForceEndModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#0D0F14] border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] p-6 md:p-7 space-y-5 text-zinc-100 overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Force End Contest for Everyone?
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Host administrative emergency action.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                ⚠️ This will <strong>immediately terminate the contest for all active participants</strong> and permanently lock all submissions. All participants will be redirected to the results podium.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsForceEndModalOpen(false)}
                  className="rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmHostForceEnd}
                  className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold px-5 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  Conclude Contest
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODERN ANIMATED EXIT CONTEST MODAL ─────────────────────── */}
      <AnimatePresence>
        {isExitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl bg-[#0D0F14] border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 space-y-4 text-zinc-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Exit Battle Arena?</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to leave the contest? Your unsubmitted answers may not be saved.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsExitModalOpen(false)}
                  className="rounded-xl text-zinc-400 hover:text-white"
                >
                  Stay
                </Button>
                <Button
                  onClick={() => navigate("/rooms")}
                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold"
                >
                  Exit Arena
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── ANTI-CHEAT WARNING MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {warningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full max-w-md rounded-2xl p-6 md:p-7 space-y-5 text-zinc-100 border shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
                isTerminated
                  ? "bg-[#180A0A] border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                  : "bg-[#120F09] border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-xl border ${
                    isTerminated
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  }`}
                >
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {isTerminated ? "Contest Disqualified" : "Proctoring Warning"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Anti-Cheat Surveillance Triggered
                  </p>
                </div>
              </div>

              {/* Strike Counter Dots */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Violation Strikes:
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => {
                    const isTriggered = step <= strikes;
                    return (
                      <div
                        key={step}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                          isTriggered
                            ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1.5">
                <div className="font-semibold text-white">Detected Action:</div>
                <div className="text-zinc-400 font-mono">{currentReason || "Tab switch or window defocus"}</div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {isTerminated
                  ? "You have accumulated 3 anti-cheat violations. Your test is being locked and finalized."
                  : "Switching tabs, minimizing the test window, or losing focus is strictly prohibited. If you reach 3 strikes, you will be disqualified."}
              </p>

              {!isTerminated && (
                <div className="pt-2 flex items-center justify-end">
                  <Button
                    onClick={dismissWarning}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                  >
                    I Understand & Return to Test
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
