import { GrammarError } from "@/lib/oral/types";

export interface FeedbackPackage {
  primary_message: string;
  grammar_correction?: string;
  rule_reminder?: string;
  pronunciation_note?: string;
  codeswitching_note?: string[];
}

export interface TurnPerformance {
  turn_id: string;
  response_latency_ms: number;
  errors_detected: GrammarError[];
  l1_insertions: string[];
  completion_method: "ORAL" | "STT" | "WORD_CARD" | "SKIPPED";
  scaffolding_used: boolean;
  lexical_score?: number;
  pronunciation_score?: {
    score: number;
    problem_phonemes: { ipa: string; description: string }[];
  };
}

export interface FeedbackRequest {
  action: "DELIVER" | "BUILD";
  performance: TurnPerformance;
  turn_text_de?: string;
  turn_text_l1?: string;
  scaffolding_config?: {
    show_grammar_labels: boolean;
    show_l1_translation: boolean;
  };
}

export interface FeedbackResponse {
  feedback: FeedbackPackage;
  delivered: boolean;
}