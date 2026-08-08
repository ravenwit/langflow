import { describe, it, expect } from "vitest";
import { spacedRepetitionScheduler, computeNextReviewDue } from "@/lib/mastery/spacedRepetition";

describe("spacedRepetitionScheduler", () => {
  it("returns 0 days for mastery < 0.3", () => {
    expect(spacedRepetitionScheduler(0.0)).toBe(0);
    expect(spacedRepetitionScheduler(0.29)).toBe(0);
  });

  it("returns 1 day for mastery 0.3-0.49", () => {
    expect(spacedRepetitionScheduler(0.3)).toBe(1);
    expect(spacedRepetitionScheduler(0.49)).toBe(1);
  });

  it("returns 3 days for mastery 0.5-0.64", () => {
    expect(spacedRepetitionScheduler(0.5)).toBe(3);
    expect(spacedRepetitionScheduler(0.64)).toBe(3);
  });

  it("returns 7 days for mastery 0.65-0.79", () => {
    expect(spacedRepetitionScheduler(0.65)).toBe(7);
    expect(spacedRepetitionScheduler(0.79)).toBe(7);
  });

  it("returns 14 days for mastery 0.8-0.89", () => {
    expect(spacedRepetitionScheduler(0.8)).toBe(14);
    expect(spacedRepetitionScheduler(0.89)).toBe(14);
  });

  it("returns 30 days for mastery >= 0.9", () => {
    expect(spacedRepetitionScheduler(0.9)).toBe(30);
    expect(spacedRepetitionScheduler(1.0)).toBe(30);
  });
});

describe("computeNextReviewDue", () => {
  it("returns a future date offset by the correct interval", () => {
    const now = new Date("2025-01-01T12:00:00Z");
    const next = computeNextReviewDue(0.6, now);
    expect(next.getDate()).toBe(4); // +3 days
    expect(next.getMonth()).toBe(0);
    expect(next.getFullYear()).toBe(2025);
  });
});