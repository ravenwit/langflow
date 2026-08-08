import { DialogueTurn } from "@/lib/scenario/types";
import { OralPerformanceRecord, GrammarError } from "./types";

/**
 * Updates vocabulary mastery scores based on oral performance.
 * Increments exposure_count and correct_production_count where applicable.
 */
export function updateVocabularyMastery(turn: DialogueTurn, performance: OralPerformanceRecord): {
  word_updates: { word_de: string; exposure_increment: number; correct_production_increment: number; errors_added: number }[];
} {
  const wordSet = turn.word_card_set || [];
  const wordUpdates = wordSet.map((card) => {
    const wasCorrect = !performance.grammar_errors.some((e) => e.incorrect_form === card.word_de);
    const errorsAdded = wasCorrect ? 0 : 1;

    return {
      word_de: card.word_de,
      exposure_increment: 1,
      correct_production_increment: wasCorrect ? 1 : 0,
      errors_added: errorsAdded,
    };
  });

  return { word_updates: wordUpdates };
}

/**
 * Updates grammar concept mastery scores based on oral performance.
 * Positive signal (+0.03) for clean production, negative signal (-0.05) for errors.
 */
export function updateGrammarMastery(turn: DialogueTurn, performance: OralPerformanceRecord): {
  concept_updates: { concept_id: string; delta: number }[];
} {
  const conceptIds = turn.annotated_parts?.flatMap((p) => p.concept_ids) || [];
  const errorConceptIds = performance.grammar_errors
    .filter((e) => e.concept_id && e.concept_id.length > 0)
    .map((e) => e.concept_id);

  const seen = new Set<string>();
  const conceptUpdates: { concept_id: string; delta: number }[] = [];

  for (const conceptId of conceptIds) {
    if (seen.has(conceptId)) continue;
    seen.add(conceptId);

    const hasError = errorConceptIds.includes(conceptId);
    conceptUpdates.push({
      concept_id: conceptId,
      delta: hasError ? -0.05 : 0.03,
    });
  }

  return { concept_updates: conceptUpdates };
}

/**
 * Orchestrates mastery updates for both vocabulary and grammar.
 */
export function updateMasteryScores(turn: DialogueTurn, performance: OralPerformanceRecord) {
  const vocabUpdates = updateVocabularyMastery(turn, performance);
  const grammarUpdates = updateGrammarMastery(turn, performance);

  return {
    vocabulary: vocabUpdates.word_updates,
    grammar: grammarUpdates.concept_updates,
  };
}