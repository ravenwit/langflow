import { describe, it, expect } from "vitest";
import {
  transition,
  transitionOrThrow,
  canTransition,
  getDefaultState,
  applyUIEvent,
} from "@/lib/uiStateMachine/machine";
import { AppUIState, UIEventType } from "@/lib/uiStateMachine/types";

describe("getDefaultState", () => {
  it("starts at ONBOARDING", () => {
    expect(getDefaultState()).toBe("ONBOARDING");
  });
});

describe("Section 14 transition table — happy paths", () => {
  const cases: [AppUIState, UIEventType, AppUIState][] = [
    // Onboarding
    ["ONBOARDING", "ONBOARDING_COMPLETE", "SESSION_PREVIEW"],
    // Session preview
    ["SESSION_PREVIEW", "USER_CONFIRMS_READY", "DELIVERY_AUDITORY_VISUAL"],
    // Delivery → comprehension gate
    ["DELIVERY_AUDITORY_VISUAL", "AUDIO_COMPLETE", "COMPREHENSION_GATE"],
    // Comprehension gate branches
    ["COMPREHENSION_GATE", "USER_SELECTS_YES", "DELIVERY_AUDITORY_VISUAL"],
    ["COMPREHENSION_GATE", "USER_SELECTS_REPLAY", "DELIVERY_AUDITORY_VISUAL"],
    ["COMPREHENSION_GATE", "USER_SELECTS_EXPLAIN", "ANALYTIC_BREAKDOWN"],
    // Analytic breakdown → kinesthetic word card
    ["ANALYTIC_BREAKDOWN", "BREAKDOWN_COMPLETE", "KINESTHETIC_WORDCARD"],
    // Kinesthetic tasks → oral preparation
    ["KINESTHETIC_WORDCARD", "TASK_COMPLETE", "ORAL_PREPARATION"],
    ["KINESTHETIC_WORDCARD", "TASK_SKIPPED", "ORAL_PREPARATION"],
    ["KINESTHETIC_CLASSIFICATION", "TASK_COMPLETE", "ORAL_PREPARATION"],
    // Oral preparation branches
    ["ORAL_PREPARATION", "COUNTDOWN_COMPLETE", "ORAL_ACTIVE"],
    ["ORAL_PREPARATION", "USER_SELECTS_READY_EARLY", "ORAL_ACTIVE"],
    ["ORAL_PREPARATION", "USER_SELECTS_TYPE_INSTEAD", "STT_INPUT"],
    // Oral active branches
    ["ORAL_ACTIVE", "SPEECH_DETECTED_AND_ENDED", "FEEDBACK_DISPLAY"],
    ["ORAL_ACTIVE", "TIMEOUT_NO_SPEECH", "ORAL_PREPARATION"],
    ["ORAL_ACTIVE", "USER_ABANDONS", "STT_INPUT"],
    // STT input
    ["STT_INPUT", "SUBMISSION_COMPLETE", "FEEDBACK_DISPLAY"],
    // Feedback display branches
    ["FEEDBACK_DISPLAY", "USER_DISMISSES", "DELIVERY_AUDITORY_VISUAL"],
    ["FEEDBACK_DISPLAY", "SESSION_COMPLETE", "SESSION_DEBRIEF"],
    // Recovery break branches
    ["RECOVERY_BREAK", "BREAK_COMPLETE", "DELIVERY_AUDITORY_VISUAL"],
    ["RECOVERY_BREAK", "USER_ENDS_SESSION", "SESSION_DEBRIEF"],
    // Session debrief → app home
    ["SESSION_DEBRIEF", "USER_EXITS", "ONBOARDING"],
  ];

  it.each(cases)("%s --%s--> %s", (from, event, to) => {
    const result = transition(from, event);
    expect(result.valid).toBe(true);
    expect(result.to).toBe(to);
    expect(canTransition(from, event)).toBe(true);
    expect(transitionOrThrow(from, event)).toBe(to);
  });
});

describe("LOAD_ESCALATION injection from any active state", () => {
  const activeStates: AppUIState[] = [
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

  it.each(activeStates)("injects RECOVERY_BREAK from %s", (state) => {
    const result = transition(state, "LOAD_ESCALATION");
    expect(result.valid).toBe(true);
    expect(result.to).toBe("RECOVERY_BREAK");
  });

  it("does NOT allow LOAD_ESCALATION from non-active states", () => {
    expect(canTransition("ONBOARDING", "LOAD_ESCALATION")).toBe(false);
    expect(canTransition("RECOVERY_BREAK", "LOAD_ESCALATION")).toBe(false);
    expect(canTransition("SESSION_DEBRIEF", "LOAD_ESCALATION")).toBe(false);
    expect(canTransition("SETTINGS", "LOAD_ESCALATION")).toBe(false);
    expect(canTransition("PROFILE_REVIEW", "LOAD_ESCALATION")).toBe(false);
  });
});

describe("invalid transitions", () => {
  it("rejects illegal transitions with a descriptive error", () => {
    const result = transition("ONBOARDING", "AUDIO_COMPLETE");
    expect(result.valid).toBe(false);
    expect(result.to).toBe("ONBOARDING"); // stays put
    expect(result.error).toContain("No transition from 'ONBOARDING' on event 'AUDIO_COMPLETE'");
    expect(canTransition("ONBOARDING", "AUDIO_COMPLETE")).toBe(false);
  });

  it("rejects events that belong to a different state", () => {
    expect(transition("DELIVERY_AUDITORY_VISUAL", "TASK_COMPLETE").valid).toBe(false);
    expect(transition("COMPREHENSION_GATE", "SUBMISSION_COMPLETE").valid).toBe(false);
    expect(transition("KINESTHETIC_WORDCARD", "SPEECH_DETECTED_AND_ENDED").valid).toBe(false);
    expect(transition("ORAL_ACTIVE", "BREAKDOWN_COMPLETE").valid).toBe(false);
  });

  it("transitionOrThrow throws on invalid transition", () => {
    expect(() => transitionOrThrow("SETTINGS", "AUDIO_COMPLETE")).toThrow();
  });

  it("SETTINGS and PROFILE_REVIEW have no outbound transitions", () => {
    expect(canTransition("SETTINGS", "USER_EXITS")).toBe(false);
    expect(canTransition("PROFILE_REVIEW", "USER_EXITS")).toBe(false);
  });
});

describe("applyUIEvent", () => {
  it("applies an event object to a state", () => {
    const result = applyUIEvent("ORAL_ACTIVE", { type: "SPEECH_DETECTED_AND_ENDED", payload: { transcript: "..." } });
    expect(result.valid).toBe(true);
    expect(result.to).toBe("FEEDBACK_DISPLAY");
  });
});

describe("full user session flow", () => {
  it("walks the complete onboarding → debrief journey", () => {
    let state = getDefaultState();
    state = transitionOrThrow(state, "ONBOARDING_COMPLETE");
    state = transitionOrThrow(state, "USER_CONFIRMS_READY");

    // Turn 1: AI delivery
    state = transitionOrThrow(state, "AUDIO_COMPLETE");
    state = transitionOrThrow(state, "USER_SELECTS_YES");

    // Turn 2: User turn — comprehension → breakdown → word card → oral prep → oral active → feedback
    state = transitionOrThrow(state, "AUDIO_COMPLETE");
    state = transitionOrThrow(state, "USER_SELECTS_EXPLAIN");
    state = transitionOrThrow(state, "BREAKDOWN_COMPLETE");
    state = transitionOrThrow(state, "TASK_COMPLETE");
    state = transitionOrThrow(state, "COUNTDOWN_COMPLETE");
    state = transitionOrThrow(state, "SPEECH_DETECTED_AND_ENDED");
    state = transitionOrThrow(state, "SESSION_COMPLETE");

    expect(state).toBe("SESSION_DEBRIEF");
  });

  it("handles load escalation mid-session into recovery and back", () => {
    let state: AppUIState = "DELIVERY_AUDITORY_VISUAL";
    state = transitionOrThrow(state, "LOAD_ESCALATION"); // load monitor injects
    expect(state).toBe("RECOVERY_BREAK");
    state = transitionOrThrow(state, "BREAK_COMPLETE");
    expect(state).toBe("DELIVERY_AUDITORY_VISUAL");
  });

  it("handles type-instead and abandon paths", () => {
    expect(transitionOrThrow("ORAL_PREPARATION", "USER_SELECTS_TYPE_INSTEAD")).toBe("STT_INPUT");
    expect(transitionOrThrow("STT_INPUT", "SUBMISSION_COMPLETE")).toBe("FEEDBACK_DISPLAY");
    const abandoned: AppUIState = transitionOrThrow("ORAL_ACTIVE", "USER_ABANDONS");
    expect(abandoned).toBe("STT_INPUT");
  });
});