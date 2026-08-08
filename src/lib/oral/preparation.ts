import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { OralPreparationPlan } from "./types";

/**
 * Builds the oral preparation plan based on scaffolding and month phase.
 * Pure logic; no side effects.
 */
export function buildOralPreparationPlan(turn: DialogueTurn, scaffolding: ScaffoldingConfig, monthPhase: number): OralPreparationPlan {
  const prepTime = scaffolding.oral_prep_time_seconds;
  const showPhoneticGuide = monthPhase <= 3;
  const codeswitchingInviteShown = scaffolding.codeswitching_invite_shown;
  const targetSentence = turn.text_de;
  const wordPronunciations = targetSentence
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word) => ({
      word,
      phonetic: generateSimplePhonetic(word),
    }));

  return {
    prep_time_seconds: prepTime,
    show_phonetic_guide: showPhoneticGuide,
    codeswitching_invite_shown: codeswitchingInviteShown,
    target_sentence: targetSentence,
    word_pronunciations: wordPronunciations,
  };
}

/**
 * Orchestrates the oral preparation sequence.
 * Returns the preparation plan. In a real UI this would drive the countdown and interaction phases.
 */
export function runOralPreparation(turn: DialogueTurn, scaffolding: ScaffoldingConfig, monthPhase: number): OralPreparationPlan {
  return buildOralPreparationPlan(turn, scaffolding, monthPhase);
}

/**
 * Simple heuristic phonetic approximation for German words.
 * This is a lightweight fallback; a production system would use a dictionary or IPA library.
 */
function generateSimplePhonetic(word: string): string {
  const cleaned = word.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").toLowerCase();
  const map: Record<string, string> = {
    a: "a",
    ä: "ɛ",
    b: "b",
    c: "k",
    d: "d",
    e: "e",
    f: "f",
    g: "g",
    h: "h",
    i: "i",
    j: "j",
    k: "k",
    l: "l",
    m: "m",
    n: "n",
    o: "o",
    ö: "ø",
    p: "p",
    q: "kv",
    r: "r",
    s: "s",
    ß: "ss",
    t: "t",
    u: "u",
    ü: "y",
    v: "f",
    w: "v",
    x: "ks",
    y: "y",
    z: "ts",
  };

  const chars = cleaned.split("");
  const phonetics = chars.map((ch) => map[ch] || ch);
  return phonetics.join("");
}