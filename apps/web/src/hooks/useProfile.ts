import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CalendarDay {
  date: string;
  count: number;
  level: number;
}

export interface ConsistencyMetrics {
  totalSubmissions: number;
  activeDays: number;
  bestStreak: number;
  currentStreak: number;
  totalContests?: number;
  calendarDays: CalendarDay[];
}

export interface LeetCodeStats {
  handle: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  calendar?: Record<string, number>;
  lastSyncedAt?: string;
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  calendar?: Record<string, number>;
  lastSyncedAt?: string;
}

export interface GitHubStats {
  handle: string;
  publicRepos: number;
  followers: number;
  avatarUrl: string;
  profileUrl: string;
  lastSyncedAt?: string;
}

export interface ProfileStatsResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  profile: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    targetRole: string | null;
    experienceLevel: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    resumeUrl: string | null;
    skills: string[];
    leetcodeHandle?: string | null;
    codeforcesHandle?: string | null;
    githubHandle?: string | null;
    lastSyncedAt?: string | null;
    streakCount: number;
    totalSessions: number;
  } | null;
  consistency: ConsistencyMetrics;
  calendars?: {
    ALL: ConsistencyMetrics;
    INTERVUE: ConsistencyMetrics;
    LEETCODE: ConsistencyMetrics;
    CODEFORCES: ConsistencyMetrics;
  };
  dsaProgress: {
    totalSolved: number;
    totalProblems: number;
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
  combinedProgress?: {
    totalSolved: number;
    easy: { solved: number };
    medium: { solved: number };
    hard: { solved: number };
    codeforces: { solved: number };
    intervue: { solved: number };
  };
  leetcodeStats?: LeetCodeStats | null;
  codeforcesStats?: CodeforcesStats | null;
  githubStats?: GitHubStats | null;
  topicStats: Array<{
    tag: string;
    rawTag: string;
    count: number;
  }>;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/profile/me");
      return res.data.profile;
    },
  });
}

export function useProfileStats() {
  return useQuery<ProfileStatsResponse>({
    queryKey: ["profile-stats"],
    queryFn: async () => {
      const res = await api.get("/profile/stats");
      return res.data;
    },
  });
}

export function useConnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      platform,
      handle,
    }: {
      platform: "leetcode" | "codeforces" | "github";
      handle: string;
    }) => {
      const res = await api.post("/profile/connect-platform", { platform, handle });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useSyncAllPlatforms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/profile/sync-all");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useDisconnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      platform,
    }: {
      platform: "leetcode" | "codeforces" | "github";
    }) => {
      const res = await api.post("/profile/disconnect-platform", { platform });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}