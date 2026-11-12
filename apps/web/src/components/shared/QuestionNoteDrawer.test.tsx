import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionNoteDrawer } from "./QuestionNoteDrawer";

vi.mock("@/hooks/useNotes", () => ({
  useNote: () => ({ data: { content: "Initial note" }, isLoading: false }),
  useSaveNote: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteNote: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("QuestionNoteDrawer unsaved note protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts before closing when note has unsaved edits", () => {
    const onClose = vi.fn();
    render(
      <QuestionNoteDrawer
        isOpen={true}
        onClose={onClose}
        problemSlug="two-sum"
        problemTitle="Two Sum"
      />
    );

    const textarea = screen.getByPlaceholderText(/write your hint/i);
    fireEvent.change(textarea, { target: { value: "Modified note" } });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "Unsaved note changes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Close note drawer"));
    fireEvent.click(screen.getByRole("button", { name: /discard & close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes immediately when note is clean", () => {
    const onClose = vi.fn();
    render(
      <QuestionNoteDrawer
        isOpen={true}
        onClose={onClose}
        problemSlug="two-sum"
        problemTitle="Two Sum"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

