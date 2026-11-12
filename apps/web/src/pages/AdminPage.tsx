import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  MessageSquare,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ArrowUpRight,
  Copy,
  Check,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";
import { AdminLearnPanel } from "@/components/admin/AdminLearnPanel";

type AdminTab =
  | "overview"
  | "users"
  | "problems"
  | "mcqs"
  | "interviews"
  | "submissions"
  | "rooms"
  | "learn";

const PANELS: Array<{
  id: AdminTab;
  label: string;
  description: string;
  icon: any;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "System KPIs, runtime & health",
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
    id: "interviews",
    label: "Mock Interviews",
    description: "Surveillance of AI simulations & scores",
    icon: MessageSquare,
  },
  {
    id: "submissions",
    label: "Code Submissions",
    description: "Platform judge log & verdicts",
    icon: FileCode2,
  },
  {
    id: "rooms",
    label: "Contest Rooms",
    description: "Live multiplayer battle surveillance",
    icon: Swords,
  },
  {
    id: "learn",
    label: "Learn & Revise",
    description: "Curriculum tracks, concepts & revisions",
    icon: GraduationCap,
  },
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const LANGUAGES = ["JAVASCRIPT", "PYTHON", "CPP", "JAVA", "TYPESCRIPT"];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-[var(--status-success)] border-[var(--status-success)]/30 bg-[var(--status-success-soft)]",
  MEDIUM: "text-[var(--status-warning)] border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10",
  HARD: "text-[var(--status-danger)] border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-[var(--text-secondary)] border-[var(--border-control)] bg-[var(--surface-muted)]",
  published: "text-[var(--status-success)] border-[var(--status-success)]/30 bg-[var(--status-success-soft)]",
  archived: "text-[var(--status-danger)] border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10",
};

const RECOMMENDATION_STYLES: Record<string, string> = {
  STRONG_HIRE: "bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/30",
  HIRE: "bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/30",
  LEAN_HIRE: "bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30",
  LEAN_NO_HIRE: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  NO_HIRE: "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30",
};

const VERDICT_STYLES: Record<string, { label: string; badge: string }> = {
  ACCEPTED: {
    label: "Accepted",
    badge: "bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/30",
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    badge: "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30",
  },
  TIME_LIMIT_EXCEEDED: {
    label: "TLE",
    badge: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: "MLE",
    badge: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  },
  RUNTIME_ERROR: {
    label: "Runtime Error",
    badge: "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30",
  },
  COMPILATION_ERROR: {
    label: "Compile Error",
    badge: "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30",
  },
  PENDING: {
    label: "Pending",
    badge: "bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30",
  },
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

  const VALID_TABS: AdminTab[] = [
    "overview",
    "users",
    "problems",
    "mcqs",
    "interviews",
    "submissions",
    "rooms",
    "learn",
  ];
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
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userPointsInput, setUserPointsInput] = useState<number>(0);
  const [userStreakInput, setUserStreakInput] = useState<number>(0);

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

  const saveUserPointsMutation = useMutation({
    mutationFn: async ({ id, points, streakCount }: { id: string; points: number; streakCount: number }) => {
      await api.put(`/admin/users/${id}/points`, { points, streakCount });
    },
    onSuccess: () => {
      toast.success("User points and streak updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
    onError: () => toast.error("Failed to update user points"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      toast.success("Candidate account removed");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to delete user"),
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

  // ─── MOCK INTERVIEWS PANEL ───────────────────────────────────────────
  const [interviewSearch, setInterviewSearch] = useState("");
  const [inspectingInterview, setInspectingInterview] = useState<any | null>(null);
  const { data: interviewsData, isLoading: isInterviewsLoading } = useQuery({
    queryKey: ["admin-interviews", interviewSearch],
    queryFn: async () => {
      const res = await api.get(
        `/admin/interviews${interviewSearch ? `?search=${encodeURIComponent(interviewSearch)}` : ""}`
      );
      return res.data.interviews;
    },
    enabled: Boolean(isAdmin && activeTab === "interviews"),
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/interviews/${id}`);
    },
    onSuccess: () => {
      toast.info("Mock interview record removed");
      queryClient.invalidateQueries({ queryKey: ["admin-interviews"] });
    },
  });

  // ─── CODE SUBMISSIONS PANEL ──────────────────────────────────────────
  const [submissionVerdictFilter, setSubmissionVerdictFilter] = useState("ALL");
  const [viewingSubmissionCode, setViewingSubmissionCode] = useState<any | null>(null);
  const [copiedSubmissionCode, setCopiedSubmissionCode] = useState(false);

  const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ["admin-submissions", submissionVerdictFilter],
    queryFn: async () => {
      const res = await api.get(
        `/admin/submissions${submissionVerdictFilter !== "ALL" ? `?verdict=${submissionVerdictFilter}` : ""}`
      );
      return res.data.submissions;
    },
    enabled: Boolean(isAdmin && activeTab === "submissions"),
  });

  if (!isSessionPending && !isProfileStatsLoading && !isAdmin) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)] p-6 font-sans">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 text-[var(--status-danger)] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Access Denied</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              This area is restricted to administrators only. Your current candidate account does not have management CMS permissions.
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] text-xs h-9"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentPanelMeta = PANELS.find((p) => p.id === activeTab) || PANELS[0];

  return (
    <div className="min-h-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* ─── Top Admin Bar ───────────────────────────────────────────── */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-text)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Admin CMS</span>
              <span className="text-[var(--text-muted)]">/</span>
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                {currentPanelMeta.label}
              </h1>
              <Badge variant="outline" className="border-[var(--border-control)] bg-[var(--surface-muted)] text-[var(--text-secondary)] text-[10px] font-mono ml-1">
                Internal
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {currentPanelMeta.description}
            </p>
          </div>
        </div>

        {/* Mobile Horizontal Module Switcher */}
        <div className="flex md:hidden items-center gap-1 p-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] overflow-x-auto custom-scrollbar">
          {PANELS.map((p) => {
            const Icon = p.icon;
            const isSelected = activeTab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchTab(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[var(--surface)] text-[var(--text-primary)] font-semibold shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Platform Global Quick Access Bar ────────────────────────── */}
      <div className="bg-[var(--surface-muted)]/60 border-b border-[var(--border-subtle)] px-5 py-2 flex items-center justify-between gap-4 overflow-x-auto text-[11px] font-medium custom-scrollbar shrink-0 select-none">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">
            Platform Hubs:
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/practice"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Practice Hub</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Dashboard</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/interview"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>AI Interview</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/rooms"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Battle Arena</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/notes"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Notes Hub</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/bookmarks"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Bookmarks</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Candidate Profile</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
          </Link>
        </div>
      </div>

      {/* ─── Multi-Panel Body (Sub-panel rail + Active workspace) ────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sub-Panel Navigation Rail (Desktop) */}
        <aside className="w-64 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface)] p-3 hidden md:flex flex-col justify-between select-none">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left group cursor-pointer ${
                    isSelected
                      ? "bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold border border-[var(--border-control)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? "text-[var(--accent-text)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate font-normal">
                      {p.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-mono">
            <div className="text-[var(--text-primary)] font-semibold text-xs">Role: Administrator</div>
            <div className="text-[var(--status-success)] text-[10px] mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
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
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">System Overview</h2>
                <p className="text-xs text-[var(--text-secondary)]">Live platform totals and infrastructure metrics</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchStats()}
                className="h-8 border-[var(--border-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>

            {isStatsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Total Users</span>
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 block">
                      {statsData?.totalUsers ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Coding Problems</span>
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 block">
                      {statsData?.totalProblems ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Assessment MCQs</span>
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 block">
                      {statsData?.totalMcqs ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">AI Mock Interviews</span>
                    <span className="text-2xl font-bold font-mono text-[var(--accent-text)] mt-1 block">
                      {statsData?.totalInterviews ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Code Submissions</span>
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 block">
                      {statsData?.totalSubmissions ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Contest Rooms</span>
                    <span className="text-2xl font-bold font-mono text-[var(--status-success)] mt-1 block">
                      {statsData?.activeRooms ?? 0} <span className="text-xs text-[var(--text-muted)] font-normal">/ {statsData?.totalRooms ?? 0}</span>
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Candidate Notes</span>
                    <span className="text-2xl font-bold font-mono text-[var(--status-warning)] mt-1 block">
                      {statsData?.totalNotes ?? 0}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--surface)] border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">Revision Bookmarks</span>
                    <span className="text-2xl font-bold font-mono text-[var(--accent-text)] mt-1 block">
                      {statsData?.totalBookmarks ?? 0}
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Service Infrastructure Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[var(--accent-text)]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">Database Cluster</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">PostgreSQL Prisma Client</p>
                  </div>
                </div>
                <Badge className="bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/30 text-[10px]">
                  Online
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-[var(--accent-text)]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">Bun Runtime Uptime</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                      {statsData?.uptimeSeconds ? `${Math.floor(statsData.uptimeSeconds / 60)} minutes` : "--"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30 text-[10px]">
                  Healthy
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-[var(--status-warning)]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">Server Memory (RSS)</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">{statsData?.memoryRssMb ?? 0} MB</p>
                  </div>
                </div>
                <Badge className="bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-control)] text-[10px]">
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
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Candidate User Management</h2>
                <p className="text-xs text-[var(--text-secondary)]">Inspect registered users, streaks, points, and administrative roles</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)]"
                />
              </div>
            </div>

            {isUsersLoading ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading users...</p>
            ) : (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[11px]">
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
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(usersData || []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-[var(--text-primary)]">{u.name || "Anonymous"}</div>
                          <div className="text-[11px] text-[var(--text-secondary)] font-mono">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              u.role === "admin"
                                ? "bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30 text-[10px]"
                                : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-control)] text-[10px]"
                            }
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-[var(--status-warning)]">
                          {u.profile?.points ?? 0}
                        </td>
                        <td className="p-3 font-mono text-[var(--text-secondary)]">
                          {u.profile?.streakCount ?? 0}d
                        </td>
                        <td className="p-3 text-[11px] font-mono text-[var(--text-secondary)]">
                          {u.profile?.leetcodeHandle && <div>LC: {u.profile.leetcodeHandle}</div>}
                          {u.profile?.codeforcesHandle && <div>CF: {u.profile.codeforcesHandle}</div>}
                          {!u.profile?.leetcodeHandle && !u.profile?.codeforcesHandle && "--"}
                        </td>
                        <td className="p-3 text-[var(--text-muted)] text-[11px] font-mono">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(u);
                                setUserPointsInput(u.profile?.points ?? 0);
                                setUserStreakInput(u.profile?.streakCount ?? 0);
                              }}
                              className="h-7 text-[11px] border-[var(--border-control)] text-[var(--status-warning)] hover:bg-[var(--status-warning)]/10"
                              title="Edit points & streak"
                            >
                              Balance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toggleUserRole.mutate({
                                  id: u.id,
                                  newRole: u.role === "admin" ? "user" : "admin",
                                })
                              }
                              className="h-7 text-[11px] border-[var(--border-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              {u.role === "admin" ? "Demote" : "Make Admin"}
                            </Button>
                            {u.role !== "admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user "${u.email}"? This permanently purges their account, submissions, and records.`)) {
                                    deleteUserMutation.mutate(u.id);
                                  }
                                }}
                                className="h-7 text-[11px] border-[var(--border-control)] text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
                                title="Delete candidate account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: Adjust User Balance */}
            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Adjust Candidate Balance</h3>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono">{editingUser.email}</p>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-[var(--text-secondary)]">Intervue Points (XP)</Label>
                      <Input
                        type="number"
                        value={userPointsInput}
                        onChange={(e) => setUserPointsInput(parseInt(e.target.value) || 0)}
                        className="bg-[var(--surface-muted)] border-[var(--border-control)] text-xs text-[var(--text-primary)] h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--text-secondary)]">Current Streak (Days)</Label>
                      <Input
                        type="number"
                        value={userStreakInput}
                        onChange={(e) => setUserStreakInput(parseInt(e.target.value) || 0)}
                        className="bg-[var(--surface-muted)] border-[var(--border-control)] text-xs text-[var(--text-primary)] h-8 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(null)}
                      className="text-xs border-[var(--border-control)] text-[var(--text-secondary)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={saveUserPointsMutation.isPending}
                      onClick={() =>
                        saveUserPointsMutation.mutate({
                          id: editingUser.id,
                          points: userPointsInput,
                          streakCount: userStreakInput,
                        })
                      }
                      className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs px-4"
                    >
                      {saveUserPointsMutation.isPending ? "Saving..." : "Save Balance"}
                    </Button>
                  </div>
                </div>
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
                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Coding Problem Bank</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Curate programming challenges and test suites</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        resetProblemForm();
                        setProblemView("create");
                      }}
                      className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Problem
                    </Button>
                  </div>
                </div>

                {isProblemsLoading ? (
                  <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading problem bank...</p>
                ) : (
                  <div className="space-y-2.5">
                    {(problems || []).map((p: any) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 hover:border-[var(--border-control)] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.title}</h4>
                            <Badge variant="outline" className={DIFFICULTY_COLORS[p.difficulty]}>
                              {p.difficulty}
                            </Badge>
                            <Badge variant="outline" className={STATUS_COLORS[p.status]}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1 flex items-center gap-2">
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
                              className="h-8 text-xs border-[var(--status-success)]/40 text-[var(--status-success)] hover:bg-[var(--status-success-soft)]"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProblemMutation.mutate(p.id)}
                            className="h-8 w-8 p-0 border-[var(--border-control)] text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:border-[var(--status-danger)]/40"
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
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProblemView("list")}
                      className="h-8 text-xs border-[var(--border-control)] text-[var(--text-primary)]"
                    >
                      ← Back to Problems
                    </Button>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">Create New Problem</h2>
                  </div>
                </div>

                {/* AI Problem Generator Card */}
                <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--action-primary)]/25 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      AI Auto-Generate Problem (Groq Llama-3.3)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        value={generateTopic}
                        onChange={(e) => setGenerateTopic(e.target.value)}
                        placeholder="e.g. Find Kth Smallest Element in a Matrix"
                        className="bg-[var(--surface)] border-[var(--border-control)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <Button
                        size="sm"
                        disabled={generatingProblem || !generateTopic.trim()}
                        onClick={generateWithAI}
                        className="w-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs h-9"
                      >
                        {generatingProblem ? "Generating..." : "Generate Draft"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Problem Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[var(--text-secondary)]">Problem Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Two Sum"
                      className="bg-[var(--surface)] border-[var(--border-control)] text-xs text-[var(--text-primary)] mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[var(--text-secondary)]">Difficulty</Label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full h-9 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] px-3 mt-1 outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-[var(--text-secondary)]">Description</Label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Problem description and statement..."
                    className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] p-3 mt-1 outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[var(--text-secondary)]">Constraints</Label>
                    <textarea
                      rows={3}
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="1 <= nums.length <= 10^5"
                      className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] p-3 mt-1 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[var(--text-secondary)]">Company Tags (comma separated)</Label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Google, Amazon, Meta"
                      className="bg-[var(--surface)] border-[var(--border-control)] text-xs text-[var(--text-primary)] mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <Button
                    variant="outline"
                    onClick={() => setProblemView("list")}
                    className="border-[var(--border-control)] text-[var(--text-secondary)] text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createProblemMutation.mutate()}
                    disabled={!title.trim() || !description.trim()}
                    className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs px-6"
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
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Assessment MCQ Bank</h2>
                <p className="text-xs text-[var(--text-secondary)]">Questions used in Competitive Arena and Aptitude Rounds</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsNewMcqModalOpen(true)}
                  className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs h-8"
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
                className="h-8 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CORE_CS">CORE_CS</option>
                <option value="APTITUDE">APTITUDE</option>
              </select>

              <select
                value={mcqSubjectFilter}
                onChange={(e) => setMcqSubjectFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] outline-none"
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
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mcqSearch}
                  onChange={(e) => setMcqSearch(e.target.value)}
                  placeholder="Filter by question text..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)]"
                />
              </div>
            </div>

            {isMcqsLoading ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading MCQ bank...</p>
            ) : (
              <div className="space-y-3">
                {(mcqsData || []).map((mcq: any) => (
                  <div
                    key={mcq.id}
                    className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/25 text-[10px]">
                            {mcq.category}
                          </Badge>
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            {mcq.subject} • {mcq.topic}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{mcq.question}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMcqMutation.mutate(mcq.id)}
                        className="h-8 w-8 p-0 border-[var(--border-control)] text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:border-[var(--status-danger)]/40 shrink-0"
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
                              ? "bg-[var(--status-success-soft)] border-[var(--status-success)]/40 text-[var(--status-success)] font-semibold"
                              : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Create Assessment MCQ</h3>
                    <button
                      onClick={() => setIsNewMcqModalOpen(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[var(--text-secondary)]">Category</Label>
                      <select
                        value={newMcqCategory}
                        onChange={(e) => setNewMcqCategory(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] px-2 mt-1"
                      >
                        <option value="CORE_CS">CORE_CS</option>
                        <option value="APTITUDE">APTITUDE</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--text-secondary)]">Subject</Label>
                      <select
                        value={newMcqSubject}
                        onChange={(e) => setNewMcqSubject(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] px-2 mt-1"
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
                    <Label className="text-xs text-[var(--text-secondary)]">Question Text</Label>
                    <textarea
                      rows={3}
                      value={newMcqQuestion}
                      onChange={(e) => setNewMcqQuestion(e.target.value)}
                      placeholder="What is the time complexity of building a heap from an array of N elements?"
                      className="w-full rounded-lg bg-[var(--surface-muted)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] p-2.5 mt-1 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--text-secondary)]">Options (Select radio for correct answer)</Label>
                    {[0, 1, 2, 3].map((optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctMcq"
                          checked={newMcqCorrect === optIdx}
                          onChange={() => setNewMcqCorrect(optIdx)}
                          className="accent-[var(--action-primary)]"
                        />
                        <span className="font-mono text-xs text-[var(--text-secondary)] w-4">
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
                          className="bg-[var(--surface-muted)] border-[var(--border-control)] text-xs text-[var(--text-primary)] h-8"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs text-[var(--text-secondary)]">Explanation (Optional)</Label>
                    <Input
                      value={newMcqExplanation}
                      onChange={(e) => setNewMcqExplanation(e.target.value)}
                      placeholder="Bottom-up heap construction runs in O(N) linear time."
                      className="bg-[var(--surface-muted)] border-[var(--border-control)] text-xs text-[var(--text-primary)] h-8 mt-1"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewMcqModalOpen(false)}
                      className="text-xs border-[var(--border-control)] text-[var(--text-secondary)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createMcqMutation.mutate()}
                      disabled={!newMcqQuestion.trim() || newMcqOptions.some((o) => !o.trim())}
                      className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs px-5"
                    >
                      Save Question
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. MOCK INTERVIEWS SURVEILLANCE PANEL */}
        {activeTab === "interviews" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">AI Mock Interviews Surveillance</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Inspect candidate simulation runs, conversation depth, and AI scorecard evaluations
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <Input
                  placeholder="Search candidate or role..."
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-[var(--surface)] border-[var(--border-control)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            {isInterviewsLoading ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading interview simulation logs...</p>
            ) : (interviewsData || []).length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                No mock interviews recorded matching your query.
              </div>
            ) : (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Role & Tech Stack</th>
                      <th className="p-3">Level & Mode</th>
                      <th className="p-3">Score & Outcome</th>
                      <th className="p-3">Messages</th>
                      <th className="p-3">Conducted</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(interviewsData || []).map((iv: any) => (
                      <tr key={iv.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-[var(--text-primary)]">{iv.user?.name || "Candidate"}</div>
                          <div className="text-[11px] text-[var(--text-secondary)] font-mono">{iv.user?.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[var(--text-primary)]">{iv.role}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(iv.techStack || []).map((t: string) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[10px] font-mono text-[var(--text-secondary)]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="border-[var(--border-control)] text-[var(--text-secondary)] text-[10px]">
                              {iv.difficulty || iv.level || "mid"}
                            </Badge>
                            <Badge variant="outline" className="border-[var(--border-subtle)] text-[var(--text-muted)] text-[10px]">
                              {iv.mode || iv.type || "technical"}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          {iv.evaluation || iv.score != null ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[var(--status-success)]">
                                  {iv.evaluation?.score ?? iv.score ?? "--"}/100
                                </span>
                                {iv.evaluation?.feedback && (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30">
                                    Evaluated
                                  </Badge>
                                )}
                              </div>
                              <button
                                onClick={() => setInspectingInterview(iv)}
                                className="text-[10px] text-[var(--accent-text)] hover:underline underline-offset-2 cursor-pointer"
                              >
                                View Scorecard
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">In progress / pending</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[var(--text-secondary)]">
                          {iv._count?.messages || 0} msgs
                        </td>
                        <td className="p-3 text-[var(--text-muted)] text-[11px] font-mono">
                          {formatDistanceToNow(new Date(iv.createdAt), { addSuffix: true })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {iv.evaluation && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInspectingInterview(iv)}
                                className="h-7 text-[11px] border-[var(--border-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                Details
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("Delete this mock interview simulation?")) {
                                  deleteInterviewMutation.mutate(iv.id);
                                }
                              }}
                              className="h-7 text-[11px] border-[var(--border-control)] text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: View Interview Scorecard Details */}
            {inspectingInterview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Evaluation Scorecard</h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {inspectingInterview.user?.name} • {inspectingInterview.role} ({inspectingInterview.level})
                      </p>
                    </div>
                    <button
                      onClick={() => setInspectingInterview(null)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
                      <div>
                        <span className="text-[var(--text-secondary)] block text-[11px]">Overall Score</span>
                        <span className="text-lg font-mono font-bold text-[var(--status-success)]">
                          {inspectingInterview.evaluation?.score ?? inspectingInterview.score ?? "--"}/100
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[var(--text-secondary)] block text-[11px]">Status</span>
                        <Badge className="text-xs bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-control)]">
                          {inspectingInterview.status || "COMPLETED"}
                        </Badge>
                      </div>
                    </div>

                    {inspectingInterview.evaluation?.feedback && (
                      <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">
                          Executive Feedback
                        </span>
                        <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                          {inspectingInterview.evaluation.feedback}
                        </p>
                      </div>
                    )}

                    {inspectingInterview.evaluation?.strengths?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[var(--status-success-soft)] border border-[var(--status-success)]/30">
                        <span className="text-[11px] font-bold text-[var(--status-success)] block mb-1.5 uppercase tracking-wider">
                          Key Strengths
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[var(--text-primary)]">
                          {inspectingInterview.evaluation.strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(inspectingInterview.evaluation?.improvements?.length > 0 || inspectingInterview.evaluation?.weaknesses?.length > 0) && (
                      <div className="p-3 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30">
                        <span className="text-[11px] font-bold text-[var(--status-danger)] block mb-1.5 uppercase tracking-wider">
                          Areas For Improvement
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[var(--text-primary)]">
                          {(inspectingInterview.evaluation?.improvements || inspectingInterview.evaluation?.weaknesses || []).map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
                    <Button
                      size="sm"
                      onClick={() => setInspectingInterview(null)}
                      className="bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] text-xs px-4"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. CODE SUBMISSIONS PANEL */}
        {activeTab === "submissions" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Code Submissions & Judge Log</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Live surveillance over testcase judge evaluations, runtimes, memory usage, and code submissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={submissionVerdictFilter}
                  onChange={(e) => setSubmissionVerdictFilter(e.target.value)}
                  className="h-8 rounded-lg bg-[var(--surface)] border border-[var(--border-control)] text-xs text-[var(--text-primary)] px-2.5 outline-none font-mono"
                >
                  <option value="ALL">All Verdicts</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="WRONG_ANSWER">WRONG_ANSWER</option>
                  <option value="TIME_LIMIT_EXCEEDED">TIME_LIMIT_EXCEEDED</option>
                  <option value="MEMORY_LIMIT_EXCEEDED">MEMORY_LIMIT_EXCEEDED</option>
                  <option value="RUNTIME_ERROR">RUNTIME_ERROR</option>
                  <option value="COMPILATION_ERROR">COMPILATION_ERROR</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            {isSubmissionsLoading ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading code submission logs...</p>
            ) : (submissionsData || []).length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                No code submissions found matching the selected filter.
              </div>
            ) : (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Problem</th>
                      <th className="p-3">Verdict</th>
                      <th className="p-3">Language</th>
                      <th className="p-3">Runtime & Memory</th>
                      <th className="p-3">Test Cases</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(submissionsData || []).map((sub: any) => {
                      const verdictStyle =
                        VERDICT_STYLES[sub.verdict] || {
                          label: sub.verdict,
                          badge: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-control)]",
                        };

                      return (
                        <tr key={sub.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-[var(--text-primary)]">{sub.user?.name || "Candidate"}</div>
                            <div className="text-[11px] text-[var(--text-secondary)] font-mono">{sub.user?.email}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                              <span>{sub.problem?.title || "Problem"}</span>
                              {sub.problem?.difficulty && (
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1 py-0 ${
                                    DIFFICULTY_COLORS[sub.problem.difficulty] || ""
                                  }`}
                                >
                                  {sub.problem.difficulty}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">{sub.problem?.slug}</div>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-[10px] font-mono ${verdictStyle.badge}`}>
                              {verdictStyle.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="border-[var(--border-control)] text-[var(--text-secondary)] font-mono text-[10px]">
                              {sub.language}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[var(--text-secondary)]">
                            <div>{sub.runtime != null ? `${sub.runtime} ms` : "--"}</div>
                            <div>{sub.memory != null ? `${(sub.memory / 1024).toFixed(1)} MB` : "--"}</div>
                          </td>
                          <td className="p-3 font-mono text-[var(--text-secondary)]">
                            {sub.testCasesPassed != null && sub.totalTestCases != null ? (
                              <span>
                                {sub.testCasesPassed}/{sub.totalTestCases}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="p-3 text-[var(--text-muted)] text-[11px] font-mono">
                            {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingSubmissionCode(sub)}
                              className="h-7 text-[11px] border-[var(--border-control)] text-[var(--accent-text)] hover:bg-[var(--accent-soft)]"
                            >
                              <Eye className="w-3 h-3 mr-1" /> View Code
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: View Submission Code */}
            {viewingSubmissionCode && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                          {viewingSubmissionCode.problem?.title || "Submission Code"}
                        </h3>
                        <Badge
                          className={`text-[10px] font-mono ${
                            VERDICT_STYLES[viewingSubmissionCode.verdict]?.badge || "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {viewingSubmissionCode.verdict}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Candidate: {viewingSubmissionCode.user?.name} ({viewingSubmissionCode.user?.email}) • Language: {viewingSubmissionCode.language}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingSubmissionCode(null)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {viewingSubmissionCode.error && (
                    <div className="p-3 rounded-lg bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-[var(--status-danger)] text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {viewingSubmissionCode.error}
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-muted)] border-t border-l border-r border-[var(--border-subtle)] rounded-t-lg text-[11px] text-[var(--text-secondary)] font-mono">
                      <span>Source Code ({viewingSubmissionCode.language})</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(viewingSubmissionCode.code);
                          setCopiedSubmissionCode(true);
                          setTimeout(() => setCopiedSubmissionCode(false), 2000);
                        }}
                        className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        {copiedSubmissionCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />
                            <span className="text-[var(--status-success)]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-b-lg font-mono text-xs text-[var(--text-primary)] overflow-x-auto max-h-[400px] leading-relaxed">
                      <code>{viewingSubmissionCode.code}</code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>Runtime: {viewingSubmissionCode.runtime != null ? `${viewingSubmissionCode.runtime} ms` : "--"}</span>
                      <span>•</span>
                      <span>Memory: {viewingSubmissionCode.memory != null ? `${(viewingSubmissionCode.memory / 1024).toFixed(1)} MB` : "--"}</span>
                      <span>•</span>
                      <span>
                        Cases:{" "}
                        {viewingSubmissionCode.testCasesPassed != null
                          ? `${viewingSubmissionCode.testCasesPassed}/${viewingSubmissionCode.totalTestCases}`
                          : "--"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setViewingSubmissionCode(null)}
                      className="bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] text-xs px-4"
                    >
                      Close
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
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Active Contest Rooms</h2>
              <p className="text-xs text-[var(--text-secondary)]">Surveillance over multiplayer coding battles and live sessions</p>
            </div>

            {isRoomsLoading ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading active rooms...</p>
            ) : (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Room Code</th>
                      <th className="p-3">Title & Host</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Participants</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(roomsData || []).map((r: any) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--surface-muted)] border border-[var(--border-control)]">
                            {r.code}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-[var(--text-primary)]">{r.title}</div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            Host: {r.host?.name || "Host"} ({r.host?.email})
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border-[var(--border-control)] text-[var(--text-secondary)] text-[10px]">
                            {r.type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              r.status === "ACTIVE"
                                ? "bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/30 text-[10px]"
                                : r.status === "WAITING"
                                ? "bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--action-primary)]/30 text-[10px]"
                                : "bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border-control)] text-[10px]"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[var(--text-secondary)]">
                          {r._count?.participants || 0} / {r.maxParticipants || 10}
                        </td>
                        <td className="p-3 text-right">
                          {r.status !== "FINISHED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => terminateRoomMutation.mutate(r.id)}
                              className="h-7 text-[11px] border-[var(--status-danger)]/40 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
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

        {/* ─── Learn & Revise Hub CMS Panel ───────────────────────── */}
        {activeTab === "learn" && <AdminLearnPanel />}
      </main>
    </div>
  </div>
  );
}