import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { buildDeliveryChannelPlan } from "./synchronization";
import { ComprehensionGateResult, DeliveryChannelPlan, DeliveryResult } from "./types";

const MAX_REPLAYS_BEFORE_ESCALATION = 3;

export function handleComprehensionGate(choice: "YES" | "REPLAY" | "EXPLAIN", replayCount: number): ComprehensionGateResult {
  switch (choice) {
    case "YES":
      return {
        next_action: "PROCEED",
        replay_count: replayCount,
        cognitive_load_escalation: false,
      };
    case "REPLAY": {
      const newReplayCount = replayCount + 1;
      return {
        next_action: "REPLAY",
        replay_count: newReplayCount,
        cognitive_load_escalation: newReplayCount > MAX_REPLAYS_BEFORE_ESCALATION,
      };
    }
    case "EXPLAIN":
      return {
        next_action: "BREAKDOWN",
        replay_count: replayCount,
        cognitive_load_escalation: false,
      };
    default:
      return {
        next_action: "PROCEED",
        replay_count: replayCount,
        cognitive_load_escalation: false,
      };
  }
}

export function deliverTurn(turn: DialogueTurn, scaffolding: ScaffoldingConfig, replayCount: number = 0): { plan: DeliveryChannelPlan; gateResult: ComprehensionGateResult } {
  const plan = buildDeliveryChannelPlan(turn, scaffolding);
  const gateResult: ComprehensionGateResult = {
    next_action: "PROCEED",
    replay_count: replayCount,
    cognitive_load_escalation: false,
  };
  return { plan, gateResult };
}

export function buildDeliveryResult(gateResult: ComprehensionGateResult): DeliveryResult {
  return {
    comprehension_confirmed: gateResult.next_action === "PROCEED",
    replay_count: gateResult.replay_count,
    cognitive_load_escalation: gateResult.cognitive_load_escalation,
    next_action: gateResult.next_action === "REPLAY" ? "REPLAY" : gateResult.next_action === "BREAKDOWN" ? "BREAKDOWN" : gateResult.cognitive_load_escalation ? "RECOVERY" : "PROCEED",
  };
}