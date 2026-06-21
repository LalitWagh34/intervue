import { useProfile } from "@/hooks/useProfile";
import { useInterviews } from "@/hooks/useInterviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Code2, MessageSquare, Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: interviews, isLoading: interviewsLoading } = useInterviews();

  const completedInterviews = interviews?.filter((i: any) => i.status === "completed") || [];
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((sum: number, i: any) => sum + (i.score || 0), 0) /
            completedInterviews.length
        )
      : null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Welcome back{profile?.fullName ? `, ${profile.fullName}` : ""}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Here's an overview of your interview preparation
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-xs mb-1">Total sessions</p>
            <p className="text-2xl font-semibold text-white">
              {interviewsLoading ? "—" : interviews?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-xs mb-1">Average score</p>
            <p className="text-2xl font-semibold text-white">
              {avgScore !== null ? `${avgScore}/10` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Streak
            </p>
            <p className="text-2xl font-semibold text-white">
              {profileLoading ? "—" : profile?.streakCount ?? 0} days
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-xs mb-1">Target role</p>
            <p className="text-lg font-semibold text-white truncate">
              {profile?.targetRole || "Not set"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick start */}
      <h2 className="text-white font-medium mb-3">Start a session</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link to="/practice?mode=voice">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Mic className="w-5 h-5 text-blue-400 mb-3" />
              <p className="text-white font-medium">Voice interview</p>
              <p className="text-zinc-500 text-xs mt-1">Speak with an AI interviewer</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/coding">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Code2 className="w-5 h-5 text-amber-400 mb-3" />
              <p className="text-white font-medium">Coding practice</p>
              <p className="text-zinc-500 text-xs mt-1">Solve problems with AI feedback</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/chat">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <MessageSquare className="w-5 h-5 text-green-400 mb-3" />
              <p className="text-white font-medium">AI prep chat</p>
              <p className="text-zinc-500 text-xs mt-1">Ask anything about interviews</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent interviews */}
      <h2 className="text-white font-medium mb-3">Recent sessions</h2>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          {interviewsLoading ? (
            <p className="text-zinc-500 text-sm">Loading...</p>
          ) : interviews?.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              No sessions yet. Start your first interview above.
            </p>
          ) : (
            <div className="space-y-3">
              {interviews?.slice(0, 5).map((interview: any) => (
                <Link
                  key={interview.id}
                  to={`/results/${interview.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <div>
                    <p className="text-white text-sm">{interview.role}</p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                      {interview.mode}
                    </Badge>
                    {interview.score && (
                      <span className="text-white text-sm font-medium">{interview.score}/10</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}