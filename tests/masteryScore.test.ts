import { describe, it, expect } from "vitest";
import { calculateMasteryScore, exponentialDecay } from "@/lib/mastery/masteryScore";
import { ErrorRecord } from "@/lib/mastery/types";

describe("exponentialDecay", () => {
  it("returns base when timeElapsedDays is 0", () => {
    expect(exponentialDecay(1.0, 0.05, 0)).toBeCloseTo(1.0, 5);
  });

  it("decays as days increase", () => {
    const decayed = exponentialDecay(1.0, 0.05, 10);
    expect(decayed).toBeLessThan(1.0);
    expect(decayed).toBeGreaterThan(0);
  });
});

describe("calculateMasteryScore", () => {
  const baseItem = {
    correct_production_count: 0,
    exposure_count: 0,
    last_reviewed: null as string | null,
    error_log: [] as ErrorRecord[],
  };

  it("returns 0 when no exposure and no errors", () => {
    const score = calculateMasteryScore(baseItem);
    expect(score).toBeCloseTo(0, 5);
  });

  it("returns 1.0 when perfect production and fresh review", () => {
    const score = calculateMasteryScore({
      ...baseItem,
      exposure_count: 10,
      correct_production_count: 10,
      last_reviewed: new Date().toISOString(),
      error_log: [],
    });
    expect(score).toBeCloseTo(1.0, 5);
  });

  it("penalizes errors up to 0.5", () => {
    const errors: ErrorRecord[] = Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date().toISOString(),
      error_type: "WORD_ORDER",
      context_sentence: `error ${i}`,
    }));
    const score = calculateMasteryScore({
      ...baseItem,
      exposure_count: 10,
      correct_production_count: 10,
      last_reviewed: new Date().toISOString(),
      error_log: errors,
    });
    expect(score).toBeCloseTo(0.5, 5); // 1.0 - 0.5 penalty
  });

  it("clamps to [0, 1]", () => {
    // Perfect production but massive errors
    const errors: ErrorRecord[] = Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date().toISOString(),
      error_type: "WORD_ORDER",
      context_sentence: `error ${i}`,
    }));
    const score = calculateMasteryScore({
      ...baseItem,
      exposure_count: 100,
      correct_production_count: 100,
      last_reviewed: new Date().toISOString(),
      error_log: errors,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});