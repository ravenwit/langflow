import { createClient } from "@supabase/supabase-js";
import { UserProfile, SessionSummary } from "@/lib/mastery/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createUserProfile(profile: Omit<UserProfile, "created_at" | "updated_at">): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert(profile as any)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create user profile: ${error?.message}`);
  }
  return data as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .update(updates as any)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }
  return data as UserProfile;
}

export async function getSessionSummaries(userId: string): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from("session_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error || !data) {
    return [];
  }
  return data as SessionSummary[];
}
