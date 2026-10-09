import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send,
  Square,
  Sparkles,
  ArrowRight,
  Code2,
  Server,
  Layers,
  Cpu,
  Terminal,
  User,
  Bot,
  ChevronLeft,
  Clock,
  Shield,
  Activity,
  SlidersHorizontal,
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const TRACKS = [
  {
    id: "Full Stack Engineer",
    title: "Full Stack Engineering",
    icon: Layers,
    tags: ["React", "Node.js", "PostgreSQL", "System APIs"],
    desc: "End-to-end web architecture, client-server sync, database queries, and REST/GraphQL API design.",
  },
  {
    id: "Frontend Engineer",
    title: "Frontend & Web Architecture",
    icon: Code2,
    tags: ["TypeScript", "React/Next.js", "State", "DOM Perf"],
    desc: "Component lifecycles, bundle optimization, accessibility, async state, and CSS/layout engines.",
  },
  {
    id: "Backend Engineer",
    title: "Backend & Distributed Systems",
    icon: Server,
    tags: ["Microservices", "Concurrency", "Caching", "SQL/NoSQL"],
    desc: "Scalable services, database indexation, Redis caching, message queues, and fault tolerance.",
  },
  {
    id: "System Design & Architecture",
    title: "System Design & Scalability",
    icon: Cpu,
    tags: ["High Availability", "Load Balancing", "Sharding", "CAP"],
    desc: "Architecting large-scale systems from 0 to 10M+ DAU, data partitioning, CDN caching, and edge routing.",
  },
  {
    id: "DevOps & Cloud Engineer",
    title: "DevOps, SRE & Cloud",
    icon: Terminal,
    tags: ["Docker", "Kubernetes", "CI/CD", "AWS/Cloud"],
    desc: "Container orchestration, automated deployments, monitoring, zero-downtime rollouts, and infrastructure.",
  },
];

const LEVELS = [
  {
    id: "junior",
    label: "Junior",
    subtitle: "0–2 YOE",
    description: "Core language fundamentals, clean coding, and baseline design patterns.",
  },
  {
    id: "mid",
    label: "Mid-Level",
    subtitle: "2–5 YOE",
    description: "Production scenarios, architectural trade-offs, debugging, and edge cases.",
  },
  {
    id: "senior",
    label: "Senior / Staff",
    subtitle: "5+ YOE",
    description: "High-scale architecture, concurrency bottlenecks, resilience, and tech strategy.",
  },
];

const ROUND_FOCUSES = [
  { id: "comprehensive", label: "Comprehensive (Balanced)", desc: "Mix of fundamentals, scenarios & design" },
  { id: "scenarios", label: "Scenario & Problem Solving", desc: "Real-world production fires & triage" },
  { id: "architecture", label: "Architecture & Trade-offs", desc: "High-level design & technical choices" },
];

export default function InterviewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const roleParam = searchParams.get("role");
  const diffParam = searchParams.get("difficulty");
  const idParam = searchParams.get("id");

  const [selectedTrack, setSelectedTrack] = useState(roleParam || "Full Stack Engineer");
  const [selectedLevel, setSelectedLevel] = useState(diffParam || "mid");
  const [selectedFocus, setSelectedFocus] = useState("comprehensive");
  const [customTrack, setCustomTrack] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(!roleParam && !idParam);

  // Active interview session state
  const [interviewId, setInterviewId] = useState<string | null>(idParam);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startedAt, setStartedAt] = useState<Date>(new Date());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track elapsed session timer
  useEffect(() => {
    if (!interviewId || isConfiguring) return;
    const interval = setInterval(() => {
      const mins = Math.floor((new Date().getTime() - startedAt.getTime()) / 60000);
      setElapsedMinutes(mins);
    }, 15000);
    return () => clearInterval(interval);
  }, [interviewId, isConfiguring, startedAt]);

  // Load existing interview if id provided in URL
  useEffect(() => {
    if (!idParam) return;

    async function loadInterview() {
      try {
        setIsStarting(true);
        const res = await api.get(`/interviews/${idParam}`);
        const interview = res.data.interview;
        setInterviewId(interview.id);
        setSelectedTrack(interview.role);
        setSelectedLevel(interview.difficulty);
        setIsConfiguring(false);

        if (interview.messages && interview.messages.length > 0) {
          setMessages(
            interview.messages.map((m: any) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        } else {
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

  // Auto-launch if role was directly passed via query params
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
          content: `Welcome to your ${selectedLevel} level ${selectedTrack} technical interview. To begin, could you briefly introduce yourself and share a complex problem you tackled recently?`,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function startInterviewSession(targetTrack: string, targetLevel: string) {
    setIsStarting(true);
    setIsConfiguring(false);
    setStartedAt(new Date());
    try {
      const res = await api.post("/interviews", {
        mode: "text",
        role: targetTrack,
        difficulty: targetLevel,
      });

      const newId = res.data.interview.id;
      setInterviewId(newId);
      setSearchParams({ id: newId });

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
          content: "Connection interrupted. Could you please reiterate your last point?",
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

  // ─────────────────────────────────────────────────────────────
  // 1. STUDIO CONFIGURATION SCREEN (Developer Studio Layout)
  // ─────────────────────────────────────────────────────────────
  if (isConfiguring) {
    const activeTrackTitle = customTrack.trim() || selectedTrack;
    const currentTrackObj = TRACKS.find((t) => t.id === selectedTrack);
    const currentLevelObj = LEVELS.find((l) => l.id === selectedLevel);

    return (
      <div className="min-h-screen bg-[#08090C] text-white">
        {/* Studio Sub-Header */}
        <div className="border-b border-[#181A20] bg-[#0D0E12]/80 backdrop-blur-md px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/practice")}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#14161C] transition-colors cursor-pointer"
                title="Back to Prep Hub"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Technical Interview Studio
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#327CF6]/10 border border-[#327CF6]/25 text-[#327CF6] text-[10px] font-mono font-medium">
                    v1.0 Live
                  </span>
                </div>
                <p className="text-xs text-[#7A808C]">
                  Configure your track, calibrate seniority, and run a full technical mock round.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-[#7A808C]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Interviewer Engine Active
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Primary Track & Level Controls */}
            <div className="lg:col-span-8 space-y-6">
              {/* Track Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#327CF6]" />
                    <span>Select Engineering Track</span>
                  </label>
                  <span className="text-[11px] text-[#7A808C]">5 Specialized Paths</span>
                </div>

                <div className="space-y-2">
                  {TRACKS.map((t) => {
                    const Icon = t.icon;
                    const isSelected = selectedTrack === t.id && !customTrack;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTrack(t.id);
                          setCustomTrack("");
                        }}
                        className={cn(
                          "p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group",
                          isSelected
                            ? "bg-[#0E121B] border-[#327CF6] shadow-sm shadow-[#327CF6]/15"
                            : "bg-[#0D0E12] border-[#181A20] hover:border-[#262933] hover:bg-[#111319]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border transition-colors",
                            isSelected
                              ? "bg-[#327CF6]/20 border-[#327CF6]/50 text-[#327CF6]"
                              : "bg-[#14161C] border-[#1E2229] text-[#7A808C] group-hover:text-zinc-200"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className={cn(
                                "text-xs sm:text-sm font-bold tracking-tight",
                                isSelected ? "text-white" : "text-zinc-200"
                              )}
                            >
                              {t.title}
                            </h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-[#327CF6]/15 text-[#327CF6] text-[10px] font-mono font-semibold shrink-0">
                                Selected
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#7A808C] leading-relaxed line-clamp-1">
                            {t.desc}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {t.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-[#14161C] border border-[#1E2229] text-[10px] text-zinc-400 font-mono"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Track write-in */}
                <div className="pt-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Or specify custom role (e.g. Staff iOS Engineer, ML Platform, Data Architect)..."
                      value={customTrack}
                      onChange={(e) => setCustomTrack(e.target.value)}
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] text-white text-xs outline-none transition-colors placeholder:text-zinc-600"
                    />
                    {customTrack.trim() && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-[#327CF6]/20 text-[#327CF6] text-[10px] font-mono">
                        Active Custom
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seniority Calibration */}
              <div className="space-y-3 pt-4 border-t border-[#181A20]">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                  Calibrate Seniority Level
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {LEVELS.map((lvl) => {
                    const isSelected = selectedLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setSelectedLevel(lvl.id)}
                        className={cn(
                          "p-3.5 rounded-xl text-left border transition-all cursor-pointer space-y-1",
                          isSelected
                            ? "bg-[#0E121B] border-[#327CF6] shadow-sm shadow-[#327CF6]/15"
                            : "bg-[#0D0E12] border-[#181A20] hover:border-[#262933] hover:bg-[#111319]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              isSelected ? "text-white" : "text-zinc-300"
                            )}
                          >
                            {lvl.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#7A808C]">
                            {lvl.subtitle}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7A808C] line-clamp-2 leading-relaxed">
                          {lvl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Round Focus Mode */}
              <div className="space-y-3 pt-4 border-t border-[#181A20]">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                  Assessment Focus
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ROUND_FOCUSES.map((f) => {
                    const isSelected = selectedFocus === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFocus(f.id)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#327CF6]/10 border-[#327CF6]/40 text-white font-medium"
                            : "bg-[#0D0E12] border-[#181A20] text-[#8B92A0] hover:text-white hover:border-[#262933]"
                        )}
                      >
                        <p className="font-semibold text-xs truncate">{f.label}</p>
                        <p className="text-[10px] text-[#7A808C] truncate mt-0.5">{f.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Session Blueprint & Launchcard */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] shadow-xl space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#7A808C] uppercase tracking-wider">
                      Session Blueprint
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {activeTrackTitle}
                  </h2>
                </div>

                <div className="space-y-3 text-xs divide-y divide-[#181A20]/60">
                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Seniority Target</span>
                    <span className="text-white font-medium capitalize">
                      {currentLevelObj?.label} ({currentLevelObj?.subtitle})
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Target Format</span>
                    <span className="text-white font-medium">Text & Architectural Round</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Estimated Length</span>
                    <span className="text-white font-medium">15–20 minutes</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Interviewer Persona</span>
                    <span className="text-emerald-400 font-medium">Staff Engineer (Adaptive)</span>
                  </div>
                </div>

                {/* Scorecard Dimensions Covered */}
                <div className="p-3.5 rounded-xl bg-[#08090C] border border-[#181A20] space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Evaluated Scorecard Dimensions
                  </span>
                  <div className="space-y-1.5 text-[11px] text-[#8B92A0]">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Technical Architecture & Accuracy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#327CF6] shrink-0" />
                      <span>Systematic Problem Solving</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Trade-off & Complexity Articulation</span>
                    </div>
                  </div>
                </div>

                {/* Primary Launch Action */}
                <Button
                  type="button"
                  onClick={() => startInterviewSession(activeTrackTitle, selectedLevel)}
                  className="w-full py-5 rounded-xl bg-[#327CF6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-lg shadow-[#327CF6]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch Interview Session</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <p className="text-[10px] text-center text-[#7A808C]">
                  Scorecard and dimensional feedback generated immediately upon completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. INITIALIZING / SPINNER STATE
  // ─────────────────────────────────────────────────────────────
  if (isStarting) {
    return (
      <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#327CF6]/10 border border-[#327CF6]/25 flex items-center justify-center animate-pulse">
          <Activity className="w-6 h-6 text-[#327CF6]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Initializing Technical Assessment</h2>
          <p className="text-xs text-[#8B92A0]">
            Calibrating questions for {selectedLevel} level {selectedTrack}...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ACTIVE INTERVIEW ROOM (Clean Engineering Interface)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col text-white">
      {/* Top Header Bar */}
      <header className="border-b border-[#181A20] bg-[#0D0E12] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#327CF6]/15 border border-[#327CF6]/30 flex items-center justify-center text-[#327CF6]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">{selectedTrack}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-medium">
                Live Session
              </span>
            </div>
            <p className="text-[11px] text-[#7A808C] capitalize">
              {selectedLevel} Level • Technical Round
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#08090C] border border-[#181A20] text-xs font-mono text-[#8B92A0]">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{elapsedMinutes}m elapsed</span>
          </div>

          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            <span>End Session</span>
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
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border",
                  isUser
                    ? "bg-[#327CF6] border-[#327CF6]/50 text-white"
                    : "bg-[#0D0E12] border-[#181A20] text-cyan-400"
                )}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
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
                    <span>Evaluating response & formulating next question...</span>
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
            placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
            disabled={isStreaming}
            className="flex-1 bg-[#08090C] border border-[#181A20] focus:border-[#327CF6] rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-colors resize-none max-h-36 min-h-[42px]"
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
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Conclude Assessment Round?</h3>
              <p className="text-xs text-[#8B92A0]">
                Are you ready to submit your responses and generate your comprehensive scorecard?
              </p>
            </div>

            <p className="text-xs text-zinc-400 bg-[#08090C] p-3 rounded-xl border border-[#181A20]">
              The AI reviewer will score your session across technical depth, problem-solving, and communication, providing complete dimension scores and feedback.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isEnding}
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#14161C] hover:bg-[#1C1F26] text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Return to Interview
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
                    <span>Conclude & Generate Scorecard</span>
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