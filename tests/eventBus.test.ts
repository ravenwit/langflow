import { describe, it, expect, vi } from "vitest";
import { EventBus, createEvent, isLoadEscalationEvent, SessionEvent } from "@/lib/events/bus";

describe("EventBus", () => {
  it("delivers events to the target module subscriber", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("M07_CognitiveLoadMonitor", handler);

    bus.publish(
      createEvent("M05_KinestheticEngine", "M07_CognitiveLoadMonitor", "TASK_COMPLETE", { turn_index: 2 })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as SessionEvent;
    expect(event.event_type).toBe("TASK_COMPLETE");
    expect(event.source_module).toBe("M05_KinestheticEngine");
    expect(event.payload.turn_index).toBe(2);
  });

  it("does not deliver to non-target subscribers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("M10_FeedbackEngine", handler);

    bus.publish(createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("delivers to wildcard '*' subscribers for any module", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("*", handler);

    bus.publish(createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION"));
    bus.publish(createEvent("M03_ScenarioGenerator", "M04_DeliveryEngine", "SCENARIO_READY"));

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("supports one-time subscriptions", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribeOnce("M09_SessionOrchestrator", handler);

    bus.publish(createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION"));
    bus.publish(createEvent("M08_ProgressionEngine", "M09_SessionOrchestrator", "PHASE_ADVANCE"));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes handlers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe("M09_SessionOrchestrator", handler);

    unsubscribe();
    bus.publish(createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("tracks subscriber count per module", () => {
    const bus = new EventBus();
    bus.subscribe("M09_SessionOrchestrator", () => {});
    bus.subscribe("M09_SessionOrchestrator", () => {});
    bus.subscribe("*", () => {});
    expect(bus.subscriberCount("M09_SessionOrchestrator")).toBe(2);
    expect(bus.subscriberCount("*")).toBe(1);
  });

  it("clear removes all subscriptions", () => {
    const bus = new EventBus();
    bus.subscribe("*", () => {});
    bus.subscribe("M09_SessionOrchestrator", () => {});
    bus.clear();
    expect(bus.subscriberCount("*")).toBe(0);
    expect(bus.subscriberCount("M09_SessionOrchestrator")).toBe(0);
  });

  it("assigns event_id and timestamp when missing", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe("*", handler);
    bus.publish({
      event_id: "",
      timestamp: "",
      source_module: "M07_CognitiveLoadMonitor",
      target_module: "*",
      event_type: "LOAD_OK",
      payload: {},
    } as SessionEvent);
    const event = handler.mock.calls[0][0] as SessionEvent;
    expect(event.event_id).toBeTruthy();
    expect(event.timestamp).toBeTruthy();
  });
});

describe("createEvent", () => {
  it("creates a structured event with type and payload", () => {
    const event = createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION", { load_index: 0.9 });
    expect(event.source_module).toBe("M07_CognitiveLoadMonitor");
    expect(event.target_module).toBe("M09_SessionOrchestrator");
    expect(event.event_type).toBe("LOAD_ESCALATION");
    expect(event.payload.load_index).toBe(0.9);
  });
});

describe("isLoadEscalationEvent", () => {
  it("returns true for LOAD_ESCALATION events", () => {
    const event = createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_ESCALATION");
    expect(isLoadEscalationEvent(event)).toBe(true);
  });

  it("returns false for other events", () => {
    const event = createEvent("M07_CognitiveLoadMonitor", "M09_SessionOrchestrator", "LOAD_OK");
    expect(isLoadEscalationEvent(event)).toBe(false);
  });
});