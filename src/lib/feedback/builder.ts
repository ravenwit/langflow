import { FeedbackPackage, TurnPerformance } from "./types";
import { GrammarError } from "@/lib/oral/types";
import { resolveCodeSwitch } from "@/lib/oral/processing";

export { deliverFeedback } from "./delivery";

/**
 * Builds a structured feedback package from a turn performance record.
 * Implements Section 13.2 of the blueprint:
 *  - Always lead with communicative success acknowledgment
 *  - Max 1 grammar correction per turn (recast style)
 *  - Selective pronunciation feedback
 *  - Gentle code-switch resolution
 */
export function buildFeedback(performance: TurnPerformance, turnTextDe?: string): FeedbackPackage {
  const feedback: FeedbackPackage = {
    primary_message:
      performance.lexical_score !== undefined && performance.lexical_score >= 0.7
        ? "Your meaning came through clearly."
        : "Good effort — let's look at this together.",
  };

  const errors = performance.errors_detected || [];
  if (errors.length > 0) {
    // Prioritize the most diagnostic error (severity, then type)
    const priorityError = selectPriorityError(errors);
    feedback.grammar_correction = buildRecast(priorityError, turnTextDe);
    feedback.rule_reminder = buildRuleReminder(priorityError);
  }

  if (performance.pronunciation_score && performance.pronunciation_score.problem_phonemes.length > 0) {
    const worstPhoneme = performance.pronunciation_score.problem_phonemes[0];
    feedback.pronunciation_note = `Watch the sound /${worstPhoneme.ipa}/ — ${worstPhoneme.description}.`;
  }

  if (performance.l1_insertions && performance.l1_insertions.length > 0) {
    feedback.codeswitching_note = performance.l1_insertions.map((l1) => {
      const german = resolveCodeSwitch(l1, turnTextDe || "");
      return german ? `${l1} → ${german}` : `${l1} → (German equivalent)`;
    });
  }

  return feedback;
}

/**
 * Selects the single most diagnostic error to correct.
 * Prefers CRITICAL severity, then the error types most tied to mastery gaps.
 */
function selectPriorityError(errors: GrammarError[]): GrammarError {
  const severityOrder: Record<string, number> = { CRITICAL: 0, MODERATE: 1, MINOR: 2 };
  const diagnosticWeight: Record<string, number> = {
    WORD_ORDER: 0,
    CASE: 1,
    CONJUGATION: 2,
    GENDER: 3,
    OMISSION: 4,
    PRONUNCIATION: 5,
  };

  return [...errors].sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 1) - (severityOrder[b.severity] ?? 1);
    if (sevDiff !== 0) return sevDiff;
    return (diagnosticWeight[a.error_type] ?? 9) - (diagnosticWeight[b.error_type] ?? 9);
  })[0];
}

/**
 * Builds a natural conversational recast that embeds the corrected form
 * without explicitly calling the error out. Mirrors Section 15.3 intent.
 */
function buildRecast(error: GrammarError, turnTextDe?: string): string {
  const corrected = error.correct_form || turnTextDe || "";
  if (!corrected) return "";
  // Recast: present the corrected form as a natural continuation.
  return `Ah, ${corrected} — genau!`;
}

/**
 * Builds a brief rule reminder for the error type.
 * In production this would fetch GrammarConcept.analytic_breakdown.
 */
function buildRuleReminder(error: GrammarError): string {
  const rules: Record<string, string> = {
    GENDER: "Remember: every German noun has a gender (der/die/das).",
    CASE: "Check the case — the article changes with the grammatical role.",
    CONJUGATION: "The verb ending must agree with the subject.",
    WORD_ORDER: "In main clauses, the verb takes position 2.",
    OMISSION: "Make sure every required part of the sentence is present.",
    PRONUNCIATION: "Pay attention to the vowel length and consonant sounds.",
  };
  return rules[error.error_type] || "Review the rule for this structure.";
}