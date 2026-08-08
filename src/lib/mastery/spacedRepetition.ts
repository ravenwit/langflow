export function spacedRepetitionScheduler(masteryScore: number): number {
  // Returns interval_days based on mastery score.
  // Derived from SM-2 logic adapted to mastery_score instead of explicit user ratings.
  if (masteryScore < 0.3) return 0;      // Review again same session or next
  if (masteryScore < 0.5) return 1;
  if (masteryScore < 0.65) return 3;
  if (masteryScore < 0.8) return 7;
  if (masteryScore < 0.9) return 14;
  return 30;                             // Near-mastered: monthly maintenance
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function computeNextReviewDue(masteryScore: number, from: Date = new Date()): Date {
  return addDays(from, spacedRepetitionScheduler(masteryScore));
}