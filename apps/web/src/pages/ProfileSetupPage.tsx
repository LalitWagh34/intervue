import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Briefcase, Link2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "career", label: "Career Details", icon: Briefcase },
  { id: "links", label: "Links", icon: Link2 },
  { id: "skills", label: "Skills", icon: Sparkles },
];

const ROLES = ["Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "DevOps Engineer", "Data Scientist"];
const LEVELS = ["junior", "mid", "senior"];

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [activeSection, setActiveSection] = useState("basic");
  const [fullName, setFullName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await api.post("/profile/setup", {
        fullName,
        targetRole,
        experienceLevel,
        githubUrl,
        linkedinUrl,
        skills,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/dashboard");
    },
  });

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sub-sidebar */}
      <div className="w-64 border-r border-zinc-800 p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-orange-500 text-sm mb-6 flex items-center gap-1 hover:text-orange-400"
        >
          ← Back to Dashboard
        </button>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                activeSection === s.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-10 max-w-2xl">
        {activeSection === "basic" && (
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Basic Info</h1>
            <p className="text-zinc-500 text-sm mb-8">You can manage your details here.</p>

            <div className="flex items-center gap-4 mb-6">
              {session?.user?.image ? (
                <img src={session.user.image} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl text-white">
                  {fullName?.[0] || "U"}
                </div>
              )}
              <div>
                <p className="text-zinc-500 text-xs">Logged in as</p>
                <p className="text-white text-sm">{session?.user?.email}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-zinc-300 mb-1.5 block">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-1.5 block">Bio (max 200 characters)</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  placeholder="A short bio about yourself..."
                  className="bg-zinc-900 border-zinc-800 text-white min-h-24"
                />
                <p className="text-zinc-600 text-xs mt-1">{bio.length}/200</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "career" && (
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Career Details</h1>
            <p className="text-zinc-500 text-sm mb-8">
              This helps the AI tailor interview questions to your background.
            </p>

            <div className="space-y-6">
              <div>
                <Label className="text-zinc-300 mb-2 block">
                  Target Role <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setTargetRole(role)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                        targetRole === role
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">
                  Experience Level <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  {LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors",
                        experienceLevel === level
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "links" && (
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Links</h1>
            <p className="text-zinc-500 text-sm mb-8">Connect your professional profiles.</p>

            <div className="space-y-5">
              <div>
                <Label className="text-zinc-300 mb-1.5 block">GitHub URL</Label>
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block">LinkedIn URL</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "skills" && (
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Skills</h1>
            <p className="text-zinc-500 text-sm mb-8">List your technical skills, comma separated.</p>

            <Input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, Node.js, PostgreSQL, Python"
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            {skillsInput && (
              <div className="flex flex-wrap gap-2 mt-3">
                {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-300 text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-zinc-800">
          <Button
            className="bg-white text-black hover:bg-zinc-200"
            disabled={!fullName || !targetRole || !experienceLevel || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Save profile"}
          </Button>
          {mutation.isError && (
            <p className="text-red-400 text-sm mt-2">Something went wrong. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}