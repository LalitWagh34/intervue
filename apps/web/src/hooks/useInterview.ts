import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInterview(id: string | undefined) {
  return useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      const res = await api.get(`/interviews/${id}`);
      return res.data.interview;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      // Keep polling every 2s if evaluation isn't ready yet
      if (!data?.evaluation || data.evaluation.status === "processing" || data.evaluation.status === "pending") {
        return 2000;
      }
      return false;
    },
  });
}