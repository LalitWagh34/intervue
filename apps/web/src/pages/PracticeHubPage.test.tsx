import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import PracticeHubPage from "./PracticeHubPage";
import { api } from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/hooks/useCompanies", () => ({
  useFeaturedCompanies: () => ({ data: { companies: [] }, isLoading: false }),
  useCompanyQuestions: () => ({ data: { questions: [], totalPages: 1, total: 0 }, isLoading: false }),
}));

vi.mock("@/hooks/useProblemFilter", () => ({
  useProblemFilter: (problems: any[] = []) => ({
    filters: { searchQuery: "", difficulty: [], status: [], topics: [], companies: [] },
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    filteredProblems: problems,
    filterOptions: {
      topics: [],
      companies: [],
      difficulties: ["Basic", "Core", "Hard"],
      statuses: ["Solved", "Unsolved"],
    },
  }),
}));

vi.mock("@/hooks/useBookmarks", () => ({
  useBookmarkSlugs: () => ({ data: [] }),
  useToggleBookmark: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/useReadiness", () => ({
  useCompanyReadiness: () => ({ data: null }),
}));

vi.mock("@/hooks/useDailyTargets", () => ({
  useDailyTargets: () => ({ completedCount: 0, totalCount: 0 }),
}));

vi.mock("@/components/company/CompanyKitsCatalog", () => ({
  CompanyKitsCatalog: () => <div data-testid="company-kits-catalog" />,
}));

vi.mock("@/components/company/CompanyKitWorkspace", () => ({
  CompanyKitWorkspace: () => <div data-testid="company-kit-workspace" />,
}));

vi.mock("@/components/shared/QuestionNoteDrawer", () => ({
  QuestionNoteDrawer: () => null,
}));

vi.mock("@/components/shared/AdvancedFilterPopover", () => ({
  AdvancedFilterPopover: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

function renderPracticeHub(initialEntry = "/practice") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PracticeHubPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("PracticeHubPage sheet loading, error isolation, and solved rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("does not trap Prephub overview in a spinner when /sheets fails", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/sheets") return Promise.reject(new Error("Sheets service down"));
      if (url === "/profile/solved-problems") return Promise.resolve({ data: { solvedProblems: {} } } as any);
      return Promise.resolve({ data: {} } as any);
    });

    renderPracticeHub("/practice");

    await waitFor(() => {
      expect(screen.getByText("Prephub")).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Loading practice sheet")).not.toBeInTheDocument();
  });

  it("renders error alert with retry in sheet_practice view when /sheets fails", async () => {
    let shouldFail = true;
    mockedGet.mockImplementation((url: string) => {
      if (url === "/sheets") {
        if (shouldFail) return Promise.reject(new Error("Sheets service down"));
        return Promise.resolve({
          data: {
            sheets: [
              {
                id: "striver-sde",
                subjectId: "dsa",
                title: "Striver SDE Sheet",
                subtitle: "Core",
                description: "Curated sheet",
                badge: "DSA",
                badgeColor: "blue",
                problemCount: 1,
                estimatedHours: "10h",
                problems: [
                  {
                    id: "p-1",
                    index: 1,
                    title: "Two Sum",
                    slug: "two-sum",
                    difficulty: "Basic",
                    topic: "Arrays",
                    companies: ["Google"],
                  },
                ],
              },
            ],
            stats: { totalUsers: 1, curatedSubjects: 1, activeThisMonth: 1 },
          },
        } as any);
      }
      if (url === "/profile/solved-problems") return Promise.resolve({ data: { solvedProblems: {} } } as any);
      return Promise.resolve({ data: {} } as any);
    });

    renderPracticeHub("/practice?view=sheet_practice&sheet=striver-sde");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to load practice sheet")).toBeInTheDocument();

    shouldFail = false;
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Striver SDE Sheet" })).toBeInTheDocument();
    });
  });

  it("rolls back optimistic solved state and notifies user when /profile/sync-solved fails", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === "/sheets") {
        return Promise.resolve({
          data: {
            sheets: [
              {
                id: "striver-sde",
                subjectId: "dsa",
                title: "Striver SDE Sheet",
                subtitle: "Core",
                description: "Curated sheet",
                badge: "DSA",
                badgeColor: "blue",
                problemCount: 1,
                estimatedHours: "10h",
                problems: [
                  {
                    id: "p-1",
                    index: 1,
                    title: "Two Sum",
                    slug: "two-sum",
                    difficulty: "Basic",
                    topic: "Arrays",
                    companies: ["Google"],
                  },
                ],
              },
            ],
            stats: { totalUsers: 1, curatedSubjects: 1, activeThisMonth: 1 },
          },
        } as any);
      }
      if (url === "/profile/solved-problems") return Promise.resolve({ data: { solvedProblems: {} } } as any);
      return Promise.resolve({ data: {} } as any);
    });
    mockedPost.mockRejectedValueOnce(new Error("Sync failed"));

    renderPracticeHub("/practice?view=sheet_practice&sheet=striver-sde");

    await waitFor(() => {
      expect(screen.getByText("Two Sum")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("button", { name: "Mark Two Sum as solved" });
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to sync solved status. Changes were reverted.");
    });
    expect(screen.getByRole("button", { name: "Mark Two Sum as solved" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
