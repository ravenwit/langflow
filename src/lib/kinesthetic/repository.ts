import { createClient } from "@supabase/supabase-js";
import { KinestheticTaskLog } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertKinestheticTaskLog(log: KinestheticTaskLog): Promise<KinestheticTaskLog> {
  const { data, error } = await supabase
    .from("kinesthetic_task_logs")
    .insert({
      log_id: log.log_id,
      task_type: log.task_type,
      turn_index: log.turn_index,
      scenario_id: log.scenario_id,
      completion_method: log.completion_method,
      attempts_used: log.attempts_used,
      correct_count: log.correct_count,
      total_words: log.total_words,
      completed_at: log.completed_at,
      created_at: log.created_at,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert kinesthetic task log: ${error?.message}`);
  }
  return data as KinestheticTaskLog;
}

export async function getKinestheticLogsByScenario(scenarioId: string): Promise<KinestheticTaskLog[]> {
  const { data, error } = await supabase
    .from("kinesthetic_task_logs")
    .select("*")
    .eq("scenario_id", scenarioId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to list kinesthetic task logs:", error);
    return [];
  }
  return (data ?? []) as KinestheticTaskLog[];
}