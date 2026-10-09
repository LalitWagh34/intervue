import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send,
  Square,
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Code2,
  Server,
  Layers,
  Cpu,
  Terminal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const ROLES = [
  {
    id: "Full Stack Engineer",
    label: "Full Stack Engineer",
    icon: Layers,
    desc: "React, Node.js, REST/GraphQL APIs, Databases & Architecture",
  },
  {
    id: "Frontend Engineer",
    label: "Frontend Engineer",
    icon: Code2,
    desc: "React/Next.js, TypeScript, State Management, DOM & Web Performance",
  },
  {
    id: "Backend Engineer",
    label: "Backend Engineer",
    icon: Server,
    desc: "Distributed Systems, Microservices, SQL/NoSQL, Caching & Queues",
  },
  {
    id: "System Design & Architecture",
    label: "System Design",
    icon: Cpu,
    desc: "Scalability, High Availability, Load Balancing, CDN & Storage",
  },
  {
    id: "DevOps & Cloud Engineer",
    label: "DevOps / Cloud",
    icon: Terminal,
    desc: "Docker, Kubernetes, CI/CD, AWS/GCP & Infrastructure as Code",
  },
];

const DIFFICULTIES = [
  { id: "junior", label: "Entry / Junior", yoe: "0–2 YOE", color: "text-emerald-400" },
  { id: "mid", label: "Mid-Level", yoe: "2–5 YOE", color: "text-[#327CF6]" },
  { id: "senior", label: "Senior / Staff", yoe: "5+ YOE", color: "text-amber-400" },
];

export default function InterviewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Setup state
  const roleParam = searchParams.get("role");
  const diffParam = searchParams.get("difficulty");
  const idParam = searchParams.get("id");

  const [selectedRole, setSelectedRole] = useState(roleParam || "Full Stack Engineer");
  const [selectedDifficulty, setSelectedDifficulty] = useState(diffParam || "mid");
  const [customRole, setCustomRole] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(!roleParam && !idParam);

  // Active interview state
  const [interviewId, setInterviewId] = useState<string | null>(idParam);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // If id is provided in URL, load existing session
  useEffect(() => {
    if (!idParam) return;

    async function loadInterview() {
      try {
        setIsStarting(true);
        const res = await api.get(`/interviews/${idParam}`);
        const interview = res.data.interview;
        setInterviewId(interview.id);
        setSelectedRole(interview.role);
        setSelectedDifficulty(interview.difficulty);
        setIsConfiguring(false);

        if (interview.messages && interview.messages.length > 0) {
          setMessages(
            interview.messages.map((m: any) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        } else {
          // Trigger first question
          await triggerInitialGreeting(interview.id);
        }
      } catch (err) {
        console.error("Failed to load interview:", err);
        setIsConfiguring(true);
      } finally {
        setIsStarting(false);
      }
    }

    loadInterview();
  }, [idParam]);

  // If role is passed via URL query without id, auto-start
  useEffect(() => {
    if (roleParam && !idParam && !interviewId && !isStarting) {
      startInterviewSession(roleParam, diffParam || "mid");
    }
  }, [roleParam, diffParam]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function triggerInitialGreeting(id: string) {
    try {
      setIsStreaming(true);
      const res = await api.post(`/interviews/${id}/message`, {
        message: "[START_INTERVIEW]",
      });
      if (res.data?.text) {
        setMessages([{ role: "assistant", content: res.data.text }]);
      }
    } catch (err) {
      console.error("Failed to start greeting:", err);
      setMessages([
        {
          role: "assistant",
          content: `Hello! Welcome to your ${selectedDifficulty} level ${selectedRole} technical interview. Could you introduce yourself and briefly explain a challenging technical problem you solved recently?`,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function startInterviewSession(targetRole: string, targetDiff: string) {
    setIsStarting(true);
    setIsConfiguring(false);
    try {
      const res = await api.post("/interviews", {
        mode: "text",
        role: targetRole,
        difficulty: targetDiff,
      });

      const newId = res.data.interview.id;
      setInterviewId(newId);
      setSearchParams({ id: newId });

      // Trigger the AI interviewer greeting & first question
      await triggerInitialGreeting(newId);
    } catch (err) {
      console.error("Failed to start interview:", err);
      setIsConfiguring(true);
    } finally {
      setIsStarting(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !interviewId || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    try {
      const res = await fetch(`${baseURL}/interviews/${interviewId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            accumulated += parsed.text;
            const finalText = accumulated;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: finalText };
              return updated;
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error streaming message:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I encountered a brief connection error. Could you please reiterate your last point?",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function endInterview() {
    if (!interviewId) return;
    setIsEnding(true);
    try {
      await api.put(`/interviews/${interviewId}/end`);
      navigate(`/results/${interviewId}`);
    } catch (err) {
      console.error("Failed to end interview:", err);
      navigate(`/results/${interviewId}`);
    } finally {
      setIsEnding(false);
      setShowEndConfirm(false);
    }
  }

  // ─── 1. INTERVIEW CONFIGURATION SCREEN ───
  if (isConfiguring) {
    const activeRoleName = customRole.trim() || selectedRole;

    return (
      <div className="min-h-screen bg-[#08090C] text-white flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#327CF6]/10 border border-[#327CF6]/25 text-[#327CF6] text-xs font-semibold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              <span>AI Technical Simulation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Configure Your AI Mock Interview
            </h1>
            <p className="text-sm text-[#8B92A0] max-w-xl mx-auto">
              Simulate an authentic technical interview with adaptive questions, follow-ups, and comprehensive instant evaluation across core dimensions.
            </p>
          </div>

          {/* Configurator Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E12] border border-[#181A20] shadow-2xl space-y-6">
            {/* Step 1: Select Role */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Select Target Role</span>
                <span className="text-[11px] text-[#7A808C] font-normal">Choose preset or type custom</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id && !customRole;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id);
                        setCustomRole("");
                      }}
                      className={cn(
                        "p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3",
                        isSelected
                          ? "bg-[#327CF6]/10 border-[#327CF6] shadow-sm shadow-[#327CF6]/20"
                          : "bg-[#08090C] border-[#181A20] hover:border-[#262933] hover:bg-[#12141A]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          isSelected ? "bg-[#327CF6] text-white" : "bg-[#181A20] text-zinc-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold", isSelected ? "text-white" : "text-zinc-200")}>
                          {r.label}
                        </p>
                        <p className="text-[11px] text-[#7A808C] truncate mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Role write-in */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Or enter custom role (e.g. iOS Engineer, Data Engineer, QA)..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08090C] border border-[#181A20] focus:border-[#327CF6] text-white text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Step 2: Select Difficulty */}
            <div className="space-y-3 pt-2 border-t border-[#181A20]">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                2. Select Experience Level
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {DIFFICULTIES.map((d) => {
                  const isSelected = selectedDifficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(d.id)}
                      className={cn(
                        "p-3 rounded-xl text-center border transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#327CF6]/10 border-[#327CF6] shadow-sm shadow-[#327CF6]/20"
                          : "bg-[#08090C] border-[#181A20] hover:border-[#262933] hover:bg-[#12141A]"
                      )}
                    >
                      <p className={cn("text-xs font-bold", isSelected ? "text-white" : "text-zinc-300")}>
                        {d.label}
                      </p>
                      <p className="text-[10px] text-[#7A808C] mt-0.5">{d.yoe}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature Highlights Banner */}
            <div className="p-4 rounded-2xl bg-[#08090C] border border-[#181A20] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#8B92A0]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Adaptive Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#327CF6] shrink-0" />
                <span>3-Dimension Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instant Scorecard</span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => startInterviewSession(activeRoleName, selectedDifficulty)}
                className="w-full py-6 rounded-2xl bg-[#327CF6] hover:bg-[#2563EB] text-white font-bold text-sm shadow-xl shadow-[#327CF6]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Interview Room</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. STARTING / LOADING STATE ───
  if (isStarting) {
    return (
      <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#327CF6]/10 border border-[#327CF6]/25 flex items-center justify-center animate-pulse">
          <Brain className="w-8 h-8 text-[#327CF6]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Preparing Your Technical Assessment</h2>
          <p className="text-xs text-[#8B92A0]">
            Configuring {selectedDifficulty} level {selectedRole} questions and reviewer persona...
          </p>
        </div>
      </div>
    );
  }

  // ─── 3. ACTIVE INTERVIEW ROOM ───
  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col text-white">
      {/* Top Header Bar */}
      <header className="border-b border-[#181A20] bg-[#0D0E12]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#327CF6]/15 border border-[#327CF6]/30 flex items-center justify-center text-[#327CF6]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">{selectedRole}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-medium uppercase">
                Active Session
              </span>
            </div>
            <p className="text-[11px] text-[#7A808C] capitalize">
              {selectedDifficulty} Level • Text Round
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            <span>End Interview</span>
          </button>
        </div>
      </header>

      {/* Messages Stream Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-5">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border",
                  isUser
                    ? "bg-[#327CF6] border-[#327CF6]/50 text-white"
                    : "bg-[#0D0E12] border-[#181A20] text-cyan-400"
                )}
              >
                {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={cn(
                  "max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                  isUser
                    ? "bg-[#327CF6] text-white rounded-tr-none font-medium"
                    : "bg-[#0D0E12] border border-[#181A20] text-zinc-200 rounded-tl-none whitespace-pre-wrap"
                )}
              >
                {msg.content ? (
                  msg.content
                ) : isStreaming && i === messages.length - 1 ? (
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-[#327CF6] animate-ping" />
                    <span>Interviewer is thinking...</span>
                  </span>
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* Input Composer */}
      <footer className="border-t border-[#181A20] bg-[#0D0E12] p-3 sm:p-4 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your technical response... (Press Enter to submit, Shift+Enter for new line)"
            disabled={isStreaming}
            className="flex-1 bg-[#08090C] border border-[#181A20] focus:border-[#327CF6] rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-colors resize-none max-h-32 min-h-[42px]"
          />

          <Button
            type="button"
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="h-[42px] px-4 rounded-xl bg-[#327CF6] hover:bg-[#2563EB] disabled:bg-[#181A20] disabled:text-zinc-600 text-white font-semibold text-xs shadow-md shadow-[#327CF6]/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </footer>

      {/* End Interview Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0D0E12] border border-[#181A20] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Conclude Assessment?</h3>
                <p className="text-xs text-[#8B92A0]">
                  Are you ready to finalize this interview and generate your performance evaluation?
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 bg-[#08090C] p-3 rounded-xl border border-[#181A20]">
              Our AI evaluator will score your responses across technical depth, problem-solving, and communication, providing full feedback and dimension scores.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isEnding}
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#14161C] hover:bg-[#1C1F26] text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Continue Interview
              </button>
              <button
                type="button"
                disabled={isEnding}
                onClick={endInterview}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
              >
                {isEnding ? (
                  <span>Generating Scorecard...</span>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Conclude & View Scorecard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}