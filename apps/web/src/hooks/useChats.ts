import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data.chats;
    },
  });
}

export function useChat(id: string | undefined) {
  return useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      return res.data.chat;
    },
    enabled: !!id,
  });
}