import { NextResponse } from "next/server";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { runOralPreparation } from "@/lib/oral/preparation";
import { processOralOutput, buildOralPerformanceRecord } from "@/lib/oral/processing";
import { updateMasteryScores } from "@/lib/oral/masteryUpdate";

export interface OralRequest {
  action: "PREPARE" | "PROCESS";
  turn: DialogueTurn;
  scaffolding_config: ScaffoldingConfig;
  month_phase: number;
  transcript?: string;
  response_latency_ms?: number;
}

export interface OralResponse {
  action: string;
  preparation?: {
    prep_time_seconds: number;
    show_phonetic_guide: boolean;
    codeswitching_invite_shown: boolean;
    target_sentence: string;
    word_pronunciations: { word: string; phonetic: string }[];
  };
  processing?: {
    lexical: { score: number; matched_words: string[]; missing_words: string[] };
    grammar_errors: { error_type: string; incorrect_form: string; correct_form: string; concept_id: string; severity: string }[];
    pronunciation: { score: number; problem_phonemes: { ipa: string; description: string }[] };
    l1_insertions: string[];
    code_switches: { l1_segment: string; german_equivalent: string; context_sentence: string }[];
  };
  performance_record?: {
    response_latency_ms: number;
    lexical_score: number;
    grammar_errors: { error_type: string; incorrect_form: string; correct_form: string; concept_id: string; severity: string }[];
    pronunciation_score: { score: number; problem_phonemes: { ipa: string; description: string }[] };
    l1_insertions: string[];
    completion_method: string;
  };
  mastery_updates?: {
    vocabulary: { word_de: string; exposure_increment: number; correct_production_increment: number; errors_added: number }[];
    grammar: { concept_id: string; delta: number }[];
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OralRequest;

    const { action, turn, scaffolding_config, month_phase, transcript, response_latency_ms = 0 } = body;

    if (!action || !turn || !scaffolding_config) {
      return NextResponse.json({ error: "action, turn, and scaffolding_config are required" }, { status: 400 });
    }

    const response: OralResponse = { action };

    if (action === "PREPARE") {
      const prep = runOralPreparation(turn, scaffolding_config, month_phase);
      response.preparation = {
        prep_time_seconds: prep.prep_time_seconds,
        show_phonetic_guide: prep.show_phonetic_guide,
        codeswitching_invite_shown: prep.codeswitching_invite_shown,
        target_sentence: prep.target_sentence,
        word_pronunciations: prep.word_pronunciations,
      };
    } else if (action === "PROCESS") {
      if (!transcript) {
        return NextResponse.json({ error: "transcript is required for PROCESS action" }, { status: 400 });
      }

      const processingResult = processOralOutput(transcript, turn);
      const performanceRecord = buildOralPerformanceRecord(response_latency_ms, processingResult, "ORAL");
      const masteryUpdates = updateMasteryScores(turn, performanceRecord);

      response.processing = {
        lexical: {
          score: processingResult.lexical.score,
          matched_words: processingResult.lexical.matched_words,
          missing_words: processingResult.lexical.missing_words,
        },
        grammar_errors: processingResult.grammar_errors.map((e) => ({
          error_type: e.error_type,
          incorrect_form: e.incorrect_form,
          correct_form: e.correct_form,
          concept_id: e.concept_id,
          severity: e.severity,
        })),
        pronunciation: {
          score: processingResult.pronunciation.score,
          problem_phonemes: processingResult.pronunciation.problem_phonemes,
        },
        l1_insertions: processingResult.l1_insertions,
        code_switches: processingResult.code_switches.map((c) => ({
          l1_segment: c.l1_segment,
          german_equivalent: c.german_equivalent,
          context_sentence: c.context_sentence,
        })),
      };

      response.performance_record = {
        response_latency_ms: performanceRecord.response_latency_ms,
        lexical_score: performanceRecord.lexical_score,
        grammar_errors: performanceRecord.grammar_errors.map((e) => ({
          error_type: e.error_type,
          incorrect_form: e.incorrect_form,
          correct_form: e.correct_form,
          concept_id: e.concept_id,
          severity: e.severity,
        })),
        pronunciation_score: {
          score: performanceRecord.pronunciation_score.score,
          problem_phonemes: performanceRecord.pronunciation_score.problem_phonemes,
        },
        l1_insertions: performanceRecord.l1_insertions,
        completion_method: performanceRecord.completion_method,
      };

      response.mastery_updates = masteryUpdates;
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Oral processing failed:", error);
    return NextResponse.json({ error: "Oral processing failed" }, { status: 500 });
  }
}