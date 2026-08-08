import { VocabularyItem, GrammarConcept } from "@/lib/mastery/types";
import { buildGenerationContext, selectDomain, selectContext, selectGrammarConcepts, selectVocabulary, selectNewVocabulary, calculateTurnCount, inferScaffolding, mapPhaseToCefr } from "./selection";
import { buildScenarioPrompt } from "./promptBuilder";
import { LLMClient, LLMConfig } from "./llmClient";
import { generateTTSAudio } from "./ttsClient";
import { validateScenario, ensureScenarioDefaults } from "./validation";
import { getFallbackScenario } from "./templates";
import { GenerationContext, Scenario } from "./types";

export interface GenerateScenarioParams {
  interestDomains: { domain_label: string; domain_weight: number; sub_topics: string[] }[];
  dailyContexts: { label: string }[];
  reviewQueue: (GrammarConcept | VocabularyItem)[];
  allVocabulary: VocabularyItem[];
  cognitiveLoadIndex: number;
  monthPhase: number;
  newItemsIntroducedThisSession: number;
  lastUsedContext?: string;
  llmConfig: LLMConfig;
}

export interface GenerateScenarioResult {
  scenario: Scenario;
  fallbackUsed: boolean;
}

export async function generateScenario(params: GenerateScenarioParams): Promise<GenerateScenarioResult> {
  const context = buildGenerationContext(
    params.interestDomains,
    params.dailyContexts,
    params.reviewQueue,
    params.allVocabulary,
    params.cognitiveLoadIndex,
    params.monthPhase,
    params.lastUsedContext
  );

  const prompt = buildScenarioPrompt(context);
  const llmClient = new LLMClient(params.llmConfig);

  let rawOutput: string;
  let parsed: unknown;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      rawOutput = await llmClient.generateScenario(prompt);
      parsed = JSON.parse(rawOutput);
      break;
    } catch (error) {
      attempts++;
      console.error(`LLM attempt ${attempts} failed:`, error);
      if (attempts >= maxAttempts) {
        console.warn("Falling back to template scenario");
        const fallback = getFallbackScenario(context.domain.domain_label, context.context.label, mapPhaseToCefr(params.monthPhase));
        await enrichWithTTS(fallback, params.monthPhase);
        return { scenario: fallback, fallbackUsed: true };
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    const fallback = getFallbackScenario(context.domain.domain_label, context.context.label, mapPhaseToCefr(params.monthPhase));
    await enrichWithTTS(fallback, params.monthPhase);
    return { scenario: fallback, fallbackUsed: true };
  }

  const validation = validateScenario(parsed);
  if (!validation.valid) {
    console.error("Scenario validation failed:", validation.errors);
    const fallback = getFallbackScenario(context.domain.domain_label, context.context.label, mapPhaseToCefr(params.monthPhase));
    await enrichWithTTS(fallback, params.monthPhase);
    return { scenario: fallback, fallbackUsed: true };
  }

  const scenario = ensureScenarioDefaults(parsed as Record<string, unknown>);
  await enrichWithTTS(scenario, params.monthPhase);

  return { scenario, fallbackUsed: false };
}

async function enrichWithTTS(scenario: Scenario, monthPhase: number): Promise<void> {
  const ttsSpeed = monthPhase <= 2 ? 0.75 : monthPhase <= 4 ? 0.9 : 1.0;

  const aiTurns = scenario.dialogue_turns.filter((t) => t.speaker === "AI_AGENT");
  for (const turn of aiTurns) {
    try {
      const result = await generateTTSAudio(turn.text_de, ttsSpeed);
      turn.audio_file_ref = result.audioFileRef;
    } catch (error) {
      console.error(`TTS failed for turn: ${turn.text_de}`, error);
      turn.audio_file_ref = null;
    }
  }
}