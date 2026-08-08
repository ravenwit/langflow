import { ModalityChainState } from "@/lib/delivery/types";
import { TurnPerformance } from "@/lib/mastery/types";
import { ScaffoldingConfig } from "@/lib/scenario/types";

export type { ModalityChainState } from "@/lib/delivery/types";

export interface SessionState {
  session_id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  current_scenario_id?: string;
  current_turn_index: number;
  cognitive_load_index: number;
  modality_chain_state: ModalityChainState;
  code_switch_count: number;
  anxiety_events: number;
  replay_count: number;
  skipped_turns: number;
  new_items_introduced: number;
  performance_log: TurnPerformance[];
  new_items_introduced_this_session: number;
  current_scaffolding?: ScaffoldingConfig;
}

export interface SessionSummary {
  session_id: string;
  user_id: string;
  total_turns: number;
  mean_response_latency_ms: number;
  error_count: number;
  code_switch_count: number;
  mastery_improvements: number;
  new_items_learned: number;
  completed_at: Date;
}

export interface SessionPreview {
  domain_tag: string;
  context_tag: string;
  target_grammar_concepts: string[];
  estimated_duration_minutes: number;
}

export interface SessionInitResult {
  session: SessionState;
  preview: SessionPreview;
  scaffolding: Record<string, unknown>;
}