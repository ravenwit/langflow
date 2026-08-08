import { GrammarError } from "@/lib/oral/types";

/**
 * Section 15.2 — Grammar Error Detection Prompt Template (grammar_error_detection_v1)
 * Builds the system + user prompt for the LLM grammar analysis call.
 */

export interface GrammarErrorDetectionInput {
  user_utterance: string;
  target_sentence: string;
  target_grammar_concept_labels: string[];
}

export const GRAMMAR_ERROR_DETECTION_SYSTEM = `
You are a precise German grammar analyst. Analyze the provided German utterance and identify grammatical errors.
Return a structured JSON list of errors only. Do not add commentary.
`;

export function buildGrammarErrorDetectionPrompt(input: GrammarErrorDetectionInput): string {
  const conceptList = input.target_grammar_concept_labels.length > 0
    ? input.target_grammar_concept_labels.join(", ")
    : "(none specified)";

  return `${GRAMMAR_ERROR_DETECTION_SYSTEM}

USER UTTERANCE: ${input.user_utterance}
TARGET SENTENCE: ${input.target_sentence}
GRAMMAR CONCEPTS BEING PRACTICED: ${conceptList}

For each error found, return:
{
    "error_type": [GENDER | CASE | CONJUGATION | WORD_ORDER | PRONUNCIATION | OMISSION],
    "incorrect_form": "...",
    "correct_form": "...",
    "concept_id": "...",
    "severity": [CRITICAL | MODERATE | MINOR]
}
If no errors: return empty list [].`;
}

/**
 * Lightweight structural validator for the LLM's grammar error response.
 * Ensures each returned error matches the GrammarError schema.
 */
export function parseGrammarErrorsResponse(rawJson: string): GrammarError[] {
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        error_type: normalizeErrorType(e.error_type),
        incorrect_form: String(e.incorrect_form ?? ""),
        correct_form: String(e.correct_form ?? ""),
        concept_id: String(e.concept_id ?? ""),
        severity: normalizeSeverity(e.severity),
      }))
      .filter((e) => e.incorrect_form !== "" || e.correct_form !== "");
  } catch {
    return [];
  }
}

function normalizeErrorType(value: unknown): GrammarError["error_type"] {
  const valid = ["GENDER", "CASE", "CONJUGATION", "WORD_ORDER", "PRONUNCIATION", "OMISSION"];
  return valid.includes(String(value)) ? (value as GrammarError["error_type"]) : "OMISSION";
}

function normalizeSeverity(value: unknown): GrammarError["severity"] {
  const valid = ["CRITICAL", "MODERATE", "MINOR"];
  return valid.includes(String(value)) ? (value as GrammarError["severity"]) : "MODERATE";
}