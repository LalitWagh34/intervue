import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  History,
  Trophy,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Swords,
  BookOpen,
  Layers,
  Sparkles,
  Flame,
  Brain,
  ChevronRight,
  Shield,
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
    title: "PREPARATION HUB",
    items: [
      {
        label: "Practice & Sheets",
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
        label: "Problem Workspace",
        icon: Code2,
        href: "/coding",
      },
      {
        label: "AI Mock Interview",
        icon: Brain,
        href: "/interview",
      },
    ],
  },
  {
    title: "ANALYTICS & ACTIVITY",
    items: [
      {
        label: "Overview Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        label: "Contest & Scorecards",
        icon: History,
        href: "/history",
      },
      {
        label: "AI Mentor Chat",
        icon: MessageSquare,
        href: "/chat",
      },
    ],
  },
  {
    title: "ACCOUNT & SETTINGS",
    items: [
      {
        label: "Profile & Heatmap",
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

export default function Sidebar() {
  const location = useLocation();
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="w-[260px] h-screen bg-[#0A0C10] border-r border-[#1B1F27] flex flex-col fixed left-0 top-0 z-30 select-none">
      {/* Brand Header (TUF-Inspired) */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#1B1F27]">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_18px_rgba(37,99,235,0.35)] transition-transform group-hover:scale-105">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-base tracking-tight font-sans">
                Intervue
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-md">
                TUF
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wide -mt-0.5">
              placement suite
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3.5 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative",
                      isActive
                        ? "bg-blue-600/15 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.12)]"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-[#11141B] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon
                        className={cn(
                          "w-4 h-4 transition-colors shrink-0",
                          isActive
                            ? "text-blue-400"
                            : "text-zinc-500 group-hover:text-zinc-300"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider shrink-0",
                          item.badgeColor === "red"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        )}
                      >
                        {item.badgeColor === "red" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-[#1B1F27] bg-[#08090D]">
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-[#0E1117]">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/40 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
            )}
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || "Student"}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {user?.email || "Pro Candidate"}
              </p>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}