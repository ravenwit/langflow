export type LoadLevel = "LOW" | "OPTIMAL" | "ELEVATED" | "CRITICAL";

export interface CognitiveLoadInput {
  recent_latencies_ms: number[];
  average_processing_lag_ms: number;
  recent_errors_count: number;
  replay_count_last_5_turns: number;
  skipped_turns: number;
  current_code_switch_rate: number;
  phase_expected_switch_rate: number;
}

export interface CognitiveLoadResult {
  load_index: number;
  load_level: LoadLevel;
  signals: {
    latency_ratio: number;
    error_signal: number;
    replay_signal: number;
    skip_signal: number;
    codeswitching_signal: number;
  };
}

export interface CognitiveLoadRepositoryRecord {
  log_id: string;
  session_id: string;
  turn_index: number;
  load_index: number;
  load_level: LoadLevel;
  latency_ratio: number;
  error_signal: number;
  replay_signal: number;
  skip_signal: number;
  codeswitching_signal: number;
  created_at: string;
}