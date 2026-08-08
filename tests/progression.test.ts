import { describe, it, expect } from "vitest";
import { scheduleNextReview } from "@/lib/progression/spacedRepetition";
import { evaluateProgressionGate } from "@/lib/progression/progressionGate";

describe("scheduleNextReview", () => {
  it("returns 0 day interval for mastery < 0.3", () => {
    const result = scheduleNextReview(0.1);
    expect(result.interval_days).toBe(0);
    expect(result.next_review_due).toBeInstanceOf(Date);
  });

  it("returns 1 day interval for mastery 0.3-0.5", () => {
    const result = scheduleNextReview(0.4);
    expect(result.interval_days).toBe(1);
  });

  it("returns 3 day interval for mastery 0.5-0.65", () => {
    const result = scheduleNextReview(0.6);
    expect(result.interval_days).toBe(3);
  });

  it("returns 7 day interval for mastery 0.65-0.8", () => {
    const result = scheduleNextReview(0.75);
    expect(result.interval_days).toBe(7);
  });

  it("returns 14 day interval for mastery 0.8-0.9", () => {
    const result = scheduleNextReview(0.85);
    expect(result.interval_days).toBe(14);
  });

  it("returns 30 day interval for mastery >= 0.9", () => {
    const result = scheduleNextReview(0.95);
    expect(result.interval_days).toBe(30);
  });

  it("returns future date relative to now", () => {
    const before = new Date();
    const result = scheduleNextReview(0.5);
    const after = new Date();
    expect(result.next_review_due.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.next_review_due.getTime()).toBeLessThanOrEqual(after.getTime() + 24 * 60 * 60 * 1000);
  });
});

describe("evaluateProgressionGate", () => {
  it("returns not ready when mastery is below 80%", () => {
    const result = evaluateProgressionGate({
      current_month_phase: 1,
      total_current_phase_items: 100,
      mastered_items: 70,
      sessions_in_phase: 20,
      current_oral_comfort: 0.8,
    });
    expect(result.ready_to_advance).toBe(false);
    expect(result.mastery_percentage).toBeCloseTo(0.7);
  });

  it("returns not ready when sessions below minimum", () => {
    const result = evaluateProgressionGate({
      current_month_phase: 1,
      total_current_phase_items: 100,
      mastered_items: 90,
      sessions_in_phase: 10,
      current_oral_comfort: 0.8,
    });
    expect(result.ready_to_advance).toBe(false);
    expect(result.sessions_in_phase).toBe(10);
  });

  it("returns not ready when oral comfort below threshold", () => {
    const result = evaluateProgressionGate({
      current_month_phase: 1,
      total_current_phase_items: 100,
      mastered_items: 90,
      sessions_in_phase: 20,
      current_oral_comfort: 0.5,
    });
    expect(result.ready_to_advance).toBe(false);
  });

  it("returns ready when all conditions met", () => {
    const result = evaluateProgressionGate({
      current_month_phase: 1,
      total_current_phase_items: 100,
      mastered_items: 85,
      sessions_in_phase: 20,
      current_oral_comfort: 0.8,
    });
    expect(result.ready_to_advance).toBe(true);
    expect(result.current_phase_cefr).toBe("A1");
  });

  it("maps phases to CEFR levels correctly", () => {
    expect(evaluateProgressionGate({ current_month_phase: 1, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("A1");
    expect(evaluateProgressionGate({ current_month_phase: 2, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("A1");
    expect(evaluateProgressionGate({ current_month_phase: 3, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("A2");
    expect(evaluateProgressionGate({ current_month_phase: 4, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("A2");
    expect(evaluateProgressionGate({ current_month_phase: 5, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("B1");
    expect(evaluateProgressionGate({ current_month_phase: 6, total_current_phase_items: 100, mastered_items: 90, sessions_in_phase: 20, current_oral_comfort: 0.8 }).current_phase_cefr).toBe("B1");
  });

  it("handles zero total items gracefully", () => {
    const result = evaluateProgressionGate({
      current_month_phase: 1,
      total_current_phase_items: 0,
      mastered_items: 0,
      sessions_in_phase: 20,
      current_oral_comfort: 0.8,
    });
    expect(result.mastery_percentage).toBe(0);
    expect(result.ready_to_advance).toBe(false);
  });
});