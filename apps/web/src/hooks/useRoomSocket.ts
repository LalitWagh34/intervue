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
  warningsCount?: number;
  isDisqualified?: boolean;
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

export interface AntiCheatViolationEvent {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  type: "TAB_SWITCH" | "WINDOW_BLUR" | "SUSPICIOUS_PASTE";
  warningLevel: number;
  penaltyAddedSeconds?: number;
  isDisqualified?: boolean;
  details?: string;
  timestamp: number;
}

export interface InspectedCodeSnapshot {
  targetUserId: string;
  problemId: number;
  sourceCode: string;
  language: string;
  updatedAt: number;
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
  const [violations, setViolations] = useState<AntiCheatViolationEvent[]>([]);
  const [inspectedCode, setInspectedCode] = useState<InspectedCodeSnapshot | null>(null);

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
              if (data.violations) {
                setViolations(data.violations);
              }
              break;

            case "participant:joined": {
              if (data.userId === userRef.current?.id) break;

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

            case "anticheat:violation": {
              if (data.violation) {
                setViolations((prev) => [data.violation, ...prev.slice(0, 29)]);

                // Broadcast alert
                const v = data.violation;
                if (v.isDisqualified) {
                  toast.error(`🚫 ${v.userName} was DISQUALIFIED!`, {
                    description: `Multiple anti-cheat violations (${v.warningLevel}/3).`,
                    duration: 5000,
                  });
                } else if (v.penaltyAddedSeconds) {
                  toast.warning(`⚠️ ${v.userName} penalized +3 mins!`, {
                    description: `Strike ${v.warningLevel}/3: ${v.type}`,
                    duration: 4000,
                  });
                } else {
                  toast.warning(`⚠️ Anti-Cheat Warning: ${v.userName}`, {
                    description: `Strike ${v.warningLevel}/3: ${v.type}`,
                    duration: 3500,
                  });
                }
              }
              break;
            }

            case "code:inspect_result":
              if (data.snapshot) {
                setInspectedCode({
                  targetUserId: data.targetUserId,
                  ...data.snapshot,
                });
              }
              break;

            case "code:stream_update":
              setInspectedCode((prev) => {
                if (prev && prev.targetUserId === data.userId) {
                  return {
                    targetUserId: data.userId,
                    problemId: data.problemId,
                    sourceCode: data.sourceCode,
                    language: data.language,
                    updatedAt: data.updatedAt,
                  };
                }
                return prev;
              });
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

  // Emit anti-cheat violation to room
  const emitViolation = useCallback(
    (type: string, details?: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomCode && userId) {
        socketRef.current.send(
          JSON.stringify({
            event: "anticheat:violation",
            data: {
              roomCode: roomCode.toUpperCase(),
              userId,
              type,
              details,
            },
          })
        );
      }
    },
    [roomCode, userId]
  );

  // Emit live code sync to room spectators
  const emitCodeSync = useCallback(
    (payload: { problemId: number; sourceCode: string; language: string }) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomCode && userId) {
        socketRef.current.send(
          JSON.stringify({
            event: "code:sync",
            data: {
              roomCode: roomCode.toUpperCase(),
              userId,
              ...payload,
            },
          })
        );
      }
    },
    [roomCode, userId]
  );

  // Spectator inspects a specific participant's code
  const inspectUserCode = useCallback(
    (targetUserId: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomCode) {
        socketRef.current.send(
          JSON.stringify({
            event: "code:inspect",
            data: {
              roomCode: roomCode.toUpperCase(),
              targetUserId,
            },
          })
        );
      }
    },
    [roomCode]
  );

  return {
    isConnected,
    participants,
    remainingSeconds,
    roomStatus,
    recentActivities,
    violations,
    inspectedCode,
    syncRoom,
    emitViolation,
    emitCodeSync,
    inspectUserCode,
  };
}
