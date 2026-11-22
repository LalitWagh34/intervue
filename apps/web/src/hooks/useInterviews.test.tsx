import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useInterview } from "./useInterview";
import { useInterviews } from "./useInterviews";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("interview infinite queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and flattens older interview history using the server cursor", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { interviews: [{ id: "new" }], pageInfo: { hasMore: true, nextCursor: "new" } },
      } as any)
      .mockResolvedValueOnce({
        data: { interviews: [{ id: "old" }], pageInfo: { hasMore: false, nextCursor: null } },
      } as any);

    const { result } = renderHook(() => useInterviews(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => { await result.current.fetchNextPage(); });

    expect(api.get).toHaveBeenNthCalledWith(2, "/interviews", {
      params: { limit: 30, cursor: "new" },
    });
    await waitFor(() => {
      expect(result.current.data?.map((interview: any) => interview.id)).toEqual(["new", "old"]);
    });
  });

  it("prepends older transcript pages while preserving chronological order", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          interview: { id: "int-1", messages: [{ id: "m3" }, { id: "m4" }] },
          pageInfo: { hasMore: true, nextCursor: "m3" },
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          interview: { id: "int-1", messages: [{ id: "m1" }, { id: "m2" }] },
          pageInfo: { hasMore: false, nextCursor: null },
        },
      } as any);

    const { result } = renderHook(() => useInterview("int-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => { await result.current.fetchNextPage(); });

    expect(api.get).toHaveBeenNthCalledWith(2, "/interviews/int-1", {
      params: { limit: 100, cursor: "m3" },
    });
    await waitFor(() => {
      expect(result.current.data?.messages.map((message: any) => message.id)).toEqual(["m1", "m2", "m3", "m4"]);
    });
  });
});
