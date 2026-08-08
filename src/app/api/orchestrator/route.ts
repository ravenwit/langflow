import { NextResponse } from "next/server";
import { initializeSessionState } from "@/lib/orchestrator/sessionInit";
import { advanceSessionLoop, applyRecovery, resumeAfterRecovery } from "@/lib/orchestrator/sessionLoop";
import { buildSessionSummary, closeSession } from "@/lib/orchestrator/sessionClose";
import { SessionState } from "@/lib/orchestrator/types";
import { Scenario, ScaffoldingConfig } from "@/lib/scenario/types";

export interface OrchestratorRequest {
  action: "INIT" | "ADVANCE" | "APPLY_RECOVERY" | "RESUME_RECOVERY" | "CLOSE";
  session?: SessionState;
  session_id?: string;
  user_id?: string;
  scenario?: Scenario;
  scenario_id?: string;
  estimated_duration_minutes?: number;
  average_processing_lag_ms?: number;
  current_code_switch_rate?: number;
  phase_expected_switch_rate?: number;
  current_scaffolding?: ScaffoldingConfig;
}

export interface OrchestratorResponse {
  action: string;
  session?: SessionState;
  summary?: {
    session_id: string;
    user_id: string;
    total_turns: number;
    mean_response_latency_ms: number;
    error_count: number;
    code_switch_count: number;
    mastery_improvements: number;
    new_items_learned: number;
    completed_at: string;
  };
  preview?: {
    domain_tag: string;
    context_tag: string;
    target_grammar_concepts: string[];
    estimated_duration_minutes: number;
  };
  scaffolding?: Record<string, unknown>;
  load_index?: number;
  load_level?: string;
  comprehension_gate_action?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrchestratorRequest;
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const response: OrchestratorResponse = { action };

    switch (action) {
      case "INIT": {
        if (!body.session_id || !body.user_id) {
          return NextResponse.json({ error: "session_id and user_id are required for INIT" }, { status: 400 });
        }
        const initResult = initializeSessionState({
          session_id: body.session_id,
          user_id: body.user_id,
          scenario_id: body.scenario_id,
          estimated_duration_minutes: body.estimated_duration_minutes,
        });
        response.session = initResult.session;
        response.preview = initResult.preview;
        response.scaffolding = initResult.scaffolding;
        break;
      }
      case "ADVANCE": {
        if (!body.session || !body.scenario) {
          return NextResponse.json({ error: "session and scenario are required for ADVANCE" }, { status: 400 });
        }
        const result = advanceSessionLoop({
          session: body.session,
          scenario: body.scenario,
          current_scaffolding: body.current_scaffolding ?? {
            show_l1_translation: true,
            show_grammar_labels: true,
            word_cards_presorted: true,
            oral_prep_time_seconds: 30,
            codeswitching_invite_shown: true,
          },
          average_processing_lag_ms: body.average_processing_lag_ms ?? 2000,
          current_code_switch_rate: body.current_code_switch_rate ?? 0,
          phase_expected_switch_rate: body.phase_expected_switch_rate ?? 0.3,
        });
        response.session = result.session;
        response.load_index = result.load_index;
        response.load_level = result.load_level;
        response.comprehension_gate_action = result.comprehension_gate_action;
        break;
      }
      case "APPLY_RECOVERY": {
        if (!body.session) {
          return NextResponse.json({ error: "session is required for APPLY_RECOVERY" }, { status: 400 });
        }
        const recovered = applyRecovery({ session: body.session });
        response.session = recovered;
        break;
      }
      case "RESUME_RECOVERY": {
        if (!body.session) {
          return NextResponse.json({ error: "session is required for RESUME_RECOVERY" }, { status: 400 });
        }
        const resumed = resumeAfterRecovery({ session: body.session });
        response.session = resumed;
        break;
      }
      case "CLOSE": {
        if (!body.session) {
          return NextResponse.json({ error: "session is required for CLOSE" }, { status: 400 });
        }
        const closed = closeSession(body.session);
        const summary = buildSessionSummary(closed);
        response.session = closed;
        response.summary = {
          ...summary,
          completed_at: summary.completed_at.toISOString(),
        };
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Orchestrator operation failed:", error);
    return NextResponse.json({ error: "Orchestrator operation failed" }, { status: 500 });
  }
}