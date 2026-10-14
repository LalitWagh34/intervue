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
  const [errors, setErrors] = useState<{ fullName?: string; targetRole?: string; experienceLevel?: string }>({});

  const getInitials = (name?: string, email?: string) => {
    const clean = (name || "").trim();
    if (clean) {
      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, parts[0].length >= 2 && parts[0].toUpperCase() === "GA" ? 2 : 1).toUpperCase();
    }
    if (email) {
      const prefix = email.split("@")[0].toUpperCase();
      if (prefix.startsWith("GA")) return "GA";
      return prefix[0] || "G";
    }
    return "GA";
  };

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
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || undefined,
        bio: bio.trim(),
        targetRole,
        experienceLevel,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
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

  const handleSaveProfile = () => {
    const newErrors: { fullName?: string; targetRole?: string; experienceLevel?: string } = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    }
    if (!targetRole) {
      newErrors.targetRole = "Please select a target role.";
    }
    if (!experienceLevel) {
      newErrors.experienceLevel = "Please select an experience level.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.fullName) {
        setActiveSection("basic");
        toast.error("Please enter your full name.");
      } else if (newErrors.targetRole || newErrors.experienceLevel) {
        setActiveSection("career");
        toast.error("Please complete your career details.");
      }
      return;
    }

    setErrors({});
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans flex items-center justify-center p-3 sm:p-6 selection:bg-[#327CF6]/30">
      <div className="w-full max-w-4xl bg-[#11131A] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px]">
        {/* Sidebar / Mobile Nav Header */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#0B0D13]/60 p-4 sm:p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between md:block mb-3 md:mb-6">
            <button
              onClick={() => navigate("/profile")}
              className="text-slate-400 text-xs font-semibold flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
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
                    : "text-slate-400 hover:text-white hover:bg-[#14161C] border border-transparent"
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
                  <p className="text-slate-400 text-xs sm:text-sm">Tell us a bit about yourself to personalize your experience.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-[#1A1D27] border border-white/[0.10]">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#11131A] border border-white/[0.12] shrink-0">
                      {avatarUrl || session?.user?.image ? (
                        <img
                          src={avatarUrl || session?.user?.image || ""}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-[#327CF6] to-[#1E3A8A]">
                          {getInitials(fullName || session?.user?.name, session?.user?.email)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{fullName || session?.user?.name || "Candidate"}</p>
                      <p className="text-slate-500 text-xs font-mono">{session?.user?.email}</p>
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
                        className="text-xs text-slate-400 hover:text-white h-8 px-2.5 rounded-xl cursor-pointer font-mono"
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
                    <Label className="text-slate-400 text-xs font-semibold mb-2 block">
                      Full Name <span className="text-[#F59E0B]">*</span>
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder="e.g. John Doe"
                      className={cn(
                        "bg-[#1A1D27] border-white/[0.12] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all rounded-xl",
                        errors.fullName && "border-red-500 focus:border-red-500 ring-1 ring-red-500/30"
                      )}
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs font-semibold mb-2 block">
                      Bio <span className="text-slate-500 font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 200))}
                      placeholder="A short bio about yourself..."
                      className="bg-[#1A1D27] border-white/[0.12] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all min-h-28 rounded-xl resize-none"
                    />
                    <p className="text-slate-500 text-[10px] mt-1.5 font-mono text-right">{bio.length}/200</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "career" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Career Details</h1>
                  <p className="text-slate-400 text-sm">Help the AI tailor interview questions to your background.</p>
                </div>

                <div className="space-y-8 max-w-lg">
                  <div>
                    <Label className="text-slate-400 text-xs font-semibold mb-3 block">
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
                              ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white border-transparent shadow-sm shadow-indigo-500/25"
                              : "bg-[#1A1D27] text-slate-300 border-white/[0.08] hover:border-white/[0.2] hover:text-white"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs font-semibold mb-3 block">
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
                              ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white border-transparent shadow-sm shadow-indigo-500/25"
                              : "bg-[#1A1D27] text-slate-300 border-white/[0.08] hover:border-white/[0.2] hover:text-white"
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
                  <p className="text-slate-400 text-sm">Connect your professional profiles.</p>
                </div>

                <div className="space-y-6 max-w-md">
                  <div>
                    <Label className="text-slate-400 text-xs font-semibold mb-2 block">GitHub URL</Label>
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="bg-[#1A1D27] border-white/[0.12] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs font-semibold mb-2 block">LinkedIn URL</Label>
                    <Input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourusername"
                      className="bg-[#1A1D27] border-white/[0.12] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "skills" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Skills</h1>
                  <p className="text-slate-400 text-sm">List your technical skills to improve recommendations.</p>
                </div>

                <div className="max-w-lg">
                  <Label className="text-slate-400 text-xs font-semibold mb-2 block">
                    Comma separated skills
                  </Label>
                  <Input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React, Node.js, PostgreSQL, System Design"
                    className="bg-[#1A1D27] border-white/[0.12] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 rounded-xl mb-4"
                  />
                  
                  {skillsInput && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 rounded-xl border border-white/[0.07] bg-[#0A0C10]">
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

          <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/[0.07] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            {mutation.isError ? (
              <p className="text-[#EF4444] text-xs font-medium">Something went wrong. Please try again.</p>
            ) : <div />}

            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:from-[#4F46E5] hover:to-[#2563EB] text-white rounded-xl px-6 h-10 font-semibold cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              disabled={mutation.isPending}
              onClick={handleSaveProfile}
            >
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}