import { Outlet, Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { Search, Bell, Flame, Swords, Sparkles, Command } from "lucide-react";

export default function AppLayout() {
  const { data: session } = useSession();
  const { data: stats } = useProfileStats();
  const navigate = useNavigate();

  const currentStreak = stats?.consistency?.currentStreak ?? 0;

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex selection:bg-blue-600/30">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="ml-[260px] flex-1 min-h-screen flex flex-col bg-[#07080B]">
        {/* TUF Floating / Sleek Header */}
        <header className="h-16 px-6 md:px-8 border-b border-[#1B1F27] bg-[#0A0C10]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
          {/* Global Search / Command Bar Trigger */}
          <div
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0E1117] border border-zinc-800/90 hover:border-blue-500/40 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all w-64 md:w-80 shadow-inner group"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            <span className="flex-1 truncate">Search problems, sheets, tracks...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/50 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              ⌘K
            </kbd>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Battle Arena Trigger */}
            <Link
              to="/rooms"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/25 hover:border-blue-500/50 text-blue-400 text-xs font-semibold shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Arena</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </Link>

            {/* Streak Counter Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1117] border border-zinc-800/90 text-xs font-semibold font-mono text-amber-400 shadow-sm"
              title="Consecutive practice streak"
            >
              <Flame className="w-4 h-4 fill-amber-500/20 text-amber-400" />
              <span>{currentStreak}d streak</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate("/history")}
              className="w-9 h-9 rounded-xl bg-[#0E1117] border border-zinc-800/90 flex items-center justify-center text-zinc-400 hover:text-white hover:border-blue-500/40 transition-colors cursor-pointer"
              title="Recent Activity"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <Link to="/profile" className="flex items-center gap-2 group">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-blue-500/40 group-hover:ring-blue-400 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs text-white font-bold group-hover:scale-105 transition-transform">
                  {session?.user?.name?.[0] || "U"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 relative z-10 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}