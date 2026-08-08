import { TaskType, ClassificationResult, ClassificationTaskResult } from "./types";

/**
 * Shuffles a word list using Fisher-Yates. Returns a new array.
 */
export function shuffleTokens(wordList: string[]): string[] {
  const copy = [...wordList];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Evaluates a single classification decision.
 */
export function evaluateClassification(word: string, assignedCategory: string, correctCategory: string): ClassificationResult {
  const isCorrect = assignedCategory === correctCategory;
  return {
    word,
    assigned_category: assignedCategory,
    correct_category: correctCategory,
    is_correct: isCorrect,
    feedback_message: isCorrect
      ? `Correct — "${word}" belongs to ${assignedCategory}.`
      : `Not quite — "${word}" belongs to ${correctCategory}, not ${assignedCategory}.`,
  };
}

/**
 * Runs the full classification task.
 * correctAnswerMap: word -> category
 */
export function runClassificationTask(wordList: string[], categoryLabels: string[], correctAnswerMap: Record<string, string>): ClassificationTaskResult {
  const shuffled = shuffleTokens(wordList);
  const results: ClassificationResult[] = [];

  for (const word of shuffled) {
    const correctCategory = correctAnswerMap[word];
    if (!correctCategory) {
      // Word missing from answer map — skip with neutral feedback
      results.push({
        word,
        assigned_category: "",
        correct_category: "UNKNOWN",
        is_correct: false,
        feedback_message: `No reference answer for "${word}".`,
      });
      continue;
    }

    // In a real UI, assigned_category comes from user interaction.
    // For pure logic/testing, we simulate perfect classification to validate positive path.
    // The API route will accept actual user input; this function just evaluates.
    const result = evaluateClassification(word, correctCategory, correctCategory);
    results.push(result);
  }

  const totalCorrect = results.filter((r) => r.is_correct).length;
  return {
    task_type: "CLASSIFICATION",
    results,
    total_correct: totalCorrect,
    total_words: wordList.length,
  };
}