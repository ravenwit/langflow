import { createClient } from "@supabase/supabase-js";
import { OralPerformanceRecord } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertOralPerformance(record: OralPerformanceRecord & { performance_id: string; turn_id?: string; session_id?: string }): Promise<unknown> {
  const { data, error } = await supabase
    .from("oral_performances")
    .insert({
      performance_id: record.performance_id,
      turn_id: record.turn_id,
      session_id: record.session_id,
      response_latency_ms: record.response_latency_ms,
      lexical_score: record.lexical_score,
      grammar_errors: record.grammar_errors,
      pronunciation_score: record.pronunciation_score,
      l1_insertions: record.l1_insertions,
      completion_method: record.completion_method,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert oral performance: ${error?.message}`);
  }
  return data;
}

export async function getOralPerformancesBySession(sessionId: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("oral_performances")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to list oral performances:", error);
    return [];
  }
  return (data ?? []) as unknown[];
}