import { describe, expect, it } from "vitest";
import { getSheetPracticePath } from "./CommandPalette";

describe("command palette destinations", () => {
  it("opens a search result at the selected practice sheet", () => {
    expect(getSheetPracticePath("neetcode-150")).toBe(
      "/practice?view=sheet_practice&sheet=neetcode-150"
    );
  });

  it("encodes unexpected slug characters safely", () => {
    expect(getSheetPracticePath("sheet & track")).toBe(
      "/practice?view=sheet_practice&sheet=sheet+%26+track"
    );
  });
});
