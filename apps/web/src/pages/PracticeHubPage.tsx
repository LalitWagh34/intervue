import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFeaturedCompanies, useCompanyQuestions } from "@/hooks/useCompanies";
import { getCompanyLogo } from "@/lib/companyLogos";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProblemFilter } from "@/hooks/useProblemFilter";
import { AdvancedFilterPopover } from "@/components/shared/AdvancedFilterPopover";
import { QuestionNoteDrawer } from "@/components/shared/QuestionNoteDrawer";
import { useBookmarkSlugs, useToggleBookmark } from "@/hooks/useBookmarks";
import { useCompanyReadiness } from "@/hooks/useReadiness";
import { CompanyKitsCatalog } from "@/components/company/CompanyKitsCatalog";
import { CompanyKitWorkspace } from "@/components/company/CompanyKitWorkspace";
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
  Bookmark,
  Check,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Filter,
  Shuffle,
  Clock,
  TrendingUp,
  LayoutGrid,
  Zap,
  NotebookPen,
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
  moreTopics?: number;
  companies: string[];
  isPotd?: boolean;
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
  { name: "Flipkart", count: 260, global: false },
  { name: "Swiggy", count: 185, global: false },
  { name: "Zomato", count: 140, global: false },
  { name: "CRED", count: 95, global: false },
];

export default function PracticeHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  >("hub");

  // Selected Subject ("dsa" | "core_cs")
  const [selectedSubject, setSelectedSubject] = useState<"dsa" | "core_cs">("dsa");

  // Selected Sheet inside subject
  const [selectedSheetId, setSelectedSheetId] = useState<string>("striver_a2z");

  // Company-Wise State
  const { data: featuredCompaniesData } = useFeaturedCompanies();
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("thirtyDays");
  const [companySearchQuery, setCompanySearchQuery] = useState<string>("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");
  const [companyTabFilter, setCompanyTabFilter] = useState<"global" | "indian">("global");

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
    }
  }, [searchParams]);

  const { data: companyQuestionsData, isLoading: isCompanyLoading } = useCompanyQuestions(
    selectedCompany,
    selectedTimeframe
  );

  const { data: sheetsData, isLoading: isSheetsLoading } = useQuery({
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
    
    // Optimistic update
    const isNowSolved = !solvedProblems[id];
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
      // We could revert optimistic update here, but for V1 it's fine
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

  if (isSheetsLoading || !currentSheet) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans pb-16 px-4 sm:px-6 lg:px-8 pt-6 max-w-[1400px] mx-auto">
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          LEVEL 1: PREP HUB ROOT OVERVIEW (tuf_ui/prep_hub.png)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "hub" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Section (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Prephub Hero Banner Card with Single Capsule Bar */}
            <div className="p-7 sm:p-8 rounded-2xl bg-[#0D0E12] border border-[#181A20] relative overflow-hidden flex flex-col justify-between min-h-[200px]">
              <div className="relative z-10 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                  Prephub
                </h1>
                <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1.5 leading-relaxed">
                  Your one-stop platform to learn, and master every interview subject.
                </p>

                {/* Single Continuous Stats Capsule Bar */}
                <div className="mt-6 inline-flex items-center rounded-xl bg-[#08090C] border border-[#181A20] px-3.5 py-2 text-xs text-[#8B92A0] font-sans shadow-inner">
                  <div className="flex items-center gap-1.5 pr-3.5 border-r border-[#181A20]">
                    <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>
                      <strong className="text-white font-semibold">{(globalStats.activeThisMonth).toLocaleString()}</strong> Active this month
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3.5 border-r border-[#181A20]">
                    <Sparkles className="w-3.5 h-3.5 text-[#327CF6]" />
                    <span>
                      <strong className="text-white font-semibold">{(globalStats.totalUsers).toLocaleString()}</strong> Total Users
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-3.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>
                      <strong className="text-white font-semibold">{globalStats.curatedSubjects}</strong> Curated Subjects
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Glowing Logo Illustration */}
              <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 items-center pointer-events-none opacity-80">
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#327CF6]/15 rounded-full blur-2xl" />
                  <div className="w-36 h-24 rounded-xl bg-[#08090C] border border-[#1E2229] shadow-2xl flex flex-col items-center justify-center p-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-[#327CF6] flex items-center justify-center text-white font-bold text-xs font-mono shadow-md shadow-[#327CF6]/30">
                      F&gt;
                    </div>
                    <span className="text-[10px] text-[#525866] font-mono mt-1">Intervue TUF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* "Explore Subjects" Section (Vertical Stacked Horizontal Rows) */}
            <div className="space-y-3.5">
              <h2 className="text-base font-bold text-white tracking-tight">Explore Subjects</h2>

              {/* Subject 1: DSA (Opens DSA Sheets Catalog with A2Z, NeetCode 150, Blind 75, SDE) */}
              <div
                onClick={() => openSubject("dsa")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        DSA Sheets
                      </h3>
                      {/* <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30">
                        4 Major Sheets
                      </span> */}
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Striver A2Z, NeetCode 150, Blind 75 & Striver's SDE Sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Explore Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 2: Target Company Practice Kits (Codolio-Inspired with Pattern Donut & Interview Loops) */}
              <div
                onClick={() => openCompanyKitsCatalog()}
                className="p-5 rounded-2xl bg-gradient-to-r from-[#0D0E12] via-[#0F131D] to-[#0D0E12] border border-blue-500/25 hover:border-blue-500/50 hover:bg-[#111522] transition-all cursor-pointer flex items-center justify-between group shadow-lg shadow-blue-950/10"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        Target Company Practice Kits
                      </h3>
                      {/* <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Loop Kits & Pattern Donuts</span>
                      </span> */}
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-0.5 line-clamp-1">
                      Targeted interview problem sets for Google, Amazon, Meta, Microsoft, Apple, Uber & Netflix with interactive topic donuts and round breakdowns.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-blue-400 group-hover:text-white shrink-0 pl-4">
                  <span>Explore Kits</span>
                  <ChevronRight className="w-4 h-4 text-blue-400/70 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 3: Company-Wise (Dedicated 470+ company question system) */}
              <div
                onClick={() => openCompanyWise()}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        Company-Wise Sheets Archive
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        470+ Companies
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Past interview papers ranked by ask rate from Google, Amazon, Meta, Microsoft, Apple & startups.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>View Companies</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 3: Core Subjects (OS, DBMS, CN) */}
              <div
                onClick={() => openSubject("core_cs")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        Core CS Subjects
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        3 Sheets
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Strengthen DBMS, Operating Systems and Computer Networks fundamentals for technical rounds.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Explore Sheets</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Subject 4: AI Mock Interviews */}
              <div
                onClick={() => navigate("/interview")}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] hover:bg-[#111318] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors truncate">
                        AI Mock Interviews
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        Live Simulation
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#7A808C] mt-0.5 line-clamp-1">
                      Interactive real-time text and coding interviews with AI scoring and rubric evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#7A808C] group-hover:text-white shrink-0 pl-4">
                  <span>Launch Room</span>
                  <ChevronRight className="w-4 h-4 text-[#525866] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail (4 of 12 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Battle Arena Contest Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131124] to-[#0A0C10] border border-[#261E42] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  COMPETITIVE ARENA
                </span>
                <h3 className="text-xl font-extrabold text-white mt-3 tracking-tight">
                  LIVE BATTLE ARENA
                </h3>
                <p className="text-xs text-[#8B92A0] mt-1">
                  Host or join timed assessments with peer competition, live scoring, and anti-cheat proctoring.
                </p>
              </div>

              <Link
                to="/rooms"
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Enter Battle Arena</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            </div>

            {/* Daily Planner Card */}
            <div className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] min-h-[260px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Planner</h3>
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#14161C] border border-[#1E2229] flex items-center justify-center text-[#8B92A0] mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Track your daily targets
                  </p>
                  <p className="text-[11px] text-[#525866] mt-1 max-w-xs">
                    Solve questions each day to maintain your streak and earn certificates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openSheetPractice("striver_a2z")}
                className="w-full py-2 rounded-xl bg-[#14161C] hover:bg-[#1A1D24] text-xs font-medium text-white border border-[#1E2229] transition-all cursor-pointer"
              >
                View Today's Tasks →
              </button>
            </div>

            {/* Target Company Loops Quick Card */}
            <div className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">Target Company Kits</h3>
                </div>
                <button
                  type="button"
                  onClick={() => openCompanyKitsCatalog()}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-mono transition-colors cursor-pointer"
                >
                  View All Kits →
                </button>
              </div>
              <p className="text-xs text-[#8B92A0]">
                Targeting a specific loop? Jump straight to interview question sets with real ask frequencies.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {TOP_COMPANIES_PRESET.slice(0, 8).map((comp) => {
                  const logo = getCompanyLogo(comp.name);
                  const isTarget = readinessData?.targetCompany?.toLowerCase() === comp.name.toLowerCase();
                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => openCompanyKit(comp.name)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left group cursor-pointer",
                        isTarget
                          ? "bg-blue-600/10 border-blue-500/40 text-blue-400"
                          : "bg-[#12151D] border-[#181A20] hover:border-zinc-700 text-zinc-300 hover:text-white"
                      )}
                    >
                      <div className="w-5 h-5 rounded-lg bg-[#08090C] border border-[#1E2229] p-0.5 flex items-center justify-center shrink-0">
                        {logo ? (
                          <img src={logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-3 h-3 text-zinc-400" />
                        )}
                      </div>
                      <span className="truncate flex-1">{comp.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => openCompanyKitsCatalog()}
                className="w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-xs font-semibold text-blue-400 border border-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Explore 18+ Curated Kits</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          LEVEL 2: SHEETS CATALOG CARDS VIEW (Selecting between Striver A2Z, NeetCode 150, Blind 75, etc.)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "sheets_catalog" && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#181A20]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-white font-medium capitalize">
                  {selectedSubject === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {selectedSubject === "dsa" ? "Data Structures & Algorithms Sheets" : "Core CS Fundamentals"}
              </h1>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                Choose a structured curriculum that matches your timeline and interview target.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer"
            >
              â† Back to Overview
            </button>
          </div>

          {/* Multiple Sheet Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentSubjectSheets.map((sheet) => {
              const sheetProblems = sheet.problems;
              const solvedCountForSheet = sheetProblems.filter((p) => solvedProblems[p.id]).length;
              const pct = Math.round((solvedCountForSheet / Math.max(sheetProblems.length, 1)) * 100);

              return (
                <div
                  key={sheet.id}
                  onClick={() => openSheetPractice(sheet.id)}
                  className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/50 hover:bg-[#101217] transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          sheet.badgeColor === "emerald"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : sheet.badgeColor === "amber"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : sheet.badgeColor === "purple"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-[#327CF6]/10 text-[#327CF6] border-[#327CF6]/20"
                        )}
                      >
                        {sheet.badge}
                      </span>

                      <span className="text-xs font-mono text-[#525866]">
                        {sheet.estimatedHours}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-[#327CF6] transition-colors">
                      {sheet.title}
                    </h2>
                    <p className="text-xs text-[#327CF6] font-medium mt-0.5">
                      {sheet.subtitle}
                    </p>
                    <p className="text-xs text-[#7A808C] mt-2.5 leading-relaxed">
                      {sheet.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#181A20]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#8B92A0] font-medium">Progress</span>
                      <span className="font-mono text-white font-bold">
                        {pct}% ({solvedCountForSheet}/{sheetProblems.length})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#181A20] overflow-hidden mb-4">
                      <div
                        className="h-full bg-[#327CF6] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#525866]">
                        {sheet.problemCount} Problems
                      </span>
                      <span className="text-xs font-semibold text-[#327CF6] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Start Practicing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          LEVEL 3: SHEET PRACTICE VIEW (Problem Table + Sheet Switcher Pill Bar)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "sheet_practice" && (
        <div className="space-y-6">
          {/* Breadcrumb & Sheet Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-2">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-2 font-sans">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Prephub
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-white transition-colors cursor-pointer capitalize"
                >
                  {currentSheet.subjectId === "dsa" ? "DSA Sheets" : "Core CS Sheets"}
                </button>
                <span>/</span>
                <span className="text-white font-medium">{currentSheet.title}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                {currentSheet.title}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#8B92A0] mt-1 max-w-2xl leading-relaxed">
                {currentSheet.description}
              </p>

              {/* Seamless Sheet Switcher Bar (User can switch between Striver A2Z, NeetCode 150, Blind 75 without leaving!) */}
              <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
                <span className="text-xs text-[#525866] font-semibold shrink-0">Switch Sheet:</span>
                {currentSubjectSheets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSheetPractice(s.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border",
                      selectedSheetId === s.id
                        ? "bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/40 font-semibold shadow-sm"
                        : "bg-[#0D0E12] text-[#8B92A0] border-[#181A20] hover:text-white hover:border-[#262933]"
                    )}
                  >
                    {s.title.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* TUF Progress Card for Current Sheet */}
            <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20] w-full lg:w-80 shrink-0">
              <div className="flex items-center justify-between text-xs text-[#8B92A0] mb-2">
                <span className="font-semibold text-white">Your Progress</span>
                <button
                  type="button"
                  onClick={() => setCurrentView("sheets_catalog")}
                  className="hover:text-white text-[11px] transition-colors"
                >
                  All sheets â†—
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sheetProgressPercent} %</span>
                <span className="text-xs text-[#525866]">({sheetSolvedCount}/{sheetTotalCount} solved)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#181A20] text-center">
                <div>
                  <span className="text-[10px] text-[#10B981] font-semibold block">Basic</span>
                  <span className="text-xs font-mono font-bold text-white">{basicSolved}/{basicTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#F59E0B] font-semibold block">Core</span>
                  <span className="text-xs font-mono font-bold text-white">{coreSolved}/{coreTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#EF4444] font-semibold block">Hard</span>
                  <span className="text-xs font-mono font-bold text-white">{hardSolved}/{hardTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Area (9 cols) + Top Companies Sidebar (3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-9 space-y-4">
              {/* Search & Counter Bar */}
              <div className="flex items-center justify-between gap-3 bg-[#0D0E12] p-2 rounded-xl border border-[#181A20]">
                <AdvancedFilterPopover 
                  filters={filters}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  options={filterOptions}
                  resultCount={filteredSheetProblems.length}
                />
              </div>

              {/* 48px Sleek Data Table */}
              <div className="rounded-2xl border border-[#181A20] bg-[#0D0E12] overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[#181A20] text-[11px] font-semibold text-[#7A808C] grid grid-cols-12 gap-3 items-center bg-[#090A0D]">
                  <div className="col-span-6 sm:col-span-5">Problem</div>
                  <div className="col-span-2 text-center">Difficulty</div>
                  <div className="col-span-2 hidden sm:block">Companies</div>
                  <div className="col-span-2 hidden sm:block">Topics</div>
                  <div className="col-span-4 sm:col-span-1 text-right">Action</div>
                </div>

                <div className="divide-y divide-[#181A20]">
                  {filteredSheetProblems.map((prob) => {
                    const isSolved = Boolean(solvedProblems[prob.id]);
                    return (
                      <div
                        key={prob.id}
                        className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-[#111318] transition-colors text-xs"
                      >
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              const diff = prob.difficulty === "Basic" ? "EASY" : prob.difficulty === "Core" ? "MEDIUM" : "HARD";
                              toggleSolved(prob.id, e, diff, [prob.topic]);
                            }}
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border",
                              isSolved
                                ? "bg-[#327CF6] border-[#327CF6] text-white"
                                : "border-[#272B33] text-transparent hover:border-[#327CF6]"
                            )}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>

                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              to={`/coding/${prob.slug}`}
                              className={cn(
                                "font-medium hover:text-[#327CF6] transition-colors truncate",
                                isSolved ? "text-[#7A808C] line-through" : "text-[#EDEDED]"
                              )}
                            >
                              {prob.index}. {prob.title}
                            </Link>

                            {prob.isPotd && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 shrink-0">
                                &lt;&gt; POTD
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide",
                              prob.difficulty === "Basic"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : prob.difficulty === "Core"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}
                          >
                            {prob.difficulty}
                          </span>
                        </div>

                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-[#525866]">
                          <Lock className="w-3.5 h-3.5 text-[#327CF6]/70" />
                          <span className="text-[11px] font-mono text-[#8B92A0]">
                            {prob.companies[0]}
                          </span>
                        </div>

                        <div className="col-span-2 hidden sm:flex items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-[#14161C] text-[#8B92A0] text-[10px] font-mono border border-[#1E2229] truncate">
                            {prob.topic}
                          </span>
                        </div>

                        <div className="col-span-4 sm:col-span-1 flex items-center justify-end gap-1.5 text-[#7A808C]">
                          <button
                            type="button"
                            onClick={(e) => handleToggleBookmark(prob.slug, prob.title, prob.difficulty, e)}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border",
                              bookmarkedSlugs.includes(prob.slug)
                                ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                                : "bg-[#08090C] border-[#181A20] text-[#525866] hover:text-[#22C55E] hover:border-[#22C55E]/30"
                            )}
                            title={bookmarkedSlugs.includes(prob.slug) ? "Remove Bookmark" : "Bookmark for Revision"}
                          >
                            <Bookmark
                              className={cn(
                                "w-3.5 h-3.5",
                                bookmarkedSlugs.includes(prob.slug) && "fill-[#22C55E]"
                              )}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveNoteTarget({
                                isOpen: true,
                                slug: prob.slug,
                                title: prob.title,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-[#08090C] border border-[#181A20] hover:border-[#F59E0B]/40 text-[#525866] hover:text-[#F59E0B] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Notes & Hints Notepad"
                          >
                            <NotebookPen className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://leetcode.com/problems/${prob.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-[#FFA116]/10 hover:bg-[#FFA116]/20 text-[#FFA116] flex items-center justify-center transition-colors shrink-0"
                            title="Solve on LeetCode"
                          >
                            <img src="/leetcode.svg" alt="LeetCode" className="w-3.5 h-3.5 object-contain" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Top Companies */}
            <div className="lg:col-span-3 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Target Company Assessment Sets
                  </h3>
                  <button
                    type="button"
                    onClick={() => openCompanyWise()}
                    className="text-[10px] text-[#327CF6] hover:underline whitespace-nowrap"
                  >
                    View 470+ â†—
                  </button>
                </div>
                
                <p className="text-[#8B92A0] text-xs mb-4">
                  Questions organized by company, recency, and interview ask rate.
                </p>

                <div className="flex flex-wrap gap-2">
                  {TOP_COMPANIES_PRESET.slice(0, 20).map((comp) => {
                    const logo = getCompanyLogo(comp.name);
                    return (
                      <button
                        key={comp.name}
                        type="button"
                        onClick={() => openCompanyWise(comp.name)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                          selectedCompany === comp.name
                            ? "bg-[#327CF6] text-white border-[#327CF6]"
                            : "bg-[#08090C] text-[#8B92A0] border-[#181A20] hover:border-[#327CF6]/50 hover:text-white"
                        )}
                      >
                        {logo && (
                          <img
                            src={logo}
                            alt=""
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                        )}
                        <span>{comp.name}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                          selectedCompany === comp.name ? "bg-white/20 text-white" : "bg-[#14161C] text-[#525866]"
                        )}>
                          {comp.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SECTION 4: DEDICATED COMPANY-WISE QUESTION EXPLORER (470+ COMPANIES)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {currentView === "company_wise" && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between pb-2 border-b border-[#181A20]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A808C] mb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView("hub")}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prephub</span>
                </button>
                <span>/</span>
                <span className="text-white font-medium">Company-Wise Question Hub</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Target Company Assessment Sets</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  470+ Verified Companies
                </span>
              </h1>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                Questions organized by company, recency, and interview ask rate with automated Judge0 evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#262933] text-xs text-[#8B92A0] hover:text-white transition-all cursor-pointer"
            >
              â† Back to Prephub
            </button>
          </div>

          {/* Company Picker Bar */}
          <div className="p-5 rounded-2xl bg-[#0D0E12] border border-[#181A20]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8B92A0] uppercase tracking-wider flex items-center gap-2">
                {getCompanyLogo(selectedCompany) ? (
                  <img
                    src={getCompanyLogo(selectedCompany)!}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-[#327CF6]" />
                )}
                Target Company: <strong className="text-white font-bold">{selectedCompany}</strong>
              </span>
              <span className="text-xs text-[#525866] font-mono">
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
                        ? "bg-[#327CF6] text-white border-[#327CF6] shadow-sm shadow-[#327CF6]/30"
                        : "bg-[#08090C] text-[#8B92A0] border-[#181A20] hover:border-[#327CF6]/50 hover:text-white"
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
                      selectedCompany === comp.name ? "bg-white/20 text-white" : "bg-[#14161C] text-[#525866]"
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
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs self-start sm:self-auto">
              {[
                { id: "thirtyDays", label: "ðŸ”¥ Last 30 Days" },
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
                      ? "bg-[#181A20] text-white shadow-sm font-semibold"
                      : "text-[#7A808C] hover:text-white"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center p-1 rounded-xl bg-[#0D0E12] border border-[#181A20] self-start sm:self-auto">
                {["ALL", "SOLVED", "UNSOLVED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setCompanyStatusFilter(status as any)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer",
                      companyStatusFilter === status
                        ? "bg-[#181A20] text-white shadow-sm"
                        : "text-[#7A808C] hover:text-white"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:flex-none sm:w-72">
                <Search className="w-4 h-4 text-[#525866] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedCompany} questions...`}
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  className="w-full bg-[#0D0E12] border border-[#181A20] focus:border-[#327CF6] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#525866] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Company Problem List Table */}
          <div className="rounded-2xl border border-[#181A20] bg-[#0D0E12] overflow-hidden">
            <div className="p-4 border-b border-[#181A20] flex items-center justify-between bg-[#08090C]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {selectedCompany} Problem Breakdown
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#327CF6]/15 text-[#327CF6] border border-[#327CF6]/30 text-[10px] font-semibold font-mono">
                  {companyQuestionsData?.totalCount || 0} questions
                </span>
              </div>
              <span className="text-[11px] text-[#525866] font-mono">
                Ranked by interview ask rate
              </span>
            </div>

            {isCompanyLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[#327CF6] border-t-transparent animate-spin" />
                <p className="text-xs text-[#8B92A0] font-mono">Loading questions for {selectedCompany}...</p>
              </div>
            ) : (
              <div className="divide-y divide-[#181A20]">
                {(companyQuestionsData?.questions || [])
                  .filter((q) => {
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
                  })
                  .slice(0, 100)
                  .map((q, idx) => (
                    <div
                      key={idx}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#111318] transition-colors"
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
                                    ? "bg-[#327CF6] border-[#327CF6] text-white"
                                    : "border-[#272B33] text-transparent hover:border-[#327CF6]"
                                )}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </button>
                            );
                          })()}
                          <span className={cn(
                            "font-medium text-xs sm:text-sm truncate",
                            Boolean(solvedProblems[q.nativeId ? String(q.nativeId) : q.slug]) ? "text-[#7A808C] line-through" : "text-white"
                          )}>
                            {q.title}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                              q.difficulty === "EASY"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : q.difficulty === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}
                          >
                            {q.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {q.topics.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-[#08090C] text-[#8B92A0] text-[10px] font-mono border border-[#181A20]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 pl-2">
                        {q.frequency > 0 && (
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[9px] text-[#525866] font-mono block leading-none mb-1">Ask Rate</span>
                            <span className="text-xs font-bold text-[#F59E0B] font-mono leading-none">
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
                              ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                              : "bg-[#08090C] border-[#181A20] text-[#525866] hover:text-[#22C55E] hover:border-[#22C55E]/30"
                          )}
                          title={bookmarkedSlugs.includes(q.slug) ? "Remove Bookmark" : "Bookmark for Revision"}
                        >
                          <Bookmark
                            className={cn(
                              "w-3.5 h-3.5",
                              bookmarkedSlugs.includes(q.slug) && "fill-[#22C55E]"
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
                          className="w-7 h-7 rounded-lg bg-[#08090C] border border-[#181A20] hover:border-[#F59E0B]/40 text-[#525866] hover:text-[#F59E0B] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          title="Notes & Hints Notepad"
                        >
                          <NotebookPen className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={q.link || (q.slug ? `https://leetcode.com/problems/${q.slug}` : "#")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-[#141620] hover:bg-[#FFA116]/15 border border-[#232736] hover:border-[#FFA116]/50 text-[#FFA116] flex items-center justify-center transition-all shrink-0 group/lc cursor-pointer shadow-sm"
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
            )}
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