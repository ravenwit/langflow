import { describe, it, expect } from "vitest";
import {
  selectDomain,
  selectContext,
  selectGrammarConcepts,
  selectVocabulary,
  calculateTurnCount,
  inferScaffolding,
  buildGenerationContext,
  mapPhaseToCefr,
} from "@/lib/scenario/selection";
import { validateScenario, ensureScenarioDefaults } from "@/lib/scenario/validation";
import { getFallbackScenario } from "@/lib/scenario/templates";
import { buildScenarioPrompt } from "@/lib/scenario/promptBuilder";
import { GrammarConcept, VocabularyItem } from "@/lib/mastery/types";

function makeGrammar(overrides: Partial<GrammarConcept> = {}): GrammarConcept {
  return {
    concept_id: crypto.randomUUID(),
    concept_label: "Akkusativ",
    cefr_level: "A2",
    prerequisite_concepts: [],
    mastery_score: 0.4,
    analytic_breakdown: "Use Akkusativ for direct objects.",
    synthetic_template: "Ich sehe ___.",
    example_sentences: [],
    ...overrides,
  };
}

function makeVocab(overrides: Partial<VocabularyItem> = {}): VocabularyItem {
  return {
    lemma_de: "der Hund",
    translations_l1: ["the dog"],
    word_class: "NOUN",
    morph_data: { gender: "DER", plural_form: "Hunde" },
    domain_tags: [],
    cefr_level: "A1",
    mastery_score: 0.3,
    exposure_count: 1,
    correct_production_count: 0,
    error_log: [],
    ...overrides,
  };
}

describe("mapPhaseToCefr", () => {
  it("maps phases to CEFR levels", () => {
    expect(mapPhaseToCefr(1)).toBe("A1");
    expect(mapPhaseToCefr(2)).toBe("A2");
    expect(mapPhaseToCefr(3)).toBe("A2");
    expect(mapPhaseToCefr(4)).toBe("B1");
    expect(mapPhaseToCefr(5)).toBe("B1");
    expect(mapPhaseToCefr(6)).toBe("B2");
  });
});

describe("selectDomain", () => {
  it("returns a domain label", () => {
    const domains = [
      { domain_label: "physics", domain_weight: 0.8, sub_topics: [], vocabulary_anchors: [] },
      { domain_label: "music", domain_weight: 0.2, sub_topics: [], vocabulary_anchors: [] },
    ];
    const result = selectDomain(domains);
    expect(domains.map((d) => d.domain_label)).toContain(result);
  });

  it("excludes last used domain", () => {
    const domains = [
      { domain_label: "physics", domain_weight: 1, sub_topics: [], vocabulary_anchors: [] },
      { domain_label: "music", domain_weight: 1, sub_topics: [], vocabulary_anchors: [] },
    ];
    const result = selectDomain(domains, "physics");
    expect(result).toBe("music");
  });
});

describe("selectContext", () => {
  it("returns a context label", () => {
    const contexts = [{ label: "cafe" }, { label: "university" }];
    const result = selectContext(contexts);
    expect(contexts.map((c) => c.label)).toContain(result);
  });

  it("excludes last used context", () => {
    const contexts = [{ label: "cafe" }, { label: "university" }];
    const result = selectContext(contexts, "cafe");
    expect(result).toBe("university");
  });
});

describe("selectGrammarConcepts", () => {
  it("filters grammar concepts with mastery < 0.8", () => {
    const queue = [
      makeGrammar({ concept_label: "Akkusativ", mastery_score: 0.4 }),
      makeGrammar({ concept_label: "Dativ", mastery_score: 0.9 }),
      makeGrammar({ concept_label: "Perfekt", mastery_score: 0.5 }),
    ];
    const result = selectGrammarConcepts(queue);
    expect(result.map((g) => g.concept_label)).toEqual(["Akkusativ", "Perfekt"]);
  });
});

describe("selectVocabulary", () => {
  it("returns vocabulary items from queue", () => {
    const queue = [
      makeVocab({ lemma_de: "Hund" }),
      makeGrammar({ concept_label: "Akkusativ" }),
      makeVocab({ lemma_de: "Katze" }),
    ];
    const result = selectVocabulary(queue);
    expect(result.map((v) => v.lemma_de)).toEqual(["Hund", "Katze"]);
  });
});

describe("calculateTurnCount", () => {
  it("returns 6-8 for low cognitive load", () => {
    for (let i = 0; i < 20; i++) {
      const result = calculateTurnCount(0.2);
      expect(result).toBeGreaterThanOrEqual(6);
      expect(result).toBeLessThanOrEqual(8);
    }
  });

  it("returns 4-5 for medium cognitive load", () => {
    for (let i = 0; i < 20; i++) {
      const result = calculateTurnCount(0.5);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(5);
    }
  });

  it("returns 2-3 for high cognitive load", () => {
    for (let i = 0; i < 20; i++) {
      const result = calculateTurnCount(0.8);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(3);
    }
  });
});

describe("inferScaffolding", () => {
  it("enables L1 for early phases", () => {
    const s = inferScaffolding(1, 0, "MEDIUM");
    expect(s.show_l1_translation).toBe(true);
  });

  it("enables grammar labels for phases <= 3", () => {
    expect(inferScaffolding(2, 0, "MEDIUM").show_grammar_labels).toBe(true);
    expect(inferScaffolding(3, 0, "MEDIUM").show_grammar_labels).toBe(true);
    expect(inferScaffolding(4, 0, "MEDIUM").show_grammar_labels).toBe(false);
  });

  it("sets oral prep time by phase", () => {
    expect(inferScaffolding(1, 0, "MEDIUM").oral_prep_time_seconds).toBe(30);
    expect(inferScaffolding(3, 0, "MEDIUM").oral_prep_time_seconds).toBe(20);
    expect(inferScaffolding(5, 0, "MEDIUM").oral_prep_time_seconds).toBe(10);
  });
});

describe("buildGenerationContext", () => {
  it("returns a valid GenerationContext", () => {
    const domains = [{ domain_label: "physics", domain_weight: 1, sub_topics: ["quantum"] }];
    const contexts = [{ label: "university" }];
    const queue = [makeGrammar({ concept_label: "Akkusativ" }), makeVocab({ lemma_de: "Buch" })];
    const context = buildGenerationContext(domains, contexts, queue, [], 0.3, 2);
    expect(context.domain.domain_label).toBe("physics");
    expect(context.context.label).toBe("university");
    expect(context.cefr_level).toBe("A2");
  });
});

describe("validateScenario", () => {
  it("rejects missing fields", () => {
    const result = validateScenario({ dialogue_turns: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("accepts valid scenario", () => {
    const result = validateScenario({
      scenario_id: "123",
      generated_at: new Date().toISOString(),
      domain_tag: "physics",
      context_tag: "university",
      difficulty_level: "A1",
      target_grammar_concepts: [],
      target_vocabulary: [],
      scenario_premise: "test",
      scenario_premise_l1: "test",
      dialogue_turns: [
        { speaker: "AI_AGENT", text_de: "Hallo", text_l1: "Hello" },
      ],
      review_concepts_embedded: [],
    });
    expect(result.valid).toBe(true);
  });
});

describe("ensureScenarioDefaults", () => {
  it("fills missing fields with defaults", () => {
    const result = ensureScenarioDefaults({ scenario_id: "123", dialogue_turns: [] });
    expect(result.generated_at).toBeTruthy();
    expect(result.difficulty_level).toBe("A1");
  });
});

describe("getFallbackScenario", () => {
  it("returns a valid fallback scenario", () => {
    const scenario = getFallbackScenario("physics", "university", "A2");
    expect(scenario.scenario_id).toBeTruthy();
    expect(scenario.dialogue_turns.length).toBeGreaterThan(0);
    expect(scenario.dialogue_turns[0].speaker).toBe("AI_AGENT");
  });
});

describe("buildScenarioPrompt", () => {
  it("includes domain, context, and turn count in prompt", () => {
    const ctx = {
      domain: { domain_label: "physics", domain_weight: 1, sub_topics: ["quantum"], vocabulary_anchors: [] },
      context: { label: "university" },
      cefr_level: "A2" as const,
      target_grammar: [makeGrammar({ concept_label: "Akkusativ", analytic_breakdown: "Direct objects" })],
      target_vocab: [makeVocab({ lemma_de: "Buch", translations_l1: ["book"] })],
      new_vocab: [],
      turn_count: 6,
      month_phase: 2,
      scaffolding: {
        show_l1_translation: true,
        show_grammar_labels: true,
        word_cards_presorted: true,
        oral_prep_time_seconds: 30,
        codeswitching_invite_shown: true,
      },
      review_concepts: [],
    };

    const prompt = buildScenarioPrompt(ctx);
    expect(prompt).toContain("DOMAIN: physics");
    expect(prompt).toContain("CONTEXT: university");
    expect(prompt).toContain("TURN COUNT: 6");
    expect(prompt).toContain("Akkusativ");
    expect(prompt).toContain("Buch");
  });
});