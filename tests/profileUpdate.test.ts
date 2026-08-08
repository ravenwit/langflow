import { describe, it, expect } from "vitest";
import {
  rollingMean,
  updateProcessingLag,
  updateOralComfort,
  updateCodeSwitchFrequency,
  updateInterestWeights,
  updateAnxietySignals,
  advanceMonthPhase,
  updateCognitiveProfile,
} from "@/lib/profile/profileUpdate";
import { UserProfile, SessionSummary, TurnPerformance } from "@/lib/mastery/types";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    user_id: "user-123",
    current_month_phase: 1,
    cognitive_profile: {
      working_memory_load_tolerance: "MEDIUM",
      preferred_input_modality: "BALANCED",
      oral_production_comfort: 0.0,
      average_processing_lag_ms: 3000,
      anxiety_signals_detected: 0,
      current_month_phase: 1,
    },
    interest_domains: [
      { domain_label: "physics", domain_weight: 1.0, sub_topics: ["quantum"], vocabulary_anchors: ["energy"] },
      { domain_label: "music", domain_weight: 1.0, sub_topics: ["jazz"], vocabulary_anchors: ["chord"] },
    ],
    daily_contexts: [{ label: "university_administration" }],
    native_language: "English",
    code_switch_frequency: 0,
    session_log: [],
    total_sessions: 0,
    total_minutes: 0,
    ...overrides,
  };
}

function makeSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    session_id: "session-1",
    user_id: "user-123",
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    total_turns: 2,
    mean_response_latency: 3000,
    error_count: 0,
    code_switch_count: 0,
    new_items_introduced: 0,
    performance_log: [] as TurnPerformance[],
    ...overrides,
  };
}

describe("rollingMean", () => {
  it("returns 0 for empty array", () => {
    expect(rollingMean([], 5)).toBe(0);
  });

  it("returns mean of all values when window exceeds length", () => {
    expect(rollingMean([2, 4, 6], 5)).toBeCloseTo(4, 5);
  });

  it("respects window size", () => {
    expect(rollingMean([2, 4, 6, 8, 10, 12], 3)).toBeCloseTo(10, 5);
  });
});

describe("updateProcessingLag", () => {
  it("computes rolling mean of latencies including current session", () => {
    const profile = makeProfile({
      session_log: [
        makeSummary({ session_id: "s1", mean_response_latency: 2000 }),
        makeSummary({ session_id: "s2", mean_response_latency: 4000 }),
      ],
    });
    const current = makeSummary({ mean_response_latency: 3000 });
    updateProcessingLag(profile, current);
    expect(profile.cognitive_profile.average_processing_lag_ms).toBeCloseTo(3000, 5);
  });
});

describe("updateOralComfort", () => {
  it("updates comfort via exponential smoothing when oral attempts exist", () => {
    const profile = makeProfile({ cognitive_profile: { oral_production_comfort: 0.1 } });
    const summary = makeSummary({
      performance_log: [
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 0, l1_insertions: [], turn_id: "t1", scaffolding_used: false },
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 0, l1_insertions: [], turn_id: "t2", scaffolding_used: false },
      ],
    });
    updateOralComfort(profile, summary);
    expect(profile.cognitive_profile.oral_production_comfort).toBeCloseTo(0.1 * 0.7 + 1.0 * 0.3, 5);
  });

  it("leaves comfort unchanged when no oral attempts", () => {
    const profile = makeProfile({ cognitive_profile: { oral_production_comfort: 0.5 } });
    const summary = makeSummary({
      performance_log: [
        { completion_method: "WORD_CARD", errors_detected: [], response_latency_ms: 0, l1_insertions: [], turn_id: "t1", scaffolding_used: false },
      ],
    });
    updateOralComfort(profile, summary);
    expect(profile.cognitive_profile.oral_production_comfort).toBe(0.5);
  });
});

describe("updateCodeSwitchFrequency", () => {
  it("computes ratio of turns with L1 insertions", () => {
    const profile = makeProfile();
    const summary = makeSummary({
      total_turns: 3,
      performance_log: [
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 0, l1_insertions: ["hello"], turn_id: "t1", scaffolding_used: false },
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 0, l1_insertions: [], turn_id: "t2", scaffolding_used: false },
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 0, l1_insertions: ["book"], turn_id: "t3", scaffolding_used: false },
      ],
    });
    updateCodeSwitchFrequency(profile, summary);
    expect(profile.code_switch_frequency).toBeCloseTo(2 / 3, 5);
  });
});

describe("updateInterestWeights", () => {
  it("boosts weight when latency is below 80% of baseline", () => {
    const profile = makeProfile({ cognitive_profile: { average_processing_lag_ms: 5000 } });
    const physicsDomain = profile.interest_domains.find((d) => d.domain_label === "physics")!;
    physicsDomain.domain_weight = 0.9;
    const summary = makeSummary({
      session_id: "physics",
      performance_log: [
        { completion_method: "ORAL", errors_detected: [], response_latency_ms: 3000, l1_insertions: [], turn_id: "t1", scaffolding_used: false },
      ],
    });
    updateInterestWeights(profile, summary);
    expect(profile.interest_domains.find((d) => d.domain_label === "physics")?.domain_weight).toBeCloseTo(0.95, 5);
  });
});

describe("advanceMonthPhase", () => {
  it("advances phase when total_sessions is a multiple of 20 and phase < 6", () => {
    const profile = makeProfile({ total_sessions: 20, current_month_phase: 1 });
    advanceMonthPhase(profile);
    expect(profile.current_month_phase).toBe(2);
  });

  it("does not advance beyond phase 6", () => {
    const profile = makeProfile({ total_sessions: 40, current_month_phase: 6 });
    advanceMonthPhase(profile);
    expect(profile.current_month_phase).toBe(6);
  });
});

describe("updateCognitiveProfile", () => {
  it("increments total_sessions and appends session log", () => {
    const profile = makeProfile({ total_sessions: 5, session_log: [] });
    const summary = makeSummary({ session_id: "s1", mean_response_latency: 3500 });
    updateCognitiveProfile(profile, summary);
    expect(profile.total_sessions).toBe(6);
    expect(profile.session_log).toHaveLength(1);
  });
});