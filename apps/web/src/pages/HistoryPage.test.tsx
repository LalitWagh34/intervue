import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HistoryPage from "./HistoryPage";
import { api } from "@/lib/api";
import { useInterviews } from "@/hooks/useInterviews";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/hooks/useInterviews", () => ({
  useInterviews: vi.fn(),
}));

const mockedApiGet = vi.mocked(api.get);
const mockedUseInterviews = vi.mocked(useInterviews);

describe("HistoryPage loading, error, and interview CTA states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders contest error alert with retry and recovers on retry", async () => {
    mockedApiGet.mockRejectedValueOnce(new Error("Contests down"));
    mockedUseInterviews.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to load contest battles")).toBeInTheDocument();
    expect(screen.queryByText("No battle records found")).not.toBeInTheDocument();

    mockedApiGet.mockResolvedValueOnce({ data: { contests: [] } } as any);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText("No battle records found")).toBeInTheDocument();
    });
  });

  it("renders interview error state and hides Evaluation link for abandoned sessions", async () => {
    mockedApiGet.mockResolvedValueOnce({ data: { contests: [] } } as any);
    const refetchInterviews = vi.fn();
    mockedUseInterviews.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchInterviews,
    } as any);

    const { rerender } = render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /ai mock interviews/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to load interview history")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetchInterviews).toHaveBeenCalledTimes(1);

    mockedUseInterviews.mockReturnValue({
      data: [
        {
          id: "int-done",
          mode: "text",
          role: "Backend Engineer",
          difficulty: "mid",
          status: "completed",
          score: 8,
          createdAt: "2026-11-10T10:00:00.000Z",
        },
        {
          id: "int-abandoned",
          mode: "text",
          role: "Frontend Engineer",
          difficulty: "junior",
          status: "abandoned",
          score: null,
          createdAt: "2026-11-10T11:00:00.000Z",
        },
      ],
      isLoading: false,
      isError: false,
      refetch: refetchInterviews,
    } as any);

    rerender(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /evaluation/i })).toHaveAttribute("href", "/results/int-done");
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Not evaluated")).toBeInTheDocument();
  });
});

