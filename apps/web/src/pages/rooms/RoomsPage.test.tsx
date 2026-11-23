import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoomsPage from "./RoomsPage";

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get: apiGet, post: vi.fn() } }));

const topics = {
  data: { codingTags: ["arrays"], coreCsSubjects: ["DBMS"], aptitudeSubjects: ["QUANT"] },
};

const renderPage = () => render(<MemoryRouter><RoomsPage /></MemoryRouter>);

beforeEach(() => apiGet.mockReset());

describe("rooms page accessibility and topic states", () => {
  it("labels the join input and exposes selected duration state", async () => {
    apiGet.mockResolvedValue(topics);
    renderPage();
    expect(screen.getByRole("textbox", { name: "Room code" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Room" }));
    expect(await screen.findByRole("dialog", { name: "Create Assessment Room" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "45m" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a recoverable topic error and retries", async () => {
    apiGet.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(topics);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create Room" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Room topics are unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "DBMS" })).toHaveAttribute("aria-pressed", "false");
  });

  it("closes with Escape and restores focus to the create trigger", async () => {
    apiGet.mockResolvedValue(topics);
    renderPage();
    const trigger = screen.getByRole("button", { name: "Create Room" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Create Assessment Room" });
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
