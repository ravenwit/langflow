import { AppUIState, UIEvent, UIEventType, UIStateTransitionResult } from "./types";

/**
 * Section 14 — UI State Machine transition table.
 * Implements every arrow in the blueprint's TRANSITIONS block.
 */

// States that are "active" during a session — the load monitor can inject
// RECOVERY_BREAK from any of these (Section 14: ANY_ACTIVE_STATE → LOAD_ESCALATION → RECOVERY_BREAK).
const ACTIVE_SESSION_STATES: AppUIState[] = [
  "SESSION_PREVIEW",
  "DELIVERY_AUDITORY_VISUAL",
  "COMPREHENSION_GATE",
  "ANALYTIC_BREAKDOWN",
  "KINESTHETIC_WORDCARD",
  "KINESTHETIC_CLASSIFICATION",
  "ORAL_PREPARATION",
  "ORAL_ACTIVE",
  "STT_INPUT",
  "FEEDBACK_DISPLAY",
];

type TransitionMap = Partial<Record<UIEventType, AppUIState>>;

const TRANSITIONS: Record<AppUIState, TransitionMap> = {
  ONBOARDING: {
    ONBOARDING_COMPLETE: "SESSION_PREVIEW",
  },
  SESSION_PREVIEW: {
    USER_CONFIRMS_READY: "DELIVERY_AUDITORY_VISUAL",
  },
  DELIVERY_AUDITORY_VISUAL: {
    AUDIO_COMPLETE: "COMPREHENSION_GATE",
  },
  COMPREHENSION_GATE: {
    USER_SELECTS_YES: "DELIVERY_AUDITORY_VISUAL", // next turn routing
    USER_SELECTS_REPLAY: "DELIVERY_AUDITORY_VISUAL",
    USER_SELECTS_EXPLAIN: "ANALYTIC_BREAKDOWN",
  },
  ANALYTIC_BREAKDOWN: {
    BREAKDOWN_COMPLETE: "KINESTHETIC_WORDCARD",
  },
  KINESTHETIC_WORDCARD: {
    TASK_COMPLETE: "ORAL_PREPARATION",
    TASK_SKIPPED: "ORAL_PREPARATION",
  },
  KINESTHETIC_CLASSIFICATION: {
    TASK_COMPLETE: "ORAL_PREPARATION",
  },
  ORAL_PREPARATION: {
    COUNTDOWN_COMPLETE: "ORAL_ACTIVE",
    USER_SELECTS_READY_EARLY: "ORAL_ACTIVE",
    USER_SELECTS_TYPE_INSTEAD: "STT_INPUT",
  },
  ORAL_ACTIVE: {
    SPEECH_DETECTED_AND_ENDED: "FEEDBACK_DISPLAY",
    TIMEOUT_NO_SPEECH: "ORAL_PREPARATION", // reset with extra time
    USER_ABANDONS: "STT_INPUT",
  },
  STT_INPUT: {
    SUBMISSION_COMPLETE: "FEEDBACK_DISPLAY",
  },
  FEEDBACK_DISPLAY: {
    USER_DISMISSES: "DELIVERY_AUDITORY_VISUAL", // next turn
    SESSION_COMPLETE: "SESSION_DEBRIEF",
  },
  RECOVERY_BREAK: {
    BREAK_COMPLETE: "DELIVERY_AUDITORY_VISUAL", // reduced complexity
    USER_ENDS_SESSION: "SESSION_DEBRIEF",
  },
  SESSION_DEBRIEF: {
    USER_EXITS: "ONBOARDING", // App Home
  },
  SETTINGS: {},
  PROFILE_REVIEW: {},
};

/**
 * Returns the default/initial app state.
 */
export function getDefaultState(): AppUIState {
  return "ONBOARDING";
}

/**
 * Returns whether a transition is valid for the given state/event pair.
 */
export function canTransition(from: AppUIState, event: UIEventType): boolean {
  // Load monitor can inject RECOVERY_BREAK from any active session state.
  if (event === "LOAD_ESCALATION" && ACTIVE_SESSION_STATES.includes(from)) {
    return true;
  }
  return TRANSITIONS[from][event] !== undefined;
}

/**
 * Computes the next state for a given state/event pair.
 * Returns a result object; never throws. Invalid transitions return valid: false.
 */
export function transition(from: AppUIState, event: UIEventType): UIStateTransitionResult {
  // Load monitor injection: any active state → RECOVERY_BREAK.
  if (event === "LOAD_ESCALATION" && ACTIVE_SESSION_STATES.includes(from)) {
    return { from, to: "RECOVERY_BREAK", event, valid: true };
  }

  const next = TRANSITIONS[from][event];
  if (next === undefined) {
    return {
      from,
      to: from,
      event,
      valid: false,
      error: `No transition from '${from}' on event '${event}'`,
    };
  }

  return { from, to: next, event, valid: true };
}

/**
 * Convenience wrapper that throws on invalid transitions (for strict callers).
 */
export function transitionOrThrow(from: AppUIState, event: UIEventType): AppUIState {
  const result = transition(from, event);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return result.to;
}

/**
 * Applies a UIEvent object (with optional payload) to a state.
 */
export function applyUIEvent(from: AppUIState, uiEvent: UIEvent): UIStateTransitionResult {
  return transition(from, uiEvent.type);
}