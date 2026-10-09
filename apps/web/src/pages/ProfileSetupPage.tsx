import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Briefcase, Link2, Sparkles, Upload, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState("basic");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  // Populate from existing profile or session
  useEffect(() => {
    if (profile) {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
      else if (session?.user?.image) setAvatarUrl(session.user.image);
      if (profile.bio) setBio(profile.bio);
      if (profile.targetRole) setTargetRole(profile.targetRole);
      if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel);
      if (profile.githubUrl) setGithubUrl(profile.githubUrl);
      if (profile.linkedinUrl) setLinkedinUrl(profile.linkedinUrl);
      if (profile.skills && Array.isArray(profile.skills)) {
        setSkillsInput(profile.skills.join(", "));
      }
    } else if (session?.user) {
      if (session.user.name && !fullName) setFullName(session.user.name);
      if (session.user.image && !avatarUrl) setAvatarUrl(session.user.image);
    }
  }, [profile, session]);

  // Clean image compression into data URI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file should be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        setAvatarUrl(dataUrl);
        toast.success("Photo uploaded! Click 'Save Profile' to apply.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await api.post("/profile/setup", {
        fullName,
        avatarUrl: avatarUrl || undefined,
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
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
      toast.success("Profile saved successfully!");
      navigate("/dashboard");
    },
  });

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans flex items-center justify-center p-3 sm:p-6 selection:bg-[#327CF6]/30">
      <div className="w-full max-w-4xl bg-[#0D0E12] border border-[#181A20] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px]">
        {/* Sidebar / Mobile Nav Header */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#181A20] bg-[#0A0C10]/60 p-4 sm:p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between md:block mb-3 md:mb-6">
            <button
              onClick={() => navigate("/profile")}
              className="text-[#8B92A0] text-xs font-semibold flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-[#327CF6]">←</span> Back to Profile
            </button>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider hidden md:block mt-6 px-1">
              Setup Profile
            </h2>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                  activeSection === s.id
                    ? "bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 shadow-sm"
                    : "text-[#8B92A0] hover:text-white hover:bg-[#14161C] border border-transparent"
                )}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 sm:p-8 md:p-10 relative flex flex-col">
          <div className="flex-1">
            {activeSection === "basic" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">Basic Info</h1>
                  <p className="text-[#8B92A0] text-xs sm:text-sm">Tell us a bit about yourself to personalize your experience.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-[#08090C] border border-[#181A20]">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#14161C] border border-[#1E2229] shrink-0">
                      {avatarUrl || session?.user?.image ? (
                        <img
                          src={avatarUrl || session?.user?.image || ""}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-[#327CF6] to-[#1E3A8A]">
                          {fullName?.[0] || "C"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{fullName || session?.user?.name || "Candidate"}</p>
                      <p className="text-[#525866] text-xs font-mono">{session?.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#14161C] border-[#1E2229] hover:bg-[#1C2028] text-xs text-white h-8 px-3 rounded-xl cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-[#327CF6]" />
                      Upload Photo
                    </Button>

                    {session?.user?.image && avatarUrl !== session.user.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarUrl(session.user.image || "");
                          toast.info("Restored Google profile photo");
                        }}
                        className="text-xs text-[#8B92A0] hover:text-white h-8 px-2.5 rounded-xl cursor-pointer font-mono"
                        title="Use Google account picture"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Use Google Photo
                      </Button>
                    )}

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarUrl("");
                          toast.info("Photo removed");
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2 rounded-xl cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
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

          <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#181A20] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            {mutation.isError ? (
              <p className="text-[#EF4444] text-xs font-medium">Something went wrong. Please try again.</p>
            ) : <div />}

            <Button
              className="w-full sm:w-auto bg-[#327CF6] text-white hover:bg-[#2563EB] rounded-xl px-6 h-10 font-semibold cursor-pointer shadow-lg shadow-[#327CF6]/20"
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