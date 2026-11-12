import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { api } from "@/lib/api";

vi.mock("@/lib/auth", () => ({
  useSession: () => ({ data: { user: { name: "Lalit Wagh" } } }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfileStats: () => ({ data: undefined }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/components/shared/TargetCompanyTracker", () => ({
  TargetCompanyTracker: () => <div data-testid="target-company-tracker" />,
}));

vi.mock("@/components/shared/DailyTargetTracker", () => ({
  DailyTargetTracker: () => <div data-testid="daily-target-tracker" />,
}));

const mockedGet = vi.mocked(api.get);

describe("DashboardPage loading and error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons instead of zero metrics while fetching", () => {
    mockedGet.mockReturnValue(new Promise(() => {}) as any);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Loading dashboard metrics")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading recent interviews")).toBeInTheDocument();
    expect(screen.queryByText("No interview simulations yet")).not.toBeInTheDocument();
  });

  it("renders an error alert with retry when /profile/dashboard fails, and recovers on retry", async () => {
    mockedGet.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to load dashboard metrics")).toBeInTheDocument();
    expect(screen.queryByText("No interview simulations yet")).not.toBeInTheDocument();

    mockedGet.mockResolvedValueOnce({
      data: {
        streakCount: 4,
        solvedCount: 12,
        simulationsCount: 2,
        avgScore: 8,
        recentInterviews: [
          {
            id: "int-1",
            role: "Backend Engineer",
            status: "completed",
            difficulty: "mid",
            score: 8,
            createdAt: "2026-11-10T10:00:00.000Z",
          },
        ],
      },
    } as any);

    const retryButtons = screen.getAllByRole("button", { name: /retry/i });
    fireEvent.click(retryButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    });
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders genuine empty state when API succeeds with zero interviews", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        streakCount: 0,
        solvedCount: 0,
        simulationsCount: 0,
        avgScore: 0,
        recentInterviews: [],
      },
    } as any);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No interview simulations yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Problems Solved")).toBeInTheDocument();
    expect(screen.getByText("Logged & self-tracked problems")).toBeInTheDocument();
    expect(screen.queryByText("Problems Mastered")).not.toBeInTheDocument();
  });
});
