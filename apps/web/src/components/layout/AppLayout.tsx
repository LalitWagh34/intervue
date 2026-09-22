import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { authClient, useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import {
  Search,
  Bell,
  Flame,
  Swords,
  Coins,
  User,
  History,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { data: session } = useSession();
  const { data: stats } = useProfileStats();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible Sidebar state (synced with localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tuf_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tuf_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Profile Popover Dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close profile dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const currentStreak = stats?.consistency?.currentStreak ?? 7;
  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-[#060709] text-[#F3F4F6] font-sans flex selection:bg-[#327CF6]/30">
      {/* Floating Inset Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* Main Content Viewport Column */}
      <div
        className={cn(
          "flex-1 min-h-screen flex flex-col bg-[#060709] transition-all duration-300 ease-in-out",
          isCollapsed ? "pl-[84px]" : "pl-[276px]"
        )}
      >
        {/* TUF Floating Top Header */}
        <header className="h-16 px-6 md:px-8 border-b border-[#181A20] bg-[#0A0C10]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          {/* Global Search / Command Bar Trigger */}
          <div
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 text-xs text-[#8B92A0] hover:text-[#F3F4F6] cursor-pointer transition-all w-64 md:w-80 group shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-[#525866] group-hover:text-[#327CF6] transition-colors" />
            <span className="flex-1 truncate">Search problems, sheets, tracks...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#060709] border border-[#181A20] text-[10px] font-mono text-[#8B92A0]">
              ⌘K
            </kbd>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Battle Arena Trigger */}
            {/* <Link
              to="/rooms"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#327CF6]/10 border border-[#327CF6]/25 hover:border-[#327CF6]/50 text-[#327CF6] text-xs font-semibold shadow-[0_0_15px_rgba(50,124,246,0.15)] transition-all cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Battle Arena</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </Link> */}

            {/* TUF Coins Balance */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-semibold font-mono text-[#F59E0B]"
              title="TUF Coin Balance"
            >
              <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>20</span>
            </div>

            {/* Streak Counter Pill */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-semibold font-mono text-[#F59E0B]"
              title="Consecutive practice streak"
            >
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B]/20 text-[#F59E0B]" />
              <span>{currentStreak}d</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate("/history")}
              className="w-9 h-9 rounded-xl bg-[#0D0E12] border border-[#181A20] flex items-center justify-center text-[#8B92A0] hover:text-white hover:border-[#327CF6]/40 transition-colors cursor-pointer"
              title="Recent Activity"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* User Profile Avatar with Clickable Dropdown Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#0D0E12] border border-transparent hover:border-[#181A20] transition-all cursor-pointer"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#327CF6]/40 hover:ring-[#327CF6] transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#327CF6] flex items-center justify-center text-xs text-white font-bold font-mono">
                    {initials}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-[#8B92A0] transition-transform duration-200 hidden sm:block",
                    isProfileOpen && "rotate-180 text-white"
                  )}
                />
              </button>

              {/* Profile Dropdown Drawer/Popover (matching TUF profile card) */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-2xl bg-[#0A0C10] border border-[#181A20] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#181A20]">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt="Profile"
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#327CF6]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#327CF6] flex items-center justify-center font-bold text-sm text-white font-mono">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {user?.name || "Student Candidate"}
                      </p>
                      <p className="text-[11px] text-[#8B92A0] truncate font-mono">
                        {user?.email || "candidate@intervue.tuf"}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="p-2 rounded-xl bg-[#0D0E12] border border-[#181A20] text-center">
                      <span className="text-[10px] text-[#8B92A0] block">Streak</span>
                      <span className="text-xs font-bold text-[#F59E0B] font-mono flex items-center justify-center gap-1 mt-0.5">
                        <Flame className="w-3 h-3" /> {currentStreak} Days
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0D0E12] border border-[#181A20] text-center">
                      <span className="text-[10px] text-[#8B92A0] block">TUF Balance</span>
                      <span className="text-xs font-bold text-[#327CF6] font-mono flex items-center justify-center gap-1 mt-0.5">
                        <Coins className="w-3 h-3" /> 20 Coins
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Navigation Links */}
                  <div className="space-y-1 pt-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8B92A0] hover:text-white hover:bg-[#12141B] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#327CF6]" />
                      <span>My Profile & Heatmap</span>
                    </Link>

                    <Link
                      to="/history"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8B92A0] hover:text-white hover:bg-[#12141B] transition-colors"
                    >
                      <History className="w-4 h-4 text-[#10B981]" />
                      <span>Contest Standings & Scorecards</span>
                    </Link>

                    <Link
                      to="/practice"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8B92A0] hover:text-white hover:bg-[#12141B] transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Prep Hub & Curriculums</span>
                    </Link>

                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8B92A0] hover:text-white hover:bg-[#12141B] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#525866]" />
                      <span>Admin Management CMS</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-3 mt-2 border-t border-[#181A20]">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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