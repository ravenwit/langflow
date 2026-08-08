import { NextResponse } from "next/server";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { deliverTurn, handleComprehensionGate } from "@/lib/delivery/delivery";
import { buildSyntheticReconstruction, buildAnalyticSteps } from "@/lib/delivery/breakdown";

export interface DeliveryRequest {
  turn: DialogueTurn;
  scaffolding_config: ScaffoldingConfig;
  replay_count?: number;
  choice?: "YES" | "REPLAY" | "EXPLAIN";
}

export interface DeliveryResponse {
  plan: {
    audio_ref: string | null;
    text_de: string;
    text_l1: string | null;
    show_l1_translation: boolean;
    show_grammar_labels: boolean;
    show_visual_cue: boolean;
    visual_cue_ref: string | null;
    word_highlight_timings: { word: string; start_ms: number; end_ms: number }[];
  };
  gate_result: {
    next_action: "PROCEED" | "REPLAY" | "BREAKDOWN" | "RECOVERY";
    replay_count: number;
    cognitive_load_escalation: boolean;
  };
  breakdown: {
    analytic_steps: { part_text: string; grammatical_role: string; explanation: string; pause_ms: number }[];
    synthetic_word_cards: { word_de: string; grammatical_role: string; correct_position: number }[];
    synthetic_presorted: boolean;
  } | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeliveryRequest;

    const { turn, scaffolding_config, replay_count = 0, choice } = body;

    if (!turn || !scaffolding_config) {
      return NextResponse.json({ error: "turn and scaffolding_config are required" }, { status: 400 });
    }

    const { plan, gateResult } = deliverTurn(turn, scaffolding_config, replay_count);

    let breakdown = null;
    if (choice === "EXPLAIN") {
      const gate = handleComprehensionGate("EXPLAIN", replay_count);
      breakdown = {
        analytic_steps: buildAnalyticSteps(turn),
        synthetic_word_cards: buildSyntheticReconstruction(turn, scaffolding_config).synthetic_word_cards,
        synthetic_presorted: buildSyntheticReconstruction(turn, scaffolding_config).synthetic_presorted,
      };
    } else if (choice === "YES" || choice === "REPLAY") {
      handleComprehensionGate(choice, replay_count);
    }

    const response: DeliveryResponse = {
      plan,
      gate_result: {
        next_action: gateResult.next_action,
        replay_count: gateResult.replay_count,
        cognitive_load_escalation: gateResult.cognitive_load_escalation,
      },
      breakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delivery failed:", error);
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}