import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface QuestionNote {
  id: string;
  problemSlug: string;
  problemTitle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useNotes() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
  return useQuery<QuestionNote[]>({
    queryKey: ["notes", userId],
    queryFn: async () => {
      const res = await api.get("/notes");
      return res.data.notes;
    },
  });
}

export function useNote(slug: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
  return useQuery<QuestionNote | null>({
    queryKey: ["notes", slug, userId],
    queryFn: async () => {
      const res = await api.get(`/notes/${slug}`);
      return res.data.note;
    },
    enabled: !!slug,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slug,
      content,
      problemTitle,
    }: {
      slug: string;
      content: string;
      problemTitle?: string;
    }) => {
      const res = await api.post(`/notes/${slug}`, { content, problemTitle });
      return res.data.note as QuestionNote;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", vars.slug] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(`/notes/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
