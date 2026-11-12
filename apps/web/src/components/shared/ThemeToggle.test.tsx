import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("renders System, Light, and Dark options and persists selected theme", () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        storageKey="intervue_theme"
      >
        <ThemeToggle />
      </ThemeProvider>
    );

    const systemBtn = screen.getByRole("button", { name: "System" });
    const lightBtn = screen.getByRole("button", { name: "Light" });
    const darkBtn = screen.getByRole("button", { name: "Dark" });

    expect(darkBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(lightBtn);
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("intervue_theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    fireEvent.click(systemBtn);
    expect(systemBtn).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("intervue_theme")).toBe("system");
  });
});

