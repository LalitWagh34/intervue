import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  History,
  Trophy,
  MessageSquare,
  User,
  Code2,
  LogOut,
  Settings,
  Swords,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Practice", icon: Mic, href: "/practice" },
  { label: "Coding Hub", icon: Code2, href: "/coding" },
  { label: "Battle Arena", icon: Swords, href: "/rooms", badge: "LIVE" },
  { label: "History", icon: History, href: "/history" },
  { label: "AI Chat", icon: MessageSquare, href: "/chat" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Profile", icon: User, href: "/profile" },
  { label: "Admin", icon: Settings, href: "/admin" },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: session } = useSession();
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen bg-[#0a0b10]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col fixed left-0 top-0 z-30 select-none">
      {/* Brand Logo & Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/[0.08]">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(50,124,246,0.35)] group-hover:scale-105 transition-transform">
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
              <span className="text-white font-bold text-base tracking-tight font-sans">
                Intervue
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 rounded">
                TUF
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Placement Prep</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                isActive
                  ? "bg-[#327cf6]/15 text-white border border-[#327cf6]/40 shadow-[0_0_18px_rgba(50,124,246,0.18)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-[#38bdf8]"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-3 border-t border-white/[0.08] bg-[#07080c]/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] mb-2">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full ring-1 ring-blue-500/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xs text-white font-bold shadow-sm">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-semibold truncate leading-tight">
              {session?.user?.name || "Candidate"}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
              {session?.user?.email || "candidate@intervue.app"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut().then(() => navigate("/"))}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 w-full rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}