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
  const [type, setType] = useState<RoomType>("APTITUDE"); // V1 defaults to MCQ
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
      const payload: any = {
        title: title.trim(),
        type,
        duration: Number(duration),
        maxParticipants: Number(maxParticipants),
        allowLateJoin: true,
      };

      if (type === "CODING" || type === "MIXED") {
        payload.codingCount = Number(codingCount) || 2;
        if (selectedCodingTags.length > 0) payload.codingTags = selectedCodingTags;
      }

      if (type === "APTITUDE" || type === "MIXED") {
        payload.assessmentCount = Number(assessmentCount) || 10;
        if (selectedSubjects.length > 0) payload.assessmentSubjects = selectedSubjects;
      }

      const res = await api.post("/rooms", payload);
      toast.success("Room created successfully!");
      setIsCreateOpen(false);
      navigate(`/rooms/${res.data.room.code}/lobby`);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.details?.[0]?.message ||
        err?.response?.data?.error ||
        "Failed to create room";
      toast.error(errMsg);
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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] p-6 md:p-10 selection:bg-[var(--surface-selected)]">
      <div className="relative z-10 max-w-6xl mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-control)] text-[var(--accent-text)]">
                <Swords className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Contest Battle Arena
                </h1>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--status-success-subtle)] border border-[var(--border-subtle)] text-[var(--status-success)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
                  Live System
                </span>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-xl">
              Host or compete in real-time synchronized coding rounds and placement test assessments with anti-cheat proctoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
                setIsCreateOpen(true);
              }}
              className="relative group overflow-hidden bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all duration-300"
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
            className="group relative rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-7 flex flex-col justify-between hover:border-[var(--border-control)] shadow-sm transition-all duration-300 overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-control)] flex items-center justify-center text-[var(--accent-text)] group-hover:scale-105 transition-transform duration-300">
                <Hash className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  Join with Room Code
                  <span className="text-xs font-mono font-normal text-[var(--accent-text)] bg-[var(--surface-selected)] border border-[var(--border-control)] px-2 py-0.5 rounded-md">
                    Instant
                  </span>
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
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
                    className="h-12 bg-[var(--surface-muted)] border-[var(--border-control)] focus:border-[var(--action-primary)] font-mono tracking-widest text-center text-lg font-bold uppercase text-[var(--text-primary)] rounded-xl placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--surface-selected)] shadow-inner"
                  />
                  {joinCode.length === 6 && (
                    <div className="absolute right-3 top-3.5 text-[var(--status-success)]">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={joinCode.trim().length !== 6 || isJoining}
                  className="h-12 px-6 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-medium transition-all shrink-0 disabled:opacity-50"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
            className="group relative rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-7 flex flex-col justify-between hover:border-[var(--border-control)] shadow-sm transition-all duration-300 overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-control)] flex items-center justify-center text-[var(--accent-text)] group-hover:scale-105 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  Host a Competition
                  <span className="text-xs font-mono font-normal text-[var(--accent-text)] bg-[var(--surface-selected)] border border-[var(--border-control)] px-2 py-0.5 rounded-md">
                    Customizable
                  </span>
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Design custom timed contests choosing from DSA coding tracks, Core CS (DBMS, OS, CN), or Aptitude with automated scoring.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  15 - 90 mins
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  Judge0 Tested
                </span>
              </div>

              <Button
                onClick={() => {
                  setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
                  setIsCreateOpen(true);
                }}
                className="h-11 px-5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium border border-[var(--border-control)] shadow-sm transition-all"
              >
                Configure Arena →
              </Button>
            </div>
          </motion.div>
        </div>

        {/* System Highlights */}
        <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-6 md:p-8 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)] mb-6">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[var(--accent-text)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Contest Engine Architecture
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Deterministic & Anti-Cheat Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2 p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-medium">
                <div className="p-1.5 rounded-lg bg-[var(--surface-selected)] border border-[var(--border-control)] text-[var(--accent-text)]">
                  <Clock className="w-4 h-4" />
                </div>
                Authoritative Server Clock
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Countdown times and cutoff events are synchronized directly via server websockets. Tests lock automatically when timer expires.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-medium">
                <div className="p-1.5 rounded-lg bg-[var(--surface-selected)] border border-[var(--border-control)] text-[var(--accent-text)]">
                  <Brain className="w-4 h-4" />
                </div>
                Proctoring & Anti-Cheat
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Active tab-switch and window-blur monitors provide 3-strike warnings to enforce fair competitive conditions for all participants.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-medium">
                <div className="p-1.5 rounded-lg bg-[var(--status-warning-subtle)] border border-[var(--border-subtle)] text-[var(--status-warning)]">
                  <Trophy className="w-4 h-4" />
                </div>
                Live Leaderboard Standings
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Real-time solve feeds and rank adjustments calculate points and tiebreakers instantly without manual page refreshes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CREATE ROOM MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-2xl text-[var(--text-primary)] p-6 md:p-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--surface-selected)] border border-[var(--border-control)] text-[var(--accent-text)]">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      Create Assessment Room
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Configure your contest format, problem topics, and duration.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateRoom} className="space-y-6 pt-5">
                {/* Room Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Room Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SDE Placement Mock Test"
                    className="h-11 bg-[var(--surface-muted)] border-[var(--border-control)] focus:border-[var(--action-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                    required
                  />
                </div>

                {/* Assessment Format Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Assessment Format
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("APTITUDE")}
                      className="flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all bg-[var(--surface-selected)] border-[var(--action-primary)] text-[var(--text-primary)] shadow-sm"
                    >
                      <Brain className="w-5 h-5 mb-2 text-[var(--accent-text)]" />
                      <span className="text-xs font-medium">MCQ Battles</span>
                      <span className="text-[10px] text-[var(--accent-text)] mt-0.5">Core CS & Aptitude</span>
                    </button>
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Contest Duration
                    </label>
                    <span className="text-[var(--accent-text)] font-mono font-semibold">
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
                            ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-[var(--on-primary)] shadow-sm"
                            : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-control)]"
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
                      <label className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                        Coding DSA Topics
                      </label>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {selectedCodingTags.length === 0
                          ? "All topics included"
                          : `${selectedCodingTags.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--surface-muted)]">
                      {metaTopics.codingTags.length === 0 ? (
                        <span className="text-xs text-[var(--text-muted)] p-1">
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
                                  ? "bg-[var(--surface-selected)] border-[var(--action-primary)] text-[var(--accent-text)] font-medium"
                                  : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
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
                      <label className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                        Core Subjects & Aptitude
                      </label>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {selectedSubjects.length === 0
                          ? "All subjects included"
                          : `${selectedSubjects.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--surface-muted)]">
                      {[...metaTopics.coreCsSubjects, ...metaTopics.aptitudeSubjects].map((sub) => {
                        const isSelected = selectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubject(sub)}
                            className={`text-[11px] px-3 py-1 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-[var(--surface-selected)] border-[var(--action-primary)] text-[var(--accent-text)] font-medium"
                                : "bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
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
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-medium px-6 rounded-xl shadow-sm transition-all"
                  >
                    {isCreating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
