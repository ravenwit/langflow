import { InterestDomain, ContextTag, CognitiveProfile, UserProfile } from "@/lib/mastery/types";

export interface OnboardingInput {
  user_id: string;
  raw_interests: Array<{ label: string; sub_topics: string[]; vocabulary_anchors: string[] }>;
  daily_contexts: string[];
  calibration_latencies_ms: number[];
  microphone_consent: boolean;
  native_language?: string;
}

export interface OnboardingResult {
  profile: UserProfile;
}

export function parseInterests(
  raw_interests: OnboardingInput["raw_interests"]
): InterestDomain[] {
  if (raw_interests.length === 0) {
    return [];
  }
  const weight = 1.0 / raw_interests.length;
  return raw_interests.map((interest) => ({
    domain_label: interest.label,
    domain_weight: weight,
    sub_topics: interest.sub_topics,
    vocabulary_anchors: interest.vocabulary_anchors,
  }));
}

export function parseContexts(selections: string[]): ContextTag[] {
  return selections.map((label) => ({ label }));
}

export function inferWorkingMemoryTolerance(averageLatencyMs: number): "LOW" | "MEDIUM" | "HIGH" {
  if (averageLatencyMs < 2500) {
    return "HIGH";
  }
  if (averageLatencyMs < 5000) {
    return "MEDIUM";
  }
  return "LOW";
}

export function runOnboardingIntake(input: OnboardingInput): OnboardingResult {
  const interest_domains = parseInterests(input.raw_interests);
  const daily_contexts = parseContexts(input.daily_contexts);

  const averageLatency =
    input.calibration_latencies_ms.length > 0
      ? input.calibration_latencies_ms.reduce((a, b) => a + b, 0) / input.calibration_latencies_ms.length
      : 0;

  const working_memory_load_tolerance = inferWorkingMemoryTolerance(averageLatency);

  const oral_production_comfort = input.microphone_consent ? 0.2 : 0.0;

  const cognitive_profile: CognitiveProfile = {
    working_memory_load_tolerance,
    preferred_input_modality: "BALANCED",
    oral_production_comfort,
    average_processing_lag_ms: averageLatency,
    anxiety_signals_detected: 0,
    current_month_phase: 1,
  };

  const profile: UserProfile = {
    user_id: input.user_id,
    current_month_phase: 1,
    cognitive_profile,
    interest_domains,
    daily_contexts,
    native_language: input.native_language || "English",
    code_switch_frequency: 0,
    session_log: [],
    total_sessions: 0,
    total_minutes: 0,
  };

  return { profile };
}