export type ComprehensionChoice = "YES" | "REPLAY" | "EXPLAIN";
export type ModalityChainState = "AUDITORY_VISUAL" | "KINESTHETIC" | "ORAL_PREP" | "ORAL_OUTPUT" | "RECOVERY" | "COMPLETED";

export interface WordHighlightTiming {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface DeliveryChannelPlan {
  audio_ref: string | null;
  text_de: string;
  text_l1: string | null;
  show_l1_translation: boolean;
  show_grammar_labels: boolean;
  show_visual_cue: boolean;
  visual_cue_ref: string | null;
  word_highlight_timings: WordHighlightTiming[];
}

export interface DeliveryResult {
  comprehension_confirmed: boolean;
  replay_count: number;
  cognitive_load_escalation: boolean;
  next_action: "PROCEED" | "REPLAY" | "BREAKDOWN" | "RECOVERY";
}

export interface ComprehensionGateResult {
  next_action: "PROCEED" | "REPLAY" | "BREAKDOWN" | "RECOVERY";
  replay_count: number;
  cognitive_load_escalation: boolean;
}

export interface AnalyticStep {
  part_text: string;
  grammatical_role: string;
  explanation: string;
  pause_ms: number;
}

export interface BreakdownResult {
  analytic_steps: AnalyticStep[];
  synthetic_word_cards: {
    word_de: string;
    grammatical_role: string;
    correct_position: number;
  }[];
  synthetic_presorted: boolean;
}

export interface TurnDeliveryLog {
  log_id: string;
  turn_index: number;
  scenario_id: string;
  replay_count: number;
  comprehension_confirmed: boolean;
  cognitive_load_escalation: boolean;
  delivered_at: string;
}