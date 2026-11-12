import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { signOut, useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useRewardsStatus } from "@/hooks/useRewards";
import { DailyStreakClaim } from "@/components/shared/DailyStreakClaim";
import { NotificationDropdown } from "./NotificationDropdown";
import {
  Search,
  Bell,
  Flame,
  Swords,
  Coins,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Menu,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductTourModal, openProductTour } from "@/components/shared/ProductTourModal";
import { ThemeToggle, ThemeQuickButton } from "@/components/shared/ThemeToggle";

export default function AppLayout() {
  const { data: session } = useSession();
  const { data: stats } = useProfileStats();
  const { setIsOpen } = useCommandPalette();
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
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

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

  // Mobile Drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const closeMobileNavigation = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isProfileOpen]);

  // Close profile dropdown and mobile drawer on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (_) {}
    navigate("/login");
  };

  const currentStreak = Math.max(stats?.profile?.streakCount ?? 0, stats?.consistency?.currentStreak ?? 0);
  const { data: rewardsStatus } = useRewardsStatus();
  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--canvas)] text-[var(--text-primary)] font-sans flex selection:bg-[var(--surface-selected)]">
      {/* Daily Streak Auto-Claim (fires once per day silently) */}
      <DailyStreakClaim />
      {/* Floating Inset Sidebar (Responsive drawer on mobile, fixed on desktop) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={closeMobileNavigation}
        returnFocusRef={mobileMenuButtonRef}
      />

      {/* Main Content Viewport Column */}
      <div
        className={cn(
          "flex-1 min-w-0 h-[100dvh] overflow-hidden flex flex-col bg-[var(--canvas)] transition-all duration-300 ease-in-out",
          "pl-0",
          isCollapsed ? "lg:pl-[84px]" : "lg:pl-[276px]"
        )}
      >
        {/* Top Header */}
        <header className="h-16 mt-2 mx-2 sm:mx-3 lg:ml-0 lg:mr-2 px-3 sm:px-5 lg:px-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-sm sticky top-2 z-30 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Mobile Menu Hamburger Button */}
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-11 h-11 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title="Open navigation menu"
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              aria-controls="primary-navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Global Search / Command Bar Trigger */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-11 sm:h-9 items-center gap-2 px-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all min-w-0 w-11 min-[390px]:w-auto min-[390px]:flex-1 max-w-[170px] sm:max-w-xs lg:w-80 group"
              aria-label="Open global search"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors shrink-0" />
              <span className="hidden min-[390px]:block flex-1 truncate text-left">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Battle Arena Trigger */}
            {/* <Link
              to="/rooms"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#327CF6]/10 border border-[#327CF6]/25 hover:border-[#327CF6]/50 text-[#327CF6] text-xs font-semibold shadow-[0_0_15px_rgba(50,124,246,0.15)] transition-all cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Battle Arena</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </Link> */}

            {/* Merged Rewards & Streak Hover Pill */}
            <div
              className="hidden sm:flex items-center rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all text-xs font-semibold font-mono overflow-hidden cursor-default"
              title={`${rewardsStatus?.points ?? 0} Intervue Coins • ${currentStreak} Day Practice Streak`}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[var(--status-success)]">
                <Coins className="w-3.5 h-3.5" />
                <span>{rewardsStatus?.points ?? 0}</span>
              </div>
              <div className="h-3.5 w-px bg-[var(--border-subtle)]" />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[var(--status-warning)]">
                <img src="/fire.png" alt="Streak" className="w-3.5 h-3.5 object-contain" />
                <span>{currentStreak}d</span>
              </div>
            </div>

            {/* Quick Light/Dark Theme Switcher */}
            <ThemeQuickButton />

            {/* Notifications Popover */}
            <NotificationDropdown />

            {/* User Profile Avatar with Clickable Dropdown Menu */}
            <div className="relative" ref={profileRef}>
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:justify-start gap-2 p-1 rounded-xl hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-control)] transition-all cursor-pointer"
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="dialog"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-[var(--action-primary)]/40 hover:ring-[var(--action-primary)] transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[var(--action-primary)] flex items-center justify-center text-xs text-[var(--on-primary)] font-bold font-mono">
                    {initials}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 hidden sm:block",
                    isProfileOpen && "rotate-180 text-[var(--text-primary)]"
                  )}
                />
              </button>

              {/* Profile Dropdown Drawer/Popover */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150" role="dialog" aria-label="Account options">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-[var(--action-primary)]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[var(--action-primary)] flex items-center justify-center font-bold text-sm text-[var(--on-primary)] font-mono">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {user?.name || "Student Candidate"}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate font-mono">
                        {user?.email || "candidate@intervue.tuf"}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="p-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-center col-span-2">
                      <span className="text-[11px] text-[var(--text-muted)] block">Streak</span>
                      <span className="text-xs font-bold text-[var(--status-warning)] font-mono flex items-center justify-center gap-1.5 mt-0.5">
                        <img src="/fire.png" alt="Streak" className="w-4 h-4 object-contain inline" />
                        <span>{currentStreak} Days</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Navigation Links */}
                  <div className="space-y-1 pt-1 [&_a]:min-h-11 [&_button]:min-h-11">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <User className="w-4 h-4 text-[var(--accent-text)]" />
                      <span>My Profile & Heatmap</span>
                    </Link>

                    {((session?.user as any)?.role === "admin" || stats?.user?.role === "admin") && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-600 dark:text-purple-300 hover:text-[var(--text-primary)] hover:bg-purple-500/10 border border-purple-500/20 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <span>Admin Management CMS</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        openProductTour();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
                    >
                      <Compass className="w-4 h-4 text-[var(--accent-text)]" />
                      <span>Explore Platform Tour</span>
                    </button>
                  </div>

                  {/* Theme Preference */}
                  <div className="pt-3 mt-2 border-t border-[var(--border-subtle)]">
                    <ThemeToggle />
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-3 mt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-colors cursor-pointer"
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
        <main className="flex-1 min-w-0 min-h-0 flex flex-col mt-2 mb-2 mx-2 sm:mx-3 lg:ml-0 lg:mr-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--canvas)] shadow-sm overflow-y-auto">
          <Outlet />
        </main>

        {/* 6-Card Product Tour Modal */}
        <ProductTourModal />
      </div>
    </div>
  );
}
