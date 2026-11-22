import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

describe("LandingPage product claims", () => {
  it("labels illustrative evaluation data and avoids unsupported promises", () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Sample Evaluation Preview")).toBeInTheDocument();
    expect(screen.getByText("Illustrative interview feedback")).toBeInTheDocument();
    expect(screen.getAllByText(/create an account/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/FAANG Placement Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Free practice tier/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live Evaluation Telemetry/i)).not.toBeInTheDocument();

    for (const id of ["features", "companies", "arena", "scorecards"]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }

    expect(screen.getAllByRole("link", { name: /sign in|get started|start practicing/i })).not.toHaveLength(0);
  });
});
