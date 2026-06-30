import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProblems(difficulty?: string) {
  return useQuery({
    queryKey: ["problems", difficulty],
    queryFn: async () => {
      const res = await api.get("/code/problems", {
        params: difficulty ? { difficulty } : {},
      });
      return res.data.problems;
    },
  });
}

export function useProblem(slug: string | undefined) {
  return useQuery({
    queryKey: ["problem", slug],
    queryFn: async () => {
      const res = await api.get(`/code/problems/${slug}`);
      return res.data.problem;
    },
    enabled: !!slug,
  });
}