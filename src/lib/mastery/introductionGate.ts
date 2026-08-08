import { CefrLevel } from "./types";

export interface IntroductionGateResult {
  introducible: boolean;
  reason: string;
}

export interface IntroductionGateContext {
  userMonthPhase: number; // 1-6
  cognitiveLoadIndex: number; // 0.0 - 1.0
  newItemsIntroducedThisSession: number;
}

const PHASE_CEILING_MAP: Record<number, CefrLevel> = {
  1: "A1",
  2: "A2",
  3: "A2",
  4: "B1",
  5: "B1",
  6: "B2",
};

const COGNITIVE_LOAD_ELEVATED_THRESHOLD = 0.7;
const NEW_ITEMS_SESSION_CAP = 3;
const PREREQUISITE_MASTERY_THRESHOLD = 0.7;

export function isItemIntroducible(
  candidateCefr: CefrLevel,
  prerequisiteMasteryScores: number[],
  context: IntroductionGateContext
): IntroductionGateResult {
  const phaseCeiling = PHASE_CEILING_MAP[context.userMonthPhase] ?? "A1";

  // CEFR ceiling check: candidate must not exceed ceiling by more than 1 level
  if (isCefrHigherThan(candidateCefr, phaseCeiling, 1)) {
    return {
      introducible: false,
      reason: `CEFR level too advanced: ${candidateCefr} exceeds phase ceiling ${phaseCeiling} by more than 1`,
    };
  }

  // Prerequisite mastery check
  for (const score of prerequisiteMasteryScores) {
    if (score < PREREQUISITE_MASTERY_THRESHOLD) {
      return {
        introducible: false,
        reason: "Prerequisites not mastered (score < 0.7)",
      };
    }
  }

  // Cognitive load check
  if (context.cognitiveLoadIndex >= COGNITIVE_LOAD_ELEVATED_THRESHOLD) {
    return {
      introducible: false,
      reason: "Cognitive load too high",
    };
  }

  // New item cap check
  if (context.newItemsIntroducedThisSession >= NEW_ITEMS_SESSION_CAP) {
    return {
      introducible: false,
      reason: "New item cap reached for session",
    };
  }

  return {
    introducible: true,
    reason: "OK",
  };
}

function isCefrHigherThan(level: CefrLevel, ceiling: CefrLevel, allowedDelta: number): boolean {
  const order: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const levelIndex = order.indexOf(level);
  const ceilingIndex = order.indexOf(ceiling);
  if (levelIndex === -1 || ceilingIndex === -1) return true;
  return levelIndex > ceilingIndex + allowedDelta;
}