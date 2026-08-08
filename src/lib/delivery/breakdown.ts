import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { AnalyticStep, BreakdownResult } from "./types";

const PAUSE_PER_WORD_MS = 1500;

export function buildAnalyticSteps(turn: DialogueTurn): AnalyticStep[] {
  if (!turn.annotated_parts || turn.annotated_parts.length === 0) {
    return [];
  }

  return turn.annotated_parts.map((part) => ({
    part_text: part.text,
    grammatical_role: part.grammatical_role,
    explanation: `[${part.grammatical_role}] ${part.text}`,
    pause_ms: PAUSE_PER_WORD_MS,
  }));
}

export function buildSyntheticReconstruction(turn: DialogueTurn, scaffolding: ScaffoldingConfig): BreakdownResult {
  const wordCardSet = turn.word_card_set && turn.word_card_set.length > 0
    ? [...turn.word_card_set]
    : buildFallbackWordCards(turn.text_de);

  if (scaffolding.word_cards_presorted) {
    wordCardSet.sort((a, b) => a.correct_position - b.correct_position);
  } else {
    for (let i = wordCardSet.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordCardSet[i], wordCardSet[j]] = [wordCardSet[j], wordCardSet[i]];
    }
  }

  return {
    analytic_steps: buildAnalyticSteps(turn),
    synthetic_word_cards: wordCardSet,
    synthetic_presorted: scaffolding.word_cards_presorted,
  };
}

function buildFallbackWordCards(text: string): { word_de: string; grammatical_role: string; correct_position: number }[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.map((word, index) => ({
    word_de: word,
    grammatical_role: "UNKNOWN",
    correct_position: index + 1,
  }));
}