import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";

vi.mock("@/lib/auth", () => ({
  useSession: () => ({ data: null, isPending: false }),
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  setSessionToken: vi.fn(),
}));

describe("LoginPage auth & capability copy", () => {
  it("replaces fake Forgot password button with Sign-in help link and uses honest AI Mock Sessions copy", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /forgot password/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign-in help" })).toHaveAttribute("href", "/help");
    expect(screen.queryByText(/voice mock/i)).not.toBeInTheDocument();
    expect(screen.getByText("AI Mock Sessions")).toBeInTheDocument();
  });
});

