import { describe, it, expect } from "vitest";
import { initializeSessionState, inferScaffoldingForUser, buildSessionReviewQueue } from "@/lib/orchestrator/sessionInit";
import { advanceSessionLoop, routeTurn, applyRecovery, resumeAfterRecovery, computeSessionLoad } from "@/lib/orchestrator/sessionLoop";
import { buildSessionSummary, closeSession } from "@/lib/orchestrator/sessionClose";
import { SessionState } from "@/lib/orchestrator/types";
import { Scenario, ScaffoldingConfig } from "@/lib/scenario/types";
import { UserProfile } from "@/lib/mastery/types";

const scaffolding: ScaffoldingConfig = {
  show_l1_translation: true,
  show_grammar_labels: true,
  word_cards_presorted: true,
  oral_prep_time_seconds: 30,
  codeswitching_invite_shown: true,
};

const scenario: Scenario = {
  scenario_id: "scenario-1",
  generated_at: new Date().toISOString(),
  domain_tag: "computational_physics",
  context_tag: "university_collaboration",
  difficulty_level: "A1",
  target_grammar_concepts: [],
  target_vocabulary: [],
  review_concepts_embedded: [],
  scenario_premise: "Du bist in einem Labor.",
  scenario_premise_l1: "You are in a lab.",
  dialogue_turns: [
    {
      speaker: "AI_AGENT",
      text_de: "Guten Morgen! Wie geht es dir?",
      text_l1: "Good morning! How are you?",
      word_card_set: [
        { word_de: "Guten", grammatical_role: "ADJ", correct_position: 1 },
        { word_de: "Morgen", grammatical_role: "NOUN", correct_position: 2 },
      ],
    },
    {
      speaker: "USER",
      text_de: "Mir geht es gut, danke!",
      text_l1: "I'm doing well, thanks!",
      word_card_set: [
        { word_de: "Mir", grammatical_role: "PRON", correct_position: 1 },
        { word_de: "geht", grammatical_role: "VERB", correct_position: 2 },
        { word_de: "gut", grammatical_role: "ADJ", correct_position: 4 },
      ],
    },
    {
      speaker: "AI_AGENT",
      text_de: "Das freut mich! Was machst du heute?",
      text_l1: "That's great! What are you doing today?",
    },
  ],
};

function makeProfile(): UserProfile {
  return {
    user_id: "user-1",
    current_month_phase: 1,
    cognitive_profile: {
      working_memory_load_tolerance: "MEDIUM",
      oral_production_comfort: 0.2,
      average_processing_lag_ms: 2400,
      anxiety_signals_detected: 0,
      current_month_phase: 1,
    },
    interest_domains: [
      { domain_label: "computational_physics", domain_weight: 1.0, sub_topics: ["quantum"], vocabulary_anchors: [] },
    ],
    daily_contexts: [{ label: "university_collaboration" }],
    native_language: "English",
    code_switch_frequency: 0,
    session_log: [],
    total_sessions: 0,
    total_minutes: 0,
  };
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    session_id: "session-1",
    user_id: "user-1",
    start_time: new Date(),
    current_turn_index: 0,
    cognitive_load_index: 0.4,
    modality_chain_state: "AUDITORY_VISUAL",
    code_switch_count: 0,
    anxiety_events: 0,
    replay_count: 0,
    skipped_turns: 0,
    new_items_introduced: 0,
    performance_log: [],
    new_items_introduced_this_session: 0,
    ...overrides,
  };
}

describe("initializeSessionState", () => {
  it("initializes with default scaffolding when no profile", () => {
    const result = initializeSessionState({ session_id: "s1", user_id: "u1" });
    expect(result.session.modality_chain_state).toBe("AUDITORY_VISUAL");
    expect(result.session.cognitive_load_index).toBe(0.4);
    expect(result.session.performance_log).toEqual([]);
    expect(result.preview.estimated_duration_minutes).toBe(15);
  });

  it("infers scaffolding from user profile (month phase 1)", () => {
    const result = initializeSessionState({ session_id: "s1", user_id: "u1", profile: makeProfile() });
    const s = result.scaffolding as unknown as ScaffoldingConfig;
    expect(s.show_l1_translation).toBe(true);
    expect(s.word_cards_presorted).toBe(true);
    expect(s.oral_prep_time_seconds).toBe(30);
  });

  it("infers scaffolding for late phase (reduced support)", () => {
    const lateProfile = { ...makeProfile(), current_month_phase: 6, cognitive_profile: { ...makeProfile().cognitive_profile, oral_production_comfort: 0.8, working_memory_load_tolerance: "HIGH" as const } };
    const result = initializeSessionState({ session_id: "s1", user_id: "u1", profile: lateProfile });
    const s = result.scaffolding as unknown as ScaffoldingConfig;
    expect(s.show_l1_translation).toBe(false);
    expect(s.word_cards_presorted).toBe(false);
    expect(s.oral_prep_time_seconds).toBe(10);
  });
});

describe("inferScaffoldingForUser", () => {
  it("maps profile fields to scaffolding config", () => {
    const s = inferScaffoldingForUser(makeProfile());
    expect(s.show_l1_translation).toBe(true);
  });
});

describe("buildSessionReviewQueue", () => {
  it("returns empty queue when no items exist", () => {
    expect(buildSessionReviewQueue([], [])).toEqual([]);
  });
});

describe("routeTurn", () => {
  it("routes AI_AGENT turns through delivery with comprehension gate", () => {
    const session = makeSession();
    const result = routeTurn({
      session,
      turn: scenario.dialogue_turns[0],
      scaffolding,
    });
    expect(result.delivery_plan).toBeDefined();
    expect(result.delivery_plan!.text_de).toBe("Guten Morgen! Wie geht es dir?");
    expect(result.comprehension_gate_action).toBe("PROCEED");
    expect(result.word_card_result).toBeUndefined();
  });

  it("routes USER turns through kinesthetic, oral prep, and feedback", () => {
    const session = makeSession();
    const result = routeTurn({
      session,
      turn: scenario.dialogue_turns[1],
      scaffolding,
    });
    expect(result.word_card_result).toBeDefined();
    expect(result.oral_prep_plan).toBeDefined();
    expect(result.feedback).toBeDefined();
    expect(result.performance).toBeDefined();
    expect(result.session.performance_log).toHaveLength(1);
  });
});

describe("advanceSessionLoop", () => {
  it("advances through all scenario turns and completes", () => {
    let session = makeSession();
    let result;
    for (let i = 0; i < scenario.dialogue_turns.length; i++) {
      result = advanceSessionLoop({
        session,
        scenario,
        current_scaffolding: scaffolding,
        average_processing_lag_ms: 2400,
        current_code_switch_rate: 0,
        phase_expected_switch_rate: 0.3,
      });
      session = result.session;
    }
    expect(result!.completed).toBe(true);
    expect(session.modality_chain_state).toBe("COMPLETED");
  });

  it("injects recovery when cognitive load is critical", () => {
    const criticalSession = makeSession({
      performance_log: [
        { turn_id: "t1", response_latency_ms: 8000, errors_detected: [], l1_insertions: [], completion_method: "ORAL", scaffolding_used: true },
        { turn_id: "t2", response_latency_ms: 8000, errors_detected: [], l1_insertions: [], completion_method: "ORAL", scaffolding_used: true },
      ],
      replay_count: 5,
      skipped_turns: 3,
    });
    const result = advanceSessionLoop({
      session: criticalSession,
      scenario,
      current_scaffolding: scaffolding,
      average_processing_lag_ms: 2400,
      current_code_switch_rate: 0.4,
      phase_expected_switch_rate: 0.3,
    });
    expect(result.session.modality_chain_state).toBe("RECOVERY");
    expect(result.session.anxiety_events).toBeGreaterThan(0);
  });
});

describe("computeSessionLoad", () => {
  it("returns optimal for fast clean performance", () => {
    const session = makeSession({
      performance_log: [
        { turn_id: "t1", response_latency_ms: 2000, errors_detected: [], l1_insertions: [], completion_method: "ORAL", scaffolding_used: true },
      ],
    });
    const load = computeSessionLoad(session, 2400, 0, 0.3);
    expect(load.load_index).toBeLessThan(0.6);
  });
});

describe("applyRecovery / resumeAfterRecovery", () => {
  it("sets recovery state and increments anxiety events", () => {
    const session = makeSession();
    const recovered = applyRecovery({ session });
    expect(recovered.modality_chain_state).toBe("RECOVERY");
    expect(recovered.anxiety_events).toBe(1);
  });

  it("resumes back to AUDITORY_VISUAL", () => {
    const recovered = makeSession({ modality_chain_state: "RECOVERY" });
    const resumed = resumeAfterRecovery({ session: recovered });
    expect(resumed.modality_chain_state).toBe("AUDITORY_VISUAL");
  });
});

describe("buildSessionSummary / closeSession", () => {
  it("computes real metrics from performance log", () => {
    const session = makeSession({
      current_turn_index: 2,
      code_switch_count: 1,
      performance_log: [
        { turn_id: "t1", response_latency_ms: 2000, errors_detected: [], l1_insertions: ["book"], completion_method: "ORAL", scaffolding_used: true },
        { turn_id: "t2", response_latency_ms: 3000, errors_detected: [], l1_insertions: [], completion_method: "ORAL", scaffolding_used: true },
      ],
    });
    const summary = buildSessionSummary(session);
    expect(summary.total_turns).toBe(2);
    expect(summary.mean_response_latency_ms).toBe(2500);
    expect(summary.code_switch_count).toBe(1);
    expect(summary.mastery_improvements).toBe(2);
  });

  it("handles empty performance log with zeros", () => {
    const session = makeSession();
    const summary = buildSessionSummary(session);
    expect(summary.mean_response_latency_ms).toBe(0);
    expect(summary.error_count).toBe(0);
  });

  it("marks session completed and sets end time", () => {
    const session = makeSession();
    const closed = closeSession(session);
    expect(closed.modality_chain_state).toBe("COMPLETED");
    expect(closed.end_time).toBeInstanceOf(Date);
  });
});