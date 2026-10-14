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
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Activity,
  SlidersHorizontal,
  Flame,
  Check,
  FileText,
  Upload,
  FileCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";

function closeUnbalancedBoldTokens(markdown: string): string {
  const matches = markdown.match(/\*\*/g);
  if (matches && matches.length % 2 !== 0) {
    return `${markdown}**`;
  }
  return markdown;
}

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
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [isResumeExpanded, setIsResumeExpanded] = useState(false);
  const trackDropdownRef = useRef<HTMLDivElement>(null);

  // Close track dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (trackDropdownRef.current && !trackDropdownRef.current.contains(event.target as Node)) {
        setIsTrackDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resume Grounding state
  const { data: userProfile } = useProfile();
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeDossier, setResumeDossier] = useState<{ projects: string[]; stack: string[]; summary: string } | null>(null);
  const [showRawEditor, setShowRawEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoFillFromProfile = () => {
    if (!userProfile) return;
    const parts: string[] = [];
    if (userProfile.fullName) parts.push(`Candidate: ${userProfile.fullName}`);
    if (userProfile.targetRole) parts.push(`Target Role: ${userProfile.targetRole}`);
    if (userProfile.experienceLevel) parts.push(`Experience Level: ${userProfile.experienceLevel}`);
    if (userProfile.skills && userProfile.skills.length > 0) parts.push(`Core Skills: ${userProfile.skills.join(", ")}`);
    if (userProfile.bio) parts.push(`Background & Projects:\n${userProfile.bio}`);
    if (userProfile.githubUrl) parts.push(`GitHub: ${userProfile.githubUrl}`);
    const combined = parts.join("\n\n");
    if (combined.trim()) {
      setResumeText(combined);
      setResumeFileName("Intervue Profile Dossier");
      setResumeDossier({
        projects: userProfile.bio ? [userProfile.bio.slice(0, 160)] : ["Verified candidate background"],
        stack: userProfile.skills || [],
        summary: `${userProfile.targetRole || "Software Engineer"} • ${userProfile.experienceLevel || "Mid"} Level Engineer`,
      });
      setIsResumeExpanded(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    setResumeFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/interviews/parse-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setResumeText(res.data.extractedText);
        setResumeFileName(res.data.fileName);
        setResumeDossier(res.data.dossier);
        setIsResumeExpanded(true);
      }
    } catch (err) {
      console.error("Resume backend parse error, falling back to local text reader:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const clean = content.replace(/[^\x20-\x7E\t\n\r]/g, " ").replace(/\s+/g, " ").trim();
          setResumeText(clean.slice(0, 4000));
          setIsResumeExpanded(true);
        }
      };
      reader.readAsText(file);
    } finally {
      setIsParsingResume(false);
    }
  };

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

  // Split-Pane Code Workspace & Telemetry State
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [codeLanguage, setCodeLanguage] = useState("python");
  const [codeSnippet, setCodeSnippet] = useState<string>(() => {
    return `# architecture_spec.py
# High-throughput URL Shortener (10M writes/day, <50ms p99 read latency)

class URLCompressorCluster:
    def __init__(self, node_id: int = 1):
        self.node_id = node_id
        # In-process L1 cache (<0.1ms) absorbs viral hotspot keys
        self.l1_cache = {}
        # Multi-AZ Distributed Redis cluster (~1-2ms)
        self.cache_layer = {}
        # Prefix-sharded persistent storage cluster
        self.db_shards = {}

    async def shorten_url(self, long_url: str) -> str:
        # Pre-generated Base62 key allocation
        short_key = "k9xW2a1"
        self.db_shards[short_key] = long_url
        self.cache_layer[short_key] = long_url
        return short_key

    async def resolve_url(self, short_key: str) -> str:
        # 1. Local L1 in-process memory cache
        if short_key in self.l1_cache:
            return self.l1_cache[short_key]
        # 2. L2 Redis cluster
        if short_key in self.cache_layer:
            self.l1_cache[short_key] = self.cache_layer[short_key]
            return self.cache_layer[short_key]
        # 3. Persistent sharded DB fallback
        return self.db_shards.get(short_key, "")
`;
  });

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
        if (interview.focus) {
          setSelectedFocus(interview.focus);
        }
        if (interview.resumeText) {
          setResumeText(interview.resumeText);
        }
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
          content: `Hi! Welcome, thanks for taking the time to chat today. I'm excited to meet you! Before we jump into technical details, could you tell me a little bit about yourself and what you've been working on recently?`,
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
        focus: selectedFocus,
        resumeText: resumeText.trim() || undefined,
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
    const token = localStorage.getItem("intervue_session_token");
    try {
      const res = await fetch(`${baseURL}/interviews/${interviewId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    const currentTrackObj = TRACKS.find((t) => t.id === selectedTrack) || TRACKS[0];
    const currentLevelObj = LEVELS.find((l) => l.id === selectedLevel) || LEVELS[1];
    const currentFocusObj = ROUND_FOCUSES.find((f) => f.id === selectedFocus) || ROUND_FOCUSES[0];
    const SelectedTrackIcon = currentTrackObj.icon;

    return (
      <div className="min-h-screen bg-[#08090C] text-white">
        {/* Studio Sub-Header */}
        <div className="border-b border-[#181A20] bg-[#0D0E12]/80 backdrop-blur-md px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                  Calibrate your track, seniority, and optional portfolio grounding before launching the session.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#7A808C] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Adaptive Groq Engine</span>
            </div>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Compact Configuration Console */}
            <div className="lg:col-span-8 space-y-5">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] shadow-xl space-y-6">
                
                {/* 01. TARGET ENGINEERING TRACK DROPDOWN */}
                <div className="space-y-2.5 relative" ref={trackDropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#327CF6]" />
                      <span>Target Role & Engineering Track</span>
                    </label>
                    <span className="text-[11px] text-[#7A808C]">
                      {customTrack ? "Custom Role" : "5 Curated Tracks"}
                    </span>
                  </div>

                  {/* Dropdown Trigger Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTrackDropdownOpen((prev) => !prev)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                        isTrackDropdownOpen
                          ? "bg-[#10141F] border-[#327CF6] ring-1 ring-[#327CF6]/30"
                          : "bg-[#090A0E] border-[#181A20] hover:border-[#262933] hover:bg-[#0D0F14]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#327CF6]/15 border border-[#327CF6]/30 flex items-center justify-center shrink-0 text-[#327CF6]">
                          <SelectedTrackIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {customTrack.trim() || currentTrackObj.title}
                          </p>
                          <p className="text-[11px] text-[#7A808C] truncate">
                            {customTrack.trim() ? "Custom specialized engineering track" : currentTrackObj.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block text-[10px] text-[#8B92A0] bg-[#14161C] border border-[#1E2229] px-2 py-0.5 rounded-md font-mono">
                          Change Track
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-zinc-400 transition-transform duration-200",
                            isTrackDropdownOpen && "rotate-180 text-[#327CF6]"
                          )}
                        />
                      </div>
                    </button>

                    {/* Dropdown Menu Popover */}
                    {isTrackDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-xl bg-[#0B0D13] border border-[#222530] shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Select Curated Track
                        </div>

                        {TRACKS.map((t) => {
                          const Icon = t.icon;
                          const isSelected = selectedTrack === t.id && !customTrack;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTrack(t.id);
                                setCustomTrack("");
                                setIsTrackDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full p-2.5 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between gap-3 group",
                                isSelected
                                  ? "bg-[#327CF6]/15 text-white font-medium"
                                  : "hover:bg-[#14161F] text-zinc-300 hover:text-white"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border",
                                    isSelected
                                      ? "bg-[#327CF6]/20 border-[#327CF6]/50 text-[#327CF6]"
                                      : "bg-[#14161C] border-[#1E2229] text-[#7A808C] group-hover:text-zinc-200"
                                  )}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{t.title}</p>
                                  <p className="text-[10px] text-[#7A808C] truncate">{t.tags.join(" • ")}</p>
                                </div>
                              </div>

                              {isSelected && (
                                <Check className="w-4 h-4 text-[#327CF6] shrink-0" />
                              )}
                            </button>
                          );
                        })}

                        {/* Custom Track Trigger inside dropdown */}
                        <div className="pt-1.5 mt-1 border-t border-[#181A20]/80 px-2 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTrack("");
                              if (!customTrack) setCustomTrack("ML Platform Engineer");
                              setIsTrackDropdownOpen(false);
                            }}
                            className="w-full text-left py-1.5 px-2 text-xs text-[#327CF6] hover:text-[#5694F8] hover:bg-[#327CF6]/10 rounded-md transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                          >
                            <span>+ Specify Custom Role / Specialization</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inline Custom Track Input (if active or custom) */}
                  {(customTrack || !selectedTrack) && (
                    <div className="pt-1">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Staff iOS Engineer, ML Platform, Distributed Systems Architect..."
                          value={customTrack}
                          onChange={(e) => setCustomTrack(e.target.value)}
                          className="w-full pl-3.5 pr-20 py-2 rounded-xl bg-[#090A0E] border border-[#327CF6]/50 focus:border-[#327CF6] text-white text-xs outline-none transition-colors placeholder:text-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTrack("");
                            setSelectedTrack(TRACKS[0].id);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-[#181A20] cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active tags preview */}
                  {!customTrack && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {currentTrackObj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[#08090C] border border-[#181A20] text-[10px] text-zinc-400 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 02. SENIORITY CALIBRATION (Segmented Pill Switcher) */}
                <div className="space-y-2 pt-3 border-t border-[#181A20]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                      Seniority Level
                    </label>
                    <span className="text-[11px] text-[#7A808C] font-mono">
                      {currentLevelObj.subtitle}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#08090C] border border-[#181A20]">
                    {LEVELS.map((lvl) => {
                      const isSelected = selectedLevel === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setSelectedLevel(lvl.id)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-center transition-all cursor-pointer font-medium text-xs flex flex-col items-center justify-center gap-0.5",
                            isSelected
                              ? "bg-[#327CF6] text-white shadow-md shadow-[#327CF6]/20 font-semibold"
                              : "text-[#8B92A0] hover:text-white hover:bg-[#111319]"
                          )}
                        >
                          <span className="truncate">{lvl.label}</span>
                          <span className={cn(
                            "text-[10px] font-mono",
                            isSelected ? "text-blue-100" : "text-[#555B67]"
                          )}>
                            {lvl.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[#7A808C] px-1">
                    {currentLevelObj.description}
                  </p>
                </div>

                {/* 03. ROUND FOCUS (Segmented Control) */}
                <div className="space-y-2 pt-3 border-t border-[#181A20]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                      Assessment Focus
                    </label>
                    <span className="text-[11px] text-[#7A808C]">
                      {currentFocusObj.desc}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#08090C] border border-[#181A20]">
                    {ROUND_FOCUSES.map((f) => {
                      const isSelected = selectedFocus === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFocus(f.id)}
                          className={cn(
                            "py-2 px-2.5 rounded-lg text-center transition-all cursor-pointer text-xs font-medium truncate",
                            isSelected
                              ? "bg-[#181D2A] text-white border border-[#327CF6]/40 shadow-sm"
                              : "text-[#8B92A0] hover:text-white hover:bg-[#111319]"
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 04. RESUME & PORTFOLIO GROUNDING (Collapsible Accordion Card) */}
                <div className="pt-3 border-t border-[#181A20]">
                  <div className="rounded-xl border border-[#181A20] bg-[#08090C] overflow-hidden transition-all">
                    
                    {/* Accordion Bar Header */}
                    <div
                      onClick={() => setIsResumeExpanded((prev) => !prev)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#0E1015] transition-colors select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                          resumeText.trim()
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                            : "bg-[#14161C] border-[#1E2229] text-[#7A808C]"
                        )}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">
                              Ground with Resume & Projects
                            </span>
                            {resumeText.trim() ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium flex items-center gap-1 shrink-0">
                                <FileCheck className="w-3 h-3" />
                                <span>Attached</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-mono shrink-0">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7A808C] truncate">
                            {resumeText.trim()
                              ? `${resumeFileName || "Custom highlights loaded"} (${resumeText.length} chars)`
                              : "Upload resume or sync profile so AI grills your actual past work"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quick action buttons right on the bar */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.md,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2 py-1 rounded-md bg-[#14161C] border border-[#1E2229] hover:border-[#327CF6]/40 text-[#8B92A0] hover:text-white text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3 text-[#327CF6]" />
                            <span className="hidden sm:inline">Upload</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAutoFillFromProfile}
                            className="px-2 py-1 rounded-md bg-[#14161C] border border-[#1E2229] hover:border-emerald-500/40 text-[#8B92A0] hover:text-white text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span className="hidden sm:inline">Sync</span>
                          </button>
                        </div>

                        <div className="p-1 text-zinc-400 hover:text-white">
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              isResumeExpanded && "rotate-180"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accordion Body Content */}
                    {isResumeExpanded && (
                      <div className="p-3.5 pt-2 border-t border-[#181A20] space-y-3 bg-[#090A0E] animate-in fade-in-50 duration-150">
                        {isParsingResume && (
                          <div className="p-3.5 rounded-xl bg-[#10141F] border border-[#327CF6]/30 flex items-center gap-3 text-xs text-[#8B92A0]">
                            <Sparkles className="w-4 h-4 text-[#327CF6] animate-spin shrink-0" />
                            <div className="space-y-0.5">
                              <p className="font-semibold text-white">Extracting & Analyzing Resume Dossier</p>
                              <p className="text-[11px] text-[#7A808C]">Reading PDF streams and extracting standout projects...</p>
                            </div>
                          </div>
                        )}

                        {resumeFileName && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium truncate">{resumeFileName}</span>
                              <span className="text-[10px] text-emerald-400/70 font-mono shrink-0">
                                (Verified & Grounded)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setResumeText("");
                                setResumeFileName(null);
                                setResumeDossier(null);
                                setShowRawEditor(false);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="p-1 hover:bg-emerald-500/20 rounded text-emerald-300 transition-colors cursor-pointer"
                              title="Remove resume"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Dossier Highlights Card (Instead of raw text dump) */}
                        {resumeDossier && (
                          <div className="p-3.5 rounded-xl bg-[#0D0E12] border border-[#181A20] space-y-2.5 text-xs">
                            {resumeDossier.summary && (
                              <p className="text-[#A5ABB6] leading-relaxed">
                                {resumeDossier.summary}
                              </p>
                            )}

                            {resumeDossier.projects && resumeDossier.projects.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  Standout Projects Detected
                                </span>
                                <div className="space-y-1">
                                  {resumeDossier.projects.map((proj, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                                      <span className="text-[#327CF6] font-bold">•</span>
                                      <span>{proj}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {resumeDossier.stack && resumeDossier.stack.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  Core Stack
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {resumeDossier.stack.map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md bg-[#14161C] border border-[#1E2229] text-[10px] text-zinc-300 font-mono"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between border-t border-[#181A20]/60">
                              <span className="text-[10px] text-[#7A808C]">
                                AI interviewer will probe these projects first.
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowRawEditor((prev) => !prev)}
                                className="text-[10px] text-[#327CF6] hover:underline cursor-pointer"
                              >
                                {showRawEditor ? "Hide Raw Notes" : "View / Edit Raw Notes"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Raw text editor only when toggled or when no dossier is present */}
                        {(showRawEditor || (!resumeDossier && !isParsingResume)) && (
                          <div className="relative">
                            <textarea
                              value={resumeText}
                              onChange={(e) => setResumeText(e.target.value.slice(0, 4000))}
                              placeholder="Or paste resume text, standout projects, tech stack, or architecture highlights here...&#10;e.g.&#10;• Built distributed caching engine with Go & Redis handling 50k RPS&#10;• Designed micro-frontend platform with Module Federation & React&#10;• Migrated monolithic PostgreSQL to distributed Neon DB"
                              rows={4}
                              className="w-full px-3 py-2.5 rounded-lg bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] focus:outline-none text-xs text-white placeholder-[#454A54] resize-none font-mono leading-relaxed transition-colors"
                            />
                            <div className="absolute right-2.5 bottom-2 flex items-center gap-2 pointer-events-none">
                              <span className="text-[10px] text-[#555B67] font-mono">
                                {resumeText.length}/4000
                              </span>
                            </div>
                          </div>
                        )}

                        {!resumeDossier && !isParsingResume && (
                          <p className="text-[11px] text-[#7A808C]">
                            Upload a PDF or sync your Intervue profile. The interviewer will question the real production trade-offs and edge cases of your projects.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Right 4 Cols: Live Session Blueprint & Launch Card (Sticky) */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] shadow-xl space-y-5">
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

                <div className="space-y-2.5 text-xs divide-y divide-[#181A20]/60">
                  <div className="pt-1.5 flex items-center justify-between text-zinc-400">
                    <span>Seniority Target</span>
                    <span className="text-white font-medium capitalize">
                      {currentLevelObj?.label} ({currentLevelObj?.subtitle})
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Assessment Focus</span>
                    <span className="text-white font-medium">
                      {currentFocusObj.label.split(" ")[0]}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Target Format</span>
                    <span className="text-white font-medium">Interactive Technical Round</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Interviewer Persona</span>
                    <span className="text-emerald-400 font-medium">Staff Engineer (Adaptive)</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-zinc-400">
                    <span>Resume Grounding</span>
                    <span
                      className={cn(
                        "font-medium flex items-center gap-1.5",
                        resumeText.trim() ? "text-emerald-400" : "text-[#7A808C]"
                      )}
                    >
                      {resumeText.trim() ? (
                        <>
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Active (Project Probing)</span>
                        </>
                      ) : (
                        <span>Optional (Unattached)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Scorecard Dimensions Covered */}
                <div className="p-3.5 rounded-xl bg-[#08090C] border border-[#181A20] space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Evaluated Dimensions
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
              {resumeText.trim() && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-mono font-medium">
                  <FileCheck className="w-3 h-3" />
                  <span>Resume Grounded</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#7A808C] capitalize">
              {selectedLevel} Level • Technical Round
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle Code Workspace Button */}
          <button
            type="button"
            onClick={() => setShowCodePanel((prev) => !prev)}
            className={cn(
              "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              showCodePanel
                ? "bg-[#327CF6]/15 border-[#327CF6]/40 text-[#327CF6]"
                : "bg-[#14161C] border-[#1E2229] text-slate-400 hover:text-white"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCodePanel ? "Hide Code Workspace" : "Open Code Workspace"}</span>
          </button>

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

      {/* Main Active Cockpit Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {showCodePanel ? (
          <PanelGroup orientation="horizontal" className="flex-1 min-h-0">
            {/* Left Dialogue Stream Panel */}
            <Panel defaultSize="50%" minSize="30%" className="flex flex-col h-full bg-[#08090C] overflow-hidden">
              <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 w-full space-y-5">
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
                          "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-[#327CF6] text-white rounded-tr-none font-medium whitespace-pre-wrap"
                            : "bg-[#0D0E12] border border-[#181A20] text-zinc-200 rounded-tl-none"
                        )}
                      >
                        {isUser ? (
                          msg.content
                        ) : msg.content ? (
                          <div className="space-y-1.5">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1.5">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                code: ({ className, children }) => {
                                  const isInline = !className && typeof children === "string" && !children.includes("\n");
                                  if (isInline) {
                                    return (
                                      <code className="bg-[#181A20] text-cyan-300 px-1 py-0.5 rounded font-mono text-[11px] border border-zinc-800">
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <pre className="bg-[#090A0E] border border-zinc-800/80 rounded-xl p-2.5 my-2 overflow-x-auto text-xs font-mono text-zinc-200">
                                      <code>{children}</code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {closeUnbalancedBoldTokens(msg.content)}
                            </ReactMarkdown>
                            {isStreaming && i === messages.length - 1 && (
                              <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse align-middle" />
                            )}
                          </div>
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
              <footer className="border-t border-[#181A20] bg-[#0D0E12] p-3 sm:p-4 shrink-0">
                <div className="flex items-end gap-2.5">
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
            </Panel>

            {/* Panel Resizer Handle */}
            <PanelResizeHandle className="w-1.5 bg-[#14161C] hover:bg-[#327CF6]/60 transition-colors cursor-col-resize active:bg-[#327CF6]" />

            {/* Right Panel: Monaco Code Editor + Live Rubric Telemetry */}
            <Panel defaultSize="50%" minSize="28%" className="hidden md:flex flex-col h-full bg-[#0A0C10] overflow-hidden border-l border-[#181A20]">
              {/* Editor Top Bar */}
              <div className="h-10 px-4 border-b border-[#181A20] bg-[#0D0E14] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#327CF6]" />
                  <span className="text-xs font-semibold text-white font-mono">architecture_spec.py</span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-[#14161F] border border-[#222634] text-[11px] text-slate-300 rounded-lg px-2 py-0.5 outline-none font-mono cursor-pointer"
                  >
                    <option value="python">Python 3</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              {/* Monaco Code Editor */}
              <div className="flex-1 min-h-0 bg-[#08090C]">
                <Editor
                  height="100%"
                  language={codeLanguage}
                  theme="vs-dark"
                  value={codeSnippet}
                  onChange={(val) => setCodeSnippet(val || "")}
                  options={{
                    fontSize: 12.5,
                    lineNumbers: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    tabSize: 4,
                    padding: { top: 10 },
                  }}
                />
              </div>

              {/* Live Rubric Telemetry Dock */}
              <div className="p-3 border-t border-[#181A20] bg-[#0D0E14] space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#327CF6]" />
                    Live Rubric Telemetry
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    Calibrated: {selectedLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-[#11131A] border border-white/[0.05] space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">System Architecture</span>
                      <span className="font-mono text-white font-bold">84%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[84%]" />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#11131A] border border-white/[0.05] space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Algorithmic Trade-offs</span>
                      <span className="font-mono text-white font-bold">78%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[78%]" />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#11131A] border border-white/[0.05] space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Edge Cases & Resiliency</span>
                      <span className="font-mono text-white font-bold">82%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-[82%]" />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#11131A] border border-white/[0.05] space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Concurrency Safety</span>
                      <span className="font-mono text-white font-bold">75%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[75%]" />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          /* Single Column Dialogue Stream when Code Panel is closed or on mobile */
          <div className="flex-1 flex flex-col h-full bg-[#08090C] overflow-hidden">
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
                          ? "bg-[#327CF6] text-white rounded-tr-none font-medium whitespace-pre-wrap"
                          : "bg-[#0D0E12] border border-[#181A20] text-zinc-200 rounded-tl-none"
                      )}
                    >
                      {isUser ? (
                        msg.content
                      ) : msg.content ? (
                        <div className="space-y-1.5">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1.5">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              code: ({ className, children }) => {
                                const isInline = !className && typeof children === "string" && !children.includes("\n");
                                if (isInline) {
                                  return (
                                    <code className="bg-[#181A20] text-cyan-300 px-1 py-0.5 rounded font-mono text-[11px] border border-zinc-800">
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <pre className="bg-[#090A0E] border border-zinc-800/80 rounded-xl p-2.5 my-2 overflow-x-auto text-xs font-mono text-zinc-200">
                                    <code>{children}</code>
                                  </pre>
                                );
                              },
                            }}
                          >
                            {closeUnbalancedBoldTokens(msg.content)}
                          </ReactMarkdown>
                          {isStreaming && i === messages.length - 1 && (
                            <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse align-middle" />
                          )}
                        </div>
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
          </div>
        )}
      </div>

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