import { VocabularyItem, GrammarConcept, CefrLevel } from "@/lib/mastery/types";
import { isItemIntroducible, IntroductionGateContext } from "@/lib/mastery/introductionGate";
import { GenerationContext, ScaffoldingConfig } from "./types";

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PHASE_CEILING_MAP: Record<number, CefrLevel> = {
  1: "A1",
  2: "A2",
  3: "A2",
  4: "B1",
  5: "B1",
  6: "B2",
};

export function mapPhaseToCefr(phase: number): CefrLevel {
  return PHASE_CEILING_MAP[phase] ?? "A1";
}

function weightedRandom<T>(items: T[], weightKey: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + weightKey(item), 0);
  if (totalWeight === 0) return items[Math.floor(Math.random() * items.length)];
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= weightKey(item);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

export function selectDomain(
  interestDomains: { domain_label: string; domain_weight: number }[],
  lastUsedDomain?: string
): string {
  const eligible = lastUsedDomain
    ? interestDomains.filter((d) => d.domain_label !== lastUsedDomain)
    : interestDomains;
  const pool = eligible.length > 0 ? eligible : interestDomains;
  const selected = weightedRandom(pool, (d) => d.domain_weight);
  return selected.domain_label;
}

export function selectContext(
  dailyContexts: { label: string }[],
  lastUsedContext?: string
): string {
  const eligible = lastUsedContext
    ? dailyContexts.filter((c) => c.label !== lastUsedContext)
    : dailyContexts;
  const pool = eligible.length > 0 ? eligible : dailyContexts;
  return pool[Math.floor(Math.random() * pool.length)].label;
}

export function selectGrammarConcepts(
  reviewQueue: (GrammarConcept | VocabularyItem)[],
  count: number = 2
): GrammarConcept[] {
  const grammarItems = reviewQueue
    .filter((item): item is GrammarConcept => "concept_label" in item)
    .filter((g) => g.mastery_score < 0.8);
  return grammarItems.slice(0, count);
}

export function selectVocabulary(
  reviewQueue: (GrammarConcept | VocabularyItem)[],
  count: number = 6
): VocabularyItem[] {
  const vocabItems = reviewQueue
    .filter((item): item is VocabularyItem => "lemma_de" in item);
  return vocabItems.slice(0, count);
}

export function selectNewVocabulary(
  allVocabulary: VocabularyItem[],
  context: IntroductionGateContext,
  count: number = 2
): VocabularyItem[] {
  const results: VocabularyItem[] = [];
  const candidates = allVocabulary.filter((v) => v.mastery_score < 0.3);
  for (const candidate of candidates) {
    if (results.length >= count) break;
    const result = isItemIntroducible(candidate.cefr_level, candidate.mastery_score < 0.7 ? [] : [0.8], context);
    if (result.introducible) {
      results.push(candidate);
    }
  }
  return results;
}

export function buildGenerationContext(
  interestDomains: { domain_label: string; domain_weight: number; sub_topics: string[] }[],
  dailyContexts: { label: string }[],
  reviewQueue: (GrammarConcept | VocabularyItem)[],
  allVocabulary: VocabularyItem[],
  cognitiveLoadIndex: number,
  monthPhase: number,
  lastUsedContext?: string
): GenerationContext {
  const domain: { domain_label: string; domain_weight: number; sub_topics: string[]; vocabulary_anchors: string[] } = {
    domain_label: selectDomain(interestDomains),
    domain_weight: 1,
    sub_topics: [],
    vocabulary_anchors: [],
  };
  domain.domain_weight = interestDomains.find((d) => d.domain_label === domain.domain_label)?.domain_weight ?? 1;
  domain.sub_topics = interestDomains.find((d) => d.domain_label === domain.domain_label)?.sub_topics ?? [];

  const contextTag = { label: selectContext(dailyContexts, lastUsedContext) };

  const cefrLevel = mapPhaseToCefr(monthPhase);

  const targetGrammar = selectGrammarConcepts(reviewQueue);
  const targetVocab = selectVocabulary(reviewQueue);
  const newVocab = selectNewVocabulary(allVocabulary, {
    userMonthPhase: monthPhase,
    cognitiveLoadIndex,
    newItemsIntroducedThisSession: 0,
  });

  const turnCount = calculateTurnCount(cognitiveLoadIndex);
  const scaffolding = inferScaffolding(monthPhase, 0, "MEDIUM");

  const reviewConcepts = targetGrammar.filter((g) => g.mastery_score >= 0.5);

  return {
    domain: domain as any,
    context: contextTag,
    cefr_level: cefrLevel,
    target_grammar: targetGrammar,
    target_vocab: targetVocab,
    new_vocab: newVocab,
    turn_count: turnCount,
    month_phase: monthPhase,
    scaffolding,
    review_concepts: reviewConcepts,
    last_used_context: lastUsedContext,
  };
}

export function calculateTurnCount(cognitiveLoadIndex: number): number {
  if (cognitiveLoadIndex < 0.4) return 6 + Math.floor(Math.random() * 2); // 6-8
  if (cognitiveLoadIndex <= 0.7) return 4 + Math.floor(Math.random() * 2); // 4-5
  return 2 + Math.floor(Math.random() * 2); // 2-3
}

export function inferScaffolding(
  monthPhase: number,
  oralComfort: number,
  wmTolerance: "LOW" | "MEDIUM" | "HIGH"
): ScaffoldingConfig {
  const phase = monthPhase;
  return {
    show_l1_translation: phase <= 2 || wmTolerance === "LOW",
    show_grammar_labels: phase <= 3,
    word_cards_presorted: phase <= 2 || oralComfort < 0.3,
    oral_prep_time_seconds: phase <= 2 ? 30 : phase <= 4 ? 20 : 10,
    codeswitching_invite_shown: phase <= 4,
  };
}