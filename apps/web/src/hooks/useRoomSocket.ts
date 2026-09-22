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

  // Stable refs for callbacks and user state to prevent infinite reconnect loops
  const onContestStartRef = useRef(onContestStart);
  onContestStartRef.current = onContestStart;

  const onContestEndRef = useRef(onContestEnd);
  onContestEndRef.current = onContestEnd;

  const userRef = useRef(user);
  userRef.current = user;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isUnmountedRef = useRef(false);
  const lastJoinedToastRef = useRef<{ name: string; time: number }>({ name: "", time: 0 });

  const userId = user?.id;

  const connect = useCallback(() => {
    if (!roomCode || !userId || isUnmountedRef.current) return;

    // Clean up any existing socket before opening a new one
    if (socketRef.current) {
      try {
        socketRef.current.onclose = null;
        socketRef.current.close();
      } catch (_) {}
      socketRef.current = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const wsUrl = `${protocol}//${host}:3000/ws/rooms`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);

        const currentUser = userRef.current;
        ws.send(
          JSON.stringify({
            event: "room:join",
            data: {
              roomCode: roomCode.toUpperCase(),
              userId: currentUser?.id || userId,
              name: currentUser?.name || "Anonymous",
              image: currentUser?.image,
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

            case "participant:joined": {
              // Don't toast for self
              if (data.userId === userRef.current?.id) break;

              // Throttle join toasts so they don't spam
              const now = Date.now();
              if (
                lastJoinedToastRef.current.name === data.name &&
                now - lastJoinedToastRef.current.time < 3000
              ) {
                break;
              }
              lastJoinedToastRef.current = { name: data.name, time: now };

              toast.info(`${data.name} joined the room`, {
                duration: 2500,
                description: `${data.totalConnected} participant${data.totalConnected > 1 ? "s" : ""} present`,
              });
              break;
            }

            case "participant:left":
              // Sync will update roster
              break;

            case "contest:started":
              setRoomStatus("ACTIVE");
              toast.success("Contest Started!", {
                duration: 3000,
                description: "The timer is now ticking. Good luck!",
              });
              onContestStartRef.current?.(data);
              break;

            case "submission:activity": {
              const activity: ActivityEvent = {
                ...data,
                timestamp: Date.now(),
              };
              setRecentActivities((prev) => [activity, ...prev.slice(0, 19)]);
              if (data.isAccepted) {
                toast.success(`🚀 ${data.userName} solved ${data.problemTitle}! (+${data.pointsAwarded} pts)`, {
                  duration: 3500,
                });
              }
              break;
            }

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
                duration: 4000,
                description: "Submissions closed. Viewing final rankings.",
              });
              onContestEndRef.current?.(data.finalLeaderboard || []);
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
        // Only schedule reconnect if the unmount was NOT intentional
        if (!isUnmountedRef.current) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              connect();
            }
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
        try {
          ws.close();
        } catch (_) {}
      };
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
    }
  }, [roomCode, userId]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        try {
          socketRef.current.onclose = null;
          socketRef.current.close();
        } catch (_) {}
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Request sync from server
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
