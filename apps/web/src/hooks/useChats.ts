import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type PageInfo = { hasMore: boolean; nextCursor: string | null };

export type ChatsPage = {
  chats: any[];
  pageInfo: PageInfo;
};

export type ChatMessagesPage = {
  chat: any;
  pageInfo: PageInfo;
};

export function useChats() {
  return useInfiniteQuery<ChatsPage>({
    queryKey: ["chats"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/chats", {
        params: { limit: 30, ...(pageParam ? { cursor: pageParam } : {}) },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.hasMore
      ? lastPage.pageInfo.nextCursor ?? undefined
      : undefined,
  });
}

export function useChat(id: string | undefined) {
  return useInfiniteQuery<ChatMessagesPage>({
    queryKey: ["chat", id],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/chats/${id}`, {
        params: { limit: 100, ...(pageParam ? { cursor: pageParam } : {}) },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.hasMore
      ? lastPage.pageInfo.nextCursor ?? undefined
      : undefined,
    enabled: !!id,
  });
}
