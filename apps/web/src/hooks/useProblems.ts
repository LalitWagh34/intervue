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

export function useSubmissions(slug: string | undefined) {
  return useQuery({
    queryKey: ["submissions", slug],
    queryFn: async () => {
      const res = await api.get(`/code/problems/${slug}/submissions`);
      return res.data.submissions as Array<{
        id: number;
        sourceCode: string;
        language: string;
        languageId: number;
        verdict: string;
        runtime: number | null;
        memory: number | null;
        isAccepted: boolean;
        createdAt: string;
      }>;
    },
    enabled: !!slug,
  });
}