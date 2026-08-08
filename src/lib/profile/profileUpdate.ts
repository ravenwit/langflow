import { UserProfile, SessionSummary, InterestDomain } from "@/lib/mastery/types";

export function rollingMean(values: number[], window: number): number {
  const slice = values.slice(-window);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function updateProcessingLag(profile: UserProfile, summary: SessionSummary): number {
  const sessionLatencies = profile.session_log.map((s) => s.mean_response_latency);
  const allLatencies = [...sessionLatencies, summary.mean_response_latency];
  const window = 5;
  const newAverage = rollingMean(allLatencies, window);
  profile.cognitive_profile.average_processing_lag_ms = newAverage;
  return newAverage;
}

export function updateOralComfort(profile: UserProfile, summary: SessionSummary): number {
  const oralAttempts = summary.performance_log.filter(
    (p) => p.completion_method === "ORAL"
  ).length;
  const oralSuccesses = summary.performance_log.filter(
    (p) => p.completion_method === "ORAL" && p.errors_detected.length === 0
  ).length;

  if (oralAttempts > 0) {
    const sessionOralScore = oralSuccesses / oralAttempts;
    const previous = profile.cognitive_profile.oral_production_comfort || 0;
    profile.cognitive_profile.oral_production_comfort =
      previous * 0.7 + sessionOralScore * 0.3;
  }

  return profile.cognitive_profile.oral_production_comfort || 0;
}

export function updateCodeSwitchFrequency(profile: UserProfile, summary: SessionSummary): number {
  const totalTurns = summary.total_turns;
  if (totalTurns === 0) {
    profile.code_switch_frequency = 0;
    return 0;
  }
  const switchTurns = summary.performance_log.filter((p) => p.l1_insertions.length > 0).length;
  profile.code_switch_frequency = switchTurns / totalTurns;
  return profile.code_switch_frequency;
}

export function updateInterestWeights(profile: UserProfile, summary: SessionSummary): void {
  const baseline = profile.cognitive_profile.average_processing_lag_ms || 0;
  if (baseline <= 0) return;

  summary.performance_log.forEach((turn) => {
    if (turn.response_latency_ms < baseline * 0.8) {
      const domainLabel = summary.session_id; // fallback if domain not stored
      const domain = profile.interest_domains.find((d) => d.domain_label === domainLabel);
      if (domain) {
        domain.domain_weight = Math.min(1.0, domain.domain_weight + 0.05);
      }
    }
  });
}

export function updateAnxietySignals(profile: UserProfile, anxietyEvents: number): void {
  profile.cognitive_profile.anxiety_signals_detected =
    (profile.cognitive_profile.anxiety_signals_detected || 0) + anxietyEvents;
}

export function advanceMonthPhase(profile: UserProfile): boolean {
  if (
    profile.total_sessions % 20 === 0 &&
    profile.current_month_phase < 6
  ) {
    profile.current_month_phase += 1;
    profile.cognitive_profile.current_month_phase = profile.current_month_phase;
    return true;
  }
  return false;
}

export function updateCognitiveProfile(profile: UserProfile, summary: SessionSummary): UserProfile {
  updateProcessingLag(profile, summary);
  updateOralComfort(profile, summary);
  updateCodeSwitchFrequency(profile, summary);
  updateInterestWeights(profile, summary);
  updateAnxietySignals(profile, 0);
  advanceMonthPhase(profile);

  profile.total_sessions += 1;
  profile.total_minutes += 0;
  profile.session_log = [...profile.session_log, summary];

  return profile;
}