import { SessionState, SessionPreview, SessionInitResult } from "./types";
import { ScaffoldingConfig } from "@/lib/scenario/types";
import { inferScaffolding } from "@/lib/scenario/selection";
import { buildReviewQueue, ReviewItem } from "@/lib/mastery/reviewQueue";
import { VocabularyItem, GrammarConcept, UserProfile } from "@/lib/mastery/types";

/**
 * Builds the scaffolding configuration from the user's cognitive profile.
 * Mirrors Module 03 Section 6.3.
 */
export function inferScaffoldingForUser(profile: UserProfile): ScaffoldingConfig {
  const oralComfort = profile.cognitive_profile?.oral_production_comfort ?? 0;
  const wmTolerance = profile.cognitive_profile?.working_memory_load_tolerance ?? "MEDIUM";
  return inferScaffolding(profile.current_month_phase, oralComfort, wmTolerance);
}

/**
 * Builds the session preview shown pre-session (Anti-Anxiety Protocol).
 */
export function buildSessionPreview(params: {
  scenario?: { domain_tag: string; context_tag: string; target_grammar_concepts: string[] };
  estimated_duration_minutes?: number;
}): SessionPreview {
  return {
    domain_tag: params.scenario?.domain_tag ?? "general",
    context_tag: params.scenario?.context_tag ?? "daily_conversation",
    target_grammar_concepts: params.scenario?.target_grammar_concepts ?? [],
    estimated_duration_minutes: params.estimated_duration_minutes ?? 15,
  };
}

/**
 * Builds the review queue from the user's mastery database.
 * Mirrors Module 02 Section 5.4.
 */
export function buildSessionReviewQueue(
  vocabulary: VocabularyItem[],
  grammar: GrammarConcept[],
  sessionTargetCount: number = 20
): ReviewItem[] {
  return buildReviewQueue(vocabulary, grammar, sessionTargetCount);
}

export function initializeSessionState(params: {
  session_id: string;
  user_id: string;
  profile?: UserProfile;
  scenario_id?: string;
  review_queue?: ReviewItem[];
  estimated_duration_minutes?: number;
  scaffolding?: ScaffoldingConfig;
}): SessionInitResult {
  const now = new Date();

  const scaffolding = params.scaffolding ?? (params.profile
    ? inferScaffoldingForUser(params.profile)
    : {
        show_l1_translation: true,
        show_grammar_labels: true,
        word_cards_presorted: true,
        oral_prep_time_seconds: 30,
        codeswitching_invite_shown: true,
      });

  const session: SessionState = {
    session_id: params.session_id,
    user_id: params.user_id,
    start_time: now,
    current_scenario_id: params.scenario_id,
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
  };

  const preview = buildSessionPreview({
    estimated_duration_minutes: params.estimated_duration_minutes,
  });

  return {
    session,
    preview,
    scaffolding: scaffolding as unknown as Record<string, unknown>,
  };
}