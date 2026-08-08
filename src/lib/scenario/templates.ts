import { Scenario, DialogueTurn } from "./types";

function makeTurn(speaker: "AI_AGENT" | "USER", text_de: string, text_l1: string): DialogueTurn {
  return { speaker, text_de, text_l1 };
}

export function getFallbackScenario(domain: string, context: string, cefrLevel: string): Scenario {
  const now = new Date().toISOString();

  const dialogueTurns: DialogueTurn[] = [
    makeTurn("AI_AGENT", `Hallo! Willkommen bei unserer Übung zum Thema ${domain}.`, `Hello! Welcome to our exercise about ${domain}.`),
    makeTurn("USER", "Hallo! Ich bin bereit.", "Hello! I am ready."),
    makeTurn("AI_AGENT", "Wunderbar. Lass uns mit einer einfachen Frage beginnen. Was machst du gerne?", `Wonderful. Let's start with a simple question. What do you like to do?`),
    makeTurn("USER", "Ich lerne gerne Deutsch.", "I like learning German."),
    makeTurn("AI_AGENT", "Das ist toll! Deutsch lernen ist sehr interessant.", "That's great! Learning German is very interesting."),
    makeTurn("USER", "Ja, ich übe jeden Tag.", "Yes, I practice every day."),
  ];

  return {
    scenario_id: crypto.randomUUID(),
    generated_at: now,
    domain_tag: domain,
    context_tag: context,
    difficulty_level: cefrLevel as Scenario["difficulty_level"],
    target_grammar_concepts: [],
    target_vocabulary: [],
    scenario_premise: `A simple introductory conversation about ${domain} in the context of ${context}.`,
    scenario_premise_l1: `A simple introductory conversation about ${domain} in the context of ${context}.`,
    dialogue_turns: dialogueTurns,
    review_concepts_embedded: [],
  };
}