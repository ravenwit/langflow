import { CognitiveLoadResult } from "./types";
import { ScaffoldingConfig } from "@/lib/scenario/types";

export interface CognitiveLoadResponse {
  load_level: string;
  actions: {
    complexity_adjustment?: string;
    scaffolding_adjustments?: Partial<ScaffoldingConfig>;
    session_reduction?: number;
    recovery_inserted?: boolean;
  };
}

const DEFAULT_SCAFFOLDING: ScaffoldingConfig = {
  show_l1_translation: true,
  show_grammar_labels: true,
  word_cards_presorted: true,
  oral_prep_time_seconds: 30,
  codeswitching_invite_shown: true,
};

export function respondToCognitiveLoad(loadResult: CognitiveLoadResult, currentScaffolding: ScaffoldingConfig): CognitiveLoadResponse {
  const loadIndex = loadResult.load_index;

  if (loadIndex < 0.3) {
    return {
      load_level: "LOW",
      actions: {
        complexity_adjustment: "INCREASE",
        scaffolding_adjustments: {
          oral_prep_time_seconds: Math.max(0, currentScaffolding.oral_prep_time_seconds - 5),
          show_l1_translation: false,
          show_grammar_labels: false,
        },
      },
    };
  }

  if (loadIndex < 0.6) {
    return {
      load_level: "OPTIMAL",
      actions: {},
    };
  }

  if (loadIndex < 0.8) {
    const updated: Partial<ScaffoldingConfig> = { ...currentScaffolding };
    updated.show_l1_translation = true;
    updated.show_grammar_labels = true;
    updated.oral_prep_time_seconds = currentScaffolding.oral_prep_time_seconds + 10;
    updated.word_cards_presorted = true;

    return {
      load_level: "ELEVATED",
      actions: {
        scaffolding_adjustments: updated,
      },
    };
  }

  return {
    load_level: "CRITICAL",
    actions: {
      recovery_inserted: true,
      session_reduction: 2,
      scaffolding_adjustments: { ...DEFAULT_SCAFFOLDING },
    },
  };
}