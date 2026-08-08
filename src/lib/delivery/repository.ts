import { createClient } from "@supabase/supabase-js";
import { TurnDeliveryLog } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertTurnDelivery(log: TurnDeliveryLog): Promise<TurnDeliveryLog> {
  const { data, error } = await supabase
    .from("turn_deliveries")
    .insert({
      log_id: log.log_id,
      turn_index: log.turn_index,
      scenario_id: log.scenario_id,
      replay_count: log.replay_count,
      comprehension_confirmed: log.comprehension_confirmed,
      cognitive_load_escalation: log.cognitive_load_escalation,
      delivered_at: log.delivered_at,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert turn delivery: ${error?.message}`);
  }
  return data as TurnDeliveryLog;
}

export async function getDeliveriesByScenario(scenarioId: string): Promise<TurnDeliveryLog[]> {
  const { data, error } = await supabase
    .from("turn_deliveries")
    .select("*")
    .eq("scenario_id", scenarioId)
    .order("delivered_at", { ascending: true });

  if (error) {
    console.error("Failed to list turn deliveries:", error);
    return [];
  }
  return (data ?? []) as TurnDeliveryLog[];
}