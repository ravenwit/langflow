import { describe, it, expect } from "vitest";
import {
  buildGrammarErrorDetectionPrompt,
  parseGrammarErrorsResponse,
  GRAMMAR_ERROR_DETECTION_SYSTEM,
} from "@/lib/prompts/grammarErrorDetection";
import {
  buildRecastFeedbackPrompt,
  parseRecastResponse,
  RECAST_FEEDBACK_SYSTEM,
} from "@/lib/prompts/recastFeedback";

describe("buildGrammarErrorDetectionPrompt (Section 15.2)", () => {
  it("includes the system block and all user inputs", () => {
    const prompt = buildGrammarErrorDetectionPrompt({
      user_utterance: "Ich habe das Buch geliest",
      target_sentence: "Ich habe das Buch gelesen",
      target_grammar_concept_labels: ["Perfekt tense", "Akkusativ case"],
    });
    expect(prompt).toContain(GRAMMAR_ERROR_DETECTION_SYSTEM);
    expect(prompt).toContain("Ich habe das Buch geliest");
    expect(prompt).toContain("Ich habe das Buch gelesen");
    expect(prompt).toContain("Perfekt tense, Akkusativ case");
    expect(prompt).toContain("error_type");
    expect(prompt).toContain("severity");
  });

  it("handles empty concept list", () => {
    const prompt = buildGrammarErrorDetectionPrompt({
      user_utterance: "Ich habe das Buch geliest",
      target_sentence: "Ich habe das Buch gelesen",
      target_grammar_concept_labels: [],
    });
    expect(prompt).toContain("(none specified)");
  });
});

describe("parseGrammarErrorsResponse", () => {
  it("parses a valid error list", () => {
    const errors = parseGrammarErrorsResponse(
      JSON.stringify([
        {
          error_type: "CONJUGATION",
          incorrect_form: "geliest",
          correct_form: "gelesen",
          concept_id: "c1",
          severity: "MODERATE",
        },
      ])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].error_type).toBe("CONJUGATION");
    expect(errors[0].correct_form).toBe("gelesen");
    expect(errors[0].severity).toBe("MODERATE");
  });

  it("returns empty list for empty array", () => {
    expect(parseGrammarErrorsResponse("[]")).toEqual([]);
  });

  it("returns empty list for invalid JSON", () => {
    expect(parseGrammarErrorsResponse("not json")).toEqual([]);
  });

  it("normalizes invalid enum values", () => {
    const errors = parseGrammarErrorsResponse(
      JSON.stringify([
        { error_type: "BOGUS", incorrect_form: "x", correct_form: "y", concept_id: "", severity: "EXTREME" },
      ])
    );
    expect(errors[0].error_type).toBe("OMISSION");
    expect(errors[0].severity).toBe("MODERATE");
  });

  it("filters out empty errors", () => {
    const errors = parseGrammarErrorsResponse(
      JSON.stringify([{ error_type: "CASE", incorrect_form: "", correct_form: "", concept_id: "", severity: "MINOR" }])
    );
    expect(errors).toHaveLength(0);
  });
});

describe("buildRecastFeedbackPrompt (Section 15.3)", () => {
  it("includes the system block and all user inputs", () => {
    const prompt = buildRecastFeedbackPrompt({
      incorrect_utterance: "Ich habe das Buch geliest",
      correct_form: "Ich habe das Buch gelesen",
      conversation_context: "university_collaboration",
    });
    expect(prompt).toContain(RECAST_FEEDBACK_SYSTEM);
    expect(prompt).toContain("Ich habe das Buch geliest");
    expect(prompt).toContain("Ich habe das Buch gelesen");
    expect(prompt).toContain("university_collaboration");
  });
});

describe("parseRecastResponse", () => {
  it("returns trimmed German text", () => {
    expect(parseRecastResponse("  Ah, du hast das Buch gelesen!  ")).toBe("Ah, du hast das Buch gelesen!");
  });

  it("returns null for empty response", () => {
    expect(parseRecastResponse("   ")).toBeNull();
  });

  it("returns null for JSON responses", () => {
    expect(parseRecastResponse('{"recast": "..."}')).toBeNull();
    expect(parseRecastResponse("[1,2,3]")).toBeNull();
  });
});