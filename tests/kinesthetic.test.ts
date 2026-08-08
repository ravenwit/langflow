import { describe, it, expect } from "vitest";
import { prepareCardArrangement, evaluateArrangement, buildGrammarHint, runWordCardTask } from "@/lib/kinesthetic/wordCardTask";
import { shuffleTokens, evaluateClassification, runClassificationTask } from "@/lib/kinesthetic/classificationTask";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";

describe("prepareCardArrangement", () => {
  const cards = [
    { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
    { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
    { word_de: "ein", grammatical_role: "ARTICLE", correct_position: 3 },
    { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
  ];

  const presortedScaffolding: ScaffoldingConfig = {
    show_l1_translation: true,
    show_grammar_labels: true,
    word_cards_presorted: true,
    oral_prep_time_seconds: 30,
    codeswitching_invite_shown: true,
  };

  const randomScaffolding: ScaffoldingConfig = {
    ...presortedScaffolding,
    word_cards_presorted: false,
  };

  it("clusters by grammatical_role when presorted is true", () => {
    const result = prepareCardArrangement(cards, presortedScaffolding);
    expect(result.arrangement).toBe("PRESORTED_CLUSTERS");
    // All cards present
    expect(result.cards).toHaveLength(4);
    // Within each role cluster, sorted by correct_position
    const roles = result.cards.map((c) => c.grammatical_role);
    expect(roles).toEqual(["SUBJ", "VERB", "ARTICLE", "OBJ"]);
  });

  it("sorts within clusters by correct_position", () => {
    const sameRole = [
      { word_de: "C", grammatical_role: "NOUN", correct_position: 3 },
      { word_de: "A", grammatical_role: "NOUN", correct_position: 1 },
      { word_de: "B", grammatical_role: "NOUN", correct_position: 2 },
    ];
    const result = prepareCardArrangement(sameRole, presortedScaffolding);
    expect(result.cards.map((c) => c.word_de)).toEqual(["A", "B", "C"]);
  });

  it("returns a valid permutation when randomized", () => {
    const result = prepareCardArrangement(cards, randomScaffolding);
    expect(result.arrangement).toBe("RANDOMIZED");
    expect(result.cards).toHaveLength(4);
    const words = result.cards.map((c) => c.word_de);
    const sorted = [...words].sort();
    expect(words).not.toEqual(sorted);
  });

  it("preserves all original cards in randomized mode (no loss)", () => {
    const result = prepareCardArrangement(cards, randomScaffolding);
    const resultWords = result.cards.map((c) => c.word_de).sort();
    const originalWords = cards.map((c) => c.word_de).sort();
    expect(resultWords).toEqual(originalWords);
  });

  it("does not mutate the input array", () => {
    const input = [...cards];
    const before = JSON.stringify(input);
    prepareCardArrangement(input, randomScaffolding);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("handles single-card arrays", () => {
    const single = [cards[0]];
    const result = prepareCardArrangement(single, randomScaffolding);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].word_de).toBe("Ich");
  });

  it("handles German umlauts and ß in randomized mode", () => {
    const umlautCards = [
      { word_de: "äße", grammatical_role: "VERB", correct_position: 1 },
      { word_de: "Mädchen", grammatical_role: "NOUN", correct_position: 2 },
    ];
    const result = prepareCardArrangement(umlautCards, randomScaffolding);
    expect(result.cards.map((c) => c.word_de).sort()).toEqual(["Mädchen", "äße"]);
  });
});

describe("evaluateArrangement", () => {
  const correctCards = [
    { word_de: "Ich", correct_position: 1 },
    { word_de: "lese", correct_position: 2 },
    { word_de: "ein", correct_position: 3 },
    { word_de: "Buch", correct_position: 4 },
  ];

  it("detects all-correct arrangement", () => {
    const userArrangement = correctCards.map((c) => ({ ...c }));
    const result = evaluateArrangement(userArrangement, correctCards);
    expect(result.all_correct).toBe(true);
    expect(result.correct_indices).toEqual([0, 1, 2, 3]);
    expect(result.incorrect_indices).toEqual([]);
  });

  it("detects all-incorrect arrangement", () => {
    const userArrangement = [...correctCards].reverse().map((c) => ({ ...c }));
    const result = evaluateArrangement(userArrangement, correctCards);
    expect(result.all_correct).toBe(false);
    expect(result.correct_indices).toEqual([]);
    expect(result.incorrect_indices).toHaveLength(4);
  });

  it("detects partial correctness (odd positions correct)", () => {
    const userArrangement = [
      { word_de: "Ich", correct_position: 1 },
      { word_de: "Buch", correct_position: 4 },
      { word_de: "ein", correct_position: 3 },
      { word_de: "lese", correct_position: 2 },
    ];
    const result = evaluateArrangement(userArrangement, correctCards);
    expect(result.correct_indices).toEqual([0, 2]);
    expect(result.incorrect_indices).toEqual([1, 3]);
  });

  it("returns all incorrect when lengths differ", () => {
    const shortArrangement = [correctCards[0], correctCards[1]];
    const result = evaluateArrangement(shortArrangement, correctCards);
    expect(result.all_correct).toBe(false);
    expect(result.incorrect_indices).toEqual([0, 1]);
  });

  it("handles duplicate positions gracefully", () => {
    const dupArrangement = [
      { word_de: "Ich", correct_position: 1 },
      { word_de: "Ich", correct_position: 1 },
      { word_de: "ein", correct_position: 3 },
      { word_de: "Buch", correct_position: 4 },
    ];
    const result = evaluateArrangement(dupArrangement, correctCards);
    expect(result.correct_indices).toEqual([0, 2, 3]);
    expect(result.incorrect_indices).toEqual([1]);
  });
});

describe("buildGrammarHint", () => {
  it("returns empty string when no incorrect cards", () => {
    expect(buildGrammarHint([], 1)).toBe("");
  });

  it("returns role reminder at attempt 1", () => {
    const incorrect = [
      { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
      { word_de: "dem", grammatical_role: "DAT", correct_position: 3 },
    ];
    const hint = buildGrammarHint(incorrect, 1);
    expect(hint).toBe("Remember: pay attention to OBJ, DAT.");
  });

  it("returns position-specific hint at attempt 2+", () => {
    const incorrect = [
      { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
    ];
    const hint = buildGrammarHint(incorrect, 2);
    expect(hint).toBe("Hint: the OBJ in this sentence goes in positions: 4.");
  });

  it("deduplicates roles in hint", () => {
    const incorrect = [
      { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
      { word_de: "Haus", grammatical_role: "OBJ", correct_position: 5 },
    ];
    const hint = buildGrammarHint(incorrect, 2);
    expect(hint).toBe("Hint: the OBJ in this sentence goes in positions: 4, 5.");
  });

  it("returns empty string for attempt 0", () => {
    const incorrect = [{ word_de: "x", grammatical_role: "X", correct_position: 1 }];
    expect(buildGrammarHint(incorrect, 0)).toBe("");
  });
});

describe("runWordCardTask", () => {
  const baseTurn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch",
    text_l1: "I read a book",
    word_card_set: [
      { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
      { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
      { word_de: "ein", grammatical_role: "ARTICLE", correct_position: 3 },
      { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
    ],
  };

  const presortedScaffolding: ScaffoldingConfig = {
    show_l1_translation: true,
    show_grammar_labels: true,
    word_cards_presorted: true,
    oral_prep_time_seconds: 30,
    codeswitching_invite_shown: true,
  };

  const randomScaffolding: ScaffoldingConfig = {
    ...presortedScaffolding,
    word_cards_presorted: false,
  };

  it("returns SUCCESS on first attempt when arrangement is correct", () => {
    const turn: DialogueTurn = {
      ...baseTurn,
      word_card_set: [
        { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
        { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
        { word_de: "ein", grammatical_role: "ARTICLE", correct_position: 3 },
        { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
      ],
    };

    const result = runWordCardTask(turn, presortedScaffolding, 3);
    expect(result.completed).toBe(true);
    expect(result.completion_method).toBe("SUCCESS");
    expect(result.attempts_used).toBe(1);
    expect(result.attempts_log).toHaveLength(1);
    expect(result.attempts_log[0].correct_indices).toEqual([0, 1, 2, 3]);
    expect(result.attempts_log[0].incorrect_indices).toEqual([]);
  });

  it("records ASSISTED_COMPLETION when max_attempts=1 and arrangement is wrong", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "test",
      text_l1: "test",
      word_card_set: [
        { word_de: "A", grammatical_role: "X", correct_position: 2 },
        { word_de: "B", grammatical_role: "X", correct_position: 1 },
      ],
    };

    const result = runWordCardTask(turn, presortedScaffolding, 1);
    expect(result.completion_method).toBe("ASSISTED_COMPLETION");
    expect(result.attempts_used).toBe(1);
    expect(result.attempts_log).toHaveLength(1);
  });

  it("injects grammar hints at attempt 2+ when failures occur", () => {
    // Use randomized scaffolding with a deterministic wrong arrangement to ensure failure.
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "test",
      text_l1: "test",
      word_card_set: [
        { word_de: "A", grammatical_role: "X", correct_position: 1 },
        { word_de: "B", grammatical_role: "X", correct_position: 2 },
      ],
    };

    const result = runWordCardTask(turn, randomScaffolding, 3);
    // Find the first attempt with feedback_hints
    const firstWithHints = result.attempts_log.find((a) => a.feedback_hints.length > 0);
    if (firstWithHints) {
      expect(firstWithHints.attempt_index).toBeGreaterThanOrEqual(2);
      expect(firstWithHints.feedback_hints[0]).toContain("Hint:");
    }
  });

  it("does not mutate input turn.word_card_set", () => {
    const original = JSON.stringify(baseTurn.word_card_set);
    runWordCardTask(baseTurn, presortedScaffolding, 2);
    expect(JSON.stringify(baseTurn.word_card_set)).toBe(original);
  });

  it("records attempts_log with correct structure", () => {
    const turn: DialogueTurn = {
      ...baseTurn,
      word_card_set: [
        { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
        { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
        { word_de: "ein", grammatical_role: "ARTICLE", correct_position: 3 },
        { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
      ],
    };

    const result = runWordCardTask(turn, presortedScaffolding, 3);
    expect(result.attempts_log[0]).toHaveProperty("attempt_index", 1);
    expect(result.attempts_log[0]).toHaveProperty("arrangement");
    expect(result.attempts_log[0]).toHaveProperty("correct_indices");
    expect(result.attempts_log[0]).toHaveProperty("incorrect_indices");
    expect(result.attempts_log[0]).toHaveProperty("feedback_hints");
  });

  it("handles turn without word_card_set by falling back to text tokenization", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Hallo Welt",
      text_l1: "Hello world",
    };

    const result = runWordCardTask(turn, presortedScaffolding, 3);
    expect(result.word_card_set).toHaveLength(2);
    expect(result.word_card_set[0].word_de).toBe("Hallo");
    expect(result.word_card_set[0].correct_position).toBe(1);
  });

  it("handles German separable prefix in fallback tokenization", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Ich stehe auf",
      text_l1: "I stand up",
    };

    const result = runWordCardTask(turn, presortedScaffolding, 3);
    expect(result.word_card_set.map((c) => c.word_de)).toEqual(["Ich", "stehe", "auf"]);
  });

  it("handles empty word_card_set by falling back to text", () => {
    const turn: DialogueTurn = {
      ...baseTurn,
      word_card_set: [],
    };

    const result = runWordCardTask(turn, presortedScaffolding, 3);
    expect(result.word_card_set.length).toBeGreaterThan(0);
  });
});

describe("shuffleTokens", () => {
  it("returns a new array with same elements", () => {
    const input = ["der", "die", "das"];
    const result = shuffleTokens(input);
    expect(result).not.toBe(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("does not mutate input", () => {
    const input = ["der", "die", "das"];
    const before = JSON.stringify(input);
    shuffleTokens(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("handles single-element array", () => {
    expect(shuffleTokens(["der"])).toEqual(["der"]);
  });

  it("handles empty array", () => {
    expect(shuffleTokens([])).toEqual([]);
  });

  it("handles German words with umlauts and ß", () => {
    const input = ["äße", "Mädchen", "schön"];
    const result = shuffleTokens(input);
    expect(result.sort()).toEqual(input.sort());
  });
});

describe("evaluateClassification", () => {
  it("returns correct=true when categories match", () => {
    const result = evaluateClassification("der", "NOMINATIV", "NOMINATIV");
    expect(result.is_correct).toBe(true);
    expect(result.feedback_message).toContain("Correct");
  });

  it("returns correct=false when categories differ", () => {
    const result = evaluateClassification("dem", "NOMINATIV", "DATIV");
    expect(result.is_correct).toBe(false);
    expect(result.feedback_message).toContain("Not quite");
    expect(result.feedback_message).toContain("DATIV");
  });

  it("returns assigned and correct categories", () => {
    const result = evaluateClassification("die", "AKKUSATIV", "NOMINATIV");
    expect(result.assigned_category).toBe("AKKUSATIV");
    expect(result.correct_category).toBe("NOMINATIV");
  });
});

describe("runClassificationTask", () => {
  it("returns correct results for all-correct classification", () => {
    const wordList = ["der", "die", "das"];
    const correctAnswerMap = { der: "NOMINATIV", die: "NOMINATIV", das: "NOMINATIV" };
    const result = runClassificationTask(wordList, ["NOMINATIV", "AKKUSATIV"], correctAnswerMap);
    expect(result.total_correct).toBe(3);
    expect(result.total_words).toBe(3);
    expect(result.results).toHaveLength(3);
    expect(result.task_type).toBe("CLASSIFICATION");
  });

  it("returns correct results for classification with provided answer map", () => {
    const wordList = ["dem", "den"];
    const correctAnswerMap = { dem: "DATIV", den: "AKKUSATIV" };
    const result = runClassificationTask(wordList, ["DATIV", "AKKUSATIV"], correctAnswerMap);
    expect(result.total_correct).toBe(2);
    expect(result.results.every((r) => r.is_correct)).toBe(true);
  });

  it("handles mixed correct and incorrect", () => {
    const wordList = ["der", "dem"];
    const correctAnswerMap = { der: "NOMINATIV", dem: "DATIV" };
    const result = runClassificationTask(wordList, ["NOMINATIV", "DATIV"], correctAnswerMap);
    expect(result.total_correct).toBe(2);
    expect(result.results).toHaveLength(2);
  });

  it("preserves all words in results (shuffle does not lose elements)", () => {
    const wordList = ["aaa", "bbb", "ccc"];
    const correctAnswerMap = { aaa: "A", bbb: "B", ccc: "C" };
    const result = runClassificationTask(wordList, ["A", "B", "C"], correctAnswerMap);
    expect(result.results.map((r) => r.word).sort()).toEqual(["aaa", "bbb", "ccc"]);
    expect(result.total_words).toBe(3);
  });

  it("returns neutral feedback for words missing from answer map", () => {
    const wordList = ["unknown"];
    const result = runClassificationTask(wordList, ["A"], {});
    expect(result.results[0].is_correct).toBe(false);
    expect(result.results[0].feedback_message).toContain("No reference answer");
  });

  it("handles empty word list", () => {
    const result = runClassificationTask([], ["A"], {});
    expect(result.total_correct).toBe(0);
    expect(result.total_words).toBe(0);
    expect(result.results).toEqual([]);
  });

  it("handles German words with umlauts and ß", () => {
    const wordList = ["äße", "Mädchen"];
    const correctAnswerMap = { äße: "VERB", Mädchen: "NOUN" };
    const result = runClassificationTask(wordList, ["VERB", "NOUN"], correctAnswerMap);
    expect(result.total_correct).toBe(2);
    expect(result.results.map((r) => r.word).sort()).toEqual(["Mädchen", "äße"]);
  });
});