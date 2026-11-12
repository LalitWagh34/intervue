import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandIcon, BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

describe("Frontend testing foundation smoke tests", () => {
  it("renders BrandIcon with accessible label", () => {
    render(<BrandIcon />);
    expect(screen.getByLabelText("Intervue logo")).toBeInTheDocument();
  });

  it("renders BrandLogo wordmark by default and supports showText=false", () => {
    const { rerender } = render(<BrandLogo />);
    expect(screen.getByText("Intervue")).toBeInTheDocument();

    rerender(<BrandLogo showText={false} />);
    expect(screen.queryByText("Intervue")).not.toBeInTheDocument();
  });

  it("merges conditional classes with cn", () => {
    expect(cn("px-2 py-1", false && "hidden", "px-4")).toBe("py-1 px-4");
  });
});

