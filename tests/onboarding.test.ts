import { describe, it, expect } from "vitest";
import { runOnboardingIntake, parseInterests, parseContexts, inferWorkingMemoryTolerance } from "@/lib/profile/onboarding";

describe("parseInterests", () => {
  it("assigns equal weights when interests provided", () => {
    const raw = [
      { label: "physics", sub_topics: ["quantum"], vocabulary_anchors: ["energy"] },
      { label: "music", sub_topics: ["jazz"], vocabulary_anchors: ["chord"] },
    ];
    const result = parseInterests(raw);
    expect(result).toHaveLength(2);
    expect(result[0].domain_weight).toBeCloseTo(0.5, 5);
    expect(result[1].domain_weight).toBeCloseTo(0.5, 5);
  });

  it("returns empty array when no interests provided", () => {
    expect(parseInterests([])).toEqual([]);
  });
});

describe("parseContexts", () => {
  it("maps selections to ContextTag objects", () => {
    const result = parseContexts(["grocery_shopping", "university_administration"]);
    expect(result).toEqual([{ label: "grocery_shopping" }, { label: "university_administration" }]);
  });
});

describe("inferWorkingMemoryTolerance", () => {
  it("returns HIGH for fast average latency", () => {
    expect(inferWorkingMemoryTolerance(2000)).toBe("HIGH");
  });

  it("returns MEDIUM for medium average latency", () => {
    expect(inferWorkingMemoryTolerance(4000)).toBe("MEDIUM");
  });

  it("returns LOW for slow average latency", () => {
    expect(inferWorkingMemoryTolerance(6000)).toBe("LOW");
  });
});

describe("runOnboardingIntake", () => {
  it("constructs a complete UserProfile with defaults", () => {
    const result = runOnboardingIntake({
      user_id: "user-123",
      raw_interests: [{ label: "computational physics", sub_topics: ["simulation"], vocabulary_anchors: ["code"] }],
      daily_contexts: ["shared_flat_logistics"],
      calibration_latencies_ms: [2000, 2500, 3000],
      microphone_consent: true,
    });

    expect(result.profile.user_id).toBe("user-123");
    expect(result.profile.interest_domains).toHaveLength(1);
    expect(result.profile.interest_domains[0].domain_weight).toBeCloseTo(1.0, 5);
    expect(result.profile.daily_contexts).toEqual([{ label: "shared_flat_logistics" }]);
    expect(result.profile.cognitive_profile.working_memory_load_tolerance).toBe("MEDIUM");
    expect(result.profile.cognitive_profile.oral_production_comfort).toBeCloseTo(0.2, 5);
    expect(result.profile.native_language).toBe("English");
    expect(result.profile.total_sessions).toBe(0);
    expect(result.profile.session_log).toEqual([]);
  });

  it("defaults oral comfort to 0 when microphone consent is false", () => {
    const result = runOnboardingIntake({
      user_id: "user-123",
      raw_interests: [],
      daily_contexts: [],
      calibration_latencies_ms: [],
      microphone_consent: false,
    });
    expect(result.profile.cognitive_profile.oral_production_comfort).toBe(0);
  });
});