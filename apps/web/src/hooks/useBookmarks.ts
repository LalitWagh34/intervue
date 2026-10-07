import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useBookmarkSlugs() {
  return useQuery<string[]>({
    queryKey: ["bookmark-slugs"],
    queryFn: async () => {
      const res = await api.get("/bookmarks/slugs");
      return res.data.slugs;
    },
    staleTime: 60_000,
  });
}

export interface Bookmark {
  id: string;
  problemSlug: string;
  problemTitle: string;
  difficulty: string;
  createdAt: string;
}

export function useBookmarks() {
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await api.get("/bookmarks");
      return res.data.bookmarks;
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      problemSlug,
      problemTitle,
      difficulty,
    }: {
      problemSlug: string;
      problemTitle: string;
      difficulty?: string;
    }) => {
      const res = await api.post("/bookmarks/toggle", {
        problemSlug,
        problemTitle,
        difficulty,
      });
      return res.data as { bookmarked: boolean };
    },
    onMutate: async ({ problemSlug }) => {
      // Optimistic update on slug list
      await queryClient.cancelQueries({ queryKey: ["bookmark-slugs"] });
      const prev = queryClient.getQueryData<string[]>(["bookmark-slugs"]) ?? [];
      const isBookmarked = prev.includes(problemSlug);
      queryClient.setQueryData(
        ["bookmark-slugs"],
        isBookmarked ? prev.filter((s) => s !== problemSlug) : [...prev, problemSlug]
      );
      return { prev, isBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(["bookmark-slugs"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-slugs"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
