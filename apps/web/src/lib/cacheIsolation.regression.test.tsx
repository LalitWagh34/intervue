import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { setPracticePreferences } from "./localCache";
import { queryClient } from "./queryClient";

const sessionMock = vi.hoisted(() => ({
  data: { user: { id: "user-a", name: "Admin User", email: "a@test.com", role: "admin" } } as any,
  isPending: false,
}));

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: apiMock,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useCompanies", () => ({
  useFeaturedCompanies: () => ({ data: { companies: [] }, isLoading: false }),
  useCompanyQuestions: () => ({ data: { questions: [], totalCount: 0 }, isLoading: false }),
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
  CompanyKitsCatalog: () => null,
}));

vi.mock("@/components/company/CompanyKitWorkspace", () => ({
  CompanyKitWorkspace: () => null,
}));

vi.mock("@/components/shared/QuestionNoteDrawer", () => ({
  QuestionNoteDrawer: () => null,
}));

vi.mock("@/components/shared/AdvancedFilterPopover", () => ({
  AdvancedFilterPopover: () => null,
}));

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value: string; onChange?: (val: string) => void }) => (
    <textarea
      aria-label="Mock Monaco Editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock("@/hooks/useRoomSocket", () => ({
  useRoomSocket: () => ({
    isConnected: true,
    participants: [],
    remainingSeconds: 600,
    roomStatus: "ACTIVE",
    recentActivities: [],
    violations: [],
    inspectedCode: null,
    emitViolation: vi.fn(),
    emitCodeSync: vi.fn(),
    inspectUserCode: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAntiCheat", () => ({
  useAntiCheat: () => ({
    strikes: 0,
    maxStrikes: 3,
    warningModalOpen: false,
    currentReason: "",
    currentType: "",
    dismissWarning: vi.fn(),
    isFullscreen: true,
    isTerminated: false,
    requestFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
  }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("./auth");
  return {
    ...actual,
    useSession: () => sessionMock,
  };
});

import {
  resetSessionCacheBoundaryForTests,
  setSessionToken,
  syncSessionCacheBoundary,
} from "./auth";
import { useProfileStats } from "@/hooks/useProfile";
import { useProblemFilter } from "@/hooks/useProblemFilter";
import PracticeHubPage from "@/pages/PracticeHubPage";
import FeedbackPage from "@/pages/FeedbackPage";
import RoomArenaPage from "@/pages/rooms/RoomArenaPage";

function createTestWrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("QA regression coverage for cache isolation and hydration", () => {
  it("ignores a previous account's feedback submission completion", async () => {
    let resolveRequest!: (response: Response) => void;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const { rerender } = render(<FeedbackPage />);
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: "Bug Report" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "A submission" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    sessionMock.data = { user: { id: "user-b", name: "B", email: "b@test.com" } };
    rerender(<FeedbackPage />);
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "B pending draft" } });
    await act(async () => resolveRequest(new Response(JSON.stringify({ success: true }), { status: 200 })));
    expect((screen.getByLabelText(/message/i) as HTMLTextAreaElement).value).toBe("B pending draft");
    expect(screen.queryByText("Thank You for Your Feedback!")).toBeNull();
    fetchSpy.mockRestore();
  });

  it.each(["user-b", "anon"])("isolates edited feedback when identity changes to %s", async (nextIdentity) => {
    sessionMock.data = { user: { id: "user-a", name: "User A", email: "a@test.com" } };
    sessionMock.isPending = false;
    localStorage.clear();
    if (nextIdentity === "user-b") {
      localStorage.setItem("intervue:draft:v1:user-b:feedback", JSON.stringify({
        name: "User B", email: "b@test.com", subject: "Bug Report", message: "B saved draft", updatedAt: Date.now(),
      }));
    }
    const { rerender } = render(<FeedbackPage />);
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: "Bug Report" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "A private feedback" } });
    sessionMock.data = nextIdentity === "anon" ? null : { user: { id: "user-b", name: "User B", email: "b@test.com" } };
    rerender(<FeedbackPage />);
    await waitFor(() => expect((screen.getByLabelText(/message/i) as HTMLTextAreaElement).value)
      .toBe(nextIdentity === "anon" ? "" : "B saved draft"));
    const stored = localStorage.getItem(`intervue:draft:v1:${nextIdentity}:feedback`);
    expect(stored ?? "").not.toContain("A private feedback");
    expect((screen.getByLabelText(/email address/i) as HTMLInputElement).value)
      .toBe(nextIdentity === "anon" ? "" : "b@test.com");
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    resetSessionCacheBoundaryForTests();
    vi.clearAllMocks();
    sessionMock.data = {
      user: { id: "user-a", name: "Admin", email: "admin@test.com", role: "admin" },
    };
    sessionMock.isPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears React Query cache and user local caches on account switch or session expiry without signOut()", async () => {
    localStorage.setItem("intervue:cache:v1:user-a:snap", JSON.stringify({ value: 1, expiresAt: Date.now() + 60_000 }));
    queryClient.setQueryData(["profile-stats", "user-a", undefined], { user: { role: "admin" } });

    syncSessionCacheBoundary("user-a", false);
    expect(queryClient.getQueryData(["profile-stats", "user-a", undefined])).toBeDefined();

    // Simulate direct session transition from user-a to user-b without calling signOut()
    syncSessionCacheBoundary("user-b", false);
    expect(localStorage.getItem("intervue:cache:v1:user-a:snap")).toBeNull();
    expect(queryClient.getQueryData(["profile-stats", "user-a", undefined])).toBeUndefined();

    // Also verify setSessionToken switching token clears shared queryClient
    queryClient.setQueryData(["profile-stats", "user-b", undefined], { user: { role: "user" } });
    setSessionToken("token-c");
    expect(queryClient.getQueryData(["profile-stats", "user-b", undefined])).toBeUndefined();
  });

  it("scopes useProfileStats query cache by userId so User B never reads User A's cached admin stats", async () => {
    const sharedClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    apiMock.get
      .mockResolvedValueOnce({ data: { user: { id: "user-a", role: "admin" } } })
      .mockResolvedValueOnce({ data: { user: { id: "user-b", role: "user" } } });

    const wrapper = createTestWrapper(sharedClient);
    const { result, rerender } = renderHook(() => useProfileStats(), { wrapper });

    await waitFor(() => expect(result.current.data?.user?.role).toBe("admin"));

    sessionMock.data = { user: { id: "user-b", name: "User B", email: "b@test.com", role: "user" } };
    rerender();

    await waitFor(() => expect(result.current.data?.user?.role).toBe("user"));
    expect(apiMock.get).toHaveBeenCalledTimes(2);
  });

  it("preserves PracticeHub saved user preferences across pending session reload and resets useProblemFilter on logout", async () => {
    setPracticePreferences("user-a", {
      selectedTimeframe: "all",
      companyTabFilter: "indian",
      companyPageSize: 50,
      difficulty: ["Hard"],
    });

    apiMock.get.mockImplementation((url: string) => {
      if (url === "/sheets") {
        return Promise.resolve({
          data: { sheets: [], stats: { totalUsers: 1, curatedSubjects: 0, totalProblems: 0 } },
        });
      }
      if (url === "/profile/solved-problems") {
        return Promise.resolve({ data: { solvedProblems: {} } });
      }
      return Promise.resolve({ data: {} });
    });

    // Render while session is still pending
    sessionMock.data = null;
    sessionMock.isPending = true;

    const { rerender } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/practice?view=company_wise"]}>
          <PracticeHubPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Session resolves to user-a
    sessionMock.data = { user: { id: "user-a", name: "A", email: "a@test.com" } };
    sessionMock.isPending = false;
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/practice?view=company_wise"]}>
          <PracticeHubPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const savedRaw = localStorage.getItem("intervue:prefs:v1:user-a:practice-filters");
      const saved = savedRaw ? JSON.parse(savedRaw) : null;
      expect(saved?.selectedTimeframe).toBe("all");
      expect(saved?.companyTabFilter).toBe("indian");
      expect(saved?.companyPageSize).toBe(50);
    });

    // Verify useProblemFilter resets to initialFilterState when storageUserId clears on logout
    const filterHook = renderHook(
      ({ uid }: { uid?: string }) => useProblemFilter([], {}, uid),
      { initialProps: { uid: "user-a" as string | undefined } }
    );
    expect(filterHook.result.current.filters.difficulty).toEqual(["Hard"]);

    filterHook.rerender({ uid: undefined });
    await waitFor(() => {
      expect(filterHook.result.current.filters.difficulty).toEqual([]);
    });
  });

  it("does not leak pre-auth FeedbackPage drafts to :anon or wipe user-a's saved draft on session resolution", async () => {
    localStorage.setItem(
      "intervue:draft:v1:user-a:feedback",
      JSON.stringify({
        name: "User A",
        email: "a@test.com",
        subject: "Bug Report",
        message: "Saved user-a feedback draft",
        updatedAt: Date.now(),
      })
    );

    // Initially session is pending
    sessionMock.data = null;
    sessionMock.isPending = true;
    const { rerender } = render(<FeedbackPage />);

    expect(localStorage.getItem("intervue:draft:v1:anon:feedback")).toBeNull();

    // Session settles to user-a
    sessionMock.data = { user: { id: "user-a", name: "User A", email: "a@test.com" } };
    sessionMock.isPending = false;
    rerender(<FeedbackPage />);

    await waitFor(() => {
      const textarea = screen.getByLabelText(/message/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Saved user-a feedback draft");
    });
    expect(localStorage.getItem("intervue:draft:v1:anon:feedback")).toBeNull();
  });

  it("flushes pending RoomArenaPage code edits from the last 300ms when switching language or question", async () => {
    sessionStorage.setItem("intervue_exam_rules_agreed_ROOM1", "true");
    apiMock.get.mockResolvedValue({
      data: {
        room: {
          id: "room-1",
          code: "ROOM1",
          title: "Contest",
          status: "ACTIVE",
          duration: 30,
          isHost: false,
          currentParticipantId: "part-1",
          questions: [
            {
              id: "rq-1",
              type: "CODING",
              points: 100,
              problem: {
                id: 101,
                title: "Two Sum",
                difficulty: "EASY",
                description: "Desc",
                templates: [
                  { language: "CPP", code: "// cpp starter" },
                  { language: "PYTHON", code: "# py starter" },
                ],
                examples: [],
              },
            },
            {
              id: "rq-2",
              type: "CODING",
              points: 100,
              problem: {
                id: 102,
                title: "Three Sum",
                difficulty: "MEDIUM",
                description: "Desc 2",
                templates: [{ language: "CPP", code: "// q2 cpp" }],
                examples: [],
              },
            },
          ],
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/rooms/ROOM1/arena"]}>
        <Routes>
          <Route path="/rooms/:code/arena" element={<RoomArenaPage />} />
        </Routes>
      </MemoryRouter>
    );

    const editor = (await screen.findByLabelText("Mock Monaco Editor")) as HTMLTextAreaElement;
    expect(editor.value).toBe("// cpp starter");

    // Edit code and immediately switch language BEFORE 300ms debounce timer fires
    fireEvent.change(editor, { target: { value: "// unsaved cpp edit" } });
    const langSelect = screen.getByRole("combobox");
    fireEvent.change(langSelect, { target: { value: "PYTHON" } });

    expect(localStorage.getItem("intervue:draft:v1:user-a:code:room:ROOM1:problem:101:CPP")).toContain(
      "// unsaved cpp edit"
    );

    // Edit python code and immediately switch to Q2 before 300ms debounce fires
    fireEvent.change(editor, { target: { value: "# unsaved py edit" } });
    fireEvent.click(screen.getByTitle(/Question 2/i));

    await waitFor(() => {
      expect(
        localStorage.getItem("intervue:draft:v1:user-a:code:room:ROOM1:problem:101:PYTHON")
      ).toContain("# unsaved py edit");
    });

    // A real document exit need not unmount React or allow the debounce to run.
    fireEvent.change(editor, { target: { value: "# last edit before refresh" } });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(localStorage.getItem("intervue:draft:v1:user-a:code:room:ROOM1:problem:102:PYTHON"))
      .toContain("# last edit before refresh");
  });
});
