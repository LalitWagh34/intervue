import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import InterviewPage from "./InterviewPage";

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock("@/lib/api", () => ({
  api: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ getSessionToken: () => "" }));
vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ data: undefined }) }));

const loadedInterview = {
  data: {
    interview: {
      id: "int-1",
      role: "Backend Engineer",
      difficulty: "mid",
      focus: "architecture",
      resumeText: null,
      messages: [{ id: "msg-1", role: "assistant", content: "Welcome back to your interview." }],
    },
    pageInfo: { hasMore: false, nextCursor: null },
  },
};

const renderInterview = () =>
  render(
    <MemoryRouter initialEntries={["/interview?id=int-1"]}>
      <Routes>
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/results/:id" element={<div>Results</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  apiGet.mockReset();
});

describe("existing interview states", () => {
  it("announces the loading state while restoring an interview", () => {
    apiGet.mockReturnValue(new Promise(() => {}));

    renderInterview();

    expect(screen.getByRole("status")).toHaveTextContent("Initializing Technical Assessment");
  });

  it("shows a recoverable error instead of silently returning to configuration", async () => {
    apiGet.mockRejectedValueOnce(new Error("network unavailable")).mockResolvedValueOnce(loadedInterview);

    renderInterview();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load interview");
    expect(screen.queryByText("Configure Your Technical Round")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Welcome back to your interview.")).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it("uses an accessible end-session dialog and restores trigger focus", async () => {
    apiGet.mockResolvedValue(loadedInterview);
    renderInterview();
    await screen.findByText("Welcome back to your interview.");

    const endButton = screen.getByRole("button", { name: "End Session" });
    endButton.focus();
    fireEvent.click(endButton);
    const dialog = await screen.findByRole("dialog", { name: "Conclude Assessment Round?" });

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(endButton).toHaveFocus());
  });
});
