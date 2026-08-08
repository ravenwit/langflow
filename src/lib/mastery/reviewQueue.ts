import { VocabularyItem, GrammarConcept, CefrLevel } from "./types";
import { spacedRepetitionScheduler } from "./spacedRepetition";

export type ReviewItem = (VocabularyItem | GrammarConcept) & {
  item_type: "VOCABULARY" | "GRAMMAR";
  priority_tier: "OVERDUE" | "WEAK" | "CONSOLIDATING" | "MAINTENANCE";
};

export function buildReviewQueue(
  vocabulary: VocabularyItem[],
  grammar: GrammarConcept[],
  sessionTargetCount: number
): ReviewItem[] {
  const now = new Date();

  const classifyVocab = (item: VocabularyItem): ReviewItem["priority_tier"] => {
    const overdue = item.next_review_due ? new Date(item.next_review_due) <= now : false;
    if (overdue) return "OVERDUE";
    if (item.mastery_score < 0.5) return "WEAK";
    if (item.mastery_score < 0.8) return "CONSOLIDATING";
    return "MAINTENANCE";
  };

  const classifyGrammar = (item: GrammarConcept): ReviewItem["priority_tier"] => {
    const overdue = item.next_review_due ? new Date(item.next_review_due) <= now : false;
    if (overdue) return "OVERDUE";
    if (item.mastery_score < 0.5) return "WEAK";
    if (item.mastery_score < 0.8) return "CONSOLIDATING";
    return "MAINTENANCE";
  };

  const tierOrder: Record<ReviewItem["priority_tier"], number> = {
    OVERDUE: 0,
    WEAK: 1,
    CONSOLIDATING: 2,
    MAINTENANCE: 3,
  };

  const combined: ReviewItem[] = [
    ...vocabulary.map((v) => ({ ...v, item_type: "VOCABULARY" as const, priority_tier: classifyVocab(v) })),
    ...grammar.map((g) => ({ ...g, item_type: "GRAMMAR" as const, priority_tier: classifyGrammar(g) })),
  ];

  combined.sort((a, b) => {
    if (tierOrder[a.priority_tier] !== tierOrder[b.priority_tier]) {
      return tierOrder[a.priority_tier] - tierOrder[b.priority_tier];
    }
    // Within same tier: earlier next_review_due first
    const aDate = a.next_review_due ? new Date(a.next_review_due).getTime() : Infinity;
    const bDate = b.next_review_due ? new Date(b.next_review_due).getTime() : Infinity;
    return aDate - bDate;
  });

  const limits: Record<ReviewItem["priority_tier"], number> = {
    OVERDUE: Math.floor(sessionTargetCount * 0.5),
    WEAK: Math.floor(sessionTargetCount * 0.3),
    CONSOLIDATING: Math.floor(sessionTargetCount * 0.15),
    MAINTENANCE: Math.floor(sessionTargetCount * 0.05),
  };

  const counts: Record<ReviewItem["priority_tier"], number> = {
    OVERDUE: 0,
    WEAK: 0,
    CONSOLIDATING: 0,
    MAINTENANCE: 0,
  };

  const result: ReviewItem[] = [];
  for (const item of combined) {
    if (result.length >= sessionTargetCount) break;
    if (counts[item.priority_tier] < limits[item.priority_tier]) {
      counts[item.priority_tier] += 1;
      result.push(item);
    }
  }

  return result;
}

export function scheduleNextReview(item: { mastery_score: number; next_review_due?: string | null }): string | null {
  if (item.next_review_due) {
    // Preserve existing schedule if already set and future-dated
    const existing = new Date(item.next_review_due);
    if (!Number.isNaN(existing.getTime()) && existing > new Date()) {
      return item.next_review_due;
    }
  }
  const intervalDays = spacedRepetitionScheduler(item.mastery_score);
  if (intervalDays === 0) return null;
  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  return next.toISOString();
}