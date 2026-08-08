import { describe, it, expect } from "vitest";
import { buildReviewQueue } from "@/lib/mastery/reviewQueue";
import { VocabularyItem, GrammarConcept } from "@/lib/mastery/types";

function makeVocab(overrides: Partial<VocabularyItem> = {}): VocabularyItem {
  return {
    lemma_de: "Testwort",
    translations_l1: ["test"],
    word_class: "NOUN",
    morph_data: {},
    domain_tags: [],
    cefr_level: "A1",
    mastery_score: 0.0,
    exposure_count: 0,
    correct_production_count: 0,
    error_log: [],
    ...overrides,
  };
}

function makeGrammar(overrides: Partial<GrammarConcept> = {}): GrammarConcept {
  return {
    concept_id: crypto.randomUUID(),
    concept_label: "Testkonzept",
    cefr_level: "A1",
    prerequisite_concepts: [],
    mastery_score: 0.0,
    analytic_breakdown: "",
    synthetic_template: "",
    example_sentences: [],
    ...overrides,
  };
}

describe("buildReviewQueue", () => {
  it("returns empty array when inputs are empty", () => {
    const queue = buildReviewQueue([], [], 20);
    expect(queue).toEqual([]);
  });

  it("prioritizes overdue items first", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();

    const overdue = makeVocab({ lemma_de: "overdue", next_review_due: past, mastery_score: 0.9 });
    const futureItem = makeVocab({ lemma_de: "future", next_review_due: future, mastery_score: 0.1 });

    const queue = buildReviewQueue([overdue, futureItem], [], 20);
    const first = queue.find((q) => q.item_type === "VOCABULARY") as VocabularyItem;
    expect(first.lemma_de).toBe("overdue");
  });

  it("respects sessionTargetCount limit", () => {
    const items = Array.from({ length: 50 }).map((_, i) => makeVocab({ lemma_de: `item${i}` }));
    const queue = buildReviewQueue(items, [], 20);
    expect(queue.length).toBeLessThanOrEqual(20);
  });

  it("respects tier limits proportionally", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const allOverdue = Array.from({ length: 50 }).map((_, i) =>
      makeVocab({ lemma_de: `overdue${i}`, next_review_due: past })
    );
    const queue = buildReviewQueue(allOverdue, [], 20);
    expect(queue.length).toBeLessThanOrEqual(20);
  });
});