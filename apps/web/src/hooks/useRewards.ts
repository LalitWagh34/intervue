import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface RewardsStatus {
  points: number;
  streakCount: number;
  todayClaimed: boolean;
  referralCode: string | null;
  totalReferrals: number;
}

export function useRewardsStatus() {
  return useQuery<RewardsStatus>({
    queryKey: ["rewards-status"],
    queryFn: async () => {
      const res = await api.get("/rewards/status");
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useDailyCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/rewards/daily-checkin");
      return res.data as {
        alreadyClaimed: boolean;
        pointsAwarded?: number;
        points: number;
        streakCount: number;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards-status"] });
    },
  });
}

export function useReferral() {
  return useQuery({
    queryKey: ["referral"],
    queryFn: async () => {
      const res = await api.get("/rewards/referral");
      return res.data as { referralCode: string; totalReferrals: number; points: number };
    },
  });
}
