import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get: mocks.get } }));
vi.mock("@/lib/auth", () => ({ useSession: () => ({ data: { user: { id: "a" } } }) }));
vi.mock("@/lib/localCache", () => ({ loadLatestLearnConceptCache: mocks.load, saveLearnConceptCache: vi.fn() }));
import { useLearnConcept, type LearnConceptResponse } from "./useLearn";

describe("lesson placeholder identity", () => {
  it("never renders lesson A under lesson B while network and storage reads are pending", async () => {
    const payload = { concept: { slug: "a", title: "Lesson A" }, navigation: { prev: null, next: null } } as LearnConceptResponse;
    mocks.get.mockImplementation(() => new Promise(() => {}));
    mocks.load.mockImplementation((slug: string) => slug === "a" ? Promise.resolve(payload) : new Promise(() => {}));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const seen: Array<{ requested: string; shown?: string }> = [];
    const { rerender, result, unmount } = renderHook(({ slug }) => {
      const query = useLearnConcept(slug);
      seen.push({ requested: slug, shown: query.data?.concept.slug });
      return query;
    }, { wrapper, initialProps: { slug: "a" } });
    await waitFor(() => expect(result.current.data?.concept.slug).toBe("a"));
    rerender({ slug: "b" });
    expect(seen.filter((render) => render.requested === "b").every((render) => render.shown !== "a")).toBe(true);
    unmount();
    client.clear();
  });
});
