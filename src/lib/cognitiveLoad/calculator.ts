import { CognitiveLoadInput, CognitiveLoadResult, LoadLevel } from "./types";

export function calculateCognitiveLoadIndex(input: CognitiveLoadInput): CognitiveLoadResult {
  const { recent_latencies_ms, average_processing_lag_ms, recent_errors_count, replay_count_last_5_turns, skipped_turns, current_code_switch_rate, phase_expected_switch_rate } = input;

  const meanLatency = recent_latencies_ms.length > 0 ? recent_latencies_ms.reduce((a, b) => a + b, 0) / recent_latencies_ms.length : average_processing_lag_ms;
  const latency_ratio = meanLatency / (average_processing_lag_ms || 1);
  const error_signal = Math.min(1, recent_errors_count / 5);
  const replay_signal = Math.min(1, replay_count_last_5_turns / 3);
  const skip_signal = Math.min(1, skipped_turns / 3);
  const switch_delta = Math.max(0, current_code_switch_rate - phase_expected_switch_rate);
  const codeswitching_signal = Math.min(1, switch_delta * 2);

  const raw = latency_ratio * 0.3 + error_signal * 0.3 + replay_signal * 0.15 + skip_signal * 0.15 + codeswitching_signal * 0.1;
  const load_index = Math.max(0, Math.min(1, raw));

  let load_level: LoadLevel;
  if (load_index < 0.3) load_level = "LOW";
  else if (load_index < 0.6) load_level = "OPTIMAL";
  else if (load_index < 0.8) load_level = "ELEVATED";
  else load_level = "CRITICAL";

  return {
    load_index,
    load_level,
    signals: {
      latency_ratio,
      error_signal,
      replay_signal,
      skip_signal,
      codeswitching_signal,
    },
  };
}