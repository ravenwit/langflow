import { createClient } from "@supabase/supabase-js";
import { VocabularyItem, GrammarConcept, UserProfile, SessionState, CefrLevel } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getVocabularyItems(userId: string): Promise<VocabularyItem[]> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch vocabulary items:", error);
    return [];
  }
  return (data ?? []) as VocabularyItem[];
}

export async function getGrammarConcepts(): Promise<GrammarConcept[]> {
  const { data, error } = await supabase
    .from("grammar_concepts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch grammar concepts:", error);
    return [];
  }
  return (data ?? []) as GrammarConcept[];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
  return data as UserProfile;
}

export async function getActiveSession(userId: string): Promise<SessionState | null> {
  const { data, error } = await supabase
    .from("session_states")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as SessionState;
}

export async function createSession(userId: string): Promise<SessionState> {
  const { data, error } = await supabase
    .from("session_states")
    .insert({ user_id: userId })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }
  return data as SessionState;
}

export async function updateSession(session: Partial<SessionState> & { session_id: string }): Promise<void> {
  const { error } = await supabase
    .from("session_states")
    .update(session)
    .eq("session_id", session.session_id);

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }
}

export async function insertVocabularyItem(item: Omit<VocabularyItem, "id" | "created_at" | "updated_at">): Promise<VocabularyItem> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .insert(item as any)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert vocabulary item: ${error?.message}`);
  }
  return data as VocabularyItem;
}

export async function updateVocabularyItem(id: string, updates: Partial<VocabularyItem>): Promise<void> {
  const { error } = await supabase
    .from("vocabulary_items")
    .update(updates as any)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update vocabulary item: ${error.message}`);
  }
}

export async function insertGrammarConcept(concept: Omit<GrammarConcept, "concept_id" | "created_at" | "updated_at">): Promise<GrammarConcept> {
  const { data, error } = await supabase
    .from("grammar_concepts")
    .insert(concept as any)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert grammar concept: ${error?.message}`);
  }
  return data as GrammarConcept;
}

export async function updateGrammarConcept(conceptId: string, updates: Partial<GrammarConcept>): Promise<void> {
  const { error } = await supabase
    .from("grammar_concepts")
    .update(updates as any)
    .eq("concept_id", conceptId);

  if (error) {
    throw new Error(`Failed to update grammar concept: ${error.message}`);
  }
}