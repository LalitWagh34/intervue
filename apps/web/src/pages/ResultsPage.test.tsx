import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResultsPage from "./ResultsPage";
import { useInterview } from "@/hooks/useInterview";

vi.mock("@/hooks/useInterview", () => ({
  useInterview: vi.fn(),
}));

const mockedUseInterview = vi.mocked(useInterview);

function renderResults() {
  return render(
    <MemoryRouter initialEntries={["/results/int-1"]}>
      <Routes>
        <Route path="/results/:id" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ResultsPage loading, error, and evaluation states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders error alert with retry when interview fetch fails", () => {
    const refetch = vi.fn();
    mockedUseInterview.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as any);

    renderResults();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Failed to load interview results")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders abandoned state instead of endless evaluation spinner", () => {
    mockedUseInterview.mockReturnValue({
      data: {
        id: "int-1",
        role: "Full Stack Engineer",
        difficulty: "mid",
        mode: "text",
        status: "abandoned",
        evaluation: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderResults();

    expect(screen.getByText("Session ended before evaluation")).toBeInTheDocument();
    expect(screen.queryByText("Evaluating your interview...")).not.toBeInTheDocument();
  });

  it("renders recovery retry action when evaluation fails", () => {
    const refetch = vi.fn();
    mockedUseInterview.mockReturnValue({
      data: {
        id: "int-1",
        role: "Backend Engineer",
        difficulty: "mid",
        mode: "text",
        status: "completed",
        evaluation: { status: "failed" },
      },
      isLoading: false,
      isError: false,
      refetch,
    } as any);

    renderResults();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Evaluation failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

