import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentSearch,
  clearCodeDraft,
  clearFeedbackDraft,
  clearRecentSearches,
  clearUserLocalCaches,
  getAccountCache,
  getCodeDraft,
  getFeedbackDraft,
  getLearnConceptVersionKey,
  getLearnReaderMode,
  getPracticePreferences,
  getRecentSearches,
  loadLatestLearnConceptCache,
  loadLearnConceptByVersion,
  saveLearnConceptCache,
  setAccountCache,
  setCodeDraft,
  setFeedbackDraft,
  setLearnReaderMode,
  setPracticePreferences,
} from "./localCache";
import { signOut } from "./auth";
import { queryClient } from "./queryClient";

describe("localCache utility", () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("isolates account-scoped read caches and respects TTL expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T10:00:00Z"));

    setAccountCache("user-a", "profile-stats", { role: "admin" }, 10_000);
    setAccountCache("user-b", "profile-stats", { role: "user" }, 10_000);

    expect(getAccountCache<{ role: string }>("user-a", "profile-stats")).toEqual({ role: "admin" });
    expect(getAccountCache<{ role: string }>("user-b", "profile-stats")).toEqual({ role: "user" });

    vi.advanceTimersByTime(10_001);
    expect(getAccountCache("user-a", "profile-stats")).toBeNull();
  });

  it("persists immutable Learn concept bodies by slug + version and strips per-user progress", async () => {
    const payload = {
      concept: {
        id: "c1",
        slug: "two-pointers",
        title: "Two Pointers",
        summary: "Monotonic pointers",
        quickRevisionMd: "## Quick",
        deepDiveMd: "## Deep",
        estimatedMinutes: 10,
        difficulty: "FOUNDATION" as const,
        keyTakeaways: ["O(n)"],
        commonMistakes: ["Bounds"],
        version: 3,
        publishedAt: "2026-11-20T00:00:00.000Z",
        module: { slug: "arrays", title: "Arrays" },
        subject: { slug: "dsa", title: "DSA" },
      },
      navigation: {
        prev: null,
        next: { slug: "sliding-window", title: "Sliding Window" },
      },
      progress: {
        status: "CONFIDENT",
        recallAttempts: 5,
      },
    };

    await saveLearnConceptCache(payload as any);

    const byVersion = await loadLearnConceptByVersion("two-pointers", 3);
    expect(byVersion?.concept.title).toBe("Two Pointers");
    expect((byVersion as any)?.progress).toBeUndefined();

    const latest = await loadLatestLearnConceptCache("two-pointers");
    expect(latest?.concept.version).toBe(3);
    expect(localStorage.getItem(getLearnConceptVersionKey("two-pointers", 3))).toBeTruthy();
  });

  it("persists and clears code drafts and feedback drafts", () => {
    setCodeDraft("user-a", "room:ABCD12:problem:42", "CPP", "int main() { return 0; }");
    setCodeDraft("user-a", "room:ABCD12:problem:42", "PYTHON", "print(1)");
    setCodeDraft("user-b", "room:ABCD12:problem:42", "CPP", "// user b");

    expect(getCodeDraft("user-a", "room:ABCD12:problem:42", "CPP")).toBe("int main() { return 0; }");
    expect(getCodeDraft("user-b", "room:ABCD12:problem:42", "CPP")).toBe("// user b");

    clearCodeDraft("user-a", "room:ABCD12:problem:42");
    expect(getCodeDraft("user-a", "room:ABCD12:problem:42", "CPP")).toBeNull();
    expect(getCodeDraft("user-a", "room:ABCD12:problem:42", "PYTHON")).toBeNull();
    expect(getCodeDraft("user-b", "room:ABCD12:problem:42", "CPP")).toBe("// user b");

    setFeedbackDraft("user-a", {
      name: "Lalit",
      email: "l@test.com",
      subject: "Bug Report",
      message: "Draft message",
    });
    expect(getFeedbackDraft("user-a")?.message).toBe("Draft message");
    clearFeedbackDraft("user-a");
    expect(getFeedbackDraft("user-a")).toBeNull();
  });

  it("manages UI preferences and deduplicated recent searches", () => {
    expect(getLearnReaderMode("user-a")).toBe("quick");
    setLearnReaderMode("user-a", "deep");
    expect(getLearnReaderMode("user-a")).toBe("deep");

    setPracticePreferences("user-a", { difficulty: ["Core"], companyTabFilter: "indian" });
    expect(getPracticePreferences("user-a")).toEqual({
      difficulty: ["Core"],
      companyTabFilter: "indian",
    });

    addRecentSearch("user-a", "Two Sum");
    addRecentSearch("user-a", "Graph");
    addRecentSearch("user-a", "two sum");
    expect(getRecentSearches("user-a")).toEqual(["two sum", "Graph"]);

    clearRecentSearches("user-a");
    expect(getRecentSearches("user-a")).toEqual([]);
  });

  it("clears user-scoped caches and React Query cache on signOut without leaving stale account data", async () => {
    setAccountCache("user-a", "dashboard", { score: 10 }, 60_000);
    setCodeDraft("user-a", "room:1:problem:1", "CPP", "draft");
    setLearnReaderMode("user-a", "deep");
    setPracticePreferences("user-a", { difficulty: ["Hard"] });
    addRecentSearch("user-a", "Binary Search");
    localStorage.setItem("intervue:solved-problems:v1:user-a", '{"two-sum":true}');
    localStorage.setItem("intervue:last-lesson:user-a", '{"slug":"two-pointers","title":"Two Pointers"}');
    localStorage.setItem("intervue_theme", "dark");

    queryClient.setQueryData(["profile-stats", undefined], { user: { role: "admin" } });
    expect(queryClient.getQueryData(["profile-stats", undefined])).toBeDefined();

    await signOut().catch(() => {});

    expect(getAccountCache("user-a", "dashboard")).toBeNull();
    expect(getCodeDraft("user-a", "room:1:problem:1", "CPP")).toBeNull();
    expect(getPracticePreferences("user-a")).toBeNull();
    expect(getRecentSearches("user-a")).toEqual([]);
    expect(localStorage.getItem("intervue:solved-problems:v1:user-a")).toBeNull();
    expect(localStorage.getItem("intervue:last-lesson:user-a")).toBeNull();
    // Non-account theme preference remains intact
    expect(localStorage.getItem("intervue_theme")).toBe("dark");
    // React Query cache is wiped
    expect(queryClient.getQueryData(["profile-stats", undefined])).toBeUndefined();
  });

  it("degrades gracefully when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Quota / security error");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota / security error");
    });

    expect(() => setAccountCache("user-a", "k", { a: 1 }, 5000)).not.toThrow();
    expect(getAccountCache("user-a", "k")).toBeNull();
    expect(() => clearUserLocalCaches("user-a")).not.toThrow();
    expect(getLearnReaderMode("user-a")).toBe("quick");
  });
});
