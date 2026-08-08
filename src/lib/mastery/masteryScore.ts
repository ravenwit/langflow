import { VocabularyItem, GrammarConcept, ErrorRecord, ErrorType } from "./types";

const ERROR_SEVERITY: Record<ErrorType, number> = {
  GENDER: 0.03,
  CASE: 0.04,
  CONJUGATION: 0.04,
  WORD_ORDER: 0.05,
  PRONUNCIATION: 0.02,
  OMISSION: 0.05,
};

export function exponentialDecay(base: number, decayRate: number, timeElapsedDays: number): number {
  return base * Math.exp(-decayRate * timeElapsedDays);
}

export function calculateMasteryScore(item: {
  correct_production_count: number;
  exposure_count: number;
  last_reviewed?: string | null;
  error_log: ErrorRecord[];
}): number {
  const productionRatio =
    item.exposure_count > 0 ? item.correct_production_count / item.exposure_count : 0;

  let recencyDecay = 0;
  if (item.last_reviewed) {
    const now = new Date();
    const lastReviewed = new Date(item.last_reviewed);
    const timeElapsedDays = Math.max(0, (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
    recencyDecay = exponentialDecay(1.0, 0.05, timeElapsedDays);
  }

  const recentErrors = item.error_log.slice(-10);
  let errorPenalty = 0;
  for (const error of recentErrors) {
    errorPenalty += ERROR_SEVERITY[error.error_type] || 0;
  }
  errorPenalty = Math.min(0.5, errorPenalty);

  let mastery = productionRatio * 0.6 + recencyDecay * 0.4 - errorPenalty;
  return Math.max(0, Math.min(1, mastery));
}

export function calculateVocabularyMasteryScore(item: VocabularyItem): number {
  return calculateMasteryScore(item);
}

export function calculateGrammarMasteryScore(item: { correct_production_count: number; exposure_count: number; last_reviewed?: string | null; error_log: ErrorRecord[] }): number {
  return calculateMasteryScore(item);
}