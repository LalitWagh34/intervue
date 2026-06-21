import { useInterviews } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400 border-green-900",
  active: "text-blue-400 border-blue-900",
  abandoned: "text-zinc-500 border-zinc-800",
};

export default function HistoryPage() {
  const { data: interviews, isLoading } = useInterviews();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Interview history</h1>
        <p className="text-zinc-400 text-sm mt-1">All your past practice sessions</p>
      </div>

      {isLoading && <p className="text-zinc-500 text-sm">Loading...</p>}

      {!isLoading && interviews?.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-10 text-center">
            <p className="text-zinc-400">No interviews yet</p>
            <Link to="/practice" className="text-white text-sm underline mt-2 inline-block">
              Start your first session
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {interviews?.map((interview: any) => (
          <Link key={interview.id} to={`/results/${interview.id}`} className="block">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{interview.role}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {new Date(interview.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {new Date(interview.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 capitalize">
                    {interview.mode}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[interview.status] || "text-zinc-400 border-zinc-700"}
                  >
                    {interview.status}
                  </Badge>
                  {interview.score && (
                    <span className="text-white text-sm font-semibold w-12 text-right">
                      {interview.score}/10
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}