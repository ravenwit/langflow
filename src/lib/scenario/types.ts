import { VocabularyItem, GrammarConcept, CefrLevel, InterestDomain, ContextTag } from "@/lib/mastery/types";

export interface WordCard {
  word_de: string;
  grammatical_role: string;
  correct_position: number;
}

export interface DialogueTurn {
  speaker: "AI_AGENT" | "USER";
  text_de: string;
  text_l1: string;
  audio_file_ref?: string | null;
  visual_cue_ref?: string | null;
  word_card_set?: WordCard[];
  annotated_parts?: SentencePart[];
}

export interface SentencePart {
  text: string;
  grammatical_role: string;
  concept_ids: string[];
}

export interface Scenario {
  scenario_id: string;
  generated_at: string;
  domain_tag: string;
  context_tag: string;
  difficulty_level: CefrLevel;
  target_grammar_concepts: string[];
  target_vocabulary: string[];
  scenario_premise: string;
  scenario_premise_l1: string;
  dialogue_turns: DialogueTurn[];
  review_concepts_embedded: string[];
}

export interface ScaffoldingConfig {
  show_l1_translation: boolean;
  show_grammar_labels: boolean;
  word_cards_presorted: boolean;
  oral_prep_time_seconds: number;
  codeswitching_invite_shown: boolean;
}

export interface GenerationContext {
  domain: InterestDomain;
  context: ContextTag;
  cefr_level: CefrLevel;
  target_grammar: GrammarConcept[];
  target_vocab: VocabularyItem[];
  new_vocab: VocabularyItem[];
  turn_count: number;
  month_phase: number;
  scaffolding: ScaffoldingConfig;
  review_concepts: GrammarConcept[];
  last_used_context?: string;
}

export interface LLMProvider {
  name: string;
  generateScenario(prompt: string): Promise<string>;
}