import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeMarkdown, sanitizeMarkdownUrl } from "./SafeMarkdown";

describe("SafeMarkdown", () => {
  it("renders headings, lists, and fenced code blocks", () => {
    const md = [
      "## Two Pointers",
      "",
      "- Sorted array scan",
      "- `O(1)` extra space",
      "",
      "```ts",
      "let l = 0, r = arr.length - 1;",
      "```",
    ].join("\n");

    render(<SafeMarkdown content={md} />);

    expect(screen.getByRole("heading", { name: "Two Pointers" })).toBeInTheDocument();
    expect(screen.getByText("Sorted array scan")).toBeInTheDocument();
    expect(screen.getByText("O(1)")).toBeInTheDocument();
    expect(screen.getByText("let l = 0, r = arr.length - 1;")).toBeInTheDocument();
  });

  it("does not execute or render raw HTML tags as DOM elements", () => {
    const xssMd = 'Hello <script>window.__xss = true</script> <img src="x" onerror="alert(1)" />';
    const { container } = render(<SafeMarkdown content={xssMd} />);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect((window as any).__xss).toBeUndefined();
  });

  it("blocks javascript: and data: URLs while keeping safe links", () => {
    expect(sanitizeMarkdownUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeMarkdownUrl("DATA:text/html,<script>alert(1)</script>")).toBe("");
    expect(sanitizeMarkdownUrl("https://intervue.dev/docs")).toBe("https://intervue.dev/docs");
    expect(sanitizeMarkdownUrl("/practice")).toBe("/practice");
    expect(sanitizeMarkdownUrl("#complexity")).toBe("#complexity");

    render(
      <SafeMarkdown content="[Evil](javascript:alert(1)) and [Safe](https://example.com)" />
    );

    expect(screen.queryByRole("link", { name: "Evil" })).toBeNull();
    const safeLink = screen.getByRole("link", { name: "Safe" });
    expect(safeLink).toHaveAttribute("href", "https://example.com");
    expect(safeLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});

