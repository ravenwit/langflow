import { GrammarError } from "@/lib/oral/types";

/**
 * Section 16 — Inter-Module Communication Protocol
 * Event-driven internal bus. All modules communicate via structured Event objects.
 * No module calls another module's functions directly (except the Orchestrator M09).
 */

export type EventType =
  | "LOAD_ESCALATION"
  | "LOAD_OK"
  | "LOAD_UNDERSTIMULATION"
  | "TURN_COMPLETE"
  | "ERROR_DETECTED"
  | "ANXIETY_SIGNAL"
  | "PHASE_ADVANCE"
  | "SCENARIO_READY"
  | "AUDIO_COMPLETE"
  | "TASK_COMPLETE"
  | "ORAL_OUTPUT_COMPLETE"
  | "STT_COMPLETE"
  | "SESSION_END";

export type SourceModule =
  | "M01_UserProfileEngine"
  | "M02_MasteryDatabase"
  | "M03_ScenarioGenerator"
  | "M04_DeliveryEngine"
  | "M05_KinestheticEngine"
  | "M06_OralOutputEngine"
  | "M07_CognitiveLoadMonitor"
  | "M08_ProgressionEngine"
  | "M09_SessionOrchestrator"
  | "M10_FeedbackEngine";

export interface SessionEvent {
  event_id: string;
  timestamp: string;
  source_module: SourceModule;
  target_module: SourceModule | "*";
  event_type: EventType;
  payload: Record<string, unknown>;
}

export type EventHandler = (event: SessionEvent) => void;

interface Subscription {
  handler: EventHandler;
  once: boolean;
}

export class EventBus {
  private subscriptions = new Map<SourceModule | "*", Subscription[]>();

  /**
   * Publishes an event to all subscribed modules.
   * Delivers to the specific target module first (if subscribed), then global "*" subscribers.
   */
  publish(event: SessionEvent): void {
    const timestamp = new Date().toISOString();
    const fullEvent: SessionEvent = {
      ...event,
      event_id: event.event_id || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: event.timestamp || timestamp,
    };

    const targets: (SourceModule | "*")[] = [];
    if (event.target_module !== "*") {
      targets.push(event.target_module);
    }
    targets.push("*");

    for (const target of targets) {
      const subs = this.subscriptions.get(target);
      if (!subs) continue;
      for (const sub of [...subs]) {
        sub.handler(fullEvent);
        if (sub.once) {
          this.unsubscribe(target, sub.handler);
        }
      }
    }
  }

  subscribe(module: SourceModule | "*", handler: EventHandler): () => void {
    const existing = this.subscriptions.get(module) || [];
    existing.push({ handler, once: false });
    this.subscriptions.set(module, existing);
    return () => this.unsubscribe(module, handler);
  }

  subscribeOnce(module: SourceModule | "*", handler: EventHandler): () => void {
    const existing = this.subscriptions.get(module) || [];
    existing.push({ handler, once: true });
    this.subscriptions.set(module, existing);
    return () => this.unsubscribe(module, handler);
  }

  unsubscribe(module: SourceModule | "*", handler: EventHandler): void {
    const subs = this.subscriptions.get(module);
    if (!subs) return;
    const remaining = subs.filter((s) => s.handler !== handler);
    if (remaining.length === 0) {
      this.subscriptions.delete(module);
    } else {
      this.subscriptions.set(module, remaining);
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }

  subscriberCount(module: SourceModule | "*"): number {
    return (this.subscriptions.get(module) || []).length;
  }
}

export function createEvent(
  sourceModule: SourceModule,
  targetModule: SourceModule | "*",
  eventType: EventType,
  payload: Record<string, unknown> = {}
): SessionEvent {
  return {
    event_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    source_module: sourceModule,
    target_module: targetModule,
    event_type: eventType,
    payload,
  };
}

export function isLoadEscalationEvent(event: SessionEvent): boolean {
  return event.event_type === "LOAD_ESCALATION";
}

export function errorPayload(errors: GrammarError[]): Record<string, unknown> {
  return { errors: errors as unknown as Record<string, unknown>[] };
}