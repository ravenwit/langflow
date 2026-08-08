import { SessionState, SessionSummary } from "./types";

/**
 * Builds a session summary from the actual performance log.
 * Mirrors Module 09 Section 12.4 — real metrics, no hardcoded zeros.
 */
export function buildSessionSummary(session: SessionState): SessionSummary {
  const now = new Date();
  const performanceLog = session.performance_log || [];

  const latencies = performanceLog.map((p) => p.response_latency_ms);
  const meanLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  const errorCount = performanceLog.reduce((sum, p) => sum + p.errors_detected.length, 0);
  const codeSwitchCount = performanceLog.reduce((sum, p) => sum + p.l1_insertions.length, 0);
  const masteryImprovements = performanceLog.length; // one reviewed item set per completed turn

  return {
    session_id: session.session_id,
    user_id: session.user_id,
    total_turns: session.current_turn_index,
    mean_response_latency_ms: meanLatency,
    error_count: errorCount,
    code_switch_count: codeSwitchCount,
    mastery_improvements: masteryImprovements,
    new_items_learned: session.new_items_introduced || 0,
    completed_at: now,
  };
}

export function closeSession(session: SessionState): SessionState {
  return {
    ...session,
    end_time: new Date(),
    modality_chain_state: "COMPLETED",
  };
}