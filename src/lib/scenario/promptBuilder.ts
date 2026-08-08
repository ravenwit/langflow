import { GenerationContext } from "./types";

export function buildScenarioPrompt(context: GenerationContext): string {
  const { domain, context: ctx, cefr_level, target_grammar, target_vocab, new_vocab, turn_count, month_phase, scaffolding, review_concepts } = context;

  const ttsSpeed = month_phase <= 2 ? 0.75 : month_phase <= 4 ? 0.9 : 1.0;

  const scaffoldingLevel =
    scaffolding.show_grammar_labels && scaffolding.word_cards_presorted
      ? "HIGH"
      : !scaffolding.show_grammar_labels && !scaffolding.word_cards_presorted
        ? "LOW"
        : "MEDIUM";

  const systemBlock = `You are an expert German language pedagogue and scenario author.
Your task is to generate a structured, pedagogically precise German language learning scenario for an adult learner with the following parameters.

HARD CONSTRAINTS:
- All German text must be grammatically correct and native-sounding.
- The scenario must organically embed all specified target vocabulary and grammar.
- CEFR level ceiling: ${cefr_level}. No vocabulary above this ceiling except the ${new_vocab.length > 0 ? "2 new items explicitly listed below" : "items explicitly listed below"}.
- All AI speaker turns must be speakable at ${ttsSpeed}x native speed naturally.
- Every turn must have a corresponding L1 (English) translation.
- The scenario must be internally coherent as a realistic interaction.
- For any turn that involves spatial prepositions, grammatical concepts needing diagrams, or complex sentence structure, ALSO include an inline SVG diagram as a data URI in the visual_cue_ref field. The SVG should illustrate the grammar concept (e.g., case relationships, word order, prepositional objects). Keep the SVG simple and clear.
- OUTPUT FORMAT: Return a valid JSON object matching the Scenario schema exactly.`;

  const userBlock = `Generate a German language learning scenario with these parameters:

DOMAIN: ${domain.domain_label}
CONTEXT: ${ctx.label}
CEFR LEVEL: ${cefr_level}
TURN COUNT: ${turn_count} (alternating AI / User turns)
MONTH PHASE: ${month_phase} / 6

TARGET GRAMMAR CONCEPTS (must be exercised in user turns):
${target_grammar.map((g) => `- ${g.concept_label}: ${g.analytic_breakdown}`).join("\n") || "(none)"}

TARGET VOCABULARY (must appear at least once):
${target_vocab.map((w) => `- ${w.lemma_de} (${w.translations_l1[0]})`).join("\n") || "(none)"}

NEW VOCABULARY TO INTRODUCE (embed naturally, AI turn must contextualize meaning):
${new_vocab.map((w) => `- ${w.lemma_de} (${w.translations_l1[0]})`).join("\n") || "(none)"}

PREVIOUSLY REVIEWED CONCEPTS TO EMBED:
${review_concepts.map((g) => `- ${g.concept_label}`).join("\n") || "(none)"}

SCAFFOLDING LEVEL: ${scaffoldingLevel}
- If HIGH: AI turns should use shorter sentences and predictable syntax.
- If MEDIUM: Moderate syntactic complexity permitted.
- If LOW: Complex, native-speed syntax encouraged.

PERSONAL INTEREST NOTE: The user has strong interests in: ${domain.sub_topics.join(", ") || "general topics"}.
Where plausible, anchor concrete references in the scenario to these topics.

Generate the full scenario JSON now.`;

  return `${systemBlock}\n\n${userBlock}`;
}