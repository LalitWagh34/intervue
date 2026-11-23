import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CommandPalette, getSheetPracticePath } from "./CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

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
