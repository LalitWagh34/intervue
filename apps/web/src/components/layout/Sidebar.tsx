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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth";

interface NavSection {
  title?: string;
  items: Array<{
    label: string;
    icon: any;
    href: string;
    badge?: string;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { label: "Problems & Roadmap", icon: BookOpen, href: "/practice" },
      { label: "Coding IDE", icon: Code2, href: "/coding" },
      { label: "Battle Arena", icon: Swords, href: "/rooms", badge: "LIVE" },
      { label: "Interview History", icon: History, href: "/history" },
    ],
  },
  {
    title: "PREPARATION",
    items: [
      { label: "AI Coach Chat", icon: MessageSquare, href: "/chat" },
      { label: "Leaderboards", icon: Trophy, href: "/leaderboard" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Profile & Heatmap", icon: User, href: "/profile" },
      { label: "Admin CMS", icon: Settings, href: "/admin" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: session } = useSession();
  const navigate = useNavigate();

  return (
    <aside className="w-[250px] h-screen bg-[#101216] border-r border-[#1e2229] flex flex-col fixed left-0 top-0 z-30 select-none">
      {/* Brand Logo & Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#1e2229]">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#2f80ed] flex items-center justify-center shadow-[0_4px_16px_rgba(47,128,237,0.3)] transition-transform group-hover:scale-105">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f5f7fa] font-bold text-base tracking-tight">
                Intervue
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-[#2f80ed]/15 text-[#3b9cff] border border-[#2f80ed]/30 rounded">
                PRO
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections (Section 10) */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#707784] mb-1.5">
                {section.title}
              </p>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-[#2f80ed]/10 text-[#f5f7fa] border-l-2 border-[#2f80ed] pl-[10px]"
                        : "text-[#a1a7b3] hover:text-[#f5f7fa] hover:bg-[#191c22] border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-[#3b9cff]" : "text-[#707784] group-hover:text-[#a1a7b3]"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
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

      {/* User Footer (Section 11) */}
      <div className="p-3 border-t border-[#1e2229] bg-[#0b0c0f]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#272b33] bg-[#14161b] mb-2">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-7 h-7 rounded-full ring-1 ring-[#2f80ed]/30 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#2f80ed] flex items-center justify-center text-xs text-white font-bold">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#f5f7fa] font-semibold truncate leading-tight">
              {session?.user?.name || "Candidate"}
            </p>
            <p className="text-[10px] text-[#707784] truncate leading-tight mt-0.5">
              {session?.user?.email || "candidate@intervue.app"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut().then(() => navigate("/"))}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-[#707784] hover:text-[#ef4444] w-full rounded-xl hover:bg-[#ef4444]/10 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}