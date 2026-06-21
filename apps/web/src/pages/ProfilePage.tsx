import { useProfile } from "@/hooks/useProfile";
import { useInterviews } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Github, ExternalLink, Flame, Trophy, Target, Pencil } from "lucide-react";
import { Flame, Trophy, Target, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: interviews } = useInterviews();

  const completed = interviews?.filter((i: any) => i.status === "completed") || [];
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum: number, i: any) => sum + (i.score || 0), 0) / completed.length)
      : null;

  const byMode = completed.reduce((acc: Record<string, number>, i: any) => {
    acc[i.mode] = (acc[i.mode] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <p className="text-white mb-2">No profile set up yet</p>
        <p className="text-zinc-500 text-sm mb-4">Complete your profile to get personalized interviews</p>
        <Link to="/profile-setup">
          <Button className="bg-white text-black hover:bg-zinc-200">Set up profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl text-white font-semibold">
            {profile.fullName?.[0] || "U"}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{profile.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-zinc-300 border-zinc-700">
                {profile.targetRole}
              </Badge>
              <Badge variant="outline" className="text-zinc-300 border-zinc-700 capitalize">
                {profile.experienceLevel}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2">
                {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" className="text-zinc-500 hover:text-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                </a>
                )}
                {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" className="text-zinc-500 hover:text-white">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                    </a>
                )}
            </div>
          </div>
        </div>
        <Link to="/profile-setup">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white">
            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <Target className="w-4 h-4 text-zinc-500 mb-2" />
            <p className="text-2xl font-semibold text-white">{interviews?.length ?? 0}</p>
            <p className="text-zinc-500 text-xs mt-1">Total sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <Trophy className="w-4 h-4 text-zinc-500 mb-2" />
            <p className="text-2xl font-semibold text-white">{avgScore !== null ? `${avgScore}/10` : "—"}</p>
            <p className="text-zinc-500 text-xs mt-1">Average score</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <Flame className="w-4 h-4 text-zinc-500 mb-2" />
            <p className="text-2xl font-semibold text-white">{profile.streakCount} days</p>
            <p className="text-zinc-500 text-xs mt-1">Current streak</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold text-white">{completed.length}</p>
            <p className="text-zinc-500 text-xs mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-medium mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <Badge key={skill} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 border-zinc-700">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sessions by mode */}
      <div>
        <h2 className="text-white font-medium mb-3">Sessions by mode</h2>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            {Object.keys(byMode).length === 0 ? (
              <p className="text-zinc-500 text-sm">No completed sessions yet</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(byMode).map(([mode, count]) => (
                  <div key={mode} className="text-center">
                    <p className="text-xl font-semibold text-white">{count as number}</p>
                    <p className="text-zinc-500 text-xs capitalize mt-1">{mode}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}