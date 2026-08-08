import { NextResponse } from "next/server";
import { scheduleNextReview } from "@/lib/progression/spacedRepetition";
import { evaluateProgressionGate } from "@/lib/progression/progressionGate";

export interface ProgressionRequest {
  action: "SCHEDULE_REVIEW" | "EVALUATE_GATE";
  mastery_score?: number;
  current_month_phase?: number;
  total_current_phase_items?: number;
  mastered_items?: number;
  sessions_in_phase?: number;
  current_oral_comfort?: number;
}

export interface ProgressionResponse {
  action: string;
  review?: {
    next_review_due: string;
    interval_days: number;
  };
  gate?: {
    current_phase_cefr: string;
    mastery_percentage: number;
    sessions_in_phase: number;
    oral_comfort_threshold: number;
    current_oral_comfort: number;
    ready_to_advance: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProgressionRequest;

    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const response: ProgressionResponse = { action };

    if (action === "SCHEDULE_REVIEW") {
      if (body.mastery_score === undefined) {
        return NextResponse.json({ error: "mastery_score is required for SCHEDULE_REVIEW" }, { status: 400 });
      }
      const result = scheduleNextReview(body.mastery_score);
      response.review = {
        next_review_due: result.next_review_due.toISOString(),
        interval_days: result.interval_days,
      };
    } else if (action === "EVALUATE_GATE") {
      const required = [
        "current_month_phase",
        "total_current_phase_items",
        "mastered_items",
        "sessions_in_phase",
        "current_oral_comfort",
      ] as const;
      const missing = required.filter((key) => body[key] === undefined);
      if (missing.length > 0) {
        return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
      }
      const gate = evaluateProgressionGate({
        current_month_phase: body.current_month_phase!,
        total_current_phase_items: body.total_current_phase_items!,
        mastered_items: body.mastered_items!,
        sessions_in_phase: body.sessions_in_phase!,
        current_oral_comfort: body.current_oral_comfort!,
      });
      response.gate = {
        current_phase_cefr: gate.current_phase_cefr,
        mastery_percentage: gate.mastery_percentage,
        sessions_in_phase: gate.sessions_in_phase,
        oral_comfort_threshold: gate.oral_comfort_threshold,
        current_oral_comfort: gate.current_oral_comfort,
        ready_to_advance: gate.ready_to_advance,
      };
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Progression operation failed:", error);
    return NextResponse.json({ error: "Progression operation failed" }, { status: 500 });
  }
}