import { FeedbackPackage } from "./types";

export function deliverFeedback(feedback: FeedbackPackage): { delivered: boolean; message: string } {
  const message = formatFeedbackMessage(feedback);
  return {
    delivered: true,
    message,
  };
}

export function formatFeedbackMessage(feedback: FeedbackPackage): string {
  const parts: string[] = [];

  if (feedback.primary_message) {
    parts.push(feedback.primary_message);
  }

  if (feedback.grammar_correction) {
    parts.push(feedback.grammar_correction);
  }

  if (feedback.rule_reminder) {
    parts.push(`Rule: ${feedback.rule_reminder}`);
  }

  if (feedback.pronunciation_note) {
    parts.push(feedback.pronunciation_note);
  }

  if (feedback.codeswitching_note && feedback.codeswitching_note.length > 0) {
    parts.push(`Vocabulary: ${feedback.codeswitching_note.join(", ")}`);
  }

  return parts.join("\n\n");
}