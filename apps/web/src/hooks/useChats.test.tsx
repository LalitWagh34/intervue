import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useChat, useChats } from "./useChats";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("chat infinite queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the next discussion page using the server cursor", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { chats: [{ id: "chat-new" }], pageInfo: { hasMore: true, nextCursor: "chat-new" } },
      } as any)
      .mockResolvedValueOnce({
        data: { chats: [{ id: "chat-old" }], pageInfo: { hasMore: false, nextCursor: null } },
      } as any);

    const { result } = renderHook(() => useChats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    let nextResult: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined;
    await act(async () => {
      nextResult = await result.current.fetchNextPage();
    });

    expect(api.get).toHaveBeenNthCalledWith(1, "/chats", { params: { limit: 30 } });
    expect(api.get).toHaveBeenNthCalledWith(2, "/chats", {
      params: { limit: 30, cursor: "chat-new" },
    });
    expect(nextResult?.data?.pages).toHaveLength(2);
  });

  it("loads older messages using the message cursor", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          chat: { id: "chat-1", messages: [{ id: "m2" }] },
          pageInfo: { hasMore: true, nextCursor: "m2" },
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          chat: { id: "chat-1", messages: [{ id: "m1" }] },
          pageInfo: { hasMore: false, nextCursor: null },
        },
      } as any);

    const { result } = renderHook(() => useChat("chat-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    let nextResult: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined;
    await act(async () => {
      nextResult = await result.current.fetchNextPage();
    });

    expect(api.get).toHaveBeenNthCalledWith(2, "/chats/chat-1", {
      params: { limit: 100, cursor: "m2" },
    });
    expect(nextResult?.data?.pages).toHaveLength(2);
  });
});
