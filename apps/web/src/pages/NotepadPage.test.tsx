import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotepadPage from "./NotepadPage";
import { toast } from "sonner";

const mockNotes = [
  {
    id: "n-1",
    problemSlug: "two-sum",
    problemTitle: "Two Sum",
    content: "Use a hash map",
    updatedAt: "2026-11-10T10:00:00.000Z",
  },
  {
    id: "n-2",
    problemSlug: "valid-parentheses",
    problemTitle: "Valid Parentheses",
    content: "Use a stack",
    updatedAt: "2026-11-10T11:00:00.000Z",
  },
];

const mockSaveMutate = vi.fn();
const mockSaveMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock("@/hooks/useNotes", () => ({
  useNotes: () => ({ data: mockNotes, isLoading: false }),
  useSaveNote: () => ({
    mutate: mockSaveMutate,
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
  useDeleteNote: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("NotepadPage unsaved note protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts before switching away from a dirty note and preserves edits on Keep editing", () => {
    render(<NotepadPage />);

    fireEvent.click(screen.getByText("Two Sum"));
    const editor = screen.getByPlaceholderText(/write your hint/i) as HTMLTextAreaElement;
    expect(editor.value).toBe("Use a hash map");

    fireEvent.change(editor, { target: { value: "Unsaved edit in progress" } });
    expect(screen.getByText("Unsaved")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Valid Parentheses"));
    expect(screen.getByRole("alertdialog", { name: "Unsaved note changes" })).toBeInTheDocument();
    expect(editor.value).toBe("Unsaved edit in progress");

    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(editor.value).toBe("Unsaved edit in progress");

    fireEvent.click(screen.getByText("Valid Parentheses"));
    fireEvent.click(screen.getByRole("button", { name: /discard changes/i }));
    expect((screen.getByPlaceholderText(/write your hint/i) as HTMLTextAreaElement).value).toBe("Use a stack");
  });

  it("switches immediately when there are no unsaved changes", () => {
    render(<NotepadPage />);

    fireEvent.click(screen.getByText("Two Sum"));
    fireEvent.click(screen.getByText("Valid Parentheses"));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect((screen.getByPlaceholderText(/write your hint/i) as HTMLTextAreaElement).value).toBe("Use a stack");
  });

  it("uses semantic button controls, touch-safe empty copy, and supports delete undo", async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce(undefined);
    render(<NotepadPage />);

    expect(screen.queryByText(/hover over any problem/i)).not.toBeInTheDocument();
    expect(screen.getByText(/open any problem in the practice hub/i)).toBeInTheDocument();

    const twoSumButton = screen.getByRole("button", { name: /^two sum/i });
    fireEvent.click(twoSumButton);
    expect(twoSumButton).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "Delete note for Two Sum" }));
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("two-sum");
    });

    const toastCalls = vi.mocked(toast.success).mock.calls;
    expect(toastCalls.length).toBeGreaterThan(0);
    const toastOptions = toastCalls[0][1] as { action: { label: string; onClick: () => void } };
    expect(toastOptions.action.label).toBe("Undo");
    toastOptions.action.onClick();

    expect(mockSaveMutate).toHaveBeenCalledWith({
      slug: "two-sum",
      content: "Use a hash map",
      problemTitle: "Two Sum",
    });
  });
});

