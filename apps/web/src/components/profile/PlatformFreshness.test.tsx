import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformFreshness } from "./PlatformFreshness";

describe("PlatformFreshness", () => {
  const now = new Date("2026-11-22T12:00:00.000Z").getTime();

  it("labels a successful recent synchronization as fresh", () => {
    render(
      <PlatformFreshness
        now={now}
        lastSyncedAt="2026-11-22T11:00:00.000Z"
        status={{ state: "fresh", lastSyncedAt: "2026-11-22T11:00:00.000Z" }}
      />
    );

    expect(screen.getByText("Fresh")).toBeInTheDocument();
    expect(screen.getByText("Platform data is current")).toBeInTheDocument();
  });

  it("identifies timed-out refresh data as cached and stale", () => {
    render(
      <PlatformFreshness
        now={now}
        lastSyncedAt="2026-11-20T10:00:00.000Z"
        status={{
          state: "stale",
          lastSyncedAt: "2026-11-20T10:00:00.000Z",
          reason: "timeout",
        }}
      />
    );

    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("Sync timed out; showing cached data")).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("datetime", "2026-11-20T10:00:00.000Z");
  });

  it("does not describe old cached data as fresh before a new sync attempt", () => {
    render(<PlatformFreshness now={now} lastSyncedAt="2026-11-19T10:00:00.000Z" />);

    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("Cached data may be out of date")).toBeInTheDocument();
  });
});
