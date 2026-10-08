import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Code2,
  Brain,
  Swords,
  Search,
  Plus,
  Trash2,
  Eye,
  Shield,
  ShieldAlert,
  Sparkles,
  Database,
  Server,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";

type AdminTab = "overview" | "users" | "problems" | "mcqs" | "rooms";

const PANELS: Array<{
  id: AdminTab;
  label: string;
  description: string;
  icon: any;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "System KPIs & runtime health",
    icon: BarChart3,
  },
  {
    id: "users",
    label: "Candidates & Roles",
    description: "Candidate directory & permissions",
    icon: Users,
  },
  {
    id: "problems",
    label: "Coding Bank",
    description: "Question repo, testcases & AI",
    icon: Code2,
  },
  {
    id: "mcqs",
    label: "MCQ Bank",
    description: "Assessment questions & subjects",
    icon: Brain,
  },
  {
    id: "rooms",
    label: "Contest Rooms",
    description: "Live multiplayer battle surveillance",
    icon: Swords,
  },
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const LANGUAGES = ["JAVASCRIPT", "PYTHON", "CPP", "JAVA", "TYPESCRIPT"];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-emerald-400 border-emerald-900 bg-emerald-950/20",
  MEDIUM: "text-amber-400 border-amber-900 bg-amber-950/20",
  HARD: "text-rose-400 border-rose-900 bg-rose-950/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-zinc-400 border-zinc-700 bg-zinc-800/20",
  published: "text-emerald-400 border-emerald-900 bg-emerald-950/20",
  archived: "text-rose-400 border-rose-900 bg-rose-950/20",
};

function defaultTemplates() {
  return LANGUAGES.map((lang) => ({
    language: lang,
    code:
      lang === "JAVASCRIPT"
        ? "function solution() {\n  // your code here\n}"
        : lang === "PYTHON"
        ? "def solution():\n    # your code here\n    pass"
        : lang === "CPP"
        ? "#include<bits/stdc++.h>\nusing namespace std;\nint main() {\n  // your code here\n  return 0;\n}"
        : lang === "JAVA"
        ? "class Solution {\n  public static void main(String[] args) {\n    // your code here\n  }\n}"
        : "// TypeScript solution here",
  }));
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { panel } = useParams<{ panel?: string }>();
  const navigate = useNavigate();

  const VALID_TABS: AdminTab[] = ["overview", "users", "problems", "mcqs", "rooms"];
  const activeTab: AdminTab = VALID_TABS.includes(panel as AdminTab)
    ? (panel as AdminTab)
    : "overview";

  const { data: session, isPending: isSessionPending } = useSession();
  const { data: profileStats, isLoading: isProfileStatsLoading } = useProfileStats();
  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";

  const switchTab = (tab: AdminTab) => {
    navigate(`/admin/${tab}`);
  };

  // ─── OVERVIEW PANEL ──────────────────────────────────────────────────
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data.stats;
    },
    enabled: Boolean(isAdmin && activeTab === "overview"),
  });

  // ─── USERS PANEL ─────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: async () => {
      const res = await api.get(`/admin/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ""}`);
      return res.data.users;
    },
    enabled: Boolean(isAdmin && activeTab === "users"),
  });

  const toggleUserRole = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
    },
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to update user role"),
  });

  // ─── CODING PROBLEMS PANEL ───────────────────────────────────────────
  const [problemView, setProblemView] = useState<"list" | "create" | "edit">("list");
  const [problemSearch, setProblemSearch] = useState("");
  const [problemFilterDiff, setProblemFilterDiff] = useState("ALL");
  const [generatingProblem, setGeneratingProblem] = useState(false);

  // Problem Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [tags, setTags] = useState("");
  const [company, setCompany] = useState("");
  const [hints, setHints] = useState("");
  const [examples, setExamples] = useState([{ input: "", output: "", explanation: "" }]);
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isHidden: false }]);
  const [templates, setTemplates] = useState(defaultTemplates());
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateTags, setGenerateTags] = useState("");

  const { data: problems, isLoading: isProblemsLoading } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: async () => {
      const res = await api.get("/admin/problems");
      return res.data.problems;
    },
    enabled: Boolean(isAdmin && activeTab === "problems"),
  });

  function resetProblemForm() {
    setTitle(""); setSlug(""); setDifficulty("EASY"); setDescription("");
    setConstraints(""); setInputFormat(""); setOutputFormat("");
    setTags(""); setCompany(""); setHints("");
    setExamples([{ input: "", output: "", explanation: "" }]);
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
    setTemplates(defaultTemplates());
  }

  async function generateWithAI() {
    if (!generateTopic || !difficulty) return;
    setGeneratingProblem(true);
    try {
      const res = await api.post("/admin/problems/generate", {
        topic: generateTopic,
        difficulty,
        tags: generateTags,
      });
      const g = res.data.generated;
      setTitle(g.title || "");
      setSlug(g.slug || "");
      setDescription(g.description || "");
      setConstraints(g.constraints || "");
      setInputFormat(g.inputFormat || "");
      setOutputFormat(g.outputFormat || "");
      setTags((g.tags || []).join(", "));
      setHints((g.hints || []).join("\n"));
      setExamples(g.examples?.length ? g.examples : [{ input: "", output: "", explanation: "" }]);
      setTestCases(g.testCases?.length ? g.testCases : [{ input: "", expectedOutput: "", isHidden: false }]);
      toast.success("Problem draft generated from AI!");
    } catch {
      toast.error("Failed to generate AI problem");
    } finally {
      setGeneratingProblem(false);
    }
  }

  const createProblemMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/problems", {
        title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        difficulty, description, constraints, inputFormat, outputFormat,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        company: company.split(",").map((c) => c.trim()).filter(Boolean),
        hints: hints.split("\n").filter(Boolean),
        examples, testCases, templates,
      });
    },
    onSuccess: () => {
      toast.success("Problem saved to question bank!");
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      resetProblemForm();
      setProblemView("list");
    },
    onError: () => toast.error("Failed to create problem"),
  });

  const publishProblemMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/admin/problems/${id}/publish`);
    },
    onSuccess: () => {
      toast.success("Problem published live!");
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/problems/${id}`);
    },
    onSuccess: () => {
      toast.info("Problem removed");
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
    },
  });

  // ─── MCQ BANK PANEL ──────────────────────────────────────────────────
  const [mcqCategoryFilter, setMcqCategoryFilter] = useState("ALL");
  const [mcqSubjectFilter, setMcqSubjectFilter] = useState("ALL");
  const [mcqSearch, setMcqSearch] = useState("");
  const [isNewMcqModalOpen, setIsNewMcqModalOpen] = useState(false);

  // New MCQ state
  const [newMcqCategory, setNewMcqCategory] = useState("CORE_CS");
  const [newMcqSubject, setNewMcqSubject] = useState("DBMS");
  const [newMcqTopic, setNewMcqTopic] = useState("");
  const [newMcqDifficulty, setNewMcqDifficulty] = useState("MEDIUM");
  const [newMcqQuestion, setNewMcqQuestion] = useState("");
  const [newMcqOptions, setNewMcqOptions] = useState(["", "", "", ""]);
  const [newMcqCorrect, setNewMcqCorrect] = useState(0);
  const [newMcqExplanation, setNewMcqExplanation] = useState("");

  const { data: mcqsData, isLoading: isMcqsLoading } = useQuery({
    queryKey: ["admin-mcqs", mcqCategoryFilter, mcqSubjectFilter, mcqSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (mcqCategoryFilter !== "ALL") params.append("category", mcqCategoryFilter);
      if (mcqSubjectFilter !== "ALL") params.append("subject", mcqSubjectFilter);
      if (mcqSearch) params.append("search", mcqSearch);
      const res = await api.get(`/admin/mcqs?${params.toString()}`);
      return res.data.mcqs;
    },
    enabled: Boolean(isAdmin && activeTab === "mcqs"),
  });

  const createMcqMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/mcqs", {
        category: newMcqCategory,
        subject: newMcqSubject,
        topic: newMcqTopic || "General",
        difficulty: newMcqDifficulty,
        question: newMcqQuestion,
        options: newMcqOptions,
        correctOption: newMcqCorrect,
        explanation: newMcqExplanation,
      });
    },
    onSuccess: () => {
      toast.success("MCQ question added to assessment bank!");
      queryClient.invalidateQueries({ queryKey: ["admin-mcqs"] });
      setIsNewMcqModalOpen(false);
      setNewMcqQuestion("");
      setNewMcqOptions(["", "", "", ""]);
      setNewMcqExplanation("");
    },
    onError: () => toast.error("Failed to add MCQ question"),
  });

  const deleteMcqMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/mcqs/${id}`);
    },
    onSuccess: () => {
      toast.info("MCQ removed");
      queryClient.invalidateQueries({ queryKey: ["admin-mcqs"] });
    },
  });

  // ─── ROOMS MONITOR PANEL ─────────────────────────────────────────────
  const { data: roomsData, isLoading: isRoomsLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const res = await api.get("/admin/rooms");
      return res.data.rooms;
    },
    enabled: Boolean(isAdmin && activeTab === "rooms"),
  });

  const terminateRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/rooms/${id}/terminate`);
    },
    onSuccess: () => {
      toast.success("Contest room terminated");
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    },
  });

  if (!isSessionPending && !isProfileStatsLoading && !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#08090C] text-zinc-100 p-6 font-sans">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#0D0F14] border border-zinc-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Access Denied</h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This area is restricted to administrators only. Your current candidate account does not have management CMS permissions.
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-9"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentPanelMeta = PANELS.find((p) => p.id === activeTab) || PANELS[0];

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#08090C] text-zinc-100 flex flex-col font-sans">
      {/* ─── Top Admin Bar ───────────────────────────────────────────── */}
      <header className="border-b border-zinc-800/80 bg-[#0A0C11] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Admin CMS</span>
              <span className="text-zinc-600">/</span>
              <h1 className="text-sm font-bold text-white tracking-tight">
                {currentPanelMeta.label}
              </h1>
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono ml-1">
                Internal
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentPanelMeta.description}
            </p>
          </div>
        </div>

        {/* Mobile Horizontal Module Switcher */}
        <div className="flex md:hidden items-center gap-1 p-1 rounded-xl bg-black/40 border border-zinc-800 overflow-x-auto custom-scrollbar">
          {PANELS.map((p) => {
            const Icon = p.icon;
            const isSelected = activeTab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchTab(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? "bg-zinc-800 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Multi-Panel Body (Sub-panel rail + Active workspace) ────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sub-Panel Navigation Rail (Desktop) */}
        <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-[#0A0C11] p-3 hidden md:flex flex-col justify-between select-none">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              CMS Panels
            </div>
            {PANELS.map((p) => {
              const Icon = p.icon;
              const isSelected = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchTab(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                    isSelected
                      ? "bg-zinc-800 text-white font-semibold border border-zinc-700/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate font-normal">
                      {p.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <div className="text-zinc-300 font-semibold text-xs">Role: Administrator</div>
            <div className="text-emerald-400 text-[10px] mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Surveillance Online
            </div>
          </div>
        </aside>

        {/* Right Active Panel Workspace */}
        <main className="flex-1 min-w-0 p-5 md:p-8 overflow-y-auto custom-scrollbar">
        {/* 1. OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">System Overview</h2>
                <p className="text-xs text-zinc-400">Live platform totals and infrastructure metrics</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchStats()}
                className="h-8 border-zinc-800 bg-[#12151D] text-zinc-300 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>

            {isStatsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-zinc-900/60 rounded-xl border border-zinc-800/60" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Total Users</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">
                      {statsData?.totalUsers ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Coding Problems</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">
                      {statsData?.totalProblems ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Assessment MCQs</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">
                      {statsData?.totalMcqs ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Total Rooms</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">
                      {statsData?.totalRooms ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Active Contests</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                      {statsData?.activeRooms ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[#0D0F14] border-zinc-800/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-zinc-400 block uppercase">Submissions</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">
                      {statsData?.totalSubmissions ?? 0}
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Service Infrastructure Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0D0F14] border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Database Cluster</h4>
                    <p className="text-[11px] text-zinc-400">PostgreSQL Prisma Client</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  Online
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0F14] border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Bun Runtime Uptime</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {statsData?.uptimeSeconds ? `${Math.floor(statsData.uptimeSeconds / 60)} minutes` : "--"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                  Healthy
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0F14] border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Server Memory (RSS)</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">{statsData?.memoryRssMb ?? 0} MB</p>
                  </div>
                </div>
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                  Optimal
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS PANEL */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Candidate User Management</h2>
                <p className="text-xs text-zinc-400">Inspect registered users, streaks, points, and administrative roles</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#111319] border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {isUsersLoading ? (
              <p className="text-xs text-zinc-500 py-8 text-center">Loading users...</p>
            ) : (
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-[#0C0E14]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#10131B] border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Points</th>
                      <th className="p-3">Streak</th>
                      <th className="p-3">Handles</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(usersData || []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-white">{u.name || "Anonymous"}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              u.role === "admin"
                                ? "bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]"
                            }
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-300">
                          {u.profile?.points ?? 0}
                        </td>
                        <td className="p-3 font-mono text-zinc-300">
                          {u.profile?.streakCount ?? 0}d
                        </td>
                        <td className="p-3 text-[11px] font-mono text-zinc-400">
                          {u.profile?.leetcodeHandle && <div>LC: {u.profile.leetcodeHandle}</div>}
                          {u.profile?.codeforcesHandle && <div>CF: {u.profile.codeforcesHandle}</div>}
                          {!u.profile?.leetcodeHandle && !u.profile?.codeforcesHandle && "--"}
                        </td>
                        <td className="p-3 text-zinc-500 text-[11px] font-mono">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleUserRole.mutate({
                                id: u.id,
                                newRole: u.role === "admin" ? "user" : "admin",
                              })
                            }
                            className="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:text-white"
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. CODING PROBLEMS PANEL */}
        {activeTab === "problems" && (
          <div className="space-y-6">
            {problemView === "list" ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Coding Problem Bank</h2>
                    <p className="text-xs text-zinc-400">Curate programming challenges and test suites</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        resetProblemForm();
                        setProblemView("create");
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Problem
                    </Button>
                  </div>
                </div>

                {isProblemsLoading ? (
                  <p className="text-xs text-zinc-500 py-8 text-center">Loading problem bank...</p>
                ) : (
                  <div className="space-y-2.5">
                    {(problems || []).map((p: any) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-[#0D0F14] border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white truncate">{p.title}</h4>
                            <Badge variant="outline" className={DIFFICULTY_COLORS[p.difficulty]}>
                              {p.difficulty}
                            </Badge>
                            <Badge variant="outline" className={STATUS_COLORS[p.status]}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                            <span>Slug: {p.slug}</span>
                            <span>•</span>
                            <span>Test cases: {p._count?.testCases || 0}</span>
                            <span>•</span>
                            <span>Submissions: {p._count?.submissions || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {p.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => publishProblemMutation.mutate(p.id)}
                              className="h-8 text-xs border-emerald-900 text-emerald-400 hover:bg-emerald-950/20"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProblemMutation.mutate(p.id)}
                            className="h-8 w-8 p-0 border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Create Problem Form */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProblemView("list")}
                      className="h-8 text-xs border-zinc-800"
                    >
                      ← Back to Problems
                    </Button>
                    <h2 className="text-base font-bold text-white">Create New Problem</h2>
                  </div>
                </div>

                {/* AI Problem Generator Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      AI Auto-Generate Problem (Groq Llama-3.3)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        value={generateTopic}
                        onChange={(e) => setGenerateTopic(e.target.value)}
                        placeholder="e.g. Find Kth Smallest Element in a Matrix"
                        className="bg-black/40 border-zinc-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <Button
                        size="sm"
                        disabled={generatingProblem || !generateTopic.trim()}
                        onClick={generateWithAI}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs h-9"
                      >
                        {generatingProblem ? "Generating..." : "Generate Draft"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Problem Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Problem Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Two Sum"
                      className="bg-[#111319] border-zinc-800 text-xs text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Difficulty</Label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full h-9 rounded-lg bg-[#111319] border border-zinc-800 text-xs text-white px-3 mt-1 outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Description</Label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Problem description and statement..."
                    className="w-full rounded-lg bg-[#111319] border border-zinc-800 text-xs text-white p-3 mt-1 outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Constraints</Label>
                    <textarea
                      rows={3}
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="1 <= nums.length <= 10^5"
                      className="w-full rounded-lg bg-[#111319] border border-zinc-800 text-xs text-white p-3 mt-1 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Company Tags (comma separated)</Label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Google, Amazon, Meta"
                      className="bg-[#111319] border-zinc-800 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    onClick={() => setProblemView("list")}
                    className="border-zinc-800 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createProblemMutation.mutate()}
                    disabled={!title.trim() || !description.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6"
                  >
                    Save Problem
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. MCQ QUESTION BANK PANEL */}
        {activeTab === "mcqs" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Assessment MCQ Bank</h2>
                <p className="text-xs text-zinc-400">Questions used in Competitive Arena and Aptitude Rounds</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsNewMcqModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add New MCQ
                </Button>
              </div>
            </div>

            {/* Category & Subject Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mcqCategoryFilter}
                onChange={(e) => setMcqCategoryFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[#12151E] border border-zinc-800 text-xs text-zinc-300 outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CORE_CS">CORE_CS</option>
                <option value="APTITUDE">APTITUDE</option>
              </select>

              <select
                value={mcqSubjectFilter}
                onChange={(e) => setMcqSubjectFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[#12151E] border border-zinc-800 text-xs text-zinc-300 outline-none"
              >
                <option value="ALL">All Subjects</option>
                <option value="DBMS">DBMS</option>
                <option value="OS">Operating Systems</option>
                <option value="CN">Computer Networks</option>
                <option value="OOP">Object Oriented Programming</option>
                <option value="QUANT">Quantitative Aptitude</option>
                <option value="LOGICAL">Logical Reasoning</option>
                <option value="VERBAL">Verbal Ability</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mcqSearch}
                  onChange={(e) => setMcqSearch(e.target.value)}
                  placeholder="Filter by question text..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#12151E] border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {isMcqsLoading ? (
              <p className="text-xs text-zinc-500 py-8 text-center">Loading MCQ bank...</p>
            ) : (
              <div className="space-y-3">
                {(mcqsData || []).map((mcq: any) => (
                  <div
                    key={mcq.id}
                    className="p-4 rounded-xl bg-[#0D0F14] border border-zinc-800/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/25 text-[10px]">
                            {mcq.category}
                          </Badge>
                          <span className="text-xs font-semibold text-zinc-300">
                            {mcq.subject} • {mcq.topic}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{mcq.question}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMcqMutation.mutate(mcq.id)}
                        className="h-8 w-8 p-0 border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Options Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {((mcq.options as string[]) || []).map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                            optIdx === mcq.correctOption
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-semibold"
                              : "bg-black/30 border-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span className="font-mono text-[10px] w-4 text-center">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                          {optIdx === mcq.correctOption && <span className="ml-auto text-[10px]">✓ Correct</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal: Add New MCQ */}
            {isNewMcqModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-xl bg-[#12151F] border border-zinc-800 p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Create Assessment MCQ</h3>
                    <button
                      onClick={() => setIsNewMcqModalOpen(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-zinc-400">Category</Label>
                      <select
                        value={newMcqCategory}
                        onChange={(e) => setNewMcqCategory(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[#0C0E14] border border-zinc-800 text-xs text-white px-2 mt-1"
                      >
                        <option value="CORE_CS">CORE_CS</option>
                        <option value="APTITUDE">APTITUDE</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Subject</Label>
                      <select
                        value={newMcqSubject}
                        onChange={(e) => setNewMcqSubject(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[#0C0E14] border border-zinc-800 text-xs text-white px-2 mt-1"
                      >
                        <option value="DBMS">DBMS</option>
                        <option value="OS">OS</option>
                        <option value="CN">CN</option>
                        <option value="OOP">OOP</option>
                        <option value="QUANT">QUANT</option>
                        <option value="LOGICAL">LOGICAL</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-400">Question Text</Label>
                    <textarea
                      rows={3}
                      value={newMcqQuestion}
                      onChange={(e) => setNewMcqQuestion(e.target.value)}
                      placeholder="What is the time complexity of building a heap from an array of N elements?"
                      className="w-full rounded-lg bg-[#0C0E14] border border-zinc-800 text-xs text-white p-2.5 mt-1 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Options (Select radio for correct answer)</Label>
                    {[0, 1, 2, 3].map((optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctMcq"
                          checked={newMcqCorrect === optIdx}
                          onChange={() => setNewMcqCorrect(optIdx)}
                          className="accent-blue-500"
                        />
                        <span className="font-mono text-xs text-zinc-400 w-4">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <Input
                          value={newMcqOptions[optIdx]}
                          onChange={(e) => {
                            const updated = [...newMcqOptions];
                            updated[optIdx] = e.target.value;
                            setNewMcqOptions(updated);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="bg-[#0C0E14] border-zinc-800 text-xs text-white h-8"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-400">Explanation (Optional)</Label>
                    <Input
                      value={newMcqExplanation}
                      onChange={(e) => setNewMcqExplanation(e.target.value)}
                      placeholder="Bottom-up heap construction runs in O(N) linear time."
                      className="bg-[#0C0E14] border-zinc-800 text-xs text-white h-8 mt-1"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewMcqModalOpen(false)}
                      className="text-xs border-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createMcqMutation.mutate()}
                      disabled={!newMcqQuestion.trim() || newMcqOptions.some((o) => !o.trim())}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5"
                    >
                      Save Question
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CONTEST ROOMS MONITOR PANEL */}
        {activeTab === "rooms" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Contest Rooms</h2>
              <p className="text-xs text-zinc-400">Surveillance over multiplayer coding battles and live sessions</p>
            </div>

            {isRoomsLoading ? (
              <p className="text-xs text-zinc-500 py-8 text-center">Loading active rooms...</p>
            ) : (
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-[#0C0E14]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#10131B] border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Room Code</th>
                      <th className="p-3">Title & Host</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Participants</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(roomsData || []).map((r: any) => (
                      <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                            {r.code}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{r.title}</div>
                          <div className="text-[11px] text-zinc-400">
                            Host: {r.host?.name || "Host"} ({r.host?.email})
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                            {r.type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              r.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                                : r.status === "WAITING"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]"
                                : "bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-zinc-300">
                          {r._count?.participants || 0} / {r.maxParticipants || 10}
                        </td>
                        <td className="p-3 text-right">
                          {r.status !== "FINISHED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => terminateRoomMutation.mutate(r.id)}
                              className="h-7 text-[11px] border-rose-900 text-rose-400 hover:bg-rose-950/20"
                            >
                              Terminate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  </div>
  );
}