import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  fetchGitHubStats,
  fetchWithProviderTimeout,
  isExternalProviderTimeout,
} from "../lib/externalStats";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("external platform provider boundaries", () => {
  it("aborts a provider request when its deadline expires", async () => {
    globalThis.fetch = mock((_input: any, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    })) as any;

    const keepEventLoopAlive = setTimeout(() => {}, 50);
    let caught: unknown;
    try {
      await fetchWithProviderTimeout("https://provider.example/stats", {}, 5);
    } catch (error) {
      caught = error;
    } finally {
      clearTimeout(keepEventLoopAlive);
    }

    expect(isExternalProviderTimeout(caught)).toBe(true);
  });

  it("uses a bounded request while preserving successful GitHub stats", async () => {
    let signal: AbortSignal | null | undefined;
    globalThis.fetch = mock(async (_input: any, init?: RequestInit) => {
      signal = init?.signal;
      return new Response(JSON.stringify({
        login: "octocat",
        public_repos: 8,
        followers: 12,
        avatar_url: "https://example.com/avatar.png",
        html_url: "https://github.com/octocat",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as any;

    const stats = await fetchGitHubStats("octocat");

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(stats).toMatchObject({ handle: "octocat", publicRepos: 8, followers: 12 });
    expect(stats.lastSyncedAt).toBeString();
  });
});
