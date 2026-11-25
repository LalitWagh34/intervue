import { useEffect, useMemo, useState } from "react";
import { getPracticePreferences, setPracticePreferences } from "@/lib/localCache";

export type FilterState = {
  searchQuery: string;
  difficulty: string[];
  status: string[]; // e.g., "Solved", "Unsolved"
  topics: string[];
  companies: string[];
};

export const initialFilterState: FilterState = {
  searchQuery: "",
  difficulty: [],
  status: [],
  topics: [],
  companies: [],
};

export interface BaseProblem {
  id: string;
  title: string;
  difficulty?: string;
  topic?: string;
  companies?: string[];
}

function readInitialFilters(userId?: string | null): FilterState {
  if (!userId) return initialFilterState;
  const saved = getPracticePreferences(userId);
  if (!saved) return initialFilterState;
  return {
    searchQuery: "",
    difficulty: Array.isArray(saved.difficulty) ? saved.difficulty : [],
    status: Array.isArray(saved.status) ? saved.status : [],
    topics: Array.isArray(saved.topics) ? saved.topics : [],
    companies: Array.isArray(saved.companies) ? saved.companies : [],
  };
}

export function useProblemFilter<T extends BaseProblem>(
  problems: T[],
  solvedMap: Record<string, boolean> = {},
  storageUserId?: string | null
) {
  const [filters, setFilters] = useState<FilterState>(() => readInitialFilters(storageUserId));

  useEffect(() => {
    if (!storageUserId) {
      setFilters(initialFilterState);
      return;
    }
    setFilters((prev) => ({
      ...readInitialFilters(storageUserId),
      searchQuery: prev.searchQuery,
    }));
  }, [storageUserId]);

  // Helper to extract unique options for dropdowns based on current problems
  const filterOptions = useMemo(() => {
    const topics = new Set<string>();
    const companies = new Set<string>();

    problems.forEach((p) => {
      if (p.topic) topics.add(p.topic);
      if (p.companies) {
        p.companies.forEach((c) => companies.add(c));
      }
    });

    return {
      topics: Array.from(topics).sort(),
      companies: Array.from(companies).sort(),
      difficulties: ["Basic", "Core", "Hard"],
      statuses: ["Solved", "Unsolved"],
    };
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // 1. Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesSearch =
          (p.title?.toLowerCase() || "").includes(q) ||
          (p.topic?.toLowerCase() || "").includes(q) ||
          (p.companies || []).some((c) => c.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Difficulty Filter
      if (filters.difficulty.length > 0) {
        if (!p.difficulty || !filters.difficulty.includes(p.difficulty)) {
          return false;
        }
      }

      // 3. Status Filter
      if (filters.status.length > 0) {
        const isSolved = Boolean(solvedMap[p.id]);
        const matchesSolved = filters.status.includes("Solved") && isSolved;
        const matchesUnsolved = filters.status.includes("Unsolved") && !isSolved;
        
        if (!matchesSolved && !matchesUnsolved) return false;
      }

      // 4. Topic Filter
      if (filters.topics.length > 0) {
        if (!p.topic || !filters.topics.includes(p.topic)) {
          return false;
        }
      }

      // 5. Company Filter
      if (filters.companies.length > 0) {
        if (!p.companies || !p.companies.some(c => filters.companies.includes(c))) {
          return false;
        }
      }

      return true;
    });
  }, [problems, filters, solvedMap]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (storageUserId && key !== "searchQuery") {
        setPracticePreferences(storageUserId, {
          difficulty: next.difficulty,
          status: next.status,
          topics: next.topics,
          companies: next.companies,
        });
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    if (storageUserId) {
      setPracticePreferences(storageUserId, {
        difficulty: [],
        status: [],
        topics: [],
        companies: [],
      });
    }
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    filteredProblems,
    filterOptions,
  };
}
