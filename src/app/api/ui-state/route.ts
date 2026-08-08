import { NextResponse } from "next/server";
import { transition, canTransition, getDefaultState } from "@/lib/uiStateMachine/machine";
import { AppUIState, UIEventType, UIStateTransitionResult } from "@/lib/uiStateMachine/types";

export interface UIStateRequest {
  action: "TRANSITION" | "CAN_TRANSITION" | "DEFAULT";
  current_state?: AppUIState;
  event?: UIEventType;
}

export interface UIStateResponse {
  action: string;
  result?: UIStateTransitionResult;
  can_transition?: boolean;
  default_state?: AppUIState;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UIStateRequest;
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const response: UIStateResponse = { action };

    switch (action) {
      case "TRANSITION": {
        if (!body.current_state || !body.event) {
          return NextResponse.json({ error: "current_state and event are required for TRANSITION" }, { status: 400 });
        }
        response.result = transition(body.current_state, body.event);
        break;
      }
      case "CAN_TRANSITION": {
        if (!body.current_state || !body.event) {
          return NextResponse.json({ error: "current_state and event are required for CAN_TRANSITION" }, { status: 400 });
        }
        response.can_transition = canTransition(body.current_state, body.event);
        break;
      }
      case "DEFAULT": {
        response.default_state = getDefaultState();
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("UI state operation failed:", error);
    return NextResponse.json({ error: "UI state operation failed" }, { status: 500 });
  }
}