import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface DailyTarget {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  category?: "DSA" | "System Design" | "Core CS" | "Behavioral" | "General";
}

const STORAGE_TARGETS_KEY = "intervue_user_daily_targets";
export const STORAGE_CUSTOM_NOTIFICATIONS_KEY = "intervue_custom_notifications";

export const NOTIFICATIONS_UPDATED_EVENT = "intervue-notifications-updated";
export const TARGETS_UPDATED_EVENT = "intervue-daily-targets-updated";

const INITIAL_TARGETS: DailyTarget[] = [
  {
    id: "dt_1",
    title: "Solve 2 Curated FAANG Medium Problems",
    completed: false,
    createdAt: new Date().toISOString(),
    category: "DSA",
  },
  {
    id: "dt_2",
    title: "Review Distributed Cache Invalidation Notes",
    completed: false,
    createdAt: new Date().toISOString(),
    category: "System Design",
  },
];

export function pushCustomNotification(notification: {
  id: string;
  title: string;
  description: string;
  type: "scorecard" | "streak" | "reward" | "practice" | "battle" | "system";
  link: string;
}) {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_NOTIFICATIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    // Prepend new notification
    const updated = [
      {
        ...notification,
        timestamp: "Just now",
        isRead: false,
      },
      ...existing.filter((n: any) => n.id !== notification.id),
    ];
    localStorage.setItem(STORAGE_CUSTOM_NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  } catch (err) {
    console.error("Failed to push custom notification:", err);
  }
}

export function useDailyTargets() {
  const [targets, setTargets] = useState<DailyTarget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TARGETS_KEY);
      if (saved) return JSON.parse(saved);
      // Store initial targets
      localStorage.setItem(STORAGE_TARGETS_KEY, JSON.stringify(INITIAL_TARGETS));
      return INITIAL_TARGETS;
    } catch {
      return INITIAL_TARGETS;
    }
  });

  // Keep state synchronized across components and tabs
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_TARGETS_KEY);
        if (saved) setTargets(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener(TARGETS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(TARGETS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const saveTargets = useCallback((newTargets: DailyTarget[]) => {
    setTargets(newTargets);
    try {
      localStorage.setItem(STORAGE_TARGETS_KEY, JSON.stringify(newTargets));
      window.dispatchEvent(new Event(TARGETS_UPDATED_EVENT));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Add target
  const addTarget = useCallback(
    (title: string, category: DailyTarget["category"] = "General") => {
      if (!title || !title.trim()) return;
      const cleanTitle = title.trim();

      const newTarget: DailyTarget = {
        id: `dt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle,
        completed: false,
        createdAt: new Date().toISOString(),
        category,
      };

      const updated = [newTarget, ...targets];
      saveTargets(updated);

      toast.success(`Target added: "${cleanTitle}"`);

      // 🔔 Dispatch Notification for target addition
      pushCustomNotification({
        id: `notif_add_${Date.now()}`,
        title: "🎯 New Daily Target Set",
        description: `Target: "${cleanTitle}" added to today's goals. Stay focused!`,
        type: "practice",
        link: "/dashboard",
      });
    },
    [targets, saveTargets]
  );

  // Toggle target completion
  const toggleTarget = useCallback(
    (id: string) => {
      let isAllCompletedNow = false;

      const updated = targets.map((t) => {
        if (t.id === id) {
          return { ...t, completed: !t.completed };
        }
        return t;
      });

      // Check if all targets are now finished
      if (updated.length > 0 && updated.every((t) => t.completed)) {
        isAllCompletedNow = true;
      }

      saveTargets(updated);

      const item = updated.find((t) => t.id === id);
      if (item?.completed) {
        toast.success(`Completed: "${item.title}"`);
      }

      // 🔔 Dispatch celebration notification if ALL targets finished!
      if (isAllCompletedNow) {
        toast.success("🎉 All daily targets completed! Fantastic momentum!");
        pushCustomNotification({
          id: `notif_all_done_${new Date().toISOString().slice(0, 10)}`,
          title: "🎉 All Daily Targets Finished!",
          description: "Incredible consistency! You have crushed 100% of your daily goals today.",
          type: "reward",
          link: "/dashboard",
        });
      }
    },
    [targets, saveTargets]
  );

  // Edit target title
  const editTarget = useCallback(
    (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      const updated = targets.map((t) =>
        t.id === id ? { ...t, title: newTitle.trim() } : t
      );
      saveTargets(updated);
      toast.success("Daily target updated");
    },
    [targets, saveTargets]
  );

  // Delete target
  const deleteTarget = useCallback(
    (id: string) => {
      const updated = targets.filter((t) => t.id !== id);
      saveTargets(updated);
      toast.info("Target removed");
    },
    [targets, saveTargets]
  );

  const completedCount = targets.filter((t) => t.completed).length;
  const progressPercent = targets.length > 0 ? Math.round((completedCount / targets.length) * 100) : 0;

  return {
    targets,
    completedCount,
    totalCount: targets.length,
    progressPercent,
    addTarget,
    toggleTarget,
    editTarget,
    deleteTarget,
  };
}
