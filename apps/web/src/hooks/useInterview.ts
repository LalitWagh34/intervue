import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";

export function useInterview(id: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: ["interview", id],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/interviews/${id}`, {
        params: { limit: 100, ...(pageParam ? { cursor: pageParam } : {}) },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.hasMore
      ? lastPage.pageInfo.nextCursor ?? undefined
      : undefined,
    enabled: !!id,
    refetchInterval: (query) => {
      const data = (query.state.data as any)?.pages?.[0]?.interview;
      // Keep polling every 2s if evaluation isn't ready yet
      if (
        !data?.evaluation ||
        data.evaluation.status === "processing" ||
        data.evaluation.status === "pending" ||
        (data.evaluation.status === "failed" && data.evaluation.nextAttemptAt)
      ) {
        return 2000;
      }
      return false;
    },
  });
  const interview = useMemo(() => {
    const pages = query.data?.pages;
    if (!pages?.length) return undefined;
    const messages = [...pages]
      .reverse()
      .flatMap((page) => page.interview.messages);
    return { ...pages[0].interview, messages };
  }, [query.data]);

  return { ...query, data: interview };
}

export function useRetryInterviewEvaluation(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Interview ID is required");
      const response = await api.post(`/interviews/${id}/evaluation/retry`);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["interview", id] });
    },
  });
}
