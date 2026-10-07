import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CompanyReadinessData {
  targetCompany: string;
  readinessPercentage: number;
  solvedCount: number;
  totalCount: number;
  breakdown: {
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
  nextRecommended: {
    title: string;
    slug: string;
    difficulty: string;
    tags?: string[];
  } | null;
  availableCompanies: Array<{
    name: string;
    slug: string;
    icon: string;
    color: string;
  }>;
}

export interface ActivityItem {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  platform: "INTERVUE" | "LEETCODE" | "CODEFORCES";
  solvedAt: string;
}

export function useCompanyReadiness() {
  return useQuery<CompanyReadinessData>({
    queryKey: ["company-readiness"],
    queryFn: async () => {
      const res = await api.get("/profile/target-company/readiness");
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useSetTargetCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetCompany: string) => {
      const res = await api.put("/profile/target-company", { targetCompany });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useRecentActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const res = await api.get("/profile/recent-activity");
      return res.data.activity || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}
