export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type WordClass =
  | "NOUN"
  | "VERB"
  | "ADJECTIVE"
  | "ADVERB"
  | "PREPOSITION"
  | "CONJUNCTION"
  | "ARTICLE"
  | "PRONOUN"
  | "PARTICLE";

export type ErrorType =
  | "GENDER"
  | "CASE"
  | "CONJUGATION"
  | "WORD_ORDER"
  | "PRONUNCIATION"
  | "OMISSION";

export interface MorphData {
  gender?: "DER" | "DIE" | "DAS";
  plural_form?: string;
  conjugation_class?: string;
  auxiliary?: "HABEN" | "SEIN";
  past_participle?: string;
  separable?: boolean;
  declension_class?: string;
}

export interface ErrorRecord {
  timestamp: string;
  error_type: ErrorType;
  context_sentence: string;
}

export interface VocabularyItem {
  id?: string;
  lemma_de: string;
  translations_l1: string[];
  word_class: WordClass;
  morph_data: MorphData;
  domain_tags: string[];
  cefr_level: CefrLevel;
  mastery_score: number;
  last_reviewed?: string | null;
  next_review_due?: string | null;
  exposure_count: number;
  correct_production_count: number;
  error_log: ErrorRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface GermanSentence {
  full_sentence_de: string;
  full_sentence_l1: string;
  annotated_parts: SentencePart[];
}

export interface SentencePart {
  text: string;
  grammatical_role: string;
  concept_ids: string[];
}

export interface GrammarConcept {
  concept_id: string;
  concept_label: string;
  cefr_level: CefrLevel;
  prerequisite_concepts: string[];
  mastery_score: number;
  last_reviewed?: string | null;
  next_review_due?: string | null;
  analytic_breakdown: string;
  synthetic_template: string;
  example_sentences: GermanSentence[];
  created_at?: string;
  updated_at?: string;
}

export interface CognitiveProfile {
  working_memory_load_tolerance?: "LOW" | "MEDIUM" | "HIGH";
  preferred_input_modality?: "VISUAL_DOMINANT" | "AUDITORY_DOMINANT" | "BALANCED";
  oral_production_comfort?: number;
  average_processing_lag_ms?: number;
  anxiety_signals_detected?: number;
  current_month_phase?: number;
}

export interface UserProfile {
  user_id: string;
  current_month_phase: number;
  cognitive_profile: CognitiveProfile;
  interest_domains: InterestDomain[];
  daily_contexts: ContextTag[];
  native_language: string;
  code_switch_frequency: number;
  session_log: SessionSummary[];
  total_sessions: number;
  total_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessionState {
  session_id: string;
  user_id: string;
  cognitive_load_index: number;
  new_items_introduced_this_session: number;
  created_at?: string;
  updated_at?: string;
}

export interface InterestDomain {
  domain_label: string;
  domain_weight: number;
  sub_topics: string[];
  vocabulary_anchors: string[];
}

export interface ContextTag {
  label: string;
}

export interface TurnPerformance {
  turn_id: string;
  response_latency_ms: number;
  errors_detected: ErrorRecord[];
  l1_insertions: string[];
  completion_method: "ORAL" | "STT" | "WORD_CARD" | "SKIPPED";
  scaffolding_used: boolean;
}

export interface SessionSummary {
  session_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  total_turns: number;
  mean_response_latency: number;
  error_count: number;
  code_switch_count: number;
  new_items_introduced: number;
  performance_log: TurnPerformance[];
  created_at?: string;
}

export const WORD_CLASSES: WordClass[] = [
  "NOUN",
  "VERB",
  "ADJECTIVE",
  "ADVERB",
  "PREPOSITION",
  "CONJUNCTION",
  "ARTICLE",
  "PRONOUN",
  "PARTICLE",
];

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const ERROR_TYPES: ErrorType[] = [
  "GENDER",
  "CASE",
  "CONJUGATION",
  "WORD_ORDER",
  "PRONUNCIATION",
  "OMISSION",
];