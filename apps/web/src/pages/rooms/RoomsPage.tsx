import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Users,
  Clock,
  Code2,
  Brain,
  Layers,
  ArrowRight,
  Plus,
  Hash,
  Check,
  Sparkles,
  Shield,
  Zap,
  Trophy,
  CheckCircle2,
  X,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RoomType = "CODING" | "APTITUDE" | "MIXED";

interface MetaTopics {
  codingTags: string[];
  coreCsSubjects: string[];
  aptitudeSubjects: string[];
}

export default function RoomsPage() {
  const navigate = useNavigate();

  // Join by code state
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Create room modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [metaTopics, setMetaTopics] = useState<MetaTopics>({
    codingTags: [],
    coreCsSubjects: [],
    aptitudeSubjects: [],
  });

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RoomType>("CODING");
  const [duration, setDuration] = useState(45);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [codingCount, setCodingCount] = useState(2);
  const [assessmentCount, setAssessmentCount] = useState(10);
  const [selectedCodingTags, setSelectedCodingTags] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Fetch available tags/subjects for room configuration
  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await api.get("/rooms/meta/topics");
        setMetaTopics(res.data);
      } catch (err) {
        console.error("Failed to load topics:", err);
      }
    }
    fetchTopics();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a 6-character room code");
      return;
    }

    setIsJoining(true);
    try {
      const res = await api.post("/rooms/join", { code });
      toast.success("Joined room successfully");
      navigate(`/rooms/${res.data.roomCode}/lobby`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a room title");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        duration,
        maxParticipants,
        codingCount: type !== "APTITUDE" ? codingCount : 0,
        assessmentCount: type !== "CODING" ? assessmentCount : 0,
        codingTags: selectedCodingTags,
        assessmentSubjects: selectedSubjects,
      };

      const res = await api.post("/rooms", payload);
      toast.success("Room created successfully!");
      setIsCreateOpen(false);
      navigate(`/rooms/${res.data.room.code}/lobby`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCodingTag = (tag: string) => {
    setSelectedCodingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 p-6 md:p-10 selection:bg-blue-600/30">
      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Swords className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Contest Battle Arena
                </h1>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live System
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-xl">
              Host or compete in real-time synchronized coding rounds and placement test assessments with anti-cheat proctoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
                setIsCreateOpen(true);
              }}
              className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.35)] transition-all duration-300"
            >
              <div className="flex items-center gap-2 relative z-10">
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                <span>Create Room</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Join with Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative rounded-2xl bg-[#0D0F14]/90 border border-zinc-800/90 p-7 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(59,130,246,0.12)] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Hash className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  Join with Room Code
                  <span className="text-xs font-mono font-normal text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                    Instant
                  </span>
                </h2>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  Have a 6-character room code from your host, peer, or institution? Enter it below to immediately enter the staging lobby.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinByCode} className="mt-8 space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="e.g. K9X2P4"
                    className="h-12 bg-black/50 border-zinc-800 focus:border-blue-500 font-mono tracking-widest text-center text-lg font-bold uppercase text-white rounded-xl placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                  />
                  {joinCode.length === 6 && (
                    <div className="absolute right-3 top-3.5 text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={joinCode.trim().length !== 6 || isJoining}
                  className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium border border-blue-400/20 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all shrink-0 disabled:opacity-50"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enter
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Host a Competition Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="group relative rounded-2xl bg-[#0D0F14]/90 border border-zinc-800/90 p-7 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-[0_0_35px_rgba(6,182,212,0.12)] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  Host a Competition
                  <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                    Customizable
                  </span>
                </h2>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  Design custom timed contests choosing from DSA coding tracks, Core CS (DBMS, OS, CN), or Aptitude with automated scoring.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  15 - 90 mins
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  Judge0 Tested
                </span>
              </div>

              <Button
                onClick={() => {
                  setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
                  setIsCreateOpen(true);
                }}
                className="h-11 px-5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-medium border border-zinc-700/80 hover:border-cyan-500/40 shadow-sm transition-all"
              >
                Configure Arena →
              </Button>
            </div>
          </motion.div>
        </div>

        {/* System Highlights */}
        <div className="relative rounded-2xl bg-[#0D0F14]/70 border border-zinc-800/80 p-6 md:p-8 overflow-hidden">
          <div className="flex items-center justify-between pb-5 border-b border-zinc-800/60 mb-6">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Contest Engine Architecture
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Deterministic & Anti-Cheat Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Clock className="w-4 h-4" />
                </div>
                Authoritative Server Clock
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Countdown times and cutoff events are synchronized directly via server websockets. Tests lock automatically when timer expires.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Brain className="w-4 h-4" />
                </div>
                Proctoring & Anti-Cheat
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Active tab-switch and window-blur monitors provide 3-strike warnings to enforce fair competitive conditions for all participants.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                Live Leaderboard Standings
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time solve feeds and rank adjustments calculate points and tiebreakers instantly without manual page refreshes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CREATE ROOM MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1116] border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-zinc-100 p-6 md:p-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Create Assessment Room
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Configure your contest format, problem topics, and duration.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateRoom} className="space-y-6 pt-5">
                {/* Room Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Room Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SDE Placement Mock Test"
                    className="h-11 bg-black/50 border-zinc-800 focus:border-blue-500 text-white rounded-xl"
                    required
                  />
                </div>

                {/* Assessment Format Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Assessment Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("CODING")}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                        type === "CODING"
                          ? "bg-blue-500/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <Code2
                        className={`w-5 h-5 mb-2 ${
                          type === "CODING" ? "text-blue-400" : "text-zinc-400"
                        }`}
                      />
                      <span className="text-xs font-medium">Coding Only</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">DSA Problems</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType("APTITUDE")}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                        type === "APTITUDE"
                          ? "bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <Brain
                        className={`w-5 h-5 mb-2 ${
                          type === "APTITUDE" ? "text-cyan-400" : "text-zinc-400"
                        }`}
                      />
                      <span className="text-xs font-medium">Core CS / Apti</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">MCQ Assessment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType("MIXED")}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                        type === "MIXED"
                          ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <Layers
                        className={`w-5 h-5 mb-2 ${
                          type === "MIXED" ? "text-indigo-400" : "text-zinc-400"
                        }`}
                      />
                      <span className="text-xs font-medium">Full Mixed</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">Coding + MCQs</span>
                    </button>
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold uppercase tracking-wider text-zinc-300">
                      Contest Duration
                    </label>
                    <span className="text-blue-400 font-mono font-semibold">
                      {duration} minutes
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-2 rounded-xl border text-xs font-semibold font-mono transition-all ${
                          duration === mins
                            ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coding Topics Filter */}
                {(type === "CODING" || type === "MIXED") && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold uppercase tracking-wider text-zinc-300">
                        Coding DSA Topics
                      </label>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {selectedCodingTags.length === 0
                          ? "All topics included"
                          : `${selectedCodingTags.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border border-zinc-800 rounded-xl bg-black/40">
                      {metaTopics.codingTags.length === 0 ? (
                        <span className="text-xs text-zinc-500 p-1">
                          All published problems
                        </span>
                      ) : (
                        metaTopics.codingTags.map((tag) => {
                          const isSelected = selectedCodingTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleCodingTag(tag)}
                              className={`text-[11px] px-3 py-1 rounded-lg border transition-all ${
                                isSelected
                                  ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-medium"
                                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Core Subjects Filter */}
                {(type === "APTITUDE" || type === "MIXED") && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold uppercase tracking-wider text-zinc-300">
                        Core Subjects & Aptitude
                      </label>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {selectedSubjects.length === 0
                          ? "All subjects included"
                          : `${selectedSubjects.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-800 rounded-xl bg-black/40">
                      {[...metaTopics.coreCsSubjects, ...metaTopics.aptitudeSubjects].map((sub) => {
                        const isSelected = selectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubject(sub)}
                            className={`text-[11px] px-3 py-1 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-medium"
                                : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-zinc-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
                  >
                    {isCreating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Room...
                      </span>
                    ) : (
                      "Create Contest Room"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
