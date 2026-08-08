import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { CardArrangement, WordCardAttempt, WordCardTaskResult, CompletionMethod } from "./types";

const MAX_ATTEMPTS = 3;
const GRAMMAR_HINT_DELAY_ATTEMPT = 2; // hints start after attempt 2 (i.e., on the second failure)

/**
 * Prepares the card arrangement for display based on scaffolding.
 * Returns a new array; never mutates input.
 */
export function prepareCardArrangement(
  cards: { word_de: string; grammatical_role: string; correct_position: number }[],
  scaffolding: ScaffoldingConfig
): { cards: { word_de: string; grammatical_role: string; correct_position: number }[]; arrangement: CardArrangement } {
  const cardsCopy = cards.map((c) => ({ ...c }));

  if (scaffolding.word_cards_presorted) {
    // Cluster by grammatical_role, then sort within each cluster by correct_position
    const clusters = new Map<string, typeof cardsCopy>();
    for (const card of cardsCopy) {
      const existing = clusters.get(card.grammatical_role) || [];
      existing.push(card);
      clusters.set(card.grammatical_role, existing);
    }
    const clustered: typeof cardsCopy = [];
    for (const [, group] of clusters) {
      group.sort((a, b) => a.correct_position - b.correct_position);
      clustered.push(...group);
    }
    return { cards: clustered, arrangement: "PRESORTED_CLUSTERS" };
  }

  // Fisher-Yates shuffle
  for (let i = cardsCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardsCopy[i], cardsCopy[j]] = [cardsCopy[j], cardsCopy[i]];
  }
  return { cards: cardsCopy, arrangement: "RANDOMIZED" };
}

/**
 * Evaluates a user's card arrangement against the correct positions.
 * Returns indices of correct and incorrect placements.
 */
export function evaluateArrangement(
  userArrangement: { word_de: string; correct_position: number }[],
  correctCards: { word_de: string; correct_position: number }[]
): { all_correct: boolean; correct_indices: number[]; incorrect_indices: number[] } {
  if (userArrangement.length !== correctCards.length) {
    return { all_correct: false, correct_indices: [], incorrect_indices: Array.from({ length: userArrangement.length }, (_, i) => i) };
  }

  const correctIndices: number[] = [];
  const incorrectIndices: number[] = [];

  for (let i = 0; i < userArrangement.length; i++) {
    const userPos = userArrangement[i].correct_position;
    const expectedPos = correctCards[i].correct_position;
    if (userPos === expectedPos) {
      correctIndices.push(i);
    } else {
      incorrectIndices.push(i);
    }
  }

  return { all_correct: incorrectIndices.length === 0, correct_indices: correctIndices, incorrect_indices: incorrectIndices };
}

/**
 * Builds grammar hint text for incorrect cards at a given attempt index.
 * Hints are progressively more specific.
 */
export function buildGrammarHint(
  incorrectCards: { word_de: string; grammatical_role: string; correct_position: number }[],
  attemptIndex: number
): string {
  if (incorrectCards.length === 0) return "";

  const roles = [...new Set(incorrectCards.map((c) => c.grammatical_role))];
  const roleList = roles.join(", ");

  if (attemptIndex === 1) {
    return `Remember: pay attention to ${roleList}.`;
  }
  if (attemptIndex >= 2) {
    return `Hint: the ${roleList} in this sentence goes in positions: ${incorrectCards.map((c) => c.correct_position).join(", ")}.`;
  }
  return "";
}

/**
 * Orchestrates the full word-card task with up to MAX_ATTEMPTS attempts.
 * Records each attempt's evaluation and returns the final task result.
 */
export function runWordCardTask(
  turn: DialogueTurn,
  scaffolding: ScaffoldingConfig,
  maxAttempts: number = MAX_ATTEMPTS
): WordCardTaskResult {
  const sourceCards = turn.word_card_set && turn.word_card_set.length > 0
    ? turn.word_card_set
    : buildFallbackCards(turn.text_de);

  const { cards: arrangedCards, arrangement } = prepareCardArrangement(sourceCards, scaffolding);
  const attemptsLog: WordCardAttempt[] = [];
  let completed = false;
  let completionMethod: CompletionMethod = "ABANDONED";
  let finalArrangement = arrangedCards;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Simulate user arrangement: in a real UI, this would come from drag-drop interaction.
    // For pure logic testing, we treat the current arrangement as the user's input.
    const userArrangement = finalArrangement.map((c) => ({ word_de: c.word_de, correct_position: c.correct_position }));
    const evaluation = evaluateArrangement(userArrangement, sourceCards);

    const feedbackHints: string[] = [];
    if (evaluation.incorrect_indices.length > 0 && attempt >= GRAMMAR_HINT_DELAY_ATTEMPT) {
      const incorrectCards = evaluation.incorrect_indices.map((i) => ({
        word_de: finalArrangement[i].word_de,
        grammatical_role: finalArrangement[i].grammatical_role,
        correct_position: finalArrangement[i].correct_position,
      }));
      feedbackHints.push(buildGrammarHint(incorrectCards, attempt));
    }

    attemptsLog.push({
      attempt_index: attempt,
      arrangement: finalArrangement.map((c) => ({ ...c })),
      correct_indices: evaluation.correct_indices,
      incorrect_indices: evaluation.incorrect_indices,
      feedback_hints: feedbackHints,
    });

    if (evaluation.all_correct) {
      completed = true;
      completionMethod = "SUCCESS";
      break;
    }

    if (attempt < maxAttempts) {
      // Partial correction: keep correct cards fixed, reshuffle incorrect ones
      const nextArrangement = finalArrangement.map((c) => ({ ...c }));
      const incorrectCards = evaluation.incorrect_indices.map((i) => nextArrangement[i]);
      // Remove incorrect cards
      for (let i = nextArrangement.length - 1; i >= 0; i--) {
        if (evaluation.incorrect_indices.includes(i)) {
          nextArrangement.splice(i, 1);
        }
      }
      // Shuffle incorrect cards and re-append
      for (let i = incorrectCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectCards[i], incorrectCards[j]] = [incorrectCards[j], incorrectCards[i]];
      }
      nextArrangement.push(...incorrectCards);
      finalArrangement = nextArrangement;
    }
  }

  if (!completed && attemptsLog.length >= maxAttempts) {
    completionMethod = "ASSISTED_COMPLETION";
  }

  return {
    task_type: "WORD_CARD",
    completed,
    attempts_used: attemptsLog.length,
    completion_method: completionMethod,
    word_card_set: finalArrangement.map((c) => ({ ...c })),
    attempts_log: attemptsLog,
  };
}

function buildFallbackCards(text: string): { word_de: string; grammatical_role: string; correct_position: number }[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.map((word, index) => ({
    word_de: word,
    grammatical_role: "UNKNOWN",
    correct_position: index + 1,
  }));
}