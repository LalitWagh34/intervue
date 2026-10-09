import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  History,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Swords,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  NotebookPen,
  Bookmark,
  Shield,
  BarChart3,
  Users,
  FileCode2,
  Building2,
  HelpCircle,
  MessageSquareHeart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient, useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { BrandIcon } from "@/components/shared/BrandLogo";
import { useQueryClient } from "@tanstack/react-query";

interface NavSubItem {
  label: string;
  icon: any;
  href: string;
}

interface NavItem {
  label: string;
  icon: any;
  href: string;
  badge?: string;
  badgeColor?: "red" | "blue" | "amber" | "emerald";
  subItems?: NavSubItem[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "PREP",
    items: [
      {
        label: "Prep Hub",
        icon: BookOpen,
        href: "/practice",
        // badge: "TUF",
        badgeColor: "blue",
      },
      {
        label: "Company Kits",
        icon: Building2,
        href: "/practice?view=company_kits",
        // badge: "HOT",
        badgeColor: "amber",
      },
      {
        label: "Battle Arena",
        icon: Swords,
        href: "/rooms",
        // badge: "LIVE",
        badgeColor: "red",
      },
      {
        label: "AI Interview",
        icon: Brain,
        href: "/interview",
      },
    ],
  },
  {
    title: "EXPLORE",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        label: "Scorecards",
        icon: History,
        href: "/history",
      },
      {
        label: "AI Mentor",
        icon: MessageSquare,
        href: "/chat",
      },
    ],
  },
  {
    title: "MY TOOLS",
    items: [
      {
        label: "Notes & Hints",
        icon: NotebookPen,
        href: "/notes",
        // badge: "NEW",
        badgeColor: "amber" as const,
      },
      {
        label: "Bookmarks",
        icon: Bookmark,
        href: "/bookmarks",
      },
    ],
  },
  {
    title: "MY SPACES",
    items: [
      {
        label: "Profile",
        icon: User,
        href: "/profile",
      },
      {
        label: "Admin CMS",
        icon: Shield,
        href: "/admin",
        subItems: [
          { label: "Overview", icon: BarChart3, href: "/admin/overview" },
          { label: "Users & Roles", icon: Users, href: "/admin/users" },
          { label: "Coding Bank", icon: Code2, href: "/admin/problems" },
          { label: "MCQ Bank", icon: Brain, href: "/admin/mcqs" },
          { label: "Mock Interviews", icon: MessageSquare, href: "/admin/interviews" },
          { label: "Code Submissions", icon: FileCode2, href: "/admin/submissions" },
          { label: "Contest Rooms", icon: Swords, href: "/admin/rooms" },
        ],
      },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      {
        label: "Help Center",
        icon: HelpCircle,
        href: "/help",
      },
      {
        label: "Feedback",
        icon: MessageSquareHeart,
        href: "/feedback",
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const { data: session } = useSession();
  const { data: profileStats } = useProfileStats();
  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";
  const navigate = useNavigate();

  const [adminExpanded, setAdminExpanded] = useState<boolean>(() =>
    location.pathname.startsWith("/admin")
  );

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      setAdminExpanded(true);
    }
  }, [location.pathname]);

  const queryClient = useQueryClient();
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (_) {}
    queryClient.clear();
    window.location.href = "/login";
  };

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={cn(
          "fixed top-2 bottom-2 z-50 rounded-2xl bg-[#0A0C10]/98 backdrop-blur-xl border border-[#181A20] shadow-2xl flex flex-col select-none transition-all duration-300 ease-in-out overflow-hidden",
          // Desktop positioning
          "md:left-2",
          isCollapsed ? "md:w-[68px]" : "md:w-[260px]",
          // Mobile positioning & slide transition
          "left-2 w-[270px] max-w-[85vw]",
          isMobileOpen ? "translate-x-0" : "-translate-x-[115%] md:translate-x-0"
        )}
      >
        {/* Brand Header & Toggle Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#181A20] shrink-0">
          {!isCollapsed ? (
            <Link
              to="/dashboard"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/40 flex items-center justify-center shadow-md shadow-[#327CF6]/20 shrink-0 group-hover:border-[#327CF6]/70 group-hover:scale-105 transition-all">
                <BrandIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-[15px] tracking-tight font-sans truncate">
                    inter<span className="text-[#327CF6]">V</span>ue
                  </span>
                </div>
                <p className="text-[10px] text-[#525866] font-mono tracking-wide -mt-0.5 truncate">
                  placement suite
                </p>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" onClick={onMobileClose} className="mx-auto" title="interVue">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/40 flex items-center justify-center shadow-md shadow-[#327CF6]/20 hover:border-[#327CF6]/70 transition-colors">
                <BrandIcon className="w-5 h-5" />
              </div>
            </Link>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            title="Close menu"
            className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#8B92A0] hover:text-white hover:bg-[#14161C] border border-[#1E2229] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Collapse / Open Toggle Button */}
          <button
            type="button"
            onClick={onToggle}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-[#8B92A0] hover:text-white hover:bg-[#14161C] border border-transparent hover:border-[#1E2229] transition-all cursor-pointer",
              isCollapsed && "mx-auto mt-2"
            )}
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4 text-[#327CF6]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto scrollbar-none">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => {
            if (item.href === "/admin" && !isAdmin) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              {!isCollapsed && section.title && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#525866] mb-1.5 font-mono">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {visibleItems.map((item, iIdx) => {
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const isSubOpen = hasSubItems && (adminExpanded || location.pathname.startsWith(item.href));
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" && item.href !== "/dashboard" && location.pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <div key={iIdx} className="space-y-1">
                    <Link
                      to={hasSubItems ? (isCollapsed ? "/admin" : (isSubOpen ? item.href : "/admin/overview")) : item.href}
                      onClick={() => {
                        if (hasSubItems && !isCollapsed) {
                          setAdminExpanded((prev) => !prev);
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer",
                        isActive
                          ? "bg-[#327CF6]/15 text-[#327CF6] font-semibold border border-[#327CF6]/30 shadow-sm"
                          : "text-[#8B92A0] hover:text-white hover:bg-[#12141B] border border-transparent"
                      )}
                    >
                      {/* Active Left Indicator Bar (TUF style) */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#327CF6] shadow-[0_0_10px_#327CF6]" />
                      )}

                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-[#327CF6]" : "text-[#8B92A0] group-hover:text-white",
                          isCollapsed && "mx-auto"
                        )}
                      />

                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase border",
                                  item.badgeColor === "red"
                                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                                    : item.badgeColor === "emerald"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : item.badgeColor === "amber"
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    : "bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/30"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {hasSubItems && (
                              <ChevronDown
                                className={cn(
                                  "w-3.5 h-3.5 text-zinc-500 transition-transform duration-200",
                                  isSubOpen && "rotate-180 text-zinc-300"
                                )}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </Link>

                    {/* Indented Sub-panel Links */}
                    {hasSubItems && isSubOpen && !isCollapsed && item.subItems && (
                      <div className="ml-5 pl-2.5 border-l border-[#1F2430] space-y-1 py-1">
                        {item.subItems.map((sub, sIdx) => {
                          const isSubActive =
                            location.pathname === sub.href ||
                            (sub.href === "/admin/overview" && location.pathname === "/admin");
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sIdx}
                              to={sub.href}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all group",
                                isSubActive
                                  ? "bg-zinc-800 text-white font-semibold shadow-sm"
                                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "w-3.5 h-3.5 shrink-0 transition-colors",
                                  isSubActive ? "text-[#327CF6]" : "text-zinc-500 group-hover:text-zinc-300"
                                )}
                              />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </nav>

      {/* Footer Profile / Quick Status */}
      <div className="p-2.5 border-t border-[#181A20] bg-[#08090C] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0E12] border border-[#181A20]">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 group">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#327CF6]/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#327CF6] text-white flex items-center justify-center font-bold text-xs font-mono">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-[#327CF6] transition-colors">
                  {user?.name || "Candidate"}
                </p>
                <p className="text-[10px] text-[#525866] truncate font-mono">
                  {user?.email || "Pro Student"}
                </p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#525866] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link to="/profile" title={user?.name || "Profile"}>
              {user?.image ? (
                <img
                  src={user.image}
                  alt="User"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#327CF6]/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#327CF6] text-white flex items-center justify-center font-bold text-xs font-mono">
                  {initials}
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </aside>
  </>
);
}