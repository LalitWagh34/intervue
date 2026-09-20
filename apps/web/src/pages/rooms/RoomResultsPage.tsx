import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import {
  Trophy,
  Medal,
  Crown,
  Clock,
  CheckCircle2,
  ArrowLeft,
  LayoutDashboard,
  Swords,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  rank: number;
  participantId: string;
  userId: string;
  name: string;
  image?: string | null;
  role: string;
  score: number;
  solvedCount: number;
  penaltyTime: number;
}

export default function RoomResultsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [roomTitle, setRoomTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const [boardRes, roomRes] = await Promise.all([
          api.get(`/rooms/${code}/leaderboard`),
          api.get(`/rooms/${code}`),
        ]);

        setLeaderboard(boardRes.data.leaderboard || []);
        setRoomTitle(roomRes.data.room.title || "Contest");
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span className="text-sm font-medium">Calculating Final Standings...</span>
        </div>
      </div>
    );
  }

  const myEntry = leaderboard.find((p) => p.userId === session?.user?.id);
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs px-3 py-1">
            Contest Concluded
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {roomTitle} — Final Standings
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Room Code: {code} • Server-Authoritative Deterministic Results
          </p>
        </div>

        {/* Podium for Top 3 */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 items-end">
            {/* 2nd Place */}
            {top2 ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center flex flex-col items-center justify-between h-48 order-1">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                    🥈
                  </div>
                  <div className="truncate max-w-[130px] font-medium text-xs text-zinc-200">
                    {top2.name}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-base font-bold text-white">
                    {top2.score} pts
                  </span>
                  <p className="text-[11px] text-zinc-500 font-mono">{top2.solvedCount} solved</p>
                </div>
              </div>
            ) : <div className="order-1" />}

            {/* 1st Place (Champion) */}
            {top1 && (
              <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 text-center flex flex-col items-center justify-between h-56 shadow-lg shadow-amber-500/5 order-2">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-lg font-bold text-amber-400">
                    🥇
                  </div>
                  <div className="truncate max-w-[150px] font-semibold text-sm text-white">
                    {top1.name}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-lg font-extrabold text-amber-400">
                    {top1.score} pts
                  </span>
                  <p className="text-xs text-zinc-400 font-mono">{top1.solvedCount} solved</p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center flex flex-col items-center justify-between h-44 order-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                    🥉
                  </div>
                  <div className="truncate max-w-[130px] font-medium text-xs text-zinc-300">
                    {top3.name}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-base font-bold text-white">
                    {top3.score} pts
                  </span>
                  <p className="text-[11px] text-zinc-500 font-mono">{top3.solvedCount} solved</p>
                </div>
              </div>
            ) : <div className="order-3" />}
          </div>
        )}

        {/* My Performance Card */}
        {myEntry && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-sm text-zinc-200">
                #{myEntry.rank}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Your Performance</h3>
                <p className="text-xs text-zinc-400">
                  You placed Rank #{myEntry.rank} out of {leaderboard.length} participants
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-right">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Score</span>
                <span className="text-base font-bold text-white">{myEntry.score} pts</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Solved</span>
                <span className="text-base font-bold text-zinc-200">{myEntry.solvedCount}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Penalty</span>
                <span className="text-base font-medium text-zinc-400">{myEntry.penaltyTime}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Complete Ranked Standings
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {leaderboard.length} Total Competitors
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80">
              <tr>
                <th className="py-3 px-4 font-mono w-16">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4 text-center">Solved</th>
                <th className="py-3 px-4 text-center font-mono">Penalty</th>
                <th className="py-3 px-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {leaderboard.map((entry) => {
                const isMe = entry.userId === session?.user?.id;

                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      isMe ? "bg-zinc-800/50 text-white font-medium" : "hover:bg-zinc-900/30 text-zinc-300"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-400">
                      #{entry.rank}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      {entry.image ? (
                        <img src={entry.image} className="w-6 h-6 rounded-full border border-zinc-700" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
                          {entry.name?.[0] || "U"}
                        </div>
                      )}
                      <span>
                        {entry.name} {isMe && <span className="text-zinc-500 text-[11px]">(You)</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {entry.solvedCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-500">
                      {entry.penaltyTime}m
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {entry.score} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>

          <Button
            onClick={() => navigate("/rooms")}
            className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium flex items-center gap-2 shadow-sm"
          >
            <Swords className="w-4 h-4" />
            Join Another Contest
          </Button>
        </div>
      </div>
    </div>
  );
}
