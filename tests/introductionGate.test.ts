import { describe, it, expect } from "vitest";
import { isItemIntroducible } from "@/lib/mastery/introductionGate";

describe("isItemIntroducible", () => {
  const defaultContext = {
    userMonthPhase: 1,
    cognitiveLoadIndex: 0.3,
    newItemsIntroducedThisSession: 0,
  };

  it("allows introducible item in phase 1 with low load", () => {
    const result = isItemIntroducible("A1", [], { ...defaultContext });
    expect(result.introducible).toBe(true);
    expect(result.reason).toBe("OK");
  });

  it("blocks CEFR level too advanced for phase", () => {
    const result = isItemIntroducible("B2", [], { ...defaultContext });
    expect(result.introducible).toBe(false);
    expect(result.reason).toContain("CEFR level too advanced");
  });

  it("blocks when prerequisite mastery is below threshold", () => {
    const result = isItemIntroducible("A1", [0.5], { ...defaultContext });
    expect(result.introducible).toBe(false);
    expect(result.reason).toContain("Prerequisites not mastered");
  });

  it("blocks when cognitive load is elevated", () => {
    const result = isItemIntroducible("A1", [], { ...defaultContext, cognitiveLoadIndex: 0.8 });
    expect(result.introducible).toBe(false);
    expect(result.reason).toContain("Cognitive load too high");
  });

  it("blocks when new item cap reached", () => {
    const result = isItemIntroducible("A1", [], { ...defaultContext, newItemsIntroducedThisSession: 3 });
    expect(result.introducible).toBe(false);
    expect(result.reason).toContain("New item cap reached");
  });
});