export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface MasteryProgress {
  current_phase_cefr: CefrLevel;
  total_current_phase_items: number;
  mastered_items: number;
  mastery_percentage: number;
  sessions_in_phase: number;
  min_sessions_required: number;
  oral_comfort_threshold: number;
  current_oral_comfort: number;
  ready_to_advance: boolean;
}

export interface ReviewScheduleResult {
  item_id: string;
  item_type: "VOCABULARY" | "GRAMMAR";
  next_review_due: Date;
  interval_days: number;
}