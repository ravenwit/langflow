import { describe, it, expect } from "vitest";
import { calculateCognitiveLoadIndex } from "@/lib/cognitiveLoad/calculator";
import { respondToCognitiveLoad } from "@/lib/cognitiveLoad/responseActions";
import { CognitiveLoadInput, LoadLevel } from "@/lib/cognitiveLoad/types";
import { ScaffoldingConfig } from "@/lib/scenario/types";

describe("calculateCognitiveLoadIndex", () => {
  const baseInput: CognitiveLoadInput = {
    recent_latencies_ms: [1000, 1000, 1000, 1000, 1000],
    average_processing_lag_ms: 1000,
    recent_errors_count: 0,
    replay_count_last_5_turns: 0,
    skipped_turns: 0,
    current_code_switch_rate: 0,
    phase_expected_switch_rate: 0,
  };

  it("returns OPTIMAL for baseline signals", () => {
    const result = calculateCognitiveLoadIndex(baseInput);
    expect(result.load_level).toBe("OPTIMAL");
    expect(result.load_index).toBeGreaterThanOrEqual(0);
    expect(result.load_index).toBeLessThan(0.6);
  });

  it("returns LOW when latency is well below baseline", () => {
    const input: CognitiveLoadInput = {
      ...baseInput,
      recent_latencies_ms: [400, 400, 400, 400, 400],
    };
    const result = calculateCognitiveLoadIndex(input);
    expect(result.load_level).toBe("LOW");
    expect(result.signals.latency_ratio).toBeCloseTo(0.4, 1);
  });

  it("returns ELEVATED when errors are very high with supporting signals", () => {
    const input: CognitiveLoadInput = {
      ...baseInput,
      recent_errors_count: 5,
      replay_count_last_5_turns: 3,
      skipped_turns: 3,
    };
    const result = calculateCognitiveLoadIndex(input);
    expect(result.load_level).toBe("CRITICAL");
  });

  it("returns ELEVATED when multiple signals are elevated", () => {
    const input: CognitiveLoadInput = {
      ...baseInput,
      recent_errors_count: 4,
      replay_count_last_5_turns: 2,
      skipped_turns: 2,
    };
    const result = calculateCognitiveLoadIndex(input);
    expect(result.load_level).toBe("ELEVATED");
  });

  it("returns CRITICAL for extreme combined signals", () => {
    const input: CognitiveLoadInput = {
      ...baseInput,
      recent_errors_count: 5,
      replay_count_last_5_turns: 3,
      skipped_turns: 3,
      recent_latencies_ms: [3000, 3000, 3000, 3000, 3000],
      current_code_switch_rate: 0.8,
      phase_expected_switch_rate: 0.1,
    };
    const result = calculateCognitiveLoadIndex(input);
    expect(result.load_level).toBe("CRITICAL");
  });

  it("clamps load_index to [0,1]", () => {
    const extreme: CognitiveLoadInput = {
      ...baseInput,
      recent_latencies_ms: [10000, 10000, 10000, 10000, 10000],
      recent_errors_count: 5,
      replay_count_last_5_turns: 3,
      skipped_turns: 3,
      current_code_switch_rate: 1,
      phase_expected_switch_rate: 0,
    };
    const result = calculateCognitiveLoadIndex(extreme);
    expect(result.load_index).toBeLessThanOrEqual(1);
    expect(result.load_index).toBeGreaterThanOrEqual(0);
  });
});

describe("respondToCognitiveLoad", () => {
  const baseScaffolding: ScaffoldingConfig = {
    show_l1_translation: false,
    show_grammar_labels: false,
    word_cards_presorted: false,
    oral_prep_time_seconds: 20,
    codeswitching_invite_shown: false,
  };

  it("returns INCREASE complexity for LOW load", () => {
    const result = respondToCognitiveLoad({ load_index: 0.1, load_level: "LOW", signals: { latency_ratio: 0.5, error_signal: 0, replay_signal: 0, skip_signal: 0, codeswitching_signal: 0 } }, baseScaffolding);
    expect(result.load_level).toBe("LOW");
    expect(result.actions.complexity_adjustment).toBe("INCREASE");
    expect(result.actions.scaffolding_adjustments?.show_l1_translation).toBe(false);
    expect(result.actions.scaffolding_adjustments?.oral_prep_time_seconds).toBeLessThan(20);
  });

  it("returns no actions for OPTIMAL load", () => {
    const result = respondToCognitiveLoad({ load_index: 0.5, load_level: "OPTIMAL", signals: { latency_ratio: 1, error_signal: 0.2, replay_signal: 0, skip_signal: 0, codeswitching_signal: 0 } }, baseScaffolding);
    expect(result.load_level).toBe("OPTIMAL");
    expect(result.actions).toEqual({});
  });

  it("returns increased scaffolding for ELEVATED load", () => {
    const result = respondToCognitiveLoad({ load_index: 0.7, load_level: "ELEVATED", signals: { latency_ratio: 1.2, error_signal: 0.6, replay_signal: 0, skip_signal: 0, codeswitching_signal: 0 } }, baseScaffolding);
    expect(result.load_level).toBe("ELEVATED");
    expect(result.actions.scaffolding_adjustments?.show_l1_translation).toBe(true);
    expect(result.actions.scaffolding_adjustments?.show_grammar_labels).toBe(true);
    expect(result.actions.scaffolding_adjustments?.oral_prep_time_seconds).toBe(30);
    expect(result.actions.scaffolding_adjustments?.word_cards_presorted).toBe(true);
  });

  it("returns recovery for CRITICAL load", () => {
    const result = respondToCognitiveLoad({ load_index: 0.9, load_level: "CRITICAL", signals: { latency_ratio: 2, error_signal: 1, replay_signal: 1, skip_signal: 1, codeswitching_signal: 1 } }, baseScaffolding);
    expect(result.load_level).toBe("CRITICAL");
    expect(result.actions.recovery_inserted).toBe(true);
    expect(result.actions.session_reduction).toBe(2);
    expect(result.actions.scaffolding_adjustments?.show_l1_translation).toBe(true);
  });
});