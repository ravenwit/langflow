import { describe, it, expect } from "vitest";
import { buildFeedback } from "@/lib/feedback/builder";
import { deliverFeedback, formatFeedbackMessage } from "@/lib/feedback/delivery";
import { TurnPerformance } from "@/lib/feedback/types";

function makePerformance(overrides: Partial<TurnPerformance> = {}): TurnPerformance {
  return {
    turn_id: "turn-1",
    response_latency_ms: 2500,
    errors_detected: [],
    l1_insertions: [],
    completion_method: "ORAL",
    scaffolding_used: true,
    ...overrides,
  };
}

describe("buildFeedback", () => {
  it("leads with positive message when lexical score is high", () => {
    const feedback = buildFeedback(makePerformance({ lexical_score: 0.85 }));
    expect(feedback.primary_message).toBe("Your meaning came through clearly.");
  });

  it("uses encouraging message when lexical score is low", () => {
    const feedback = buildFeedback(makePerformance({ lexical_score: 0.4 }));
    expect(feedback.primary_message).toBe("Good effort — let's look at this together.");
  });

  it("defaults to encouraging message when lexical score is absent", () => {
    const feedback = buildFeedback(makePerformance());
    expect(feedback.primary_message).toBe("Good effort — let's look at this together.");
  });

  it("builds a recast correction for a grammar error", () => {
    const feedback = buildFeedback(
      makePerformance({
        errors_detected: [
          {
            error_type: "CONJUGATION",
            incorrect_form: "Ich habe das Buch geliest",
            correct_form: "Ich habe das Buch gelesen",
            concept_id: "c1",
            severity: "MODERATE",
          },
        ],
      }),
      "Ich habe das Buch gelesen"
    );
    expect(feedback.grammar_correction).toContain("gelesen");
    expect(feedback.rule_reminder).toBeTruthy();
  });

  it("selects the most severe error when multiple are present", () => {
    const feedback = buildFeedback(
      makePerformance({
        errors_detected: [
          {
            error_type: "GENDER",
            incorrect_form: "der Buch",
            correct_form: "das Buch",
            concept_id: "c1",
            severity: "MINOR",
          },
          {
            error_type: "WORD_ORDER",
            incorrect_form: "Buch ich habe",
            correct_form: "Ich habe das Buch",
            concept_id: "c2",
            severity: "CRITICAL",
          },
        ],
      })
    );
    // CRITICAL WORD_ORDER should be prioritized over MINOR GENDER
    expect(feedback.grammar_correction).toContain("Ich habe das Buch");
  });

  it("adds pronunciation note when problem phonemes exist", () => {
    const feedback = buildFeedback(
      makePerformance({
        pronunciation_score: {
          score: 0.6,
          problem_phonemes: [{ ipa: "ç", description: "ich-Laut" }],
        },
      })
    );
    expect(feedback.pronunciation_note).toContain("/ç/");
  });

  it("omits pronunciation note when no problem phonemes", () => {
    const feedback = buildFeedback(
      makePerformance({
        pronunciation_score: { score: 0.9, problem_phonemes: [] },
      })
    );
    expect(feedback.pronunciation_note).toBeUndefined();
  });

  it("resolves code-switch insertions to German equivalents", () => {
    const feedback = buildFeedback(
      makePerformance({
        l1_insertions: ["book", "water"],
      })
    );
    expect(feedback.codeswitching_note).toEqual(["book → Buch", "water → Wasser"]);
  });

  it("returns empty feedback for a clean performance", () => {
    const feedback = buildFeedback(makePerformance({ lexical_score: 0.9 }));
    expect(feedback.grammar_correction).toBeUndefined();
    expect(feedback.rule_reminder).toBeUndefined();
    expect(feedback.pronunciation_note).toBeUndefined();
    expect(feedback.codeswitching_note).toBeUndefined();
  });
});

describe("deliverFeedback", () => {
  it("marks feedback as delivered", () => {
    const result = deliverFeedback({ primary_message: "Good effort." });
    expect(result.delivered).toBe(true);
  });
});

describe("formatFeedbackMessage", () => {
  it("formats all components into a single message", () => {
    const message = formatFeedbackMessage({
      primary_message: "Your meaning came through clearly.",
      grammar_correction: "Ah, Ich habe das Buch gelesen — genau!",
      rule_reminder: "The verb ending must agree with the subject.",
      pronunciation_note: "Watch the sound /ç/.",
      codeswitching_note: ["book → Buch"],
    });
    expect(message).toContain("Your meaning came through clearly.");
    expect(message).toContain("gelesen");
    expect(message).toContain("Rule:");
    expect(message).toContain("/ç/");
    expect(message).toContain("Vocabulary:");
  });
});