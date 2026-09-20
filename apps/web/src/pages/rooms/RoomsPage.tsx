import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
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
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60">
                <Swords className="w-5 h-5 text-zinc-200" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Battle Arena
              </h1>
              <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300 text-xs">
                Real-Time
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              Host or join live assessment rooms for timed competitive coding and core placement tests.
            </p>
          </div>

          <Button
            onClick={() => {
              setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
              setIsCreateOpen(true);
            }}
            className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Room
          </Button>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Join with Code Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                <Hash className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Join with Room Code</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Have a 6-character code from a friend or host? Enter it below to join the lobby.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinByCode} className="mt-6 flex gap-2.5">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="e.g. K9X2P4"
                className="bg-zinc-950 border-zinc-800 font-mono tracking-widest text-center text-lg font-semibold uppercase text-white focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              />
              <Button
                type="submit"
                disabled={joinCode.trim().length !== 6 || isJoining}
                className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-6 shrink-0"
              >
                {isJoining ? "Joining..." : "Enter Room"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>

          {/* Quick Host Room Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                <Users className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Host a Competition</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Configure custom topics (DSA, DBMS, OS, Aptitude), set strict time limits, and share your room code.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/80">
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  15 - 90 mins
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                  Judge0 Tested
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setTitle("Placement Contest #" + Math.floor(100 + Math.random() * 900));
                  setIsCreateOpen(true);
                }}
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white"
              >
                Configure
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            System Guarantees
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Clock className="w-4 h-4 text-zinc-400" />
                Server-Authoritative Timer
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Countdown times are strictly synchronized with the backend. Submissions close automatically when the timer reaches zero.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Brain className="w-4 h-4 text-zinc-400" />
                Deterministic Scoring
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Scores and tie-breakers are calculated mathematically using testcase verdicts and submission timestamps.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                Live Standings
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Real-time WebSocket events update leaderboards and solve feeds instantly across all participants without page reloads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Create Assessment Room
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Set up your contest format, problem topics, and duration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-6 pt-2">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Room Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SDE Placement Mock Test"
                className="bg-zinc-900 border-zinc-800 text-white"
                required
              />
            </div>

            {/* Room Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Assessment Format</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setType("CODING")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                    type === "CODING"
                      ? "bg-zinc-800 border-zinc-600 text-white shadow-sm"
                      : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Code2 className="w-4 h-4 mb-1.5" />
                  <span className="text-xs font-medium">Coding Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("APTITUDE")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                    type === "APTITUDE"
                      ? "bg-zinc-800 border-zinc-600 text-white shadow-sm"
                      : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Brain className="w-4 h-4 mb-1.5" />
                  <span className="text-xs font-medium">Core CS / Aptitude</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("MIXED")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                    type === "MIXED"
                      ? "bg-zinc-800 border-zinc-600 text-white shadow-sm"
                      : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Layers className="w-4 h-4 mb-1.5" />
                  <span className="text-xs font-medium">Full Mixed Test</span>
                </button>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-zinc-300">Contest Duration</label>
                <span className="text-zinc-400 font-mono">{duration} minutes</span>
              </div>
              <div className="flex gap-2">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-all ${
                      duration === mins
                        ? "bg-zinc-800 border-zinc-600 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Filter for Coding */}
            {(type === "CODING" || type === "MIXED") && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-zinc-300">Coding DSA Topics</label>
                  <span className="text-[11px] text-zinc-500">
                    {selectedCodingTags.length === 0 ? "Any topics" : `${selectedCodingTags.length} selected`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-zinc-800 rounded-md bg-zinc-900/50">
                  {metaTopics.codingTags.length === 0 ? (
                    <span className="text-xs text-zinc-500 p-1">All published problems</span>
                  ) : (
                    metaTopics.codingTags.map((tag) => {
                      const isSelected = selectedCodingTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleCodingTag(tag)}
                          className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                            isSelected
                              ? "bg-zinc-800 border-zinc-600 text-white"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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

            {/* Subjects Filter for Aptitude / Core CS */}
            {(type === "APTITUDE" || type === "MIXED") && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-zinc-300">Core Subjects & Aptitude</label>
                  <span className="text-[11px] text-zinc-500">
                    {selectedSubjects.length === 0 ? "All subjects" : `${selectedSubjects.length} selected`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-1 border border-zinc-800 rounded-md bg-zinc-900/50">
                  {[...metaTopics.coreCsSubjects, ...metaTopics.aptitudeSubjects].map((sub) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                          isSelected
                            ? "bg-zinc-800 border-zinc-600 text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium px-6"
              >
                {isCreating ? "Creating Room..." : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
