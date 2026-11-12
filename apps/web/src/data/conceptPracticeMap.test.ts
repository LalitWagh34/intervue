import { describe, it, expect } from "vitest";
import { CONCEPT_PRACTICE_MAP } from "./conceptPracticeMap";

describe("CONCEPT_PRACTICE_MAP", () => {
  it("defines practice problems for pilot concepts", () => {
    expect(CONCEPT_PRACTICE_MAP["two-pointers"]).toBeDefined();
    expect(CONCEPT_PRACTICE_MAP["sliding-window"]).toBeDefined();
    expect(CONCEPT_PRACTICE_MAP["binary-search"]).toBeDefined();
  });

  it("each mapped problem contains required fields and valid URLs", () => {
    for (const [conceptSlug, problems] of Object.entries(CONCEPT_PRACTICE_MAP)) {
      expect(problems.length).toBeGreaterThan(0);
      for (const p of problems) {
        expect(p.slug).toBeTruthy();
        expect(p.title).toBeTruthy();
        expect(["Easy", "Medium", "Hard"]).toContain(p.difficulty);
        expect(p.url).toMatch(/^https?:\/\//);
        expect(p.recommendedInvariants).toBeTruthy();
      }
    }
  });
});

