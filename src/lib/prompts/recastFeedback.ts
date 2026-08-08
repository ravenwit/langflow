/**
 * Section 15.3 — Recast Feedback Generation Prompt Template (recast_feedback_v1)
 * Builds the system + user prompt for the LLM recast generation call.
 */

export interface RecastFeedbackInput {
  incorrect_utterance: string;
  correct_form: string;
  conversation_context: string;
}

export const RECAST_FEEDBACK_SYSTEM = `
You are a warm, encouraging German language tutor. Generate a natural spoken recast of the user's utterance that embeds the corrected form without explicitly saying "that was wrong."
The recast must sound like a natural conversational response, not a correction. Keep it to one sentence. Respond in German only.
`;

export function buildRecastFeedbackPrompt(input: RecastFeedbackInput): string {
  return `${RECAST_FEEDBACK_SYSTEM}

USER SAID (with error): ${input.incorrect_utterance}
CORRECT FORM: ${input.correct_form}
CONVERSATION CONTEXT: ${input.conversation_context}

Generate the recast sentence:`;
}

/**
 * Validates that a recast response is non-empty German text.
 * Returns the trimmed recast, or null if the response is unusable.
 */
export function parseRecastResponse(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) return null;
  // Reject responses that are clearly not German (e.g., JSON, empty, or meta-commentary)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return null;
  return trimmed;
}