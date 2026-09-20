import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

export interface Participant {
  rank?: number;
  participantId: string;
  userId: string;
  name: string;
  image?: string | null;
  role: string;
  score: number;
  solvedCount: number;
  penaltyTime: number;
  isSelf?: boolean;
}

export interface ActivityEvent {
  userId: string;
  userName: string;
  userImage?: string | null;
  problemTitle: string;
  isAccepted: boolean;
  pointsAwarded: number;
  timestamp: number;
}

interface UseRoomSocketProps {
  roomCode?: string;
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
  onContestStart?: (data: { startTime: string; endTime: string; durationSeconds: number }) => void;
  onContestEnd?: (finalLeaderboard: Participant[]) => void;
}

export function useRoomSocket({ roomCode, user, onContestStart, onContestEnd }: UseRoomSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [roomStatus, setRoomStatus] = useState<"WAITING" | "ACTIVE" | "FINISHED">("WAITING");
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!roomCode || !user?.id) return;

    // Use current host or default backend ws port
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const wsUrl = `${protocol}//${host}:3000/ws/rooms`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Send join event
        ws.send(
          JSON.stringify({
            event: "room:join",
            data: {
              roomCode: roomCode.toUpperCase(),
              userId: user.id,
              name: user.name || "Anonymous",
              image: user.image,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;

          switch (eventName) {
            case "room:sync":
              setRoomStatus(data.status);
              setParticipants(data.participants || []);
              if (data.remainingSeconds !== undefined) {
                setRemainingSeconds(data.remainingSeconds);
              }
              break;

            case "participant:joined":
              toast.info(`${data.name} joined the room`, {
                description: `${data.totalConnected} participants now present`,
              });
              break;

            case "participant:left":
              // Sync will update roster
              break;

            case "contest:started":
              setRoomStatus("ACTIVE");
              toast.success("Contest Started!", {
                description: "The timer is now ticking. Good luck!",
              });
              onContestStart?.(data);
              break;

            case "submission:activity":
              const activity: ActivityEvent = {
                ...data,
                timestamp: Date.now(),
              };
              setRecentActivities((prev) => [activity, ...prev.slice(0, 19)]);
              if (data.isAccepted) {
                toast.success(`🚀 ${data.userName} solved ${data.problemTitle}! (+${data.pointsAwarded} pts)`, {
                  duration: 4000,
                });
              }
              break;

            case "leaderboard:update":
              if (data.leaderboard) {
                setParticipants(data.leaderboard);
              }
              if (data.status) {
                setRoomStatus(data.status);
              }
              break;

            case "contest:time_sync":
              if (data.remainingSeconds !== undefined) {
                setRemainingSeconds(data.remainingSeconds);
              }
              break;

            case "contest:ended":
              setRoomStatus("FINISHED");
              setRemainingSeconds(0);
              toast.warning("Contest Ended!", {
                description: "Submissions closed. Viewing final rankings.",
              });
              onContestEnd?.(data.finalLeaderboard || []);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds if component is still mounted
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
    }
  }, [roomCode, user?.id, user?.name, user?.image, onContestStart, onContestEnd]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Request sync from server (e.g. on manual refresh or window focus)
  const syncRoom = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomCode) {
      socketRef.current.send(
        JSON.stringify({
          event: "time:sync",
          data: { roomCode: roomCode.toUpperCase() },
        })
      );
    }
  }, [roomCode]);

  return {
    isConnected,
    participants,
    remainingSeconds,
    roomStatus,
    recentActivities,
    syncRoom,
  };
}
