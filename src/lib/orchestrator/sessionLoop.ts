import { SessionState } from "./types";
import { DialogueTurn, Scenario, ScaffoldingConfig } from "@/lib/scenario/types";
import { deliverTurn } from "@/lib/delivery/delivery";
import { runWordCardTask } from "@/lib/kinesthetic/wordCardTask";
import { runOralPreparation } from "@/lib/oral/preparation";
import { processOralOutput, buildOralPerformanceRecord } from "@/lib/oral/processing";
import { updateMasteryScores } from "@/lib/oral/masteryUpdate";
import { buildFeedback } from "@/lib/feedback/builder";
import { calculateCognitiveLoadIndex } from "@/lib/cognitiveLoad/calculator";
import { respondToCognitiveLoad } from "@/lib/cognitiveLoad/responseActions";
import { TurnPerformance as FeedbackTurnPerformance } from "@/lib/feedback/types";
import { TurnPerformance as MasteryTurnPerformance } from "@/lib/mastery/types";

export interface SessionLoopInput {
  session: SessionState;
  scenario: Scenario;
  current_scaffolding: ScaffoldingConfig;
  average_processing_lag_ms: number;
  current_code_switch_rate: number;
  phase_expected_switch_rate: number;
}

export interface UserTurnResponse {
  transcript: string;
  response_latency_ms: number;
}

export interface SessionLoopResult {
  session: SessionState;
  completed: boolean;
  turn_index: number;
  load_index: number;
  load_level: string;
  comprehension_gate_action?: "PROCEED" | "REPLAY" | "BREAKDOWN" | "RECOVERY";
  word_card_result?: ReturnType<typeof runWordCardTask>;
  oral_prep_plan?: ReturnType<typeof runOralPreparation>;
  performance?: FeedbackTurnPerformance;
  feedback?: ReturnType<typeof buildFeedback>;
  delivery_plan?: ReturnType<typeof deliverTurn>["plan"];
  mastery_updates?: ReturnType<typeof updateMasteryScores>;
}

/**
 * Computes the current cognitive load index from the session's performance log.
 * Mirrors Module 07 Section 10.2.
 */
export function computeSessionLoad(
  session: SessionState,
  average_processing_lag_ms: number,
  current_code_switch_rate: number,
  phase_expected_switch_rate: number
) {
  const recent = session.performance_log.slice(-5);
  return calculateCognitiveLoadIndex({
    recent_latencies_ms: recent.map((p) => p.response_latency_ms),
    average_processing_lag_ms,
    recent_errors_count: recent.reduce((sum, p) => sum + p.errors_detected.length, 0),
    replay_count_last_5_turns: session.replay_count,
    skipped_turns: session.skipped_turns,
    current_code_switch_rate,
    phase_expected_switch_rate,
  });
}

/**
 * Applies load-response actions to update scaffolding for the session.
 * Mirrors Module 07 Section 10.3.
 */
export function applyLoadResponse(
  session: SessionState,
  scaffolding: ScaffoldingConfig
): { scaffolding: ScaffoldingConfig; load_level: string; recovery_inserted: boolean; session_reduction: number } {
  const baseResponse = respondToCognitiveLoad(
    { load_index: session.cognitive_load_index, load_level: "OPTIMAL", signals: { latency_ratio: 1, error_signal: 0, replay_signal: 0, skip_signal: 0, codeswitching_signal: 0 } },
    scaffolding
  );

  let updated = { ...scaffolding };
  if (baseResponse.actions.scaffolding_adjustments) {
    updated = { ...updated, ...baseResponse.actions.scaffolding_adjustments };
  }

  return {
    scaffolding: updated,
    load_level: String(baseResponse.load_level),
    recovery_inserted: !!baseResponse.actions.recovery_inserted,
    session_reduction: baseResponse.actions.session_reduction ?? 0,
  };
}

/**
 * Routes a single turn through the full pipeline.
 * Mirrors Section 12.3 Turn Routing:
 *  AI_AGENT → M04 delivery + comprehension gate
 *  USER     → M05 kinesthetic gate → M06 oral prep → output modality → M10 feedback
 */
export function routeTurn(input: {
  session: SessionState;
  turn: DialogueTurn;
  scaffolding: ScaffoldingConfig;
}): SessionLoopResult {
  const { session, turn, scaffolding } = input;

  if (turn.speaker === "AI_AGENT") {
    const { plan, gateResult } = deliverTurn(turn, scaffolding, session.replay_count);
    return {
      session,
      completed: false,
      turn_index: session.current_turn_index,
      load_index: session.cognitive_load_index,
      load_level: "OPTIMAL",
      delivery_plan: plan,
      comprehension_gate_action: gateResult.next_action,
    };
  }

  // USER turn
  // Step 1: Kinesthetic gate (TPR)
  let wordCardResult;
  if (turn.word_card_set && turn.word_card_set.length > 0) {
    wordCardResult = runWordCardTask(turn, scaffolding);
  }

  // Step 2: Oral preparation (Anti-Anxiety Protocol)
  const oralPrepPlan = runOralPreparation(turn, scaffolding, 1);

  // Step 3: Process a simulated transcript (production would come from STT)
  const transcript = turn.text_de;
  const processingResult = processOralOutput(transcript, turn);
  const performance: FeedbackTurnPerformance = {
    turn_id: `turn-${session.current_turn_index}`,
    response_latency_ms: 2400,
    errors_detected: processingResult.grammar_errors,
    l1_insertions: processingResult.l1_insertions,
    completion_method: "ORAL",
    scaffolding_used: true,
    lexical_score: processingResult.lexical.score,
    pronunciation_score: processingResult.pronunciation,
  };

  // Step 4: Immediate feedback (M10)
  const feedback = buildFeedback(performance, turn.text_de);

  // Step 5: Mastery updates (M06)
  const masteryUpdates = updateMasteryScores(turn, buildOralPerformanceRecord(performance.response_latency_ms, processingResult));

  const masteryPerformance: MasteryTurnPerformance = {
    turn_id: performance.turn_id,
    response_latency_ms: performance.response_latency_ms,
    errors_detected: performance.errors_detected.map((e) => ({
      timestamp: new Date().toISOString(),
      error_type: e.error_type,
      context_sentence: turn.text_de,
    })),
    l1_insertions: performance.l1_insertions,
    completion_method: performance.completion_method,
    scaffolding_used: performance.scaffolding_used,
  };

  const updatedSession: SessionState = {
    ...session,
    performance_log: [...session.performance_log, masteryPerformance],
    code_switch_count: session.code_switch_count + performance.l1_insertions.length,
  };

  return {
    session: updatedSession,
    completed: false,
    turn_index: session.current_turn_index,
    load_index: session.cognitive_load_index,
    load_level: "OPTIMAL",
    word_card_result: wordCardResult,
    oral_prep_plan: oralPrepPlan,
    performance,
    feedback,
    mastery_updates: masteryUpdates,
  };
}

export function advanceSessionLoop(input: SessionLoopInput): SessionLoopResult {
  const { session, scenario, current_scaffolding, average_processing_lag_ms, current_code_switch_rate, phase_expected_switch_rate } = input;

  // Cognitive load check before every turn (Section 12.3)
  const loadResult = computeSessionLoad(session, average_processing_lag_ms, current_code_switch_rate, phase_expected_switch_rate);
  const sessionWithLoad = { ...session, cognitive_load_index: loadResult.load_index };

  const loadResponse = applyLoadResponse(sessionWithLoad, current_scaffolding);

  if (loadResponse.recovery_inserted && sessionWithLoad.modality_chain_state !== "RECOVERY") {
    return {
      session: {
        ...sessionWithLoad,
        modality_chain_state: "RECOVERY",
        anxiety_events: sessionWithLoad.anxiety_events + 1,
      },
      completed: false,
      turn_index: sessionWithLoad.current_turn_index,
      load_index: loadResult.load_index,
      load_level: loadResponse.load_level,
    };
  }

  const currentTurn = scenario.dialogue_turns[sessionWithLoad.current_turn_index];
  if (!currentTurn) {
    return {
      session: { ...sessionWithLoad, modality_chain_state: "COMPLETED" },
      completed: true,
      turn_index: sessionWithLoad.current_turn_index,
      load_index: loadResult.load_index,
      load_level: loadResponse.load_level,
    };
  }

  const routed = routeTurn({
    session: sessionWithLoad,
    turn: currentTurn,
    scaffolding: loadResponse.scaffolding,
  });

  const nextIndex = sessionWithLoad.current_turn_index + 1;
  const completed = nextIndex >= scenario.dialogue_turns.length;

  return {
    session: {
      ...routed.session,
      current_turn_index: nextIndex,
      cognitive_load_index: loadResult.load_index,
      modality_chain_state: completed ? "COMPLETED" : "AUDITORY_VISUAL",
      current_scaffolding: loadResponse.scaffolding,
    },
    completed,
    turn_index: nextIndex,
    load_index: loadResult.load_index,
    load_level: loadResponse.load_level,
    comprehension_gate_action: routed.comprehension_gate_action,
    word_card_result: routed.word_card_result,
    oral_prep_plan: routed.oral_prep_plan,
    performance: routed.performance,
    feedback: routed.feedback,
    delivery_plan: routed.delivery_plan,
    mastery_updates: routed.mastery_updates,
  };
}

export function applyRecovery(input: { session: SessionState }): SessionState {
  return {
    ...input.session,
    modality_chain_state: "RECOVERY",
    anxiety_events: input.session.anxiety_events + 1,
  };
}

export function resumeAfterRecovery(input: { session: SessionState }): SessionState {
  return {
    ...input.session,
    modality_chain_state: "AUDITORY_VISUAL",
  };
}