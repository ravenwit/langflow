export type OralPrepPhase = "ADVANCE_NOTICE" | "SILENT_REHEARSAL" | "CODE_SWITCH_INVITE" | "MIC_ACTIVATION";

export interface OralPreparationPlan {
  prep_time_seconds: number;
  show_phonetic_guide: boolean;
  codeswitching_invite_shown: boolean;
  target_sentence: string;
  word_pronunciations: { word: string; phonetic: string }[];
}

export interface CodeSwitchSegment {
  l1_segment: string;
  german_equivalent: string;
  context_sentence: string;
}

export interface LexicalEvaluation {
  score: number;
  matched_words: string[];
  missing_words: string[];
}

export interface GrammarError {
  error_type: "GENDER" | "CASE" | "CONJUGATION" | "WORD_ORDER" | "PRONUNCIATION" | "OMISSION";
  incorrect_form: string;
  correct_form: string;
  concept_id: string;
  severity: "CRITICAL" | "MODERATE" | "MINOR";
}

export interface PronunciationEvaluation {
  score: number;
  problem_phonemes: { ipa: string; description: string }[];
}

export interface OralPerformanceRecord {
  response_latency_ms: number;
  lexical_score: number;
  grammar_errors: GrammarError[];
  pronunciation_score: PronunciationEvaluation;
  l1_insertions: string[];
  completion_method: "ORAL" | "STT" | "WORD_CARD" | "SKIPPED";
}