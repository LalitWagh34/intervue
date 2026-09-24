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
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient, useSession } from "@/lib/auth";

interface NavSection {
  title?: string;
  items: Array<{
    label: string;
    icon: any;
    href: string;
    badge?: string;
    badgeColor?: "red" | "blue" | "amber" | "emerald";
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "PREP",
    items: [
      {
        label: "Prep Hub",
        icon: BookOpen,
        href: "/practice",
        badge: "TUF",
        badgeColor: "blue",
      },
      {
        label: "Battle Arena",
        icon: Swords,
        href: "/rooms",
        badge: "LIVE",
        badgeColor: "red",
      },
      {
        label: "Practice Code",
        icon: Code2,
        href: "/coding",
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
    title: "MY SPACES",
    items: [
      {
        label: "Profile",
        icon: User,
        href: "/profile",
      },
      {
        label: "Admin CMS",
        icon: Settings,
        href: "/admin",
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
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
    <aside
      className={cn(
        "fixed top-2 left-2 bottom-2 z-40 rounded-2xl bg-[#0A0C10]/95 backdrop-blur-xl border border-[#181A20] shadow-xl flex flex-col select-none transition-all duration-300 ease-in-out overflow-hidden",
        isCollapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Brand Header & Toggle Button (matching tuf_ui sidebar toggle) */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#181A20] shrink-0">
        {!isCollapsed ? (
          <Link to="/dashboard" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#327CF6] flex items-center justify-center shadow-md shadow-[#327CF6]/20 shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm tracking-tight font-mono">F&gt;</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-[15px] tracking-tight font-sans truncate">
                  {/* take<span className="text-[#327CF6]">U</span>forward */}
                  inter<span className="text-[#327CF6]">V</span>ue
                </span>
              </div>
              <p className="text-[10px] text-[#525866] font-mono tracking-wide -mt-0.5 truncate">
                placement suite
              </p>
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="mx-auto" title="takeUforward">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#327CF6] flex items-center justify-center shadow-md shadow-[#327CF6]/20">
              <span className="text-white font-bold text-sm font-mono">F&gt;</span>
            </div>
          </Link>
        )}

        {/* TUF Sidebar Collapse / Open Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-[#8B92A0] hover:text-white hover:bg-[#14161C] border border-transparent hover:border-[#1E2229] transition-all cursor-pointer",
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
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {!isCollapsed && section.title && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#525866] mb-1.5 font-mono">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item, iIdx) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" && item.href !== "/dashboard" && location.pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={iIdx}
                    to={item.href}
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
                        {item.badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase border",
                              item.badgeColor === "red"
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : item.badgeColor === "emerald"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-[#327CF6]/15 text-[#327CF6] border-[#327CF6]/30"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
  );
}