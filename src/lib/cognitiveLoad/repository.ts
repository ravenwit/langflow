import { createClient } from "@supabase/supabase-js";
import { CognitiveLoadRepositoryRecord } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertCognitiveLoadLog(record: CognitiveLoadRepositoryRecord): Promise<CognitiveLoadRepositoryRecord> {
  const { data, error } = await supabase
    .from("cognitive_load_logs")
    .insert({
      session_id: record.session_id,
      turn_index: record.turn_index,
      load_index: record.load_index,
      load_level: record.load_level,
      latency_ratio: record.latency_ratio,
      error_signal: record.error_signal,
      replay_signal: record.replay_signal,
      skip_signal: record.skip_signal,
      codeswitching_signal: record.codeswitching_signal,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert cognitive load log: ${error?.message}`);
  }
  return data as CognitiveLoadRepositoryRecord;
}

export async function getCognitiveLoadLogsBySession(sessionId: string): Promise<CognitiveLoadRepositoryRecord[]> {
  const { data, error } = await supabase
    .from("cognitive_load_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: true });

  if (error) {
    console.error("Failed to list cognitive load logs:", error);
    return [];
  }
  return (data ?? []) as CognitiveLoadRepositoryRecord[];
}