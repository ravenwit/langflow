import { createClient } from "@supabase/supabase-js";
import { Scenario } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertScenario(scenario: Scenario): Promise<Scenario> {
  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      scenario_id: scenario.scenario_id,
      generated_at: scenario.generated_at,
      domain_tag: scenario.domain_tag,
      context_tag: scenario.context_tag,
      difficulty_level: scenario.difficulty_level,
      target_grammar_concepts: scenario.target_grammar_concepts,
      target_vocabulary: scenario.target_vocabulary,
      scenario_premise: scenario.scenario_premise,
      scenario_premise_l1: scenario.scenario_premise_l1,
      dialogue_turns: scenario.dialogue_turns,
      review_concepts_embedded: scenario.review_concepts_embedded,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert scenario: ${error?.message}`);
  }
  return data as Scenario;
}

export async function getScenarioById(scenarioId: string): Promise<Scenario | null> {
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("scenario_id", scenarioId)
    .single();

  if (error || !data) {
    return null;
  }
  return data as Scenario;
}

export async function listScenariosByUser(userId: string, limit: number = 20): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to list scenarios:", error);
    return [];
  }
  return (data ?? []) as Scenario[];
}