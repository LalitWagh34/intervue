import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import ChatPage from "./ChatPage";

const { useChatsMock, useChatMock } = vi.hoisted(() => ({
  useChatsMock: vi.fn(),
  useChatMock: vi.fn(),
}));

vi.mock("@/hooks/useChats", () => ({
  useChats: useChatsMock,
  useChat: useChatMock,
}));

vi.mock("@/lib/auth", () => ({ getSessionToken: () => "" }));

const emptyQuery = {
  data: undefined,
  isPending: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
};

const renderChat = (route = "/chat/chat-1") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  useChatsMock.mockReset();
  useChatMock.mockReset();
  useChatsMock.mockReturnValue({ ...emptyQuery });
  useChatMock.mockReturnValue({ ...emptyQuery });
});

describe("chat query states", () => {
  it("does not present loading data as an empty discussion", () => {
    useChatsMock.mockReturnValue({ ...emptyQuery, isPending: true });
    useChatMock.mockReturnValue({ ...emptyQuery, isPending: true });

    renderChat();

    expect(screen.getByText("Loading discussions...")).toBeInTheDocument();
    expect(screen.getByText("Loading discussion...")).toBeInTheDocument();
    expect(screen.queryByText("No discussions yet")).not.toBeInTheDocument();
    expect(screen.queryByText("What would you like to master today?")).not.toBeInTheDocument();
  });

  it("shows retry actions for failed history and active discussion queries", () => {
    const retryHistory = vi.fn();
    const retryDiscussion = vi.fn();
    useChatsMock.mockReturnValue({ ...emptyQuery, isError: true, refetch: retryHistory });
    useChatMock.mockReturnValue({ ...emptyQuery, isError: true, refetch: retryDiscussion });

    renderChat();

    expect(screen.getByText("Discussion history is unavailable.")).toBeInTheDocument();
    expect(screen.getByText("Unable to load this discussion.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry history" }));
    fireEvent.click(screen.getByRole("button", { name: "Retry discussion" }));
    expect(retryHistory).toHaveBeenCalledOnce();
    expect(retryDiscussion).toHaveBeenCalledOnce();
  });

  it("shows genuine empty states only after successful empty queries", () => {
    renderChat("/chat");

    expect(screen.getByText("No discussions yet")).toBeInTheDocument();
    expect(screen.getByText("What would you like to master today?")).toBeInTheDocument();
  });
});
