import { describe, it, expect } from "vitest";
import { buildOralPreparationPlan, runOralPreparation } from "@/lib/oral/preparation";
import { detectCodeSwitches, resolveCodeSwitch, evaluateLexicalMatch, evaluateGrammar, evaluatePronunciation, processOralOutput, buildOralPerformanceRecord } from "@/lib/oral/processing";
import { updateVocabularyMastery, updateGrammarMastery, updateMasteryScores } from "@/lib/oral/masteryUpdate";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";

describe("buildOralPreparationPlan", () => {
  const turn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch",
    text_l1: "I read a book",
  };

  const scaffolding: ScaffoldingConfig = {
    show_l1_translation: true,
    show_grammar_labels: true,
    word_cards_presorted: true,
    oral_prep_time_seconds: 30,
    codeswitching_invite_shown: true,
  };

  it("returns prep time from scaffolding", () => {
    const plan = buildOralPreparationPlan(turn, scaffolding, 2);
    expect(plan.prep_time_seconds).toBe(30);
  });

  it("shows phonetic guide for month phases <= 3", () => {
    expect(buildOralPreparationPlan(turn, scaffolding, 1).show_phonetic_guide).toBe(true);
    expect(buildOralPreparationPlan(turn, scaffolding, 3).show_phonetic_guide).toBe(true);
    expect(buildOralPreparationPlan(turn, scaffolding, 4).show_phonetic_guide).toBe(false);
  });

  it("passes through codeswitching_invite_shown", () => {
    const plan = buildOralPreparationPlan(turn, scaffolding, 2);
    expect(plan.codeswitching_invite_shown).toBe(true);
  });

  it("generates word pronunciations for each word", () => {
    const plan = buildOralPreparationPlan(turn, scaffolding, 2);
    expect(plan.word_pronunciations).toHaveLength(4);
    expect(plan.word_pronunciations[0].word).toBe("Ich");
    expect(plan.word_pronunciations[0].phonetic.length).toBeGreaterThan(0);
  });

  it("target_sentence matches turn.text_de", () => {
    const plan = buildOralPreparationPlan(turn, scaffolding, 2);
    expect(plan.target_sentence).toBe("Ich lese ein Buch");
  });
});

describe("detectCodeSwitches", () => {
  it("returns empty array for pure German", () => {
    const result = detectCodeSwitches("Ich lese ein Buch");
    expect(result).toEqual([]);
  });

  it("returns L1 tokens not matching German indicators", () => {
    const result = detectCodeSwitches("the Ich lese book");
    expect(result).toContain("the");
    expect(result).toContain("book");
    expect(result).not.toContain("Ich");
  });

  it("returns empty for empty transcript", () => {
    expect(detectCodeSwitches("")).toEqual([]);
  });

  it("is case-insensitive", () => {
    const result = detectCodeSwitches("THE Ich lese BOOK");
    expect(result).toContain("THE");
    expect(result).toContain("BOOK");
  });
});

describe("resolveCodeSwitch", () => {
  it("resolves common L1 words to German", () => {
    expect(resolveCodeSwitch("hello", "")).toBe("hallo");
    expect(resolveCodeSwitch("book", "")).toBe("Buch");
    expect(resolveCodeSwitch("the", "")).toBe("");
  });

  it("capitalizes unknown words as fallback", () => {
    expect(resolveCodeSwitch("unknown", "")).toBe("Unknown");
  });

  it("is case-insensitive for lookup", () => {
    expect(resolveCodeSwitch("HELLO", "")).toBe("hallo");
  });
});

describe("evaluateLexicalMatch", () => {
  it("returns perfect match when transcript contains all target words", () => {
    const result = evaluateLexicalMatch("Ich lese ein Buch", "Ich lese ein Buch");
    expect(result.score).toBe(1);
    expect(result.matched_words).toHaveLength(4);
    expect(result.missing_words).toHaveLength(0);
  });

  it("returns partial match when some words missing", () => {
    const result = evaluateLexicalMatch("Ich lese", "Ich lese ein Buch");
    expect(result.score).toBeCloseTo(0.5);
    expect(result.missing_words).toContain("ein");
    expect(result.missing_words).toContain("buch");
  });

  it("returns zero for no overlap", () => {
    const result = evaluateLexicalMatch("hello world", "Ich lese ein Buch");
    expect(result.score).toBe(0);
  });

  it("normalizes punctuation", () => {
    const result = evaluateLexicalMatch("Ich, lese ein Buch!", "Ich lese ein Buch");
    expect(result.score).toBe(1);
  });
});

describe("evaluateGrammar", () => {
  const turn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch",
    text_l1: "I read a book",
  };

  it("returns OMISSION when transcript shorter than target", () => {
    const result = evaluateGrammar("Ich lese", turn);
    expect(result.some((e) => e.error_type === "OMISSION")).toBe(true);
  });

  it("returns WORD_ORDER when token order differs with same length", () => {
    const shortTurn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Ich lese ein",
      text_l1: "I read a",
    };
    const result = evaluateGrammar("Ich ein lese", shortTurn);
    expect(result.some((e) => e.error_type === "WORD_ORDER")).toBe(true);
  });

  it("returns empty array for exact match", () => {
    const result = evaluateGrammar("Ich lese ein Buch", turn);
    expect(result).toEqual([]);
  });

  it("sets severity levels", () => {
    const result = evaluateGrammar("Ich lese", turn);
    const omission = result.find((e) => e.error_type === "OMISSION");
    expect(omission?.severity).toBe("MODERATE");

    const shortTurn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Ich lese ein",
      text_l1: "I read a",
    };
    const orderResult = evaluateGrammar("Ich ein lese", shortTurn);
    const wordOrder = orderResult.find((e) => e.error_type === "WORD_ORDER");
    expect(wordOrder?.severity).toBe("CRITICAL");
  });
});

describe("evaluatePronunciation", () => {
  it("returns default score 0.9 with empty problem_phonemes", () => {
    const result = evaluatePronunciation(null, "Ich lese");
    expect(result.score).toBe(0.9);
    expect(result.problem_phonemes).toEqual([]);
  });
});

describe("processOralOutput", () => {
  const turn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch",
    text_l1: "I read a book",
  };

  it("processes pure German transcript", () => {
    const result = processOralOutput("Ich lese ein Buch", turn);
    expect(result.l1_insertions).toEqual([]);
    expect(result.code_switches).toEqual([]);
    expect(result.lexical.score).toBe(1);
  });

  it("detects and resolves code switches", () => {
    const result = processOralOutput("Ich lese a book", turn);
    expect(result.l1_insertions).toContain("a");
    expect(result.l1_insertions).toContain("book");
    expect(result.code_switches.length).toBeGreaterThan(0);
  });

  it("evaluates lexical, grammar, and pronunciation", () => {
    const result = processOralOutput("Ich lese ein Buch", turn);
    expect(result.lexical).toBeDefined();
    expect(result.grammar_errors).toBeDefined();
    expect(result.pronunciation).toBeDefined();
  });
});

describe("buildOralPerformanceRecord", () => {
  it("builds record with ORAL completion method", () => {
    const processing = processOralOutput("Ich lese ein Buch", {
      speaker: "AI_AGENT",
      text_de: "Ich lese ein Buch",
      text_l1: "I read a book",
    });
    const record = buildOralPerformanceRecord(1200, processing, "ORAL");
    expect(record.response_latency_ms).toBe(1200);
    expect(record.completion_method).toBe("ORAL");
    expect(record.lexical_score).toBe(1);
  });

  it("defaults completion_method to ORAL", () => {
    const processing = processOralOutput("test", {
      speaker: "AI_AGENT",
      text_de: "test",
      text_l1: "test",
    });
    const record = buildOralPerformanceRecord(500, processing);
    expect(record.completion_method).toBe("ORAL");
  });
});

describe("updateVocabularyMastery", () => {
  const turn: DialogueTurn = {
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

  it("increments exposure and correct production for clean performance", () => {
    const performance: Parameters<typeof updateVocabularyMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 1,
      grammar_errors: [],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateVocabularyMastery(turn, performance);
    expect(result.word_updates).toHaveLength(4);
    for (const update of result.word_updates) {
      expect(update.exposure_increment).toBe(1);
      expect(update.correct_production_increment).toBe(1);
      expect(update.errors_added).toBe(0);
    }
  });

  it("does not increment correct production when grammar error present", () => {
    const performance: Parameters<typeof updateVocabularyMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 0.8,
      grammar_errors: [{ error_type: "CASE", incorrect_form: "Buch", correct_form: "Buch", concept_id: "c1", severity: "CRITICAL" }],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateVocabularyMastery(turn, performance);
    const buchUpdate = result.word_updates.find((u) => u.word_de === "Buch");
    expect(buchUpdate?.correct_production_increment).toBe(0);
    expect(buchUpdate?.errors_added).toBe(1);
  });

  it("handles empty word_card_set", () => {
    const emptyTurn: DialogueTurn = { ...turn, word_card_set: [] };
    const performance: Parameters<typeof updateVocabularyMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 1,
      grammar_errors: [],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateVocabularyMastery(emptyTurn, performance);
    expect(result.word_updates).toEqual([]);
  });
});

describe("updateGrammarMastery", () => {
  const turn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch",
    text_l1: "I read a book",
    annotated_parts: [
      { text: "Ich", grammatical_role: "SUBJ", concept_ids: ["c1"] },
      { text: "lese", grammatical_role: "VERB", concept_ids: ["c2"] },
      { text: "ein Buch", grammatical_role: "OBJ", concept_ids: ["c3"] },
    ],
  };

  it("applies positive delta when no errors for concept", () => {
    const performance: Parameters<typeof updateGrammarMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 1,
      grammar_errors: [],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateGrammarMastery(turn, performance);
    expect(result.concept_updates).toHaveLength(3);
    expect(result.concept_updates.every((u) => u.delta === 0.03)).toBe(true);
  });

  it("applies negative delta when error references concept", () => {
    const performance: Parameters<typeof updateGrammarMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 0.8,
      grammar_errors: [{ error_type: "CASE", incorrect_form: "Buch", correct_form: "Buch", concept_id: "c3", severity: "CRITICAL" }],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateGrammarMastery(turn, performance);
    const c3 = result.concept_updates.find((u) => u.concept_id === "c3");
    expect(c3?.delta).toBe(-0.05);
    const c1 = result.concept_updates.find((u) => u.concept_id === "c1");
    expect(c1?.delta).toBe(0.03);
  });

  it("handles missing annotated_parts", () => {
    const noParts: DialogueTurn = { ...turn, annotated_parts: undefined };
    const performance: Parameters<typeof updateGrammarMastery>[1] = {
      response_latency_ms: 1000,
      lexical_score: 1,
      grammar_errors: [],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateGrammarMastery(noParts, performance);
    expect(result.concept_updates).toEqual([]);
  });
});

describe("updateMasteryScores", () => {
  it("returns combined vocabulary and grammar updates", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Ich lese ein Buch",
      text_l1: "I read a book",
      word_card_set: [
        { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
        { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
      ],
      annotated_parts: [
        { text: "Ich", grammatical_role: "SUBJ", concept_ids: ["c1"] },
        { text: "lese", grammatical_role: "VERB", concept_ids: ["c2"] },
      ],
    };

    const performance: Parameters<typeof updateMasteryScores>[1] = {
      response_latency_ms: 1000,
      lexical_score: 1,
      grammar_errors: [],
      pronunciation_score: { score: 0.9, problem_phonemes: [] },
      l1_insertions: [],
      completion_method: "ORAL",
    };

    const result = updateMasteryScores(turn, performance);
    expect(result.vocabulary).toHaveLength(2);
    expect(result.grammar).toHaveLength(2);
  });
});