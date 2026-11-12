import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

vi.mock("@/lib/auth", () => ({
  useSession: () => ({ data: null, isPending: false }),
  signOut: vi.fn(),
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  setSessionToken: vi.fn(),
}));

vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => null,
}));

vi.mock("@/components/shared/CommandPalette", () => ({
  CommandPalette: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

function renderAppAt(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Public /help and /feedback routes", () => {
  it("renders Help Center for unauthenticated visitors without redirecting to /login", () => {
    renderAppAt("/help");

    expect(screen.getByText("Intervue Help Center")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search for articles...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
  });

  it("renders Feedback page for unauthenticated visitors without redirecting to /login", () => {
    renderAppAt("/feedback");

    expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
  });
});
