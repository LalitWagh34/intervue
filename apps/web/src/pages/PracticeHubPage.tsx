import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFeaturedCompanies, useCompanyQuestions } from "@/hooks/useCompanies";
import { getCompanyLogo } from "@/lib/companyLogos";
import { BrandIcon } from "@/components/shared/BrandLogo";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProblemFilter } from "@/hooks/useProblemFilter";
import { AdvancedFilterPopover } from "@/components/shared/AdvancedFilterPopover";
import { QuestionNoteDrawer } from "@/components/shared/QuestionNoteDrawer";
import { useBookmarkSlugs, useToggleBookmark } from "@/hooks/useBookmarks";
import { useCompanyReadiness } from "@/hooks/useReadiness";
import { CompanyKitsCatalog } from "@/components/company/CompanyKitsCatalog";
import { CompanyKitWorkspace } from "@/components/company/CompanyKitWorkspace";
import { useDailyTargets } from "@/hooks/useDailyTargets";
import { toast } from "sonner";
import {
  Code2,
  BookOpen,
  CheckCircle2,
  Search,
  ChevronRight,
  Flame,
  Swords,
  Layers,
  Cpu,
  Database,
  Building2,
  Coins,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Shuffle,
  Clock,
  TrendingUp,
  LayoutGrid,
  Zap,
  NotebookPen,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SHEET DATASETS
// ============================================================================

export interface DsaProblem {
  id: string;
  index: number;
  title: string;
  slug: string;
  difficulty: "Basic" | "Core" | "Hard";
  topic: string;
  subtopic?: string;
  moreTopics?: number;
  companies: string[];
  isPotd?: boolean;
  link?: string;
  videoUrl?: string;
}

export interface SheetMeta {
  id: string;
  subjectId: "dsa" | "system_design" | "core_cs";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: "blue" | "emerald" | "amber" | "purple";
  problemCount: number;
  estimatedHours: string;
  problems: DsaProblem[];
}

// We now fetch this dynamically from the backend
const fetchSheets = async () => {
  const res = await api.get('/sheets');
  return res.data;
};

const TOP_COMPANIES_PRESET = [
  { name: "Amazon", count: 443, global: true },
  { name: "Google", count: 447, global: true },
  { name: "Meta", count: 357, global: true },
  { name: "Uber", count: 433, global: true },
  { name: "Microsoft", count: 466, global: true },
  { name: "Oracle", count: 431, global: true },
  { name: "Apple", count: 400, global: true },
  { name: "Adobe", count: 404, global: true },
  { name: "Netflix", count: 120, global: true },
  { name: "Accenture", count: 130, global: true },
  { name: "Flipkart", count: 260, global: false },
  { name: "Swiggy", count: 185, global: false },
  { name: "Zomato", count: 140, global: false },
  { name: "CRED", count: 95, global: false },
];

export default function PracticeHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { completedCount: dailyCompleted, totalCount: dailyTotal } = useDailyTargets();

  // Target Company Readiness
  const { data: readinessData } = useCompanyReadiness();

  // Navigation View State:
  // - "hub": The root Prephub overview with Explore Subjects list
  // - "sheets_catalog": Multiple sheets view for a subject (DSA / Core CS)
  // - "sheet_practice": The problem set table for a specific sheet
  // - "company_wise": The dedicated 470+ company question explorer
  // - "company_kits_catalog": Curated company sheets catalog with cards & filters
  // - "company_kit_workspace": Deep Codolio-style workspace with pattern donuts & rounds
  const [currentView, setCurrentView] = useState<
    | "hub"
    | "sheets_catalog"
    | "sheet_practice"
    | "company_wise"
    | "company_kits_catalog"
    | "company_kit_workspace"
    | "coming_soon"
  >("hub");

  // Selected Subject ("dsa" | "core_cs")
  const [selectedSubject, setSelectedSubject] = useState<"dsa" | "core_cs">("dsa");

  // Selected Sheet inside subject
  const [selectedSheetId, setSelectedSheetId] = useState<string>("striver-a2z");

  // Company-Wise State
  const { data: featuredCompaniesData } = useFeaturedCompanies();
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("thirtyDays");
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");
  const [companyTabFilter, setCompanyTabFilter] = useState<"global" | "indian">("global");
  const [companyPage, setCompanyPage] = useState<number>(1);
  const [companyPageSize, setCompanyPageSize] = useState<number>(25);

  useEffect(() => {
    setCompanyPage(1);
  }, [selectedCompany, selectedTimeframe, companySearchQuery, companyStatusFilter]);

  // Deep linking and URL synchronization
  useEffect(() => {
    const viewParam = searchParams.get("view");
    const companyParam = searchParams.get("company");

    if (viewParam === "company_kit" && companyParam) {
      setSelectedCompany(companyParam);
      setCurrentView("company_kit_workspace");
    } else if (viewParam === "company_kits" || viewParam === "company_kits_catalog") {
      setCurrentView("company_kits_catalog");
    } else if (viewParam === "company_wise") {
      if (companyParam) setSelectedCompany(companyParam);
      setCurrentView("company_wise");
    } else if (viewParam === "sheets_catalog") {
      const subjectParam = searchParams.get("subject") as "dsa" | "core_cs";
      if (subjectParam) setSelectedSubject(subjectParam);
      setCurrentView("sheets_catalog");
    } else if (viewParam === "sheet_practice") {
      const sheetParam = searchParams.get("sheet");
      if (sheetParam) setSelectedSheetId(sheetParam.replace(/_/g, "-"));
      setCurrentView("sheet_practice");
    } else if (viewParam === "coming_soon") {
      setCurrentView("coming_soon");
    }
  }, [searchParams]);

  const { data: companyQuestionsData, isLoading: isCompanyLoading } = useCompanyQuestions(
    selectedCompany,
    selectedTimeframe
  );

  const {
    data: sheetsData,
    isLoading: isSheetsLoading,
    isError: isSheetsError,
    refetch: refetchSheets,
  } = useQuery({
    queryKey: ["sheets"],
    queryFn: fetchSheets,
  });

  const dynamicSheets: SheetMeta[] = sheetsData?.sheets || [];
  const globalStats = sheetsData?.stats || { totalUsers: 0, curatedSubjects: 0, activeThisMonth: 0 };

  // Solved state persisted in localStorage
  const [solvedProblems, setSolvedProblems] = useState<Record<string, boolean>>({});

  // Fetch solved problems from backend on mount
  useEffect(() => {
    const fetchSolved = async () => {
      try {
        const res = await api.get("/profile/solved-problems");
        setSolvedProblems(res.data.solvedProblems || {});
      } catch {
        // fallback to localstorage if api fails
        try {
          const saved = localStorage.getItem("tuf_solved_problems");
          if (saved) setSolvedProblems(JSON.parse(saved));
        } catch {}
      }
    };
    fetchSolved();
  }, []);

  const toggleSolved = async (id: string, e: React.MouseEvent, difficulty: string = "EASY", tags: string[] = []) => {
    e.stopPropagation();

    const wasSolved = Boolean(solvedProblems[id]);
    const isNowSolved = !wasSolved;
    setSolvedProblems((prev) => {
      const next = { ...prev, [id]: isNowSolved };
      try {
        localStorage.setItem("tuf_solved_problems", JSON.stringify(next));
      } catch {}
      return next;
    });

    // API Sync
    try {
      await api.post("/profile/sync-solved", {
        solvedKey: id,
        isSolved: isNowSolved,
        difficulty,
        tags
      });
    } catch (err) {
      console.error("Failed to sync solved problem:", err);
      setSolvedProblems((prev) => {
        const reverted = { ...prev, [id]: wasSolved };
        try {
          localStorage.setItem("tuf_solved_problems", JSON.stringify(reverted));
        } catch {}
        return reverted;
      });
      toast.error("Failed to sync solved status. Changes were reverted.");
    }
  };

  // Bookmarks & Notes state
  const { data: bookmarkedSlugs = [] } = useBookmarkSlugs();
  const toggleBookmark = useToggleBookmark();

  const [activeNoteTarget, setActiveNoteTarget] = useState<{
    isOpen: boolean;
    slug: string;
    title: string;
  }>({
    isOpen: false,
    slug: "",
    title: "",
  });

  const handleToggleBookmark = async (
    problemSlug: string,
    problemTitle: string,
    difficulty: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    try {
      const res = await toggleBookmark.mutateAsync({
        problemSlug,
        problemTitle,
        difficulty,
      });
      if (res.bookmarked) {
        toast.success(`Bookmarked "${problemTitle}" for revision`);
      } else {
        toast.info(`Removed "${problemTitle}" from bookmarks`);
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || "Failed to update bookmark"; console.error("Bookmark error:", err); toast.error(msg);
    }
  };

  // Get active sheet metadata
  const currentSheet = useMemo(() => {
    return dynamicSheets.find((s) => s.id === selectedSheetId) || dynamicSheets[0];
  }, [selectedSheetId, dynamicSheets]);

  // Sheets belonging to current subject
  const currentSubjectSheets = useMemo(() => {
    return dynamicSheets.filter((s) => s.subjectId === selectedSubject);
  }, [selectedSubject, dynamicSheets]);

  // Active sheet problem metrics
  const activeSheetProblems = currentSheet?.problems || [];
  const sheetTotalCount = activeSheetProblems.length;
  const sheetSolvedCount = activeSheetProblems.filter((p) => solvedProblems[p.id]).length;
  const sheetProgressPercent = Math.round((sheetSolvedCount / Math.max(sheetTotalCount, 1)) * 100);

  const basicSolved = activeSheetProblems.filter((p) => p.difficulty === "Basic" && solvedProblems[p.id]).length;
  const basicTotal = activeSheetProblems.filter((p) => p.difficulty === "Basic").length;

  const coreSolved = activeSheetProblems.filter((p) => p.difficulty === "Core" && solvedProblems[p.id]).length;
  const coreTotal = activeSheetProblems.filter((p) => p.difficulty === "Core").length;

  const hardSolved = activeSheetProblems.filter((p) => p.difficulty === "Hard" && solvedProblems[p.id]).length;
  const hardTotal = activeSheetProblems.filter((p) => p.difficulty === "Hard").length;

  // Search and Filter in sheet
  const { 
    filters, 
    updateFilter, 
    clearFilters, 
    filteredProblems: filteredSheetProblems, 
    filterOptions 
  } = useProblemFilter(activeSheetProblems, solvedProblems);

  // Group problems into takeUforward syllabus hierarchy (Topics -> Subtopics -> Problems)
  interface SubtopicGroup {
    name: string;
    problems: DsaProblem[];
    total: number;
    solved: number;
  }

  interface TopicGroup {
    name: string;
    total: number;
    solved: number;
    subtopics: SubtopicGroup[];
  }

  const groupedTopics = useMemo<TopicGroup[]>(() => {
    const topicOrder: string[] = [];
    const topicMap = new Map<
      string,
      {
        name: string;
        subtopicOrder: string[];
        subtopicMap: Map<string, DsaProblem[]>;
      }
    >();

    for (const prob of filteredSheetProblems) {
      const topicName = prob.topic || "General Problems";
      const subtopicName = prob.subtopic || "";

      if (!topicMap.has(topicName)) {
        topicOrder.push(topicName);
        topicMap.set(topicName, {
          name: topicName,
          subtopicOrder: [],
          subtopicMap: new Map(),
        });
      }

      const t = topicMap.get(topicName)!;
      if (!t.subtopicMap.has(subtopicName)) {
        t.subtopicOrder.push(subtopicName);
        t.subtopicMap.set(subtopicName, []);
      }
      t.subtopicMap.get(subtopicName)!.push(prob);
    }

    return topicOrder.map((topicName) => {
      const t = topicMap.get(topicName)!;
      const subtopics: SubtopicGroup[] = t.subtopicOrder.map((subName) => {
        const probs = t.subtopicMap.get(subName) || [];
        const solved = probs.filter((p) => Boolean(solvedProblems[p.id])).length;
        return {
          name: subName,
          problems: probs,
          total: probs.length,
          solved,
        };
      });

      const total = subtopics.reduce((acc, s) => acc + s.total, 0);
      const solved = subtopics.reduce((acc, s) => acc + s.solved, 0);

      return {
        name: t.name,
        total,
        solved,
        subtopics,
      };
    });
  }, [filteredSheetProblems, solvedProblems]);

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});

  // Auto-expand all when active search or filters are applied
  const isFiltering = Boolean(
    filters.searchQuery ||
    filters.difficulty.length > 0 ||
    filters.status.length > 0 ||
    filters.topics.length > 0
  );

  const toggleTopicExpand = (topicName: string) => {
    setExpandedTopics((prev) => {
      const current = prev[topicName] ?? false;
      return { ...prev, [topicName]: !current };
    });
  };

  const toggleSubtopicExpand = (subKey: string) => {
    setExpandedSubtopics((prev) => {
      const current = prev[subKey] ?? false;
      return { ...prev, [subKey]: !current };
    });
  };

  const expandAll = () => {
    const allT: Record<string, boolean> = {};
    const allS: Record<string, boolean> = {};
    groupedTopics.forEach((t) => {
      allT[t.name] = true;
      t.subtopics.forEach((s) => {
        allS[`${t.name}:::${s.name}`] = true;
      });
    });
    setExpandedTopics(allT);
    setExpandedSubtopics(allS);
  };

  const collapseAll = () => {
    const allT: Record<string, boolean> = {};
    const allS: Record<string, boolean> = {};
    groupedTopics.forEach((t) => {
      allT[t.name] = false;
      t.subtopics.forEach((s) => {
        allS[`${t.name}:::${s.name}`] = false;
      });
    });
    setExpandedTopics(allT);
    setExpandedSubtopics(allS);
  };

  // Expand first topic by default when changing sheets
  useEffect(() => {
    if (groupedTopics.length > 0) {
      const firstT = groupedTopics[0];
      setExpandedTopics((prev) => ({
        ...prev,
        [firstT.name]: prev[firstT.name] ?? true,
      }));
      if (firstT.subtopics.length > 0) {
        const firstSubKey = `${firstT.name}:::${firstT.subtopics[0].name}`;
        setExpandedSubtopics((prev) => ({
          ...prev,
          [firstSubKey]: prev[firstSubKey] ?? true,
        }));
      }
    }
  }, [selectedSheetId, groupedTopics]);

  // Handler to open a subject catalog
  const openSubject = (subjectId: "dsa" | "core_cs") => {
    setSelectedSubject(subjectId);
    // select first sheet of that subject by default
    const firstSheet = dynamicSheets.find((s) => s.subjectId === subjectId);
    if (firstSheet) setSelectedSheetId(firstSheet.id);
    setCurrentView("sheets_catalog");
    setSearchParams({ view: "sheets_catalog", subject: subjectId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler to select and practice a specific sheet
  const openSheetPractice = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setCurrentView("sheet_practice");
    setSearchParams({ view: "sheet_practice", sheet: sheetId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCompanyWise = (companyName?: string) => {
    if (companyName) setSelectedCompany(companyName);
    setCurrentView("company_wise");
    setSearchParams({ view: "company_wise", ...(companyName ? { company: companyName } : {}) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Codolio-style curated company kits navigation
  const openCompanyKitsCatalog = () => {
    setCurrentView("company_kits_catalog");
    setSearchParams({ view: "company_kits" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCompanyKit = (companyName: string) => {
    setSelectedCompany(companyName);
    setCurrentView("company_kit_workspace");
    setSearchParams({ view: "company_kit", company: companyName });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openComingSoon = (feature: string = "dsa") => {
    setCurrentView("coming_soon");
    setSearchParams({ view: "coming_soon", feature });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-full bg-[var(--canvas)] text-[var(--text-primary)] font-sans pb-16 px-4 sm:px-6 lg:px-8 pt-6 max-w-[1400px] mx-auto">
      {/* LEVEL 1: PREP HUB ROOT OVERVIEW */}
      {currentView === "hub" && (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Prephub Hero Banner Card with Single Capsule Bar */}
            <div className="p-7 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] relative overflow-hidden flex flex-col justify-between min-h-[200px]">
              <div className="relative z-10 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                  Prephub
                </h1>
                <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Your one-stop platform to learn, and master every interview subject.
                </p>

                {/* Single Continuous Stats Capsule Bar */}
                <div className="mt-6 inline-flex items-center rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-secondary)] font-sans">
                  <div className="flex items-center gap-1.5 pr-3.5 border-r border-[var(--border-subtle)]">
                    <Flame className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                    <span>
                      <strong className="text-[var(--text-primary)] font-semibold">{(globalStats.activeThisMonth).toLocaleString()}</strong> Active this month
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3.5 border-r border-[var(--border-subtle)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>
                      <strong className="text-[var(--text-primary)] font-semibold">{(globalStats.totalUsers).toLocaleString()}</strong> Total Users
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-3.5">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--status-success)]" />
                    <span>
                      <strong className="text-[var(--text-primary)] font-semibold">{globalStats.curatedSubjects}</strong> Curated Subjects
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Glowing Logo Illustration */}
              <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 items-center pointer-events-none opacity-90">
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[var(--action-primary)]/15 rounded-full blur-2xl" />
                  <div className="w-36 h-24 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-control)] shadow-lg flex flex-col items-center justify-center p-2 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-control)] flex items-center justify-center shadow-sm">
                      <BrandIcon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-tight font-sans mt-1.5">
                      inter<span className="text-[var(--accent-text)]">V</span>ue
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* "Explore Subjects" Section (Vertical Stacked Horizontal Rows) */}
            <div className="space-y-3.5">
              <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Explore Subjects</h2>

              {/* Subject 1: Target Company Practice Kits (Target company wise) */}
              <button
                type="button"
                onClick={() => openCompanyKitsCatalog()}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--accent-text)]/30 hover:border-[var(--accent-text)]/60 hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center justify-between group shadow-sm gap-3 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--surface-selected)] border border-[var(--accent-text)]/25 flex items-center justify-center text-[var(--accent-text)] shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors leading-snug">
                        Target Company Practice Kits
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/25 whitespace-nowrap shrink-0">
                        Top FAANG Rounds
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      Targeted interview problem sets for Google, Amazon, Meta, Microsoft, Apple, Uber & Netflix.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[var(--accent-text)] shrink-0 pl-1 sm:pl-4">
                  <span className="hidden sm:inline">Explore Kits</span>
                  <ChevronRight className="w-4 h-4 text-[var(--accent-text)]/70 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Subject 2: All Company Section (Company-Wise 470+ company question system) */}
              <button
                type="button"
                onClick={() => openCompanyWise()}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center justify-between group gap-3 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--status-success)]/12 border border-[var(--status-success)]/25 flex items-center justify-center text-[var(--status-success)] shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors leading-snug">
                        All Company Questions Archive
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25 whitespace-nowrap shrink-0">
                        470+ Companies
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      Past interview papers ranked by ask rate from Google, Amazon, Meta, Microsoft, Apple, Uber & startups.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0 pl-1 sm:pl-4">
                  <span className="hidden sm:inline">View Companies</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Subject 3: DSA Problem Sheets (Live Flagship Curriculums) */}
              <button
                type="button"
                onClick={() => openSubject("dsa")}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--status-success)]/40 hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center justify-between group gap-3 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--status-success)]/12 border border-[var(--status-success)]/25 flex items-center justify-center text-[var(--status-success)] shrink-0 group-hover:scale-105 transition-transform">
                    <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--status-success)] transition-colors leading-snug">
                        DSA Problem Sheets
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25 whitespace-nowrap shrink-0">
                        {dynamicSheets.filter((s) => s.subjectId === "dsa").length || 4} Flagship Sheets
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      Striver A2Z, NeetCode 150, Blind 75 & Striver's SDE Sheet with step-by-step progress tracking.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[var(--status-success)] shrink-0 pl-1 sm:pl-4">
                  <span className="hidden sm:inline">Browse Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[var(--status-success)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Subject 4: AI Mock Interviews */}
              <button
                type="button"
                onClick={() => navigate("/interview")}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center justify-between group gap-3 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--status-warning)]/12 border border-[var(--status-warning)]/25 flex items-center justify-center text-[var(--status-warning)] shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors leading-snug">
                        AI Mock Interviews
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-warning)]/12 text-[var(--status-warning)] border border-[var(--status-warning)]/25 whitespace-nowrap shrink-0">
                        Live Simulation
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      Interactive real-time technical & behavioral interviews with AI rubric evaluations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0 pl-1 sm:pl-4">
                  <span className="hidden sm:inline">Start Mock</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* Target Company Kits Section (Full Width) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--action-primary)] animate-pulse" />
                  <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Target Company Kits</h3>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/25 font-mono">
                    Top 18+ Loops
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openCompanyKitsCatalog()}
                  className="whitespace-nowrap inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:opacity-80 font-mono transition-opacity cursor-pointer shrink-0 group"
                >
                  <span>View All Kits</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                Targeting a specific loop? Jump straight to interview question sets with verified ask frequencies and curated pattern breakdowns.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
                {TOP_COMPANIES_PRESET.slice(0, 8).map((comp) => {
                  const logo = getCompanyLogo(comp.name);
                  const isTarget = readinessData?.targetCompany?.toLowerCase() === comp.name.toLowerCase();
                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => openCompanyKit(comp.name)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left group cursor-pointer",
                        isTarget
                          ? "bg-[var(--surface-selected)] border-[var(--accent-text)]/40 text-[var(--accent-text)]"
                          : "bg-[var(--surface-muted)] border-[var(--border-subtle)] hover:border-[var(--border-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                      )}
                    >
                      <div className="w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0">
                        {logo ? (
                          <img src={logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        )}
                      </div>
                      <span className="truncate flex-1">{comp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
        </div>
      )}

      {/* COMING SOON VIEW (DSA Problem Sheets & V2 Roadmap) */}
      {currentView === "coming_soon" && (
        <div className="space-y-6 max-w-4xl mx-auto py-4">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <button
                type="button"
                onClick={() => {
                  setCurrentView("hub");
                  setSearchParams({});
                }}
                className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prephub</span>
              </button>
              <span>/</span>
              <span className="text-[var(--text-primary)] font-medium">DSA Problem Sheets</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentView("hub");
                setSearchParams({});
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>← Back to Overview</span>
            </button>
          </div>

          {/* Hero Spotlight Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border-subtle)] relative overflow-hidden text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-selected)] border border-[var(--accent-text)]/25 text-[var(--accent-text)] flex items-center justify-center mx-auto">
              <Code2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/25 text-[var(--status-warning)] font-mono text-xs font-semibold uppercase">
                <Sparkles className="w-3 h-3" />
                Under Active Crafting • V2 Feature
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                DSA Problem Sheets are Coming Soon
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                We are curating Striver A2Z, NeetCode 150, Blind 75, and SDE sheets with automated test runners, hint assistance, and solution breakdowns.
              </p>
            </div>

            {/* What's Coming Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left pt-2">
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  Striver A2Z DSA Sheet
                </span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  450+ complete step-by-step roadmap from basics to advanced graphs & DP.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  NeetCode 150 Patterns
                </span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Core algorithmic patterns covering two pointers, sliding window, and heaps.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                  Blind 75 High-Yield
                </span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  The timeless curated 75 questions most frequently asked in tech screens.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  Striver SDE Sheet
                </span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Top product-based company interview questions for rapid final-month prep.
                </p>
              </div>
            </div>

            {/* Active Alternatives CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openCompanyKitsCatalog()}
                className="px-5 py-2.5 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Explore Company Kits (Live)</span>
              </button>

              <button
                type="button"
                onClick={() => openCompanyWise()}
                className="px-5 py-2.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Browse 470+ Company Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === "sheets_catalog" && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium capitalize">
                  {selectedSubject === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {selectedSubject === "dsa" ? "Data Structures & Algorithms Sheets" : "Core CS Fundamentals"}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Choose a structured curriculum that matches your timeline and interview target.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back to Overview
            </button>
          </div>

          {/* Multiple Sheet Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentSubjectSheets.map((sheet) => {
              const sheetProblems = sheet.problems;
              const solvedCountForSheet = sheetProblems.filter((p) => solvedProblems[p.id]).length;
              const pct = Math.round((solvedCountForSheet / Math.max(sheetProblems.length, 1)) * 100);

              return (
                <button
                  type="button"
                  key={sheet.id}
                  onClick={() => openSheetPractice(sheet.id)}
                  className="w-full p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-text)]/50 hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex flex-col justify-between group shadow-sm text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          sheet.badgeColor === "emerald"
                            ? "bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/25"
                            : sheet.badgeColor === "amber"
                            ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/25"
                            : sheet.badgeColor === "purple"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                            : "bg-[var(--surface-selected)] text-[var(--accent-text)] border-[var(--accent-text)]/25"
                        )}
                      >
                        {sheet.badge}
                      </span>

                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        {sheet.estimatedHours}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                      {sheet.title}
                    </h2>
                    <p className="text-xs text-[var(--accent-text)] font-medium mt-0.5">
                      {sheet.subtitle}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                      {sheet.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[var(--text-secondary)] font-medium">Progress</span>
                      <span className="font-mono text-[var(--text-primary)] font-bold">
                        {pct}% ({solvedCountForSheet}/{sheetProblems.length})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden mb-4">
                      <div
                        className="h-full bg-[var(--action-primary)] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        {sheet.problemCount} Problems
                      </span>
                      <span className="text-xs font-semibold text-[var(--accent-text)] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Start Practicing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          LEVEL 3: SHEET PRACTICE VIEW (Problem Table + Sheet Switcher Pill Bar)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "sheet_practice" && (
        isSheetsLoading ? (
          <div className="py-20 flex items-center justify-center" role="status" aria-label="Loading practice sheet">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--action-primary)]"></div>
          </div>
        ) : isSheetsError ? (
          <div
            role="alert"
            className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--status-danger)]/30 text-center space-y-3 max-w-lg mx-auto my-12"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)]">Failed to load practice sheet</p>
            <p className="text-xs text-[var(--text-secondary)]">Unable to fetch sheet problems right now.</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => refetchSheets()}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-control)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("hub")}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Back to Prephub
              </button>
            </div>
          </div>
        ) : !currentSheet ? (
          <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] text-center space-y-3 max-w-lg mx-auto my-12">
            <p className="text-sm font-semibold text-[var(--text-primary)]">No practice sheet available</p>
            <p className="text-xs text-[var(--text-secondary)]">Select another track or return to Prephub.</p>
            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-xs font-semibold text-[var(--on-primary)] cursor-pointer"
            >
              Back to Prephub
            </button>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Breadcrumb & Sheet Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-2">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-2 font-sans">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Prephub
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer capitalize"
                >
                  {currentSheet.subjectId === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </button>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium">{currentSheet.title}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                {currentSheet.title}
              </h1>
              <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                {currentSheet.description}
              </p>

              {/* Seamless Sheet Switcher Bar */}
              <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
                <span className="text-xs text-[var(--text-muted)] font-semibold shrink-0">Switch Sheet:</span>
                {currentSubjectSheets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSheetPractice(s.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border",
                      selectedSheetId === s.id
                        ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border-[var(--accent-text)]/40 font-semibold shadow-sm"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]"
                    )}
                  >
                    {s.title.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* TUF Progress Card for Current Sheet */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] w-full lg:w-80 shrink-0">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span className="font-semibold text-[var(--text-primary)]">Your Progress</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-[var(--text-primary)] text-[11px] transition-colors cursor-pointer"
                >
                  All sheets <ArrowUpRight className="w-3 h-3 inline ml-0.5" />
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">{sheetProgressPercent} %</span>
                <span className="text-xs text-[var(--text-muted)]">({sheetSolvedCount}/{sheetTotalCount} solved)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] text-center">
                <div>
                  <span className="text-[10px] text-[var(--status-success)] font-semibold block">Basic</span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{basicSolved}/{basicTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--status-warning)] font-semibold block">Core</span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{coreSolved}/{coreTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--status-danger)] font-semibold block">Hard</span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{hardSolved}/{hardTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TakeUForward Accordion Syllabus View */}
          <div className="space-y-4">
            {/* Search, Filter & Expand Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
              <AdvancedFilterPopover 
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                options={filterOptions}
                resultCount={filteredSheetProblems.length}
              />

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Syllabus Topic Accordions */}
            {groupedTopics.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                <p className="text-sm text-[var(--text-secondary)]">No problems match your current filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 px-3.5 py-1.5 text-xs font-medium text-[var(--accent-text)] bg-[var(--surface-selected)] hover:opacity-90 border border-[var(--accent-text)]/30 rounded-lg transition-opacity cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedTopics.map((topic) => {
                  const isTopicExpanded = isFiltering ? true : Boolean(expandedTopics[topic.name]);
                  const hasNamedSubtopics = topic.subtopics.some((s) => Boolean(s.name && s.name.trim()));

                  return (
                    <div
                      key={topic.name}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden transition-all shadow-sm"
                    >
                      {/* Topic Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleTopicExpand(topic.name)}
                        className="w-full px-5 py-4 bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-between text-left transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 shrink-0",
                              isTopicExpanded && "rotate-90 text-[var(--accent-text)]"
                            )}
                          />
                          <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight truncate">
                            {topic.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pl-3">
                          <div className="w-24 sm:w-32 hidden sm:block bg-[var(--surface-muted)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--status-success)] rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round((topic.solved / Math.max(topic.total, 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                            {topic.solved}/{topic.total}
                          </span>
                        </div>
                      </button>

                      {/* Topic Accordion Body */}
                      {isTopicExpanded && (
                        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 p-3 sm:p-4 space-y-3">
                          {hasNamedSubtopics ? (
                            topic.subtopics.map((sub) => {
                              const subKey = `${topic.name}:::${sub.name}`;
                              const isSubExpanded = isFiltering ? true : Boolean(expandedSubtopics[subKey]);

                              return (
                                <div
                                  key={subKey}
                                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden"
                                >
                                  {sub.name ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleSubtopicExpand(subKey)}
                                      className="w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-between text-left transition-colors cursor-pointer select-none"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <ChevronRight
                                          className={cn(
                                            "w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 shrink-0",
                                            isSubExpanded && "rotate-90 text-[var(--status-success)]"
                                          )}
                                        />
                                        <span className="font-medium text-xs text-[var(--text-primary)] tracking-tight truncate">
                                          {sub.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0 pl-2">
                                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                                          {sub.solved}/{sub.total}
                                        </span>
                                      </div>
                                    </button>
                                  ) : null}

                                  {(isSubExpanded || !sub.name) && (
                                    <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                                      {sub.problems.map((prob) => {
                                        const isSolved = Boolean(solvedProblems[prob.id]);
                                        const isLeetCode = prob.link
                                          ? prob.link.includes("leetcode.com")
                                          : (!prob.slug.includes("takeuforward") &&
                                             !prob.slug.includes("input-output") &&
                                             !prob.slug.includes("cpp") &&
                                             !prob.slug.includes("pattern") &&
                                             !prob.slug.includes("stl") &&
                                             !prob.slug.includes("hashing") &&
                                             !prob.slug.includes("data-type"));
                                        const isTakeUForward = prob.link ? prob.link.includes("takeuforward.org") : !isLeetCode;
                                        const destinationUrl = prob.link || (isLeetCode ? `https://leetcode.com/problems/${prob.slug}` : `https://takeuforward.org/practice/dsa/${prob.slug}`);

                                        return (
                                          <div
                                            key={prob.id}
                                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-hover)] transition-colors text-xs"
                                          >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                              <button
                                                type="button"
                                                aria-pressed={isSolved}
                                                aria-label={isSolved ? `Mark ${prob.title} as unsolved` : `Mark ${prob.title} as solved`}
                                                onClick={(e) => {
                                                  const diff = prob.difficulty === "Basic" ? "EASY" : prob.difficulty === "Core" ? "MEDIUM" : "HARD";
                                                  toggleSolved(prob.id, e, diff, [prob.topic]);
                                                }}
                                                className={cn(
                                                  "w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 border",
                                                  isSolved
                                                    ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-[var(--on-primary)]"
                                                    : "border-[var(--border-control)] text-transparent hover:border-[var(--action-primary)]"
                                                )}
                                              >
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                              </button>

                                              <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                                                <a
                                                  href={destinationUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={cn(
                                                    "font-medium hover:text-[var(--accent-text)] transition-colors truncate cursor-pointer",
                                                    isSolved ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                                                  )}
                                                >
                                                  {prob.title}
                                                </a>

                                                <span
                                                  className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0",
                                                    prob.difficulty === "Basic"
                                                      ? "bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25"
                                                      : prob.difficulty === "Core"
                                                      ? "bg-[var(--status-warning)]/12 text-[var(--status-warning)] border border-[var(--status-warning)]/25"
                                                      : "bg-[var(--status-danger)]/12 text-[var(--status-danger)] border border-[var(--status-danger)]/25"
                                                  )}
                                                >
                                                  {prob.difficulty}
                                                </span>

                                                {prob.isPotd && (
                                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/30 shrink-0">
                                                    POTD
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-secondary)] shrink-0">
                                              {isTakeUForward && (
                                                <a
                                                  href={destinationUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="w-7 h-7 rounded-lg bg-[var(--surface-selected)] hover:opacity-85 border border-[var(--accent-text)]/25 flex items-center justify-center transition-opacity shrink-0 p-1"
                                                  title="Practice on takeUforward"
                                                >
                                                  <img src="/takeUforwardicon.png" alt="takeUforward" className="w-4 h-4 rounded-full object-contain" />
                                                </a>
                                              )}

                                              {isLeetCode && (
                                                <a
                                                  href={destinationUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="w-7 h-7 rounded-lg bg-[var(--status-warning)]/10 hover:bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]/25 flex items-center justify-center transition-colors shrink-0"
                                                  title="Solve on LeetCode"
                                                >
                                                  <img src="/leetcode.svg" alt="LeetCode" className="w-3.5 h-3.5 object-contain" />
                                                </a>
                                              )}

                                              {prob.videoUrl && (
                                                <a
                                                  href={prob.videoUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="w-7 h-7 rounded-lg bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 border border-[var(--status-danger)]/25 flex items-center justify-center transition-colors shrink-0"
                                                  title="Watch YouTube Video Solution"
                                                >
                                                  <img src="/yt.png" alt="YouTube" className="w-4 h-3.5 object-contain" />
                                                </a>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setActiveNoteTarget({
                                                    isOpen: true,
                                                    slug: prob.slug,
                                                    title: prob.title,
                                                  })
                                                }
                                                className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--status-warning)]/40 text-[var(--text-secondary)] hover:text-[var(--status-warning)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                title="Notes & Hints Notepad"
                                              >
                                                <NotebookPen className="w-3.5 h-3.5" />
                                              </button>

                                              <button
                                                type="button"
                                                onClick={(e) => handleToggleBookmark(prob.slug, prob.title, prob.difficulty, e)}
                                                className={cn(
                                                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border",
                                                  bookmarkedSlugs.includes(prob.slug)
                                                    ? "bg-[var(--status-success)]/15 border-[var(--status-success)]/40 text-[var(--status-success)]"
                                                    : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--status-success)] hover:border-[var(--status-success)]/30"
                                                )}
                                                title={bookmarkedSlugs.includes(prob.slug) ? "Remove Bookmark" : "Bookmark for Revision"}
                                              >
                                                <Bookmark
                                                  className={cn(
                                                    "w-3.5 h-3.5",
                                                    bookmarkedSlugs.includes(prob.slug) && "fill-[var(--status-success)]"
                                                  )}
                                                />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                              {topic.subtopics.flatMap((s) => s.problems).map((prob) => {
                                const isSolved = Boolean(solvedProblems[prob.id]);
                                const isLeetCode = prob.link
                                  ? prob.link.includes("leetcode.com")
                                  : (!prob.slug.includes("takeuforward") &&
                                     !prob.slug.includes("input-output") &&
                                     !prob.slug.includes("cpp") &&
                                     !prob.slug.includes("pattern") &&
                                     !prob.slug.includes("stl") &&
                                     !prob.slug.includes("hashing") &&
                                     !prob.slug.includes("data-type"));
                                const isTakeUForward = prob.link ? prob.link.includes("takeuforward.org") : !isLeetCode;
                                const destinationUrl = prob.link || (isLeetCode ? `https://leetcode.com/problems/${prob.slug}` : `https://takeuforward.org/practice/dsa/${prob.slug}`);

                                return (
                                  <div
                                    key={prob.id}
                                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-hover)] transition-colors text-xs"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <button
                                        type="button"
                                        aria-pressed={isSolved}
                                        aria-label={isSolved ? `Mark ${prob.title} as unsolved` : `Mark ${prob.title} as solved`}
                                        onClick={(e) => {
                                          const diff = prob.difficulty === "Basic" ? "EASY" : prob.difficulty === "Core" ? "MEDIUM" : "HARD";
                                          toggleSolved(prob.id, e, diff, [prob.topic]);
                                        }}
                                        className={cn(
                                          "w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 border",
                                          isSolved
                                            ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-[var(--on-primary)]"
                                            : "border-[var(--border-control)] text-transparent hover:border-[var(--action-primary)]"
                                        )}
                                      >
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>

                                      <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                                        <a
                                          href={destinationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn(
                                            "font-medium hover:text-[var(--accent-text)] transition-colors truncate cursor-pointer",
                                            isSolved ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                                          )}
                                        >
                                          {prob.title}
                                        </a>

                                        <span
                                          className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0",
                                            prob.difficulty === "Basic"
                                              ? "bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25"
                                              : prob.difficulty === "Core"
                                              ? "bg-[var(--status-warning)]/12 text-[var(--status-warning)] border border-[var(--status-warning)]/25"
                                              : "bg-[var(--status-danger)]/12 text-[var(--status-danger)] border border-[var(--status-danger)]/25"
                                          )}
                                        >
                                          {prob.difficulty}
                                        </span>

                                        {prob.isPotd && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/30 shrink-0">
                                            POTD
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-secondary)] shrink-0">
                                      {isTakeUForward && (
                                        <a
                                          href={destinationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-7 h-7 rounded-lg bg-[var(--surface-selected)] hover:opacity-85 border border-[var(--accent-text)]/25 flex items-center justify-center transition-opacity shrink-0 p-1"
                                          title="Practice on takeUforward"
                                        >
                                          <img src="/takeUforwardicon.png" alt="takeUforward" className="w-4 h-4 rounded-full object-contain" />
                                        </a>
                                      )}

                                      {isLeetCode && (
                                        <a
                                          href={destinationUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-7 h-7 rounded-lg bg-[var(--status-warning)]/10 hover:bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]/25 flex items-center justify-center transition-colors shrink-0"
                                          title="Solve on LeetCode"
                                        >
                                          <img src="/leetcode.svg" alt="LeetCode" className="w-3.5 h-3.5 object-contain" />
                                        </a>
                                      )}

                                      {prob.videoUrl && (
                                        <a
                                          href={prob.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-7 h-7 rounded-lg bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 border border-[var(--status-danger)]/25 flex items-center justify-center transition-colors shrink-0"
                                          title="Watch YouTube Video Solution"
                                        >
                                          <img src="/yt.png" alt="YouTube" className="w-4 h-3.5 object-contain" />
                                        </a>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveNoteTarget({
                                            isOpen: true,
                                            slug: prob.slug,
                                            title: prob.title,
                                          })
                                        }
                                        className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--status-warning)]/40 text-[var(--text-secondary)] hover:text-[var(--status-warning)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                        title="Notes & Hints Notepad"
                                      >
                                        <NotebookPen className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleBookmark(prob.slug, prob.title, prob.difficulty, e)}
                                        className={cn(
                                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border",
                                          bookmarkedSlugs.includes(prob.slug)
                                            ? "bg-[var(--status-success)]/15 border-[var(--status-success)]/40 text-[var(--status-success)]"
                                            : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--status-success)] hover:border-[var(--status-success)]/30"
                                        )}
                                        title={bookmarkedSlugs.includes(prob.slug) ? "Remove Bookmark" : "Bookmark for Revision"}
                                      >
                                        <Bookmark
                                          className={cn(
                                            "w-3.5 h-3.5",
                                            bookmarkedSlugs.includes(prob.slug) && "fill-[var(--status-success)]"
                                          )}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SECTION 4: DEDICATED COMPANY-WISE QUESTION EXPLORER (470+ COMPANIES)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "company_wise" && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium">Company-Wise Question Hub</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
                <span>Target Company Assessment Sets</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25">
                  470+ Verified Companies
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Questions organized by company, recency, and interview ask rate with automated Judge0 evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back to Prephub
            </button>
          </div>

          {/* Company Picker Bar */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                {getCompanyLogo(selectedCompany) ? (
                  <img
                    src={getCompanyLogo(selectedCompany)!}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-[var(--accent-text)]" />
                )}
                Target Company: <strong className="text-[var(--text-primary)] font-bold">{selectedCompany}</strong>
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {companyQuestionsData?.totalCount || 0} questions available
              </span>
            </div>

            {/* Wrap Company Pills */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {(featuredCompaniesData?.companies || []).map((comp) => {
                const logo = getCompanyLogo(comp.name) || getCompanyLogo(comp.slug);
                return (
                  <button
                    key={comp.slug}
                    onClick={() => setSelectedCompany(comp.name)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                      selectedCompany === comp.name
                        ? "bg-[var(--action-primary)] text-[var(--on-primary)] border-[var(--action-primary)] shadow-sm"
                        : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-text)]/50 hover:text-[var(--text-primary)]"
                    )}
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                    ) : (
                      <span className="font-mono text-[11px] opacity-75">{comp.icon}</span>
                    )}
                    <span>{comp.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                      selectedCompany === comp.name ? "bg-white/20 text-[var(--on-primary)]" : "bg-[var(--surface)] text-[var(--text-muted)]"
                    )}>
                      {comp.totalProblems}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeframe & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs self-start sm:self-auto">
              {[
                { id: "thirtyDays", label: "🔥 Last 30 Days" },
                { id: "threeMonths", label: "3 Months" },
                { id: "sixMonths", label: "6 Months" },
                { id: "all", label: "All Time" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    selectedTimeframe === tf.id
                      ? "bg-[var(--surface-selected)] text-[var(--accent-text)] shadow-sm font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] self-start sm:self-auto">
                {["ALL", "SOLVED", "UNSOLVED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setCompanyStatusFilter(status as any)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer",
                      companyStatusFilter === status
                        ? "bg-[var(--surface-selected)] text-[var(--accent-text)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:flex-none sm:w-72">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedCompany} questions...`}
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-control)] focus:border-[var(--action-primary)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Company Problem List Table */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-muted)]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                  {selectedCompany} Problem Breakdown
                </h3>
                <span className="px-2 py-0.5 rounded bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/30 text-[10px] font-semibold font-mono">
                  {companyQuestionsData?.totalCount || 0} questions
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Ranked by interview ask rate
              </span>
            </div>

            {isCompanyLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[var(--action-primary)] border-t-transparent animate-spin" />
                <p className="text-xs text-[var(--text-secondary)] font-mono">Loading questions for {selectedCompany}...</p>
              </div>
            ) : (() => {
                const filteredCompanyQuestions = (companyQuestionsData?.questions || []).filter((q) => {
                  const solvedKey = q.nativeId ? String(q.nativeId) : q.slug;
                  const isSolved = Boolean(solvedProblems[solvedKey]);
                  
                  if (companyStatusFilter === "SOLVED" && !isSolved) return false;
                  if (companyStatusFilter === "UNSOLVED" && isSolved) return false;

                  if (!companySearchQuery) return true;
                  const qLower = companySearchQuery.toLowerCase();
                  return (
                    q.title.toLowerCase().includes(qLower) ||
                    q.topics.some((t) => t.toLowerCase().includes(qLower)) ||
                    q.difficulty.toLowerCase().includes(qLower)
                  );
                });

                const totalCount = filteredCompanyQuestions.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / companyPageSize));
                const safePage = Math.min(Math.max(1, companyPage), totalPages);
                const startIndex = totalCount === 0 ? 0 : (safePage - 1) * companyPageSize;
                const endIndex = Math.min(startIndex + companyPageSize, totalCount);
                const paginated = filteredCompanyQuestions.slice(startIndex, endIndex);

                if (totalCount === 0) {
                  return (
                    <div className="p-12 text-center text-xs text-[var(--text-secondary)] font-mono">
                      No questions found matching your filter criteria.
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {paginated.map((q, idx) => (
                        <div
                          key={idx}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-hover)] transition-colors"
                        >
                          <div className="space-y-1 min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {(() => {
                                const solvedKey = q.nativeId ? String(q.nativeId) : q.slug;
                                const isSolved = Boolean(solvedProblems[solvedKey]);
                                return (
                                  <button
                                    onClick={(e) => toggleSolved(solvedKey, e, q.difficulty, q.topics)}
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                                      isSolved
                                        ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-[var(--on-primary)]"
                                        : "border-[var(--border-control)] text-transparent hover:border-[var(--action-primary)]"
                                    )}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </button>
                                );
                              })()}
                              <span className={cn(
                                "font-medium text-xs sm:text-sm truncate",
                                Boolean(solvedProblems[q.nativeId ? String(q.nativeId) : q.slug]) ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                              )}>
                                {q.title}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                                  q.difficulty === "EASY"
                                    ? "bg-[var(--status-success)]/12 text-[var(--status-success)] border border-[var(--status-success)]/25"
                                    : q.difficulty === "MEDIUM"
                                    ? "bg-[var(--status-warning)]/12 text-[var(--status-warning)] border border-[var(--status-warning)]/25"
                                    : "bg-[var(--status-danger)]/12 text-[var(--status-danger)] border border-[var(--status-danger)]/25"
                                )}
                              >
                                {q.difficulty}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {q.topics.slice(0, 4).map((t, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] text-[10px] font-mono border border-[var(--border-subtle)]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 pl-2">
                            {q.frequency > 0 && (
                              <div className="text-right flex flex-col items-end">
                                <span className="text-[9px] text-[var(--text-muted)] font-mono block leading-none mb-1">Ask Rate</span>
                                <span className="text-xs font-bold text-[var(--status-warning)] font-mono leading-none">
                                  {q.frequency}%
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleToggleBookmark(q.slug, q.title, q.difficulty, e)}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border",
                                bookmarkedSlugs.includes(q.slug)
                                  ? "bg-[var(--status-success)]/15 border-[var(--status-success)]/40 text-[var(--status-success)]"
                                  : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--status-success)] hover:border-[var(--status-success)]/30"
                              )}
                              title={bookmarkedSlugs.includes(q.slug) ? "Remove Bookmark" : "Bookmark for Revision"}
                            >
                              <Bookmark
                                className={cn(
                                  "w-3.5 h-3.5",
                                  bookmarkedSlugs.includes(q.slug) && "fill-[var(--status-success)]"
                                )}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveNoteTarget({
                                  isOpen: true,
                                  slug: q.slug,
                                  title: q.title,
                                })
                              }
                              className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--status-warning)]/40 text-[var(--text-secondary)] hover:text-[var(--status-warning)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Notes & Hints Notepad"
                            >
                              <NotebookPen className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={q.link || (q.slug ? `https://leetcode.com/problems/${q.slug}` : "#")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--status-warning)]/15 border border-[var(--border-subtle)] hover:border-[var(--status-warning)]/50 text-[var(--status-warning)] flex items-center justify-center transition-all shrink-0 group/lc cursor-pointer shadow-sm"
                              title="Solve on LeetCode"
                            >
                              <img
                                src="/leetcode.svg"
                                alt="LeetCode"
                                className="w-4 h-4 object-contain opacity-80 group-hover/lc:opacity-100 group-hover/lc:scale-115 transition-all"
                              />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] text-xs text-[var(--text-secondary)]">
                      <span className="font-mono text-[11px]">
                        Showing <strong className="text-[var(--text-primary)]">{startIndex + 1}–{endIndex}</strong> of{" "}
                        <strong className="text-[var(--text-primary)]">{totalCount.toLocaleString()}</strong> questions
                      </span>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-1 font-mono">
                          <button
                            type="button"
                            onClick={() => setCompanyPage(1)}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="First Page"
                          >
                            <ChevronsLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompanyPage(safePage - 1)}
                            disabled={safePage === 1}
                            className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>
                          <span className="px-2 text-[11px] text-[var(--text-secondary)]">
                            Page <strong className="text-[var(--text-primary)] font-bold">{safePage}</strong> of{" "}
                            <strong className="text-[var(--text-primary)] font-bold">{totalPages}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setCompanyPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompanyPage(totalPages)}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Last Page"
                          >
                            <ChevronsRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          LEVEL 4: CODOLIO-INSPIRED TARGET COMPANY KITS CATALOG
      ────────────────────────────────────────────────────────────────── */}
      {currentView === "company_kits_catalog" && (
        <CompanyKitsCatalog
          onSelectCompany={openCompanyKit}
          onBack={() => {
            setCurrentView("hub");
            setSearchParams({});
          }}
          activeTargetCompany={readinessData?.targetCompany || undefined}
          targetCompanies={readinessData?.targetCompanies}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────
          LEVEL 5: DEEP COMPANY TARGET WORKSPACE WITH PATTERN DONUT & ROUNDS
      ────────────────────────────────────────────────────────────────── */}
      {currentView === "company_kit_workspace" && (
        <CompanyKitWorkspace
          companyName={selectedCompany}
          onBack={() => {
            setCurrentView("company_kits_catalog");
            setSearchParams({ view: "company_kits" });
          }}
          activeTargetCompany={readinessData?.targetCompany || undefined}
          targetCompanies={readinessData?.targetCompanies}
          solvedProblems={solvedProblems}
          onToggleSolved={toggleSolved}
          isBookmarked={(slug) => bookmarkedSlugs.includes(slug)}
          onToggleBookmark={(slug, title, difficulty) =>
            handleToggleBookmark(slug, title || slug, difficulty || "Medium")
          }
          onOpenNotes={(problem) =>
            setActiveNoteTarget({
              isOpen: true,
              slug: problem.slug,
              title: problem.title,
            })
          }
        />
      )}

      {/* Slide-over Question Notes Drawer */}
      <QuestionNoteDrawer
        isOpen={activeNoteTarget.isOpen}
        onClose={() =>
          setActiveNoteTarget((prev) => ({ ...prev, isOpen: false }))
        }
        problemSlug={activeNoteTarget.slug}
        problemTitle={activeNoteTarget.title}
      />
    </div>
  );
}
