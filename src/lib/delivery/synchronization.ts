import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { WordHighlightTiming, DeliveryChannelPlan } from "./types";

/**
 * Computes per-word highlight timings distributed proportionally across the audio duration.
 * If audio duration is unknown, falls back to equal 500ms per word.
 */
export function computeWordHighlightTimings(text: string, audioDurationMs: number | null): WordHighlightTiming[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const duration = audioDurationMs && audioDurationMs > 0 ? audioDurationMs : words.length * 500;
  const perWord = duration / words.length;

  return words.map((word, index) => ({
    word,
    start_ms: Math.round(index * perWord),
    end_ms: Math.round((index + 1) * perWord),
  }));
}

/**
 * Builds the channel plan for a single AI dialogue turn.
 * Determines what renders in each sensory channel based on the scaffolding config.
 */
export function buildDeliveryChannelPlan(turn: DialogueTurn, scaffolding: ScaffoldingConfig): DeliveryChannelPlan {
  const wordHighlightTimings = computeWordHighlightTimings(turn.text_de, null);

  return {
    audio_ref: turn.audio_file_ref ?? null,
    text_de: turn.text_de,
    text_l1: scaffolding.show_l1_translation ? turn.text_l1 : null,
    show_l1_translation: scaffolding.show_l1_translation,
    show_grammar_labels: scaffolding.show_grammar_labels,
    show_visual_cue: turn.visual_cue_ref != null && turn.visual_cue_ref.length > 0,
    visual_cue_ref: turn.visual_cue_ref ?? null,
    word_highlight_timings: wordHighlightTimings,
  };
}