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
        bio,
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
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans flex items-center justify-center p-4 selection:bg-[#327CF6]/30">
      <div className="w-full max-w-4xl bg-[#0D0E12] border border-[#181A20] rounded-2xl shadow-2xl flex overflow-hidden min-h-[550px]">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#181A20] bg-[#0A0C10]/50 p-6 flex flex-col">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[#8B92A0] text-xs font-semibold mb-8 flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="text-[#327CF6]">←</span> Back to Dashboard
          </button>
          
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 px-2">Setup Profile</h2>
          
          <nav className="space-y-1.5 flex-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeSection === s.id
                    ? "bg-[#327CF6]/10 text-[#327CF6] shadow-sm shadow-[#327CF6]/5"
                    : "text-[#8B92A0] hover:text-white hover:bg-[#14161C]"
                )}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-12 relative flex flex-col">
          <div className="flex-1">
            {activeSection === "basic" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Basic Info</h1>
                  <p className="text-[#8B92A0] text-sm">Tell us a bit about yourself to personalize your experience.</p>
                </div>

                <div className="flex items-center gap-5 mb-8 p-4 rounded-2xl bg-[#08090C] border border-[#181A20]">
                  {session?.user?.image ? (
                    <img src={session.user.image} className="w-16 h-16 rounded-full ring-2 ring-[#181A20]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#14161C] border border-[#1E2229] flex items-center justify-center text-xl font-bold text-white shadow-inner">
                      {fullName?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-[#525866] text-xs font-mono mb-0.5">Logged in as</p>
                    <p className="text-white font-medium text-sm">{session?.user?.email}</p>
                  </div>
                </div>

                <div className="space-y-6 max-w-md">
                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-2 block">
                      Full Name <span className="text-[#F59E0B]">*</span>
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="bg-[#08090C] border-[#181A20] text-white focus:border-[#327CF6]/50 focus:ring-[#327CF6]/20 transition-all rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-2 block">
                      Bio <span className="text-[#525866] font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 200))}
                      placeholder="A short bio about yourself..."
                      className="bg-[#08090C] border-[#181A20] text-white focus:border-[#327CF6]/50 focus:ring-[#327CF6]/20 transition-all min-h-28 rounded-xl resize-none"
                    />
                    <p className="text-[#525866] text-[10px] mt-1.5 font-mono text-right">{bio.length}/200</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "career" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Career Details</h1>
                  <p className="text-[#8B92A0] text-sm">Help the AI tailor interview questions to your background.</p>
                </div>

                <div className="space-y-8 max-w-lg">
                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-3 block">
                      Target Role <span className="text-[#F59E0B]">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2.5">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          onClick={() => setTargetRole(role)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                            targetRole === role
                              ? "bg-[#327CF6] text-white border-[#327CF6] shadow-sm shadow-[#327CF6]/20"
                              : "bg-[#08090C] text-[#8B92A0] border-[#181A20] hover:border-[#327CF6]/50 hover:text-white"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-3 block">
                      Experience Level <span className="text-[#F59E0B]">*</span>
                    </Label>
                    <div className="flex gap-2.5">
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setExperienceLevel(level)}
                          className={cn(
                            "px-5 py-2 rounded-xl text-xs font-medium border capitalize transition-all cursor-pointer",
                            experienceLevel === level
                              ? "bg-[#327CF6] text-white border-[#327CF6] shadow-sm shadow-[#327CF6]/20"
                              : "bg-[#08090C] text-[#8B92A0] border-[#181A20] hover:border-[#327CF6]/50 hover:text-white"
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
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Links</h1>
                  <p className="text-[#8B92A0] text-sm">Connect your professional profiles.</p>
                </div>

                <div className="space-y-6 max-w-md">
                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-2 block">GitHub URL</Label>
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="bg-[#08090C] border-[#181A20] text-white focus:border-[#327CF6]/50 focus:ring-[#327CF6]/20 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[#8B92A0] text-xs font-semibold mb-2 block">LinkedIn URL</Label>
                    <Input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourusername"
                      className="bg-[#08090C] border-[#181A20] text-white focus:border-[#327CF6]/50 focus:ring-[#327CF6]/20 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "skills" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Skills</h1>
                  <p className="text-[#8B92A0] text-sm">List your technical skills to improve recommendations.</p>
                </div>

                <div className="max-w-lg">
                  <Label className="text-[#8B92A0] text-xs font-semibold mb-2 block">
                    Comma separated skills
                  </Label>
                  <Input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React, Node.js, PostgreSQL, System Design"
                    className="bg-[#08090C] border-[#181A20] text-white focus:border-[#327CF6]/50 focus:ring-[#327CF6]/20 rounded-xl mb-4"
                  />
                  
                  {skillsInput && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 rounded-xl border border-[#181A20] bg-[#0A0C10]">
                      {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-[#14161C] border border-[#1E2229] rounded-lg text-white text-[11px] font-medium flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#327CF6]"></span>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-[#181A20] flex items-center justify-between">
            {mutation.isError ? (
              <p className="text-[#EF4444] text-xs font-medium">Something went wrong. Please try again.</p>
            ) : <div />}
            
            <Button
              className="bg-[#327CF6] text-white hover:bg-[#2563EB] rounded-xl px-6"
              disabled={!fullName || !targetRole || !experienceLevel || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}