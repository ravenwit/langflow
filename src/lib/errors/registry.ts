/**
 * Section 17 — Error States & Fallback Logic
 * Unified error registry. Each error type has a trigger condition and a
 * fallback handler that returns a structured FallbackResult.
 */

export type ErrorCode =
  | "LLM_SCENARIO_GENERATION_FAILURE"
  | "TTS_API_FAILURE"
  | "STT_API_FAILURE"
  | "MICROPHONE_PERMISSION_DENIED"
  | "PRONUNCIATION_API_FAILURE"
  | "MASTERY_DB_WRITE_FAILURE"
  | "COGNITIVE_LOAD_DATA_INSUFFICIENT";

export interface FallbackResult {
  error_code: ErrorCode;
  fallback_applied: boolean;
  message: string;
  /** Structured fallback actions taken (e.g., "load_template_scenario", "route_to_stt") */
  actions: string[];
  /** Whether the user should be notified of the fallback */
  notify_user: boolean;
  /** Whether performance data was preserved (for DB write failures) */
  data_preserved?: boolean;
}

export interface ErrorContext {
  /** e.g. domain, cefr_level, turn_count for scenario fallback */
  [key: string]: unknown;
}

type FallbackHandler = (context: ErrorContext) => FallbackResult;

const ERROR_REGISTRY: Record<ErrorCode, { description: string; handler: FallbackHandler }> = {
  LLM_SCENARIO_GENERATION_FAILURE: {
    description: "LLM API returns invalid JSON or fails schema validation after 2 retries",
    handler: (ctx) => ({
      error_code: "LLM_SCENARIO_GENERATION_FAILURE",
      fallback_applied: true,
      message: "Scenario generation failed; using template scenario.",
      actions: [
        `load_template_scenario(domain=${String(ctx.domain ?? "unknown")}, cefr=${String(ctx.cefr_level ?? "A1")}, turns=${String(ctx.turn_count ?? "?")})`,
        "log_failure_with_prompt",
        "continue_session_with_template",
      ],
      notify_user: false, // user is unaware
    }),
  },
  TTS_API_FAILURE: {
    description: "Text-to-speech service unavailable or returns empty audio",
    handler: () => ({
      error_code: "TTS_API_FAILURE",
      fallback_applied: true,
      message: "Audio unavailable; showing text with phonetic transcription.",
      actions: [
        "display_text_large_font",
        "show_phonetic_transcription",
        "show_audio_unavailable_notice",
        "allow_text_only_turn",
        "retry_tts_in_background",
      ],
      notify_user: true,
    }),
  },
  STT_API_FAILURE: {
    description: "Speech-to-text returns empty or confidence < 0.3",
    handler: () => ({
      error_code: "STT_API_FAILURE",
      fallback_applied: true,
      message: "Couldn't catch that — try again or type your answer.",
      actions: ["offer_text_input_alternative", "do_not_record_as_error"],
      notify_user: true,
    }),
  },
  MICROPHONE_PERMISSION_DENIED: {
    description: "User device blocks microphone access at OS level",
    handler: () => ({
      error_code: "MICROPHONE_PERMISSION_DENIED",
      fallback_applied: true,
      message: "Microphone unavailable; routing to text input mode.",
      actions: [
        "route_all_oral_tasks_to_stt_input",
        "update_profile_oral_comfort_stt_only",
        "display_mic_enable_guidance",
      ],
      notify_user: true,
    }),
  },
  PRONUNCIATION_API_FAILURE: {
    description: "Pronunciation scoring service unavailable",
    handler: () => ({
      error_code: "PRONUNCIATION_API_FAILURE",
      fallback_applied: true,
      message: "Pronunciation scoring skipped; continuing with lexical and grammar feedback.",
      actions: ["skip_pronunciation_component", "continue_with_lexical_grammar_feedback", "log_for_retry_next_session"],
      notify_user: false,
    }),
  },
  MASTERY_DB_WRITE_FAILURE: {
    description: "Database write fails during mastery score update",
    handler: () => ({
      error_code: "MASTERY_DB_WRITE_FAILURE",
      fallback_applied: true,
      message: "Mastery update cached locally; will retry at session close.",
      actions: ["cache_update_locally", "retry_write_at_session_close", "queue_for_next_session_open"],
      notify_user: false,
      data_preserved: true,
    }),
  },
  COGNITIVE_LOAD_DATA_INSUFFICIENT: {
    description: "< 3 turns completed, insufficient data for load calculation",
    handler: () => ({
      error_code: "COGNITIVE_LOAD_DATA_INSUFFICIENT",
      fallback_applied: true,
      message: "Insufficient load data; defaulting to OPTIMAL.",
      actions: ["default_load_index_to_0.4", "apply_default_scaffolding", "begin_real_calculation_from_turn_4"],
      notify_user: false,
    }),
  },
};

export const ERROR_CODES = Object.keys(ERROR_REGISTRY) as ErrorCode[];

export function getErrorDescription(code: ErrorCode): string {
  return ERROR_REGISTRY[code].description;
}

export function handleError(code: ErrorCode, context: ErrorContext = {}): FallbackResult {
  return ERROR_REGISTRY[code].handler(context);
}

export function isKnownErrorCode(value: string): value is ErrorCode {
  return value in ERROR_REGISTRY;
}