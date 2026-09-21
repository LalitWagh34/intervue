import { Outlet, Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { Search, Bell, Flame } from "lucide-react";

export default function AppLayout() {
  const { data: session } = useSession();
  const { data: stats } = useProfileStats();
  const navigate = useNavigate();

  const currentStreak = stats?.consistency?.currentStreak ?? 0;

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-[#f5f7fa] flex">
      {/* Persistent Left Sidebar (Section 10) */}
      <Sidebar />

      {/* Main Column */}
      <div className="ml-[250px] flex-1 min-h-screen flex flex-col bg-[#0b0c0f]">
        {/* Topbar (Section 12) */}
        <header className="h-16 px-6 md:px-10 border-b border-[#1e2229] bg-[#0b0c0f]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
          {/* Global Search / Command Bar Trigger */}
          <div
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#14161b] border border-[#272b33] hover:border-[#3b9cff]/40 text-xs text-[#707784] hover:text-[#a1a7b3] cursor-pointer transition-all w-64 md:w-80"
          >
            <Search className="w-3.5 h-3.5 text-[#707784]" />
            <span className="flex-1">Search problems, roadmaps...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#101216] border border-[#272b33] text-[10px] font-mono text-[#707784]">
              ⌘K
            </kbd>
          </div>

          {/* Right Actions: Streak, Notifications, Profile */}
          <div className="flex items-center gap-3">
            {/* Streak Pill (Section 12, 46) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#14161b] border border-[#272b33] text-xs font-semibold text-[#f59e0b]">
              <Flame className="w-3.5 h-3.5 fill-[#f59e0b]/20" />
              <span>{currentStreak} days</span>
            </div>

            {/* Notification Bell */}
            <button
              className="w-8 h-8 rounded-xl bg-[#14161b] border border-[#272b33] flex items-center justify-center text-[#a1a7b3] hover:text-white hover:border-[#3b9cff]/40 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* User Profile Avatar */}
            <Link to="/profile" className="flex items-center gap-2">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#2f80ed]/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#2f80ed] flex items-center justify-center text-xs text-white font-bold">
                  {session?.user?.name?.[0] || "U"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative z-10 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}