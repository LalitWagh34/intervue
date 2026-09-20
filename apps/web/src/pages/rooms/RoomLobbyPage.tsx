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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  // Initialize real-time WebSocket connection
  const { isConnected, participants: socketParticipants, roomStatus } = useRoomSocket({
    roomCode: code,
    user: session?.user,
    onContestStart: () => {
      navigate(`/rooms/${code}/arena`);
    },
  });

  // Fetch full room data
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await api.get(`/rooms/${code}`);
        const data = res.data.room;
        setRoom(data);

        // If contest is already active, navigate to arena directly
        if (data.status === "ACTIVE") {
          navigate(`/rooms/${code}/arena`);
        } else if (data.status === "FINISHED") {
          navigate(`/rooms/${code}/results`);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error || "Failed to load room");
        navigate("/rooms");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoom();
  }, [code, navigate]);

  // If status changes to ACTIVE from socket, navigate
  useEffect(() => {
    if (roomStatus === "ACTIVE" && code) {
      navigate(`/rooms/${code}/arena`);
    }
  }, [roomStatus, code, navigate]);

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
      await api.post(`/rooms/${code}/start`);
      toast.success("Starting contest...");
      navigate(`/rooms/${code}/arena`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to start contest");
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span className="text-sm font-medium">Entering Lobby...</span>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Merge socket participants with initial participants
  const displayParticipants =
    socketParticipants.length > 0 ? socketParticipants : room.participants;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/rooms")}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            ← Back to Arena
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-zinc-400 font-mono">
              {isConnected ? "Live Socket Sync" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Room Header Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white tracking-tight">
                  {room.title}
                </h1>
                <Badge variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300 text-xs">
                  {room.type}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Lobby waiting room • Duration: <span className="text-zinc-200">{room.duration} minutes</span> • Max participants: <span className="text-zinc-200">{room.maxParticipants}</span>
              </p>
            </div>

            {/* Room Code Pill */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Code:</span>
              <span className="font-mono text-base font-bold tracking-widest text-white">
                {room.code}
              </span>
              <button
                onClick={copyInvite}
                className="p-1 text-zinc-400 hover:text-white transition-colors ml-1"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Question Summary Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>{room.questions.length} Questions Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Server-Authoritative Timer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              <span>Deterministic Standings</span>
            </div>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              Participants ({displayParticipants.length} / {room.maxParticipants})
            </h2>
            <span className="text-xs text-zinc-500">
              Share code <strong className="text-zinc-300 font-mono">{room.code}</strong> with your friends
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
                      ? "bg-zinc-900 border-zinc-700/80 shadow-sm"
                      : "bg-zinc-900/40 border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image ? (
                      <img src={p.image} className="w-8 h-8 rounded-full border border-zinc-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-200">
                        {p.name?.[0] || "U"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate flex items-center gap-1">
                        {p.name}
                        {isMe && <span className="text-[10px] text-zinc-500">(You)</span>}
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono">Ready</span>
                    </div>
                  </div>

                  {isHostUser && (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] flex items-center gap-1">
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
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {room.isHost ? (
            <>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-medium text-white">
                  You are the Host
                </h3>
                <p className="text-xs text-zinc-400">
                  When everyone has joined, start the contest. All screens will transition simultaneously.
                </p>
              </div>
              <Button
                onClick={handleStartContest}
                disabled={isStarting}
                className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium px-8 shrink-0 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-zinc-900" />
                {isStarting ? "Starting..." : "Start Contest"}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-zinc-400">
                Waiting for the host to start the contest. Please do not close this tab.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
