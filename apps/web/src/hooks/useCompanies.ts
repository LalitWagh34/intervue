import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface CompanyMeta {
  name: string;
  slug: string;
  totalProblems: number;
  icon: string;
}

export interface CompanyQuestion {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  title: string;
  slug: string;
  frequency: number;
  acceptanceRate: number | null;
  link: string;
  topics: string[];
  isNative: boolean;
  nativeId: number | null;
}

export interface CompanyQuestionsResponse {
  company: string;
  timeframe: string;
  totalCount: number;
  questions: CompanyQuestion[];
}

export function useFeaturedCompanies() {
  return useQuery<{ companies: CompanyMeta[] }>({
    queryKey: ["featured-companies"],
    queryFn: async () => {
      const res = await api.get("/companies");
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCompanyQuestions(company: string, timeframe: string) {
  return useQuery<CompanyQuestionsResponse>({
    queryKey: ["company-questions", company, timeframe],
    queryFn: async () => {
      const res = await api.get(`/companies/${encodeURIComponent(company)}?timeframe=${timeframe}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
