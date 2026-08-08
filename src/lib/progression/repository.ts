import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function insertProgressionLog(params: {
  session_id: string;
  user_id: string;
  current_month_phase: number;
  mastery_percentage: number;
  sessions_in_phase: number;
  ready_to_advance: boolean;
}): Promise<unknown> {
  const { data, error } = await supabase
    .from("progression_logs")
    .insert({
      session_id: params.session_id,
      user_id: params.user_id,
      current_month_phase: params.current_month_phase,
      mastery_percentage: params.mastery_percentage,
      sessions_in_phase: params.sessions_in_phase,
      ready_to_advance: params.ready_to_advance,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert progression log: ${error?.message}`);
  }
  return data;
}

export async function getProgressionLogsBySession(sessionId: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("progression_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to list progression logs:", error);
    return [];
  }
  return (data ?? []) as unknown[];
}