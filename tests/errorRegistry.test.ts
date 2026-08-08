import { describe, it, expect } from "vitest";
import {
  handleError,
  getErrorDescription,
  isKnownErrorCode,
  ERROR_CODES,
} from "@/lib/errors/registry";

describe("Section 17 error registry", () => {
  it("exposes all 7 blueprint error codes", () => {
    expect(ERROR_CODES).toHaveLength(7);
    expect(ERROR_CODES).toContain("LLM_SCENARIO_GENERATION_FAILURE");
    expect(ERROR_CODES).toContain("TTS_API_FAILURE");
    expect(ERROR_CODES).toContain("STT_API_FAILURE");
    expect(ERROR_CODES).toContain("MICROPHONE_PERMISSION_DENIED");
    expect(ERROR_CODES).toContain("PRONUNCIATION_API_FAILURE");
    expect(ERROR_CODES).toContain("MASTERY_DB_WRITE_FAILURE");
    expect(ERROR_CODES).toContain("COGNITIVE_LOAD_DATA_INSUFFICIENT");
  });

  it("isKnownErrorCode validates codes", () => {
    expect(isKnownErrorCode("TTS_API_FAILURE")).toBe(true);
    expect(isKnownErrorCode("BOGUS_ERROR")).toBe(false);
  });

  it("getErrorDescription returns the trigger description", () => {
    expect(getErrorDescription("LLM_SCENARIO_GENERATION_FAILURE")).toContain("invalid JSON");
    expect(getErrorDescription("COGNITIVE_LOAD_DATA_INSUFFICIENT")).toContain("3 turns");
  });
});

describe("LLM_SCENARIO_GENERATION_FAILURE", () => {
  it("loads a template scenario and does not notify the user", () => {
    const result = handleError("LLM_SCENARIO_GENERATION_FAILURE", {
      domain: "computational_physics",
      cefr_level: "A1",
      turn_count: 6,
    });
    expect(result.fallback_applied).toBe(true);
    expect(result.notify_user).toBe(false);
    expect(result.actions[0]).toContain("load_template_scenario");
    expect(result.actions[0]).toContain("computational_physics");
    expect(result.actions[0]).toContain("A1");
    expect(result.actions).toContain("continue_session_with_template");
  });
});

describe("TTS_API_FAILURE", () => {
  it("falls back to text with phonetic transcription and notifies user", () => {
    const result = handleError("TTS_API_FAILURE");
    expect(result.notify_user).toBe(true);
    expect(result.actions).toContain("show_phonetic_transcription");
    expect(result.actions).toContain("allow_text_only_turn");
    expect(result.actions).toContain("retry_tts_in_background");
  });
});

describe("STT_API_FAILURE", () => {
  it("offers text input and does not record as error", () => {
    const result = handleError("STT_API_FAILURE");
    expect(result.actions).toContain("offer_text_input_alternative");
    expect(result.actions).toContain("do_not_record_as_error");
  });
});

describe("MICROPHONE_PERMISSION_DENIED", () => {
  it("routes all oral tasks to STT input", () => {
    const result = handleError("MICROPHONE_PERMISSION_DENIED");
    expect(result.actions).toContain("route_all_oral_tasks_to_stt_input");
    expect(result.actions).toContain("update_profile_oral_comfort_stt_only");
  });
});

describe("PRONUNCIATION_API_FAILURE", () => {
  it("skips pronunciation silently and continues", () => {
    const result = handleError("PRONUNCIATION_API_FAILURE");
    expect(result.notify_user).toBe(false);
    expect(result.actions).toContain("skip_pronunciation_component");
    expect(result.actions).toContain("continue_with_lexical_grammar_feedback");
  });
});

describe("MASTERY_DB_WRITE_FAILURE", () => {
  it("caches locally and preserves data", () => {
    const result = handleError("MASTERY_DB_WRITE_FAILURE");
    expect(result.data_preserved).toBe(true);
    expect(result.actions).toContain("cache_update_locally");
    expect(result.actions).toContain("retry_write_at_session_close");
    expect(result.actions).toContain("queue_for_next_session_open");
  });
});

describe("COGNITIVE_LOAD_DATA_INSUFFICIENT", () => {
  it("defaults load index to 0.4 and applies default scaffolding", () => {
    const result = handleError("COGNITIVE_LOAD_DATA_INSUFFICIENT");
    expect(result.actions).toContain("default_load_index_to_0.4");
    expect(result.actions).toContain("apply_default_scaffolding");
    expect(result.actions).toContain("begin_real_calculation_from_turn_4");
  });
});