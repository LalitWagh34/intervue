import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

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
    streakCount: number;
    totalSessions: number;
  } | null;
  consistency: {
    totalSubmissions: number;
    activeDays: number;
    bestStreak: number;
    currentStreak: number;
    totalContests: number;
    calendarDays: Array<{
      date: string;
      count: number;
      level: number;
    }>;
  };
  dsaProgress: {
    totalSolved: number;
    totalProblems: number;
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
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