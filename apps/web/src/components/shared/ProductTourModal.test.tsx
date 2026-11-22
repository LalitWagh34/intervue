import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductTourModal, TOUR_STEPS, openProductTour } from "./ProductTourModal";

describe("ProductTourModal claims and destinations", () => {
  it("uses only registered product destinations and qualified integrity claims", () => {
    expect(TOUR_STEPS.filter((step) => step.actionHref).map((step) => step.actionHref)).toEqual([
      "/interview",
      "/rooms",
      "/practice?view=company_kits",
      "/practice",
      "/profile",
    ]);

    const copy = TOUR_STEPS.flatMap((step) => [step.title, step.headline, step.description, ...step.highlights]).join(" ");
    expect(copy).toMatch(/browser activity signals/i);
    expect(copy).toMatch(/freshness status/i);
    expect(copy).not.toMatch(/anti-cheat protection/i);
    expect(copy).not.toMatch(/what top tech companies actually ask/i);
    expect(copy).not.toMatch(/shareable profile/i);
  });

  it("renders the corrected overview when the tour is opened", () => {
    localStorage.setItem("intervue_tour_completed", "true");
    render(
      <MemoryRouter>
        <ProductTourModal />
      </MemoryRouter>
    );

    act(() => openProductTour());

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/timed multiplayer coding rooms/i)).toBeInTheDocument();
    expect(screen.getByText(/integrity signals/i)).toBeInTheDocument();
  });
});
