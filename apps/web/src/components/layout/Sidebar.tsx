import { useState, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  History,
  MessageSquare,
  LogOut,
  Swords,
  BookOpen,
  Brain,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  NotebookPen,
  Bookmark,
  Shield,
  BarChart3,
  Users,
  FileCode2,
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
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        label: "Practice Hub",
        icon: BookOpen,
        href: "/practice",
      },
      {
        label: "AI Interview",
        icon: Brain,
        href: "/interview",
      },
      {
        label: "Battle Arena",
        icon: Swords,
        href: "/rooms",
      },
    ],
  },
  {
    title: "TOOLS",
    items: [
      {
        label: "Scorecards",
        icon: History,
        href: "/history",
      },
      {
        label: "Notes & Hints",
        icon: NotebookPen,
        href: "/notes",
      },
      {
        label: "Bookmarks",
        icon: Bookmark,
        href: "/bookmarks",
      },
      {
        label: "AI Mentor",
        icon: MessageSquare,
        href: "/chat",
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
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
  returnFocusRef,
}: SidebarProps) {
  const location = useLocation();
  const { data: session } = useSession();
  const { data: profileStats } = useProfileStats();
  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";
  const asideRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );
  const effectiveCollapsed = isDesktop && isCollapsed;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileOpen || isDesktop) return;

    const drawer = asideRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>("[data-mobile-drawer-close]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileClose?.();
        return;
      }

      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef?.current?.focus();
    };
  }, [isDesktop, isMobileOpen, onMobileClose, returnFocusRef]);

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
      localStorage.removeItem("intervue_session_token");
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
        <button
          type="button"
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          aria-label="Close navigation menu"
          tabIndex={-1}
        />
      )}

      <aside
        id="primary-navigation"
        ref={asideRef}
        aria-label="Primary navigation"
        aria-hidden={!isDesktop && !isMobileOpen}
        inert={!isDesktop && !isMobileOpen ? true : undefined}
        className={cn(
          "fixed top-2 bottom-2 z-50 lg:z-30 rounded-2xl bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl flex flex-col select-none transition-all duration-300 ease-in-out overflow-hidden",
          // Desktop positioning
          "lg:left-2",
          effectiveCollapsed ? "lg:w-[68px]" : "lg:w-[260px]",
          // Mobile positioning & slide transition
          "left-2 w-[270px] max-w-[85vw]",
          isMobileOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0"
        )}
      >
        {/* Brand Header & Toggle Button */}
        <div
          className={cn(
            "border-b border-[var(--border-subtle)] shrink-0 flex items-center",
            effectiveCollapsed ? "flex-col justify-center gap-2 py-3 px-2" : "h-16 px-4 justify-between"
          )}
        >
          {!effectiveCollapsed ? (
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
                  <span className="text-[var(--text-primary)] font-bold text-[15px] tracking-tight font-sans truncate">
                    Intervue
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-mono tracking-wide -mt-0.5 truncate">
                  placement suite
                </p>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" onClick={onMobileClose} className="mx-auto" title="Intervue">
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
            data-mobile-drawer-close
            aria-label="Close navigation menu"
            className="lg:hidden w-11 h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Collapse / Open Toggle Button */}
          <button
            type="button"
            onClick={onToggle}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden lg:flex w-9 h-9 rounded-lg items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer shrink-0",
              effectiveCollapsed && "mx-auto"
            )}
          >
            {effectiveCollapsed ? (
              <PanelLeft className="w-4 h-4 text-[var(--accent-text)]" />
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
              {!effectiveCollapsed && section.title && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
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
                      to={hasSubItems ? (effectiveCollapsed ? "/admin" : (isSubOpen ? item.href : "/admin/overview")) : item.href}
                      onClick={() => {
                        if (hasSubItems && !effectiveCollapsed) {
                          setAdminExpanded((prev) => !prev);
                        }
                        if (!hasSubItems) onMobileClose?.();
                      }}
                      title={effectiveCollapsed ? item.label : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer",
                        isActive
                          ? "bg-[var(--surface-selected)] text-[var(--accent-text)] font-semibold border border-[var(--border-subtle)] shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent"
                      )}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--action-primary)]" />
                      )}

                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                          effectiveCollapsed && "mx-auto"
                        )}
                      />

                      {!effectiveCollapsed && (
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
                    {hasSubItems && isSubOpen && !effectiveCollapsed && item.subItems && (
                      <div className="ml-5 pl-2.5 border-l border-[var(--border-subtle)] space-y-1 py-1">
                        {item.subItems.map((sub, sIdx) => {
                          const isSubActive =
                            location.pathname === sub.href ||
                            (sub.href === "/admin/overview" && location.pathname === "/admin");
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sIdx}
                              to={sub.href}
                              onClick={onMobileClose}
                              className={cn(
                                "flex min-h-11 items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors group",
                                isSubActive
                                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] font-semibold"
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "w-3.5 h-3.5 shrink-0 transition-colors",
                                  isSubActive
                                    ? "text-[var(--accent-text)]"
                                    : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
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

      {/* Compact Secondary Support Group (Help & Feedback) */}
      <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] shrink-0">
        {!effectiveCollapsed ? (
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <Link
              to="/help"
              onClick={onMobileClose}
              className="flex min-h-11 items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help Center</span>
            </Link>
            <span className="text-[var(--border-control)]">•</span>
            <Link
              to="/feedback"
              onClick={onMobileClose}
              className="flex min-h-11 items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
            >
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </Link>
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            <Link
              to="/help"
              onClick={onMobileClose}
              title="Help Center"
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Footer Profile / Quick Status */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--surface)] shrink-0">
        {!effectiveCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
            <Link to="/profile" onClick={onMobileClose} className="flex min-h-11 items-center gap-2.5 min-w-0 group">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[var(--action-primary)]/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[var(--action-primary)] text-[var(--on-primary)] flex items-center justify-center font-bold text-xs font-mono">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-text)] transition-colors">
                  {user?.name || "Candidate"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                  {user?.email || "Pro Student"}
                </p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-subtle)] transition-colors cursor-pointer"
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
