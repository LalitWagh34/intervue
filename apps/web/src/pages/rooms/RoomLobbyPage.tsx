import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { toast } from "sonner";
import {
  Users,
  Clock,
  Code2,
  Brain,
  Layers,
  Copy,
  Check,
  Play,
  LogOut,
  Crown,
  Wifi,
  Sparkles,
  Shield,
  Swords,
  ShieldAlert,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExamInstructionsGate } from "@/components/exam/ExamInstructionsGate";

interface RoomDetails {
  id: string;
  code: string;
  title: string;
  type: "CODING" | "APTITUDE" | "MIXED";
  status: "WAITING" | "ACTIVE" | "FINISHED";
  duration: number;
  maxParticipants: number;
  hostId: string;
  isHost: boolean;
  participants: Array<{
    id: string;
    userId: string;
    name: string;
    image?: string | null;
    role: "HOST" | "PARTICIPANT";
    score: number;
  }>;
  questions: Array<{
    id: string;
    orderIndex: number;
    points: number;
    type: "CODING" | "MCQ";
    problem?: { title: string; difficulty: string };
    assessmentQuestion?: { subject: string; topic: string; difficulty: string };
  }>;
}

export default function RoomLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [unjoinedRoom, setUnjoinedRoom] = useState<any>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Initialize real-time WebSocket connection only if user is authorized
  const isAuthorized = !!room && !unjoinedRoom;
  const { isConnected, participants: socketParticipants, roomStatus } = useRoomSocket({
    roomCode: isAuthorized ? code : undefined,
    user: session?.user,
    onContestStart: () => {
      navigate(`/rooms/${code}/arena`);
    },
  });

  // Fetch full room data
  const loadRoom = async () => {
    try {
      const res = await api.get(`/rooms/${code}`);
      const data = res.data.room;

      if (res.data.requiresJoin || data.isParticipant === false) {
        setUnjoinedRoom(data);
        return;
      }

      setUnjoinedRoom(null);
      setRoom(data);

      // If contest is already active, navigate to arena directly
      if (data.status === "ACTIVE") {
        navigate(`/rooms/${code}/arena`);
      } else if (data.status === "FINISHED") {
        navigate(`/rooms/${code}/results`);
      }
    } catch (err: any) {
      if (err?.response?.data?.requiresJoin && err?.response?.data?.room) {
        setUnjoinedRoom(err.response.data.room);
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to load room");
      navigate("/rooms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoom();
  }, [code, navigate]);

  // Handle explicit join action
  const handleJoinContest = async () => {
    if (!code) return;
    setIsJoiningRoom(true);
    try {
      await api.post("/rooms/join", { code });
      toast.success("Joined room successfully!");
      await loadRoom();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to join room");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // If status changes to ACTIVE from socket, navigate
  useEffect(() => {
    if (roomStatus === "ACTIVE" && code && !unjoinedRoom) {
      navigate(`/rooms/${code}/arena`);
    }
  }, [roomStatus, code, navigate, unjoinedRoom]);

  // Fallback sync polling: poll every 3 seconds while waiting to ensure synchronous start even if WS packets drop
  useEffect(() => {
    if (!code || roomStatus === "ACTIVE" || unjoinedRoom) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/rooms/${code}`);
        const currentStatus = res.data?.room?.status;
        if (currentStatus === "ACTIVE") {
          navigate(`/rooms/${code}/arena`);
        } else if (res.data?.room?.participants) {
          setRoom(res.data.room);
        }
      } catch (_) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [code, roomStatus, navigate, unjoinedRoom]);

  const copyInvite = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    toast.success("Room code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartContest = async () => {
    if (!code) return;
    setIsStarting(true);
    try {
      const res = await api.post(`/rooms/${code}/start`);
      toast.success("Starting contest...", { duration: 2500 });
      navigate(`/rooms/${code}/arena`);
    } catch (err: any) {
      if (err?.response?.data?.status === "ACTIVE" || roomStatus === "ACTIVE") {
        navigate(`/rooms/${code}/arena`);
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to start contest");
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-ping" />
          <span className="text-sm font-medium">Entering Lobby...</span>
        </div>
      </div>
    );
  }

  if (unjoinedRoom) {
    const isLive = unjoinedRoom.status === "ACTIVE";
    const allowLateJoin = unjoinedRoom.allowLateJoin !== false;

    return (
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] flex items-center justify-center p-6 selection:bg-[var(--surface-selected)]">
        <div className="max-w-md w-full rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--action-primary)]/20 text-[var(--accent-text)]">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-text)] font-semibold">Contest Invitation</span>
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{unjoinedRoom.title}</h1>
            </div>
          </div>

          <div className="space-y-3 py-2 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Room Code</span>
              <span className="font-mono font-bold text-[var(--text-primary)] tracking-wider">{unjoinedRoom.code}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Host</span>
              <span className="font-medium text-[var(--text-primary)]">{unjoinedRoom.host?.name || "Host"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Format & Duration</span>
              <span className="font-medium text-[var(--text-primary)]">{unjoinedRoom.type} • {unjoinedRoom.duration} mins</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Contest Status</span>
              <span className={`font-mono font-semibold ${isLive ? "text-[var(--status-success)]" : "text-[var(--status-warning)]"}`}>
                {isLive ? "● LIVE IN PROGRESS" : "Waiting for Host"}
              </span>
            </div>
          </div>

          {isLive && !allowLateJoin ? (
            <div className="p-3.5 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 text-xs text-[var(--status-danger)]">
              This contest has already started and late joining has been locked by the host.
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              You are not a registered participant in this room yet. Click below to join this contest session.
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/rooms")}
              className="flex-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
            >
              Back to Hub
            </Button>
            {(!isLive || allowLateJoin) && (
              <Button
                onClick={handleJoinContest}
                disabled={isJoiningRoom}
                className="flex-1 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-semibold rounded-xl shadow-sm transition-all"
              >
                {isJoiningRoom ? "Joining..." : "Join Contest Room"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Merge socket participants with initial participants, deduplicated by userId
  const participantMap = new Map<string, any>();
  if (room?.participants) {
    for (const p of room.participants) {
      participantMap.set(p.userId, p);
    }
  }
  if (socketParticipants) {
    for (const p of socketParticipants) {
      const existing = participantMap.get(p.userId) || {};
      participantMap.set(p.userId, { ...existing, ...p });
    }
  }
  const displayParticipants = Array.from(participantMap.values());

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/rooms")}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Arena
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
              }`}
            />
            <span className="text-[var(--text-secondary)] font-mono">
              {isConnected ? "Live Socket Sync" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Room Header Card */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  {room.title}
                </h1>
                <Badge variant="outline" className="border-[var(--border-control)] bg-[var(--surface-muted)] text-[var(--text-secondary)] text-xs">
                  {room.type}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Lobby waiting room • Duration: <span className="text-[var(--text-primary)] font-medium">{room.duration} minutes</span> • Max participants: <span className="text-[var(--text-primary)] font-medium">{room.maxParticipants}</span>
              </p>
            </div>

            {/* Room Code Pill */}
            <div className="flex items-center gap-2 bg-[var(--surface-muted)] border border-[var(--border-subtle)] px-4 py-2 rounded-lg">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">Code:</span>
              <span className="font-mono text-base font-bold tracking-widest text-[var(--text-primary)]">
                {room.code}
              </span>
              <button
                onClick={copyInvite}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-1 cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--status-success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Question Summary Bar */}
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{room.questions.length} Questions Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Server-Authoritative Timer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Deterministic Standings</span>
            </div>
          </div>
        </div>

        {/* Pre-Exam Rules & Disclaimer Notice Card */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--surface-muted)] text-[var(--text-secondary)] shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Examination Instructions & Anti-Cheat Disclaimers</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  Strict 3 Strikes
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Review workspace layout, tab-switch penalty disclaimers, and spectator rules before entering.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsRulesModalOpen(true)}
            className="w-full sm:w-auto bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Read Exam Rules</span>
          </Button>
        </div>

        {/* Participants Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-muted)]" />
              Participants ({displayParticipants.length} / {room.maxParticipants})
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              Share code <strong className="text-[var(--text-primary)] font-mono">{room.code}</strong> with your friends
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {displayParticipants.map((p) => {
              const isHostUser = p.role === "HOST";
              const isMe = p.userId === session?.user?.id;

              return (
                <div
                  key={p.userId}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isMe
                      ? "bg-[var(--surface)] border-[var(--border-control)] shadow-sm"
                      : "bg-[var(--surface)]/80 border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image ? (
                      <img src={p.image} className="w-8 h-8 rounded-full border border-[var(--border-subtle)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-primary)]">
                        {p.name?.[0] || "U"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate flex items-center gap-1">
                        {p.name}
                        {isMe && <span className="text-[10px] text-[var(--text-muted)]">(You)</span>}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Ready</span>
                    </div>
                  </div>

                  {isHostUser && (
                    <Badge variant="outline" className="border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)] text-[10px] flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Host
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Control / Waiting Banner */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          {room.isHost ? (
            <>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  You are the Host
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  When everyone has joined, start the contest. All screens will transition simultaneously.
                </p>
              </div>
              <Button
                onClick={handleStartContest}
                disabled={isStarting}
                className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-semibold px-8 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {isStarting ? "Starting..." : "Start Contest"}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--status-warning)] animate-pulse" />
              <span className="text-xs text-[var(--text-secondary)]">
                Waiting for the host to start the contest. Please do not close this tab.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── PRE-EXAM RULES & GUIDELINES PREVIEW MODAL ──────────────── */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--overlay-scrim)] backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col relative shadow-2xl my-auto overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface-elevated)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Examination Rules, Layout & Anti-Cheat Guidelines
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsRulesModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-8 px-2 rounded-lg cursor-pointer"
              >
                ✕ Close
              </Button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <ExamInstructionsGate
                room={room}
                candidateName={session?.user?.name || "Candidate"}
                candidateEmail={session?.user?.email || ""}
                isModalView={true}
                onAcceptAndEnter={() => {
                  if (code) {
                    sessionStorage.setItem(`intervue_exam_rules_agreed_${code}`, "true");
                  }
                  toast.success("Guidelines acknowledged! You are cleared for the examination.");
                  setIsRulesModalOpen(false);
                }}
                onCancel={() => setIsRulesModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
