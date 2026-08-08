import { MasteryProgress, CefrLevel } from "./types";

const PHASE_TO_CEFR: Record<number, CefrLevel> = {
  1: "A1",
  2: "A1",
  3: "A2",
  4: "A2",
  5: "B1",
  6: "B1",
};

export function evaluateProgressionGate(params: {
  current_month_phase: number;
  total_current_phase_items: number;
  mastered_items: number;
  sessions_in_phase: number;
  current_oral_comfort: number;
}): MasteryProgress {
  const current_phase_cefr = PHASE_TO_CEFR[params.current_month_phase] || "A1";
  const mastery_percentage = params.total_current_phase_items > 0 ? params.mastered_items / params.total_current_phase_items : 0;
  const min_sessions_required = 15;
  const oral_comfort_threshold = 0.6;

  const ready_to_advance =
    mastery_percentage >= 0.8 &&
    params.sessions_in_phase >= min_sessions_required &&
    params.current_oral_comfort >= oral_comfort_threshold;

  return {
    current_phase_cefr,
    total_current_phase_items: params.total_current_phase_items,
    mastered_items: params.mastered_items,
    mastery_percentage,
    sessions_in_phase: params.sessions_in_phase,
    min_sessions_required,
    oral_comfort_threshold,
    current_oral_comfort: params.current_oral_comfort,
    ready_to_advance,
  };
}