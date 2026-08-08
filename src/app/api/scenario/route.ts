import { NextResponse } from "next/server";
import { generateScenario } from "@/lib/scenario/generator";
import { VocabularyItem, GrammarConcept } from "@/lib/mastery/types";

export interface GenerateScenarioRequest {
  interest_domains: { domain_label: string; domain_weight: number; sub_topics: string[] }[];
  daily_contexts: { label: string }[];
  review_queue: (GrammarConcept | VocabularyItem)[];
  all_vocabulary: VocabularyItem[];
  cognitive_load_index: number;
  month_phase: number;
  new_items_introduced_this_session: number;
  last_used_context?: string;
  llm_provider: "deepseek" | "gemini";
  llm_api_key: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateScenarioRequest;

    const { interest_domains, daily_contexts, review_queue, all_vocabulary, cognitive_load_index, month_phase, new_items_introduced_this_session, last_used_context, llm_provider, llm_api_key } = body;

    if (!llm_api_key) {
      return NextResponse.json({ error: "llm_api_key is required" }, { status: 400 });
    }

    const result = await generateScenario({
      interestDomains: interest_domains,
      dailyContexts: daily_contexts,
      reviewQueue: review_queue,
      allVocabulary: all_vocabulary,
      cognitiveLoadIndex: cognitive_load_index,
      monthPhase: month_phase,
      newItemsIntroducedThisSession: new_items_introduced_this_session,
      lastUsedContext: last_used_context,
      llmConfig: {
        provider: llm_provider,
        apiKey: llm_api_key,
      },
    });

    return NextResponse.json({
      scenario: result.scenario,
      fallback_used: result.fallbackUsed,
    });
  } catch (error) {
    console.error("Scenario generation failed:", error);
    return NextResponse.json({ error: "Scenario generation failed" }, { status: 500 });
  }
}