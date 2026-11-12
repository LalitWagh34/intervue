import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Trophy,
  Swords,
  Building2,
  Check,
  Trash2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfileStats } from "@/hooks/useProfile";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "scorecard" | "streak" | "reward" | "practice" | "battle" | "system";
  link: string;
  isRead: boolean;
  meta?: Record<string, any>;
}

const STORAGE_READ_KEY = "intervue_read_notifications";
const STORAGE_DISMISSED_KEY = "intervue_dismissed_notifications";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { data: interviews } = useInterviews();
  const { data: stats } = useProfileStats();
  const currentStreak = stats?.consistency?.currentStreak ?? 0;

  // Track read notification IDs in localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_READ_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track dismissed notification IDs in localStorage
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DISMISSED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(readIds));
    } catch (e) {
      console.error(e);
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, JSON.stringify(dismissedIds));
    } catch (e) {
      console.error(e);
    }
  }, [dismissedIds]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Custom notifications (e.g. daily target added, all targets finished)
  const [customNotifications, setCustomNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("intervue_custom_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen for real-time notification dispatch events
  useEffect(() => {
    const handleCustomNotifs = () => {
      try {
        const saved = localStorage.getItem("intervue_custom_notifications");
        if (saved) setCustomNotifications(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("intervue-notifications-updated", handleCustomNotifs);
    window.addEventListener("storage", handleCustomNotifs);
    return () => {
      window.removeEventListener("intervue-notifications-updated", handleCustomNotifs);
      window.removeEventListener("storage", handleCustomNotifs);
    };
  }, []);

  // Assemble dynamic list of notifications
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 0. Prepend user-triggered custom notifications (e.g. daily targets set or completed)
    if (Array.isArray(customNotifications) && customNotifications.length > 0) {
      customNotifications.forEach((cn) => {
        list.push({
          id: cn.id,
          title: cn.title,
          description: cn.description,
          timestamp: cn.timestamp || "Just now",
          type: cn.type || "practice",
          link: cn.link || "/dashboard",
          isRead: readIds.includes(cn.id),
        });
      });
    }

    // 1. Dynamic scorecard notifications from real interviews
    if (Array.isArray(interviews) && interviews.length > 0) {
      const recent = interviews.slice(0, 3);
      recent.forEach((it: any) => {
        const isCompleted = it.status === "COMPLETED" || it.status === "completed";
        const score = it.scorecard?.overallScore ?? it.score;
        list.push({
          id: `interview_${it.id}`,
          title: isCompleted ? "Scorecard Ready" : "Interview in Progress",
          description: isCompleted
            ? `Your evaluation for "${it.role || it.title || "Technical Round"}" is ready${score ? ` (Score: ${score}%)` : ""}.`
            : `You have an active session for "${it.role || "Technical Round"}".`,
          timestamp: it.createdAt ? formatTimeAgo(new Date(it.createdAt)) : "Recently",
          type: "scorecard",
          link: "/history",
          isRead: readIds.includes(`interview_${it.id}`),
        });
      });
    }

    // 2. Daily Streak notification
    list.push({
      id: "daily_streak_reminder",
      title: "Daily Practice Streak",
      description:
        currentStreak > 0
          ? `You are on a ${currentStreak}-day streak! Solve a problem today to keep the fire burning.`
          : "Start your practice streak today to build consistency and unlock rewards.",
      timestamp: "Today",
      type: "streak",
      link: "/practice",
      isRead: readIds.includes("daily_streak_reminder"),
    });

    // 3. Company Prep Kits notification
    list.push({
      id: "company_kits_update",
      title: "Company Interview Kits",
      description: "Google, Amazon, Microsoft & Meta rounds updated with real interview questions.",
      timestamp: "1d ago",
      type: "practice",
      link: "/practice?view=company_kits",
      isRead: readIds.includes("company_kits_update"),
    });

    // 4. Battle Arena notification
    list.push({
      id: "battle_arena_open",
      title: "Live Battle Arena",
      description: "Join real-time 1v1 coding showdowns against other candidates.",
      timestamp: "2d ago",
      type: "battle",
      link: "/rooms",
      isRead: readIds.includes("battle_arena_open"),
    });

    // 5. Rewards / XP notification
    list.push({
      id: "rewards_xp_check",
      title: "Rewards & Consistency XP",
      description: "Earn badges, track your problem solving mastery, and redeem milestone perks.",
      timestamp: "3d ago",
      type: "reward",
      link: "/practice",
      isRead: readIds.includes("rewards_xp_check"),
    });

    // Filter out dismissed
    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [interviews, currentStreak, readIds, dismissedIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const handleMarkAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds((prev) => [...prev, id]);
    }
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const handleClearAll = () => {
    const allIds = notifications.map((n) => n.id);
    setDismissedIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const handleItemClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id);
    setIsOpen(false);
    navigate(item.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-11 h-11 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-control)] transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-text)]",
          isOpen && "border-[var(--action-primary)] text-[var(--text-primary)] bg-[var(--surface-selected)]"
        )}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--action-primary)] text-[var(--on-primary)] text-[10px] font-bold font-mono flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="fixed left-4 right-4 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[400px] rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[520px] overscroll-contain"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-muted)]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/30">
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[var(--accent-text)] hover:opacity-80 flex items-center gap-1 font-medium transition-opacity cursor-pointer"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-4 py-2 gap-2 border-b border-[var(--border-subtle)] text-xs bg-[var(--surface)]">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                filter === "all"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/25"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                filter === "unread"
                  ? "bg-[var(--surface-selected)] text-[var(--accent-text)] border border-[var(--accent-text)]/25"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] p-1.5 overscroll-contain max-h-[380px] bg-[var(--surface)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)] mb-1">
                  <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" />
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-[220px]">
                  {filter === "unread"
                    ? "You are all caught up! Great job staying on top of your prep."
                    : "Notifications about your scorecards, streaks, and sessions will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const iconConfig = getNotificationIcon(item.type);
                const Icon = iconConfig.icon;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "group w-full p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 relative hover:bg-[var(--surface-hover)] text-left",
                      !item.isRead ? "bg-[var(--surface-selected)]/45" : "opacity-85 hover:opacity-100"
                    )}
                  >
                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-[var(--action-primary)] shadow-sm" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                        iconConfig.bgClass,
                        iconConfig.borderClass,
                        iconConfig.colorClass
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-semibold truncate text-[var(--text-primary)]">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          {item.timestamp}
                        </span>
                        <span className="text-[10px] text-[var(--accent-text)] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-auto">
                          View
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] flex items-center justify-between text-xs px-4">
            <span className="text-[11px] text-[var(--text-muted)]">Stay consistent daily</span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/history");
              }}
              className="text-[11px] text-[var(--accent-text)] hover:opacity-80 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              All Scorecards
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "scorecard":
      return {
        icon: Sparkles,
        bgClass: "bg-[var(--surface-selected)]",
        borderClass: "border-[var(--accent-text)]/25",
        colorClass: "text-[var(--accent-text)]",
      };
    case "streak":
      return {
        icon: Flame,
        bgClass: "bg-[var(--status-warning)]/12",
        borderClass: "border-[var(--status-warning)]/25",
        colorClass: "text-[var(--status-warning)]",
      };
    case "reward":
      return {
        icon: Trophy,
        bgClass: "bg-[var(--status-success)]/12",
        borderClass: "border-[var(--status-success)]/25",
        colorClass: "text-[var(--status-success)]",
      };
    case "battle":
      return {
        icon: Swords,
        bgClass: "bg-[var(--status-danger)]/12",
        borderClass: "border-[var(--status-danger)]/25",
        colorClass: "text-[var(--status-danger)]",
      };
    case "practice":
      return {
        icon: Building2,
        bgClass: "bg-violet-500/12",
        borderClass: "border-violet-500/25",
        colorClass: "text-violet-600 dark:text-violet-400",
      };
    default:
      return {
        icon: Bell,
        bgClass: "bg-[var(--surface-muted)]",
        borderClass: "border-[var(--border-subtle)]",
        colorClass: "text-[var(--text-secondary)]",
      };
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
