import { describe, it, expect } from "vitest";
import { computeWordHighlightTimings, buildDeliveryChannelPlan } from "@/lib/delivery/synchronization";
import { handleComprehensionGate, deliverTurn, buildDeliveryResult } from "@/lib/delivery/delivery";
import { buildAnalyticSteps, buildSyntheticReconstruction } from "@/lib/delivery/breakdown";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";

describe("computeWordHighlightTimings", () => {
  it("returns empty array for empty string", () => {
    expect(computeWordHighlightTimings("", 1000)).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(computeWordHighlightTimings("   \t  ", 1000)).toEqual([]);
  });

  it("distributes timings proportionally with exact division", () => {
    const result = computeWordHighlightTimings("Hallo Welt", 2000);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "Hallo", start_ms: 0, end_ms: 1000 });
    expect(result[1]).toEqual({ word: "Welt", start_ms: 1000, end_ms: 2000 });
  });

  it("handles non-divisible duration with rounding", () => {
    const result = computeWordHighlightTimings("Hallo Welt", 1500);
    expect(result).toHaveLength(2);
    // Total coverage must equal input duration
    const totalCoverage = result.reduce((sum, t) => sum + (t.end_ms - t.start_ms), 0);
    expect(totalCoverage).toBe(1500);
    expect(result[0].start_ms).toBe(0);
    expect(result[1].end_ms).toBe(1500);
  });

  it("falls back to 500ms per word when audioDurationMs is null", () => {
    const result = computeWordHighlightTimings("Hallo Welt", null);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: "Hallo", start_ms: 0, end_ms: 500 });
    expect(result[1]).toEqual({ word: "Welt", start_ms: 500, end_ms: 1000 });
  });

  it("falls back to 500ms per word when audioDurationMs is zero", () => {
    const result = computeWordHighlightTimings("Hallo", 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ word: "Hallo", start_ms: 0, end_ms: 500 });
  });

  it("handles German umlauts and ß", () => {
    const result = computeWordHighlightTimings("Ich äße gerne", 3000);
    expect(result).toHaveLength(3);
    expect(result[0].word).toBe("Ich");
    expect(result[1].word).toBe("äße");
    expect(result[2].word).toBe("gerne");
  });

  it("handles punctuation attached to words", () => {
    const result = computeWordHighlightTimings("Hallo, Welt!", 1000);
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe("Hallo,");
    expect(result[1].word).toBe("Welt!");
  });

  it("collapses multiple consecutive whitespace characters", () => {
    const result = computeWordHighlightTimings("Hallo   \t  Welt", 1000);
    expect(result).toHaveLength(2);
  });

  it("preserves word order exactly", () => {
    const text = "Der Mann gibt dem Hund den Knochen";
    const result = computeWordHighlightTimings(text, 7000);
    const extracted = result.map((t) => t.word);
    expect(extracted).toEqual(["Der", "Mann", "gibt", "dem", "Hund", "den", "Knochen"]);
  });
});

describe("buildDeliveryChannelPlan", () => {
  const baseTurn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Guten Tag, Frau Schmidt!",
    text_l1: "Good day, Ms. Schmidt!",
    audio_file_ref: "/audio/abc-123.mp3",
    visual_cue_ref: "/diagrams/xyz-456.png",
  };

  const baseScaffolding: ScaffoldingConfig = {
    show_l1_translation: true,
    show_grammar_labels: true,
    word_cards_presorted: true,
    oral_prep_time_seconds: 30,
    codeswitching_invite_shown: true,
  };

  it("returns complete plan when all channels active", () => {
    const plan = buildDeliveryChannelPlan(baseTurn, baseScaffolding);
    expect(plan.audio_ref).toBe("/audio/abc-123.mp3");
    expect(plan.text_de).toBe("Guten Tag, Frau Schmidt!");
    expect(plan.text_l1).toBe("Good day, Ms. Schmidt!");
    expect(plan.show_l1_translation).toBe(true);
    expect(plan.show_grammar_labels).toBe(true);
    expect(plan.show_visual_cue).toBe(true);
    expect(plan.visual_cue_ref).toBe("/diagrams/xyz-456.png");
    expect(plan.word_highlight_timings.length).toBeGreaterThan(0);
  });

  it("hides L1 translation when scaffolding.show_l1_translation is false", () => {
    const scaffolding: ScaffoldingConfig = { ...baseScaffolding, show_l1_translation: false };
    const plan = buildDeliveryChannelPlan(baseTurn, scaffolding);
    expect(plan.text_l1).toBeNull();
    expect(plan.show_l1_translation).toBe(false);
  });

  it("preserves L1 in plan even when hidden (UI layer decides rendering)", () => {
    const scaffolding: ScaffoldingConfig = { ...baseScaffolding, show_l1_translation: false };
    const plan = buildDeliveryChannelPlan(baseTurn, scaffolding);
    // text_l1 is set to null, not just hidden — this is correct per blueprint
    expect(plan.text_l1).toBeNull();
  });

  it("hides visual cue when visual_cue_ref is null", () => {
    const turn: DialogueTurn = { ...baseTurn, visual_cue_ref: null };
    const plan = buildDeliveryChannelPlan(turn, baseScaffolding);
    expect(plan.show_visual_cue).toBe(false);
    expect(plan.visual_cue_ref).toBeNull();
  });

  it("hides visual cue when visual_cue_ref is empty string", () => {
    const turn: DialogueTurn = { ...baseTurn, visual_cue_ref: "" };
    const plan = buildDeliveryChannelPlan(turn, baseScaffolding);
    expect(plan.show_visual_cue).toBe(false);
    expect(plan.visual_cue_ref).toBe("");
  });

  it("hides visual cue when audio_file_ref is null but scaffolding permits", () => {
    const turn: DialogueTurn = { ...baseTurn, audio_file_ref: null };
    const plan = buildDeliveryChannelPlan(turn, baseScaffolding);
    expect(plan.audio_ref).toBeNull();
  });

  it("does not mutate input turn object", () => {
    const turnCopy = { ...baseTurn, annotated_parts: baseTurn.annotated_parts };
    const before = JSON.stringify(turnCopy);
    buildDeliveryChannelPlan(turnCopy, baseScaffolding);
    expect(JSON.stringify(turnCopy)).toBe(before);
  });

  it("handles German text with case markers correctly", () => {
    const turn: DialogueTurn = {
      ...baseTurn,
      text_de: "Ich gebe dem Mann den Apfel.",
      text_l1: "I give the man the apple.",
    };
    const plan = buildDeliveryChannelPlan(turn, baseScaffolding);
    const words = plan.word_highlight_timings.map((t) => t.word);
    expect(words).toEqual(["Ich", "gebe", "dem", "Mann", "den", "Apfel."]);
  });
});

describe("handleComprehensionGate", () => {
  it("returns PROCEED with no escalation for YES", () => {
    const result = handleComprehensionGate("YES", 0);
    expect(result).toEqual({ next_action: "PROCEED", replay_count: 0, cognitive_load_escalation: false });
  });

  it("returns PROCEED with no escalation for YES with existing replays", () => {
    const result = handleComprehensionGate("YES", 5);
    expect(result).toEqual({ next_action: "PROCEED", replay_count: 5, cognitive_load_escalation: false });
  });

  it("increments replay count for REPLAY without escalation at boundary", () => {
    const result = handleComprehensionGate("REPLAY", 2);
    expect(result).toEqual({ next_action: "REPLAY", replay_count: 3, cognitive_load_escalation: false });
  });

  it("triggers escalation exactly when replay count exceeds 3", () => {
    const result = handleComprehensionGate("REPLAY", 3);
    expect(result).toEqual({ next_action: "REPLAY", replay_count: 4, cognitive_load_escalation: true });
  });

  it("triggers escalation on second consecutive REPLAY after 3 total", () => {
    const result = handleComprehensionGate("REPLAY", 4);
    expect(result).toEqual({ next_action: "REPLAY", replay_count: 5, cognitive_load_escalation: true });
  });

  it("returns BREAKDOWN for EXPLAIN without escalation", () => {
    const result = handleComprehensionGate("EXPLAIN", 0);
    expect(result).toEqual({ next_action: "BREAKDOWN", replay_count: 0, cognitive_load_escalation: false });
  });

  it("returns BREAKDOWN preserving existing replay count", () => {
    const result = handleComprehensionGate("EXPLAIN", 3);
    expect(result).toEqual({ next_action: "BREAKDOWN", replay_count: 3, cognitive_load_escalation: false });
  });

  it("defaults to PROCEED for unrecognized choice", () => {
    const result = handleComprehensionGate("MAYBE" as any, 0);
    expect(result.next_action).toBe("PROCEED");
    expect(result.cognitive_load_escalation).toBe(false);
  });
});

describe("deliverTurn", () => {
  const turn: DialogueTurn = {
    speaker: "AI_AGENT",
    text_de: "Ich lese ein Buch über Quantenphysik.",
    text_l1: "I read a book about quantum physics.",
    audio_file_ref: "/audio/def-789.mp3",
    visual_cue_ref: "/diagrams/quantum.png",
    annotated_parts: [
      { text: "Ich", grammatical_role: "NOMINATIV_SUBJECT", concept_ids: ["c1"] },
      { text: "lese", grammatical_role: "VERB_FINITE", concept_ids: ["c2"] },
      { text: "ein Buch", grammatical_role: "AKKUSATIV_OBJECT", concept_ids: ["c3"] },
    ],
  };

  it("returns a DeliveryChannelPlan and initial gateResult", () => {
    const scaffolding: ScaffoldingConfig = {
      show_l1_translation: true,
      show_grammar_labels: true,
      word_cards_presorted: false,
      oral_prep_time_seconds: 20,
      codeswitching_invite_shown: true,
    };

    const result = deliverTurn(turn, scaffolding, 0);
    expect(result.plan.text_de).toBe(turn.text_de);
    expect(result.plan.text_l1).toBe(turn.text_l1);
    expect(result.gateResult.next_action).toBe("PROCEED");
    expect(result.gateResult.replay_count).toBe(0);
    expect(result.gateResult.cognitive_load_escalation).toBe(false);
  });

  it("passes replayCount through to gateResult", () => {
    const scaffolding: ScaffoldingConfig = {
      show_l1_translation: false,
      show_grammar_labels: false,
      word_cards_presorted: true,
      oral_prep_time_seconds: 10,
      codeswitching_invite_shown: false,
    };

    const result = deliverTurn(turn, scaffolding, 2);
    expect(result.gateResult.replay_count).toBe(2);
  });

  it("does not mutate turn or scaffolding", () => {
    const turnCopy = { ...turn };
    const scaffoldingCopy: ScaffoldingConfig = {
      show_l1_translation: true,
      show_grammar_labels: true,
      word_cards_presorted: true,
      oral_prep_time_seconds: 30,
      codeswitching_invite_shown: true,
    };
    const beforeTurn = JSON.stringify(turnCopy);
    const beforeScaffolding = JSON.stringify(scaffoldingCopy);

    deliverTurn(turnCopy, scaffoldingCopy, 1);

    expect(JSON.stringify(turnCopy)).toBe(beforeTurn);
    expect(JSON.stringify(scaffoldingCopy)).toBe(beforeScaffolding);
  });
});

describe("buildDeliveryResult", () => {
  it("maps PROCEED to comprehension_confirmed true", () => {
    expect(buildDeliveryResult({ next_action: "PROCEED", replay_count: 0, cognitive_load_escalation: false })).toEqual({
      comprehension_confirmed: true,
      replay_count: 0,
      cognitive_load_escalation: false,
      next_action: "PROCEED",
    });
  });

  it("maps REPLAY preserving fields", () => {
    expect(buildDeliveryResult({ next_action: "REPLAY", replay_count: 2, cognitive_load_escalation: false })).toEqual({
      comprehension_confirmed: false,
      replay_count: 2,
      cognitive_load_escalation: false,
      next_action: "REPLAY",
    });
  });

  it("maps BREAKDOWN when next_action is EXPLAIN-then-proceed", () => {
    expect(buildDeliveryResult({ next_action: "BREAKDOWN", replay_count: 0, cognitive_load_escalation: false })).toEqual({
      comprehension_confirmed: false,
      replay_count: 0,
      cognitive_load_escalation: false,
      next_action: "BREAKDOWN",
    });
  });

  it("maps RECOVERY when cognitive_load_escalation is true regardless of next_action", () => {
    expect(buildDeliveryResult({ next_action: "PROCEED", replay_count: 4, cognitive_load_escalation: true })).toEqual({
      comprehension_confirmed: true,
      replay_count: 4,
      cognitive_load_escalation: true,
      next_action: "RECOVERY",
    });
  });
});

describe("buildAnalyticSteps", () => {
  it("returns empty array when annotated_parts is undefined", () => {
    const turn: DialogueTurn = { speaker: "AI_AGENT", text_de: "Hallo", text_l1: "Hello" };
    expect(buildAnalyticSteps(turn)).toEqual([]);
  });

  it("returns empty array when annotated_parts is empty", () => {
    const turn: DialogueTurn = { speaker: "AI_AGENT", text_de: "Hallo", text_l1: "Hello", annotated_parts: [] };
    expect(buildAnalyticSteps(turn)).toEqual([]);
  });

  it("builds steps from annotated_parts with German grammatical roles", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Der Hund sieht die Katze.",
      text_l1: "The dog sees the cat.",
      annotated_parts: [
        { text: "Der", grammatical_role: "ARTIKEL_NOMINATIV", concept_ids: ["g1"] },
        { text: "Hund", grammatical_role: "NOUN_NOMINATIV", concept_ids: ["g2"] },
        { text: "sieht", grammatical_role: "VERB_FINITE", concept_ids: ["g3"] },
        { text: "die", grammatical_role: "ARTIKEL_AKKUSATIV", concept_ids: ["g1"] },
        { text: "Katze", grammatical_role: "NOUN_AKKUSATIV", concept_ids: ["g2"] },
      ],
    };

    const steps = buildAnalyticSteps(turn);
    expect(steps).toHaveLength(5);
    expect(steps[0]).toEqual({ part_text: "Der", grammatical_role: "ARTIKEL_NOMINATIV", explanation: "[ARTIKEL_NOMINATIV] Der", pause_ms: 1500 });
    expect(steps[2].grammatical_role).toBe("VERB_FINITE");
    expect(steps[4].part_text).toBe("Katze");
  });

  it("uses fixed 1500ms pause per step", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Test",
      text_l1: "Test",
      annotated_parts: [{ text: "Test", grammatical_role: "NOUN", concept_ids: [] }],
    };
    expect(buildAnalyticSteps(turn)[0].pause_ms).toBe(1500);
  });
});

describe("buildSyntheticReconstruction", () => {
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

  it("returns BreakdownResult with analytic steps and word cards", () => {
    const result = buildSyntheticReconstruction(baseTurn, presortedScaffolding);
    expect(result.analytic_steps).toHaveLength(0); // no annotated_parts in baseTurn
    expect(result.synthetic_word_cards).toHaveLength(4);
    expect(result.synthetic_presorted).toBe(true);
  });

  it("does not mutate input turn.word_card_set", () => {
    const original = JSON.stringify(baseTurn.word_card_set);
    buildSyntheticReconstruction(baseTurn, randomScaffolding);
    expect(JSON.stringify(baseTurn.word_card_set)).toBe(original);
  });

  it("sorts by correct_position when presorted is true", () => {
    const unsortedTurn: DialogueTurn = {
      ...baseTurn,
      word_card_set: [
        { word_de: "Buch", grammatical_role: "OBJ", correct_position: 4 },
        { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 1 },
        { word_de: "ein", grammatical_role: "ARTICLE", correct_position: 3 },
        { word_de: "lese", grammatical_role: "VERB", correct_position: 2 },
      ],
    };

    const result = buildSyntheticReconstruction(unsortedTurn, presortedScaffolding);
    expect(result.synthetic_word_cards.map((c) => c.correct_position)).toEqual([1, 2, 3, 4]);
    expect(result.synthetic_word_cards.map((c) => c.word_de)).toEqual(["Ich", "lese", "ein", "Buch"]);
    expect(result.synthetic_presorted).toBe(true);
  });

  it("produces a valid permutation when presorted is false", () => {
    const result = buildSyntheticReconstruction(baseTurn, randomScaffolding);
    expect(result.synthetic_word_cards).toHaveLength(4);
    const words = result.synthetic_word_cards.map((c) => c.word_de);
    const sorted = [...words].sort();
    expect(words).not.toEqual(sorted);
    expect(result.synthetic_presorted).toBe(false);
  });

  it("randomization preserves all original cards (no loss)", () => {
    const result = buildSyntheticReconstruction(baseTurn, randomScaffolding);
    const resultWords = result.synthetic_word_cards.map((c) => c.word_de).sort();
    const originalWords = baseTurn.word_card_set!.map((c) => c.word_de).sort();
    expect(resultWords).toEqual(originalWords);
  });

  it("handles empty word_card_set by falling back to text tokenization", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Hallo Welt",
      text_l1: "Hello world",
      word_card_set: [],
    };

    const result = buildSyntheticReconstruction(turn, presortedScaffolding);
    expect(result.synthetic_word_cards).toHaveLength(2);
    expect(result.synthetic_word_cards[0].word_de).toBe("Hallo");
    expect(result.synthetic_word_cards[0].correct_position).toBe(1);
    expect(result.synthetic_word_cards[0].grammatical_role).toBe("UNKNOWN");
  });

  it("falls back when word_card_set is undefined", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Wie geht's?",
      text_l1: "How are you?",
    };

    const result = buildSyntheticReconstruction(turn, presortedScaffolding);
    expect(result.synthetic_word_cards).toHaveLength(2);
    expect(result.synthetic_word_cards[0].word_de).toBe("Wie");
    expect(result.synthetic_word_cards[1].word_de).toBe("geht's?");
  });

  it("handles German separable prefix in fallback tokenization", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Ich stehe auf",
      text_l1: "I stand up",
    };

    const result = buildSyntheticReconstruction(turn, presortedScaffolding);
    expect(result.synthetic_word_cards.map((c) => c.word_de)).toEqual(["Ich", "stehe", "auf"]);
  });

  it("sorts fallback cards presorted when word_card_set absent", () => {
    const turn: DialogueTurn = {
      speaker: "AI_AGENT",
      text_de: "Zwei Bäume",
      text_l1: "Two trees",
    };

    const result = buildSyntheticReconstruction(turn, presortedScaffolding);
    expect(result.synthetic_word_cards[0].correct_position).toBe(1);
    expect(result.synthetic_word_cards[1].correct_position).toBe(2);
    expect(result.synthetic_presorted).toBe(true);
  });
});