import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CommandPalette, getSheetPracticePath } from "./CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

const { apiGet, sessionState } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  sessionState: { userId: "user-a" as string | undefined },
}));

vi.mock("@/lib/api", () => ({
  api: { get: apiGet },
}));

vi.mock("@/lib/auth", () => ({
  useSession: () => ({
    data: sessionState.userId ? { user: { id: sessionState.userId } } : null,
    isPending: false,
  }),
}));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const renderPalette = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <button type="button">Previous control</button>
        <CommandPalette />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  useCommandPalette.setState({ isOpen: false, returnFocus: null });
  apiGet.mockReset();
  localStorage.clear();
  sessionState.userId = "user-a";
});

describe("command palette destinations", () => {
  it("opens a search result at the selected practice sheet", () => {
    expect(getSheetPracticePath("neetcode-150")).toBe(
      "/practice?view=sheet_practice&sheet=neetcode-150"
    );
  });

  it("encodes unexpected slug characters safely", () => {
    expect(getSheetPracticePath("sheet & track")).toBe(
      "/practice?view=sheet_practice&sheet=sheet+%26+track"
    );
  });
});

describe("command palette accessibility", () => {
  it("exposes an accessible dialog and focuses its search input", async () => {
    renderPalette();

    act(() => useCommandPalette.getState().setIsOpen(true));

    expect(await screen.findByRole("dialog", { name: "Search Intervue" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search problems, sheets, tracks...")).toHaveFocus();
    });
  });

  it("closes with Escape and restores focus to the previous control", async () => {
    renderPalette();
    const previousControl = screen.getByRole("button", { name: "Previous control" });
    previousControl.focus();

    act(() => useCommandPalette.getState().setIsOpen(true));
    const dialog = await screen.findByRole("dialog", { name: "Search Intervue" });
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(previousControl).toHaveFocus());
  });
});

describe("command palette search resilience", () => {
  it("debounces requests and passes a cancellation signal", async () => {
    apiGet.mockResolvedValue({ data: { problems: [], sheets: [] } });
    renderPalette();
    act(() => useCommandPalette.getState().setIsOpen(true));

    const input = await screen.findByPlaceholderText("Search problems, sheets, tracks...");
    fireEvent.change(input, { target: { value: "array" } });

    expect(apiGet).not.toHaveBeenCalled();
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    expect(apiGet).toHaveBeenCalledWith("/search?q=array", {
      signal: expect.any(AbortSignal),
    });
  });

  it("cancels an obsolete request when a newer query starts", async () => {
    let firstSignal: AbortSignal | undefined;
    apiGet.mockImplementationOnce((_url, config) => {
      firstSignal = config.signal;
      return new Promise((_resolve, reject) => {
        config.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    });
    apiGet.mockResolvedValueOnce({ data: { problems: [], sheets: [] } });
    renderPalette();
    act(() => useCommandPalette.getState().setIsOpen(true));

    const input = await screen.findByPlaceholderText("Search problems, sheets, tracks...");
    fireEvent.change(input, { target: { value: "array" } });
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));

    fireEvent.change(input, { target: { value: "graph" } });
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);
  });

  it("shows a retry action when search fails", async () => {
    apiGet
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce({ data: { problems: [], sheets: [] } });
    renderPalette();
    act(() => useCommandPalette.getState().setIsOpen(true));

    const input = await screen.findByPlaceholderText("Search problems, sheets, tracks...");
    fireEvent.change(input, { target: { value: "array" } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Search is temporarily unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("scopes recent searches per authenticated userId and prevents cross-account leakage", async () => {
    apiGet.mockResolvedValue({
      data: {
        problems: [],
        sheets: [{ slug: "neetcode-150", title: "NeetCode 150" }],
      },
    });

    sessionState.userId = "user-a";
    const viewA = renderPalette();
    act(() => useCommandPalette.getState().setIsOpen(true));

    const inputA = await screen.findByPlaceholderText("Search problems, sheets, tracks...");
    fireEvent.change(inputA, { target: { value: "neetcode" } });

    const sheetResult = await screen.findByText("NeetCode 150");
    fireEvent.click(sheetResult);

    expect(localStorage.getItem("intervue:recent-searches:v1:user-a")).toBe('["neetcode"]');
    expect(localStorage.getItem("intervue:recent-searches:v1:anon")).toBeNull();
    viewA.unmount();

    sessionState.userId = "user-b";
    renderPalette();
    act(() => useCommandPalette.getState().setIsOpen(true));

    expect(await screen.findByRole("dialog", { name: "Search Intervue" })).toBeInTheDocument();
    expect(screen.queryByText("neetcode")).not.toBeInTheDocument();
  });
});
