import { ReviewScheduleResult } from "./types";

const INTERVAL_RULES = [
  { maxMastery: 0.3, intervalDays: 0 },
  { maxMastery: 0.5, intervalDays: 1 },
  { maxMastery: 0.65, intervalDays: 3 },
  { maxMastery: 0.8, intervalDays: 7 },
  { maxMastery: 0.9, intervalDays: 14 },
  { maxMastery: 1.0, intervalDays: 30 },
];

export function scheduleNextReview(masteryScore: number): ReviewScheduleResult {
  const rule = INTERVAL_RULES.find((r) => masteryScore <= r.maxMastery) || INTERVAL_RULES[INTERVAL_RULES.length - 1];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + rule.intervalDays);
  nextReview.setHours(0, 0, 0, 0);

  return {
    item_id: "",
    item_type: "VOCABULARY",
    next_review_due: nextReview,
    interval_days: rule.intervalDays,
  };
}