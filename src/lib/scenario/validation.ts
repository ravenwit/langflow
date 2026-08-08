 import { Scenario, DialogueTurn } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateScenario(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Scenario must be an object"] };
  }

  const scenario = data as Record<string, unknown>;

  const requiredFields = [
    "scenario_id",
    "generated_at",
    "domain_tag",
    "context_tag",
    "difficulty_level",
    "target_grammar_concepts",
    "target_vocabulary",
    "scenario_premise",
    "scenario_premise_l1",
    "dialogue_turns",
    "review_concepts_embedded",
  ];

  for (const field of requiredFields) {
    if (!(field in scenario)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (scenario.difficulty_level && !["A1", "A2", "B1", "B2", "C1", "C2"].includes(scenario.difficulty_level as string)) {
    errors.push(`Invalid difficulty_level: ${scenario.difficulty_level}`);
  }

  if (Array.isArray(scenario.dialogue_turns)) {
    scenario.dialogue_turns.forEach((turn: unknown, index: number) => {
      const turnErrors = validateDialogueTurn(turn, index);
      errors.push(...turnErrors);
    });
  } else if (scenario.dialogue_turns !== undefined) {
    errors.push("dialogue_turns must be an array");
  }

  return { valid: errors.length === 0, errors };
}

function validateDialogueTurn(turn: unknown, index: number): string[] {
  const errors: string[] = [];
  const t = turn as Record<string, unknown>;

  const requiredTurnFields = ["speaker", "text_de", "text_l1"];
  for (const field of requiredTurnFields) {
    if (!(field in t)) {
      errors.push(`Turn ${index}: missing field ${field}`);
    }
  }

  if (t.speaker && !["AI_AGENT", "USER"].includes(t.speaker as string)) {
    errors.push(`Turn ${index}: invalid speaker ${t.speaker}`);
  }

  if (typeof t.text_de !== "string" || t.text_de.trim().length === 0) {
    errors.push(`Turn ${index}: text_de must be a non-empty string`);
  }

  if (typeof t.text_l1 !== "string" || t.text_l1.trim().length === 0) {
    errors.push(`Turn ${index}: text_l1 must be a non-empty string`);
  }

  return errors;
}

export function ensureScenarioDefaults(data: Record<string, unknown>): Scenario {
  return {
    scenario_id: (data.scenario_id as string) || "",
    generated_at: (data.generated_at as string) || new Date().toISOString(),
    domain_tag: (data.domain_tag as string) || "",
    context_tag: (data.context_tag as string) || "",
    difficulty_level: (data.difficulty_level as Scenario["difficulty_level"]) || "A1",
    target_grammar_concepts: (data.target_grammar_concepts as string[]) || [],
    target_vocabulary: (data.target_vocabulary as string[]) || [],
    scenario_premise: (data.scenario_premise as string) || "",
    scenario_premise_l1: (data.scenario_premise_l1 as string) || "",
    dialogue_turns: (data.dialogue_turns as DialogueTurn[]) || [],
    review_concepts_embedded: (data.review_concepts_embedded as string[]) || [],
  };
}