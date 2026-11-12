import { describe, it, expect } from "vitest";
import { formatInterviewScore } from "./score";

describe("formatInterviewScore", () => {
  it("formats 1-10 integer scores with /10 scale", () => {
    expect(formatInterviewScore(8)).toEqual({
      value: "8",
      max: 10,
      formatted: "8/10",
    });
    expect(formatInterviewScore(10)).toEqual({
      value: "10",
      max: 10,
      formatted: "10/10",
    });
  });

  it("formats zero and decimal 1-10 scores cleanly", () => {
    expect(formatInterviewScore(0)).toEqual({
      value: "0",
      max: 10,
      formatted: "0/10",
    });
    expect(formatInterviewScore(7.5)).toEqual({
      value: "7.5",
      max: 10,
      formatted: "7.5/10",
    });
    expect(formatInterviewScore(7.0)).toEqual({
      value: "7",
      max: 10,
      formatted: "7/10",
    });
  });

  it("preserves /100 scale for any legacy >10 scores", () => {
    expect(formatInterviewScore(82)).toEqual({
      value: "82",
      max: 100,
      formatted: "82/100",
    });
    expect(formatInterviewScore(100)).toEqual({
      value: "100",
      max: 100,
      formatted: "100/100",
    });
  });

  it("returns null for missing or invalid values", () => {
    expect(formatInterviewScore(null)).toBeNull();
    expect(formatInterviewScore(undefined)).toBeNull();
    expect(formatInterviewScore(Number.NaN)).toBeNull();
    expect(formatInterviewScore(-1)).toBeNull();
  });
});

