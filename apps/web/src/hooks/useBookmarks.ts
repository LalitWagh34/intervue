import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useBookmarkSlugs() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
  return useQuery<string[]>({
    queryKey: ["bookmark-slugs", userId],
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
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks", userId],
    queryFn: async () => {
      const res = await api.get("/bookmarks");
      return res.data.bookmarks;
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
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
      await queryClient.cancelQueries({ queryKey: ["bookmark-slugs", userId] });
      const prev = queryClient.getQueryData<string[]>(["bookmark-slugs", userId]) ?? [];
      const isBookmarked = prev.includes(problemSlug);
      queryClient.setQueryData(
        ["bookmark-slugs", userId],
        isBookmarked ? prev.filter((s) => s !== problemSlug) : [...prev, problemSlug]
      );
      return { prev, isBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(["bookmark-slugs", userId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-slugs"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
