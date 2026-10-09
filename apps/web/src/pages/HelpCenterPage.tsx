import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  X,
} from "lucide-react";

interface GuideArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
  actionLabel?: string;
  actionHref?: string;
}

const ARTICLES: GuideArticle[] = [
  // Getting Started
  {
    id: "what-is-intervue",
    title: "What is Intervue?",
    category: "Getting Started",
    summary: "An overview of Intervue's all-in-one technical interview and coding preparation platform.",
    content: [
      "Intervue is a next-generation engineering interview preparation ecosystem tailored for developers targeting tier-1 tech companies (Google, Amazon, Meta, Microsoft).",
      "Unlike static problem sheets, Intervue combines curated real-world company problem banks, deterministic daily Problems-of-the-Day (POTD), real-time AI voice mock interviews with instant rubric evaluations, and live 1v1 peer coding battles.",
    ],
    actionLabel: "Go to Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "who-is-intervue-for",
    title: "Who is Intervue for?",
    category: "Getting Started",
    summary: "Designed for software engineers, college students, and experienced developers.",
    content: [
      "Intervue is designed for any developer preparing for software engineering technical rounds — from college candidates aiming for their first internship to senior engineers targeting FAANG staff roles.",
      "Whether you need structured DSA sheets (Striver SDE, Blind 75, NeetCode), company-specific problem kits, or live verbal mock interviews, Intervue adapts to your preparation level.",
    ],
    actionLabel: "Explore Prep Hub",
    actionHref: "/practice",
  },
  {
    id: "key-features-overview",
    title: "Key Features Overview",
    category: "Getting Started",
    summary: "Explore the core tools: Prep Hub, Company Kits, Battle Arena, and AI Voice Mock.",
    content: [
      "• Prep Hub: Standard curated DSA sheets with topic categorization, solved tracking, and notes.",
      "• Company Kits: Curated problem kits for Google, Amazon, Meta, and Microsoft with authentic LeetCode links.",
      "• Daily POTD: Deterministic daily challenges tailored to your selected target companies.",
      "• Battle Arena: Real-time 1v1 competitive coding duels with timed challenges and scoreboards.",
      "• Revision Bookmarks: Quickly save tough problems with normalized difficulty tags.",
    ],
    actionLabel: "View Target Company Kits",
    actionHref: "/practice?view=company_kits",
  },
  {
    id: "create-an-account",
    title: "Create an Account (Google, Email)",
    category: "Getting Started",
    summary: "How to register and sign in to sync your progress across devices.",
    content: [
      "You can sign in using either 1-click Google OAuth or your Email and Password.",
      "Your solved problem history, bookmarks, notes, target companies, and interview performance metrics are automatically synced to the cloud.",
    ],
    actionLabel: "Manage Profile",
    actionHref: "/profile",
  },

  // Profile Tracker
  {
    id: "building-portfolio",
    title: "Building your Ultimate Portfolio (Profile Tracker)",
    category: "Profile Tracker",
    summary: "Set up your developer profile, target role, and interview goals.",
    content: [
      "Head to Edit Profile to add your full name, bio, target role (Frontend, Backend, Fullstack, Systems), experience level, and social links (GitHub, LinkedIn, Resume).",
      "You can upload a custom avatar photo, restore your Google account photo, or use generated initials.",
    ],
    actionLabel: "Edit Profile",
    actionHref: "/profile-setup",
  },
  {
    id: "connect-verify-platforms",
    title: "How to Connect & Verify Your Coding Platforms",
    category: "Profile Tracker",
    summary: "Link your LeetCode, Codeforces, and GitHub handles.",
    content: [
      "In your Profile Settings, enter your public handles for LeetCode, Codeforces, and GitHub.",
      "Intervue syncs your contest ratings, total problems solved, and contribution stats to build your comprehensive readiness radar.",
    ],
    actionLabel: "Connect Platforms",
    actionHref: "/profile-setup",
  },
  {
    id: "showcase-intervue-card",
    title: "Showcase Your Skills with the Intervue Card",
    category: "Profile Tracker",
    summary: "Generate your shareable developer card with rank and stats.",
    content: [
      "Your Intervue Profile generates a public developer badge showing your target companies, daily streak, problems mastered, and readiness percentile.",
      "Share your profile link with recruiters and peers to demonstrate verified interview readiness.",
    ],
    actionLabel: "View My Profile",
    actionHref: "/profile",
  },
  {
    id: "how-readiness-radar-works",
    title: "How the Readiness Radar Works?",
    category: "Profile Tracker",
    summary: "Understand your preparation score across Data Structures, Algorithms, and System Design.",
    content: [
      "The Readiness Radar algorithm tracks your practice across 6 dimensions: Arrays/Strings, Trees/Graphs, Dynamic Programming, Math/Bitwise, Speed Percentile, and Consistency.",
      "Solving daily POTD and company-specific problems increases your domain mastery scores.",
    ],
    actionLabel: "View Dashboard Radar",
    actionHref: "/dashboard",
  },

  // Question Tracker
  {
    id: "overview-question-tracker",
    title: "Overview of Intervue's Question Tracker",
    category: "Question Tracker",
    summary: "Master curated problem sheets, company frequency kits, and custom filters.",
    content: [
      "The Question Tracker in Prep Hub gives you structured roadmaps for technical interviews.",
      "You can mark problems as Solved, save Revision Bookmarks, take Personal Notes, and filter by topic or difficulty.",
    ],
    actionLabel: "Open Prep Hub",
    actionHref: "/practice",
  },
  {
    id: "sheets-in-intervue",
    title: "Sheets in Intervue (Striver, Blind 75, NeetCode)",
    category: "Question Tracker",
    summary: "Curated industry-standard problem sheets with completion trackers.",
    content: [
      "Intervue includes the most recognized interview preparation sheets:",
      "• Striver SDE Sheet (180+ problems covering core interview topics)",
      "• Blind 75 (The most essential LeetCode questions)",
      "• NeetCode 150 (Comprehensive roadmap for FAANG interviews)",
      "Track your progress per sheet with real-time percentage rings and breakdown stats.",
    ],
    actionLabel: "Browse Sheets",
    actionHref: "/practice",
  },
  {
    id: "how-workspace-works",
    title: "How Target Companies Work?",
    category: "Question Tracker",
    summary: "Target specific tech giants and get daily customized practice sets.",
    content: [
      "On the Dashboard or Prep Hub, select one or more Target Companies (Google, Amazon, Meta, Microsoft).",
      "Intervue instantly filters high-frequency problems asked by those companies, generates your daily POTD challenges, and highlights them with verified tags.",
      "You can add or remove target companies at any time using the interactive chips or 'Clear All' button.",
    ],
    actionLabel: "Configure Target Companies",
    actionHref: "/dashboard",
  },
  {
    id: "revision-bookmarks-notes",
    title: "Revision Bookmarks & Question Notes",
    category: "Question Tracker",
    summary: "Star tough questions and save key insights for quick revision before rounds.",
    content: [
      "Click the Bookmark icon next to any problem to save it into your Revision Bookmarks list.",
      "Use the Notes icon to record intuition, time complexity, and edge cases. Notes remain saved and accessible from the dedicated Notes & Hints page.",
    ],
    actionLabel: "View Revision Bookmarks",
    actionHref: "/bookmarks",
  },

  // Event & Contest Tracker
  {
    id: "battle-arena-guide",
    title: "1v1 Battle Arena: Never Miss a Coding Duel",
    category: "Event & Contest Tracker",
    summary: "Real-time peer coding duels with timed rounds and live test executions.",
    content: [
      "The Battle Arena allows you to create private or public contest rooms.",
      "Invite friends or match with global candidates to solve timed problems head-to-head with live scoring, spectator mode, and post-round comparisons.",
    ],
    actionLabel: "Enter Battle Arena",
    actionHref: "/rooms",
  },
  {
    id: "competitive-scoring-leaderboards",
    title: "Real-Time Competitive Scoring & Leaderboards",
    category: "Event & Contest Tracker",
    summary: "Earn points, track your rank, and build your competitive streak.",
    content: [
      "Every problem solved, daily check-in completed, and contest room won awards points toward your global rank.",
      "Compete for the top 10 on the global leaderboard and unlock exclusive profile badges.",
    ],
    actionLabel: "Check Scorecards",
    actionHref: "/history",
  },

  // Frequently Asked Questions
  {
    id: "profile-account-management",
    title: "Profile & Account Management",
    category: "Frequently Asked Questions",
    summary: "Managing your credentials, name, avatar, and linked social profiles.",
    content: [
      "You can update your personal information and profile picture under /profile-setup.",
      "To sign out, click Log Out at the bottom of the sidebar.",
    ],
    actionLabel: "Edit Profile",
    actionHref: "/profile-setup",
  },
  {
    id: "platform-integration-sync",
    title: "Platform Integration & LeetCode Sync",
    category: "Frequently Asked Questions",
    summary: "How problem links connect directly to official problem pages.",
    content: [
      "Every question in Intervue links directly to its official LeetCode problem page via the custom icon pill.",
      "Solving problems on LeetCode can be marked in Intervue to update your readiness stats and progress rings.",
    ],
    actionLabel: "View Company Kits",
    actionHref: "/practice?view=company_kits",
  },
  {
    id: "potd-frequency",
    title: "Target Company POTD Frequency",
    category: "Frequently Asked Questions",
    summary: "How daily problems are generated and rotated.",
    content: [
      "Daily POTD problems rotate every 24 hours based on your selected target companies.",
      "If you target Google and Amazon, you receive deterministic problems curated specifically from those question banks.",
    ],
    actionLabel: "View Today's POTD",
    actionHref: "/dashboard",
  },
  {
    id: "data-privacy-security",
    title: "Data Privacy & Free Tier",
    category: "Frequently Asked Questions",
    summary: "Our commitment to security, free forever access, and zero data selling.",
    content: [
      "All sessions are secured with 256-bit encryption and HTTP-only authentication cookies.",
      "Intervue's core features — DSA sheets, Company Kits, Target Company POTD, and Revision Bookmarks — are completely free for all developers.",
    ],
    actionLabel: "Go to Dashboard",
    actionHref: "/dashboard",
  },
];

const CATEGORIES = [
  "Getting Started",
  "Profile Tracker",
  "Question Tracker",
  "Event & Contest Tracker",
  "Frequently Asked Questions",
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<GuideArticle | null>(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return ARTICLES;
    const query = searchQuery.toLowerCase().trim();
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.content.some((c) => c.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Breadcrumb & Search Bar (Matching Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#F97316] font-semibold">Intervue Help Center</span>
          <span className="text-[#525866]">/</span>
          <span className="text-zinc-400">User Guide</span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for articles..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0D0E12] border border-[#1E2229] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 text-xs text-white placeholder:text-[#71717A] outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Page Title */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Intervue User Guide
        </h1>
        <p className="text-xs text-zinc-400">
          Everything you need to know about preparing, practicing, and cracking top tech interviews.
        </p>
      </div>

      {/* Search results banner if active */}
      {searchQuery && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
          <span>
            Found <strong className="text-white">{filteredArticles.length}</strong> articles matching "
            {searchQuery}"
          </span>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* 2-Column Categories Grid (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {CATEGORIES.map((category) => {
          const categoryArticles = filteredArticles.filter((a) => a.category === category);
          if (categoryArticles.length === 0) return null;

          return (
            <div key={category} className="space-y-3.5">
              {/* Category Title in Vibrant Orange (Matching Screenshot 1) */}
              <h2 className="text-base font-bold text-[#F97316] tracking-tight flex items-center gap-2">
                <span>{category}</span>
              </h2>

              {/* List of Clickable Article Titles */}
              <div className="space-y-2">
                {categoryArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left py-1 text-xs text-zinc-300 hover:text-white hover:translate-x-1 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="group-hover:text-[#F97316] transition-colors">{article.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#F97316] shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#0D0E12] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">
                  {selectedArticle.category}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedArticle.title}</h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p className="font-medium text-white/90">{selectedArticle.summary}</p>
              {selectedArticle.content.map((paragraph, idx) => (
                <p key={idx} className="text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Modal Action CTA */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Intervue User Guide</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {selectedArticle.actionHref && (
                  <Link
                    to={selectedArticle.actionHref}
                    onClick={() => setSelectedArticle(null)}
                    className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>{selectedArticle.actionLabel || "Open"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
