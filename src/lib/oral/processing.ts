import { DialogueTurn } from "@/lib/scenario/types";
import {
  CodeSwitchSegment,
  LexicalEvaluation,
  GrammarError,
  PronunciationEvaluation,
  OralPerformanceRecord,
} from "./types";

const GERMAN_INDICATORS = /^(ich|du|er|sie|es|wir|ihr|der|die|das|den|dem|des|ein|eine|einem|einen|auf|in|an|mit|für|von|zu|bei|nach|vor|aus|über|unter|zwischen|durch|gehen|kommen|haben|sein|werden|können|müssen|sollen|wollen|mögen|möchten|gut|schlecht|ja|nein|bitte|danke|entschuldigung|hallo|tschüss|guten|morgen|tag|abend|nacht|woche|monat|jahr|zeit|tag|heute|morgen|gestern|jetzt|bald|später|früh|spät|hier|dort|wo|warum|wie|was|wer|wann|welche|welcher|welches|viel|wenig|groß|klein|alt|jung|neu|schön|hässlich|leicht|schwer|schnell|langsam|warm|kalt|hell|dunkel|oben|unten|links|rechts|vorn|hinten|innen|außen|alle|viele|einige|keine|beide|mein|dein|sein|ihr|unser|euer|ihr|lese|buch|bist|ist|sind|war|waren|auf|ab)$/i;

/**
 * Detects L1 (English) segments in a transcript by matching against German indicator words.
 * Returns segments where no German indicator was found in the token.
 */
export function detectCodeSwitches(transcript: string): string[] {
  const tokens = transcript.split(/\s+/).filter((t) => t.length > 0);
  const l1Segments: string[] = [];

  for (const token of tokens) {
    const cleaned = token.replace(/[^a-zA-ZäöüÄÖÜß]/g, "").toLowerCase();
    if (cleaned.length === 0) continue;
    if (!GERMAN_INDICATORS.test(cleaned)) {
      l1Segments.push(token);
    }
  }

  return l1Segments;
}

/**
 * Resolves an L1 segment to a German equivalent.
 * In production, this calls the LLM. Here we provide a small fallback dictionary.
 */
export function resolveCodeSwitch(l1Segment: string, contextSentence: string): string {
  const lower = l1Segment.toLowerCase();
  const dictionary: Record<string, string> = {
    the: "",
    a: "",
    an: "",
    is: "ist",
    are: "sind",
    was: "",
    were: "waren",
    have: "habe",
    has: "hat",
    had: "hatte",
    do: "",
    does: "",
    did: "tat",
    will: "werden",
    would: "würde",
    can: "kann",
    could: "könnte",
    should: "sollte",
    may: "darf",
    might: "könnte",
    must: "muss",
    i: "ich",
    you: "du",
    he: "er",
    she: "sie",
    it: "es",
    we: "wir",
    they: "sie",
    me: "mich",
    him: "ihn",
    her: "sie",
    us: "uns",
    them: "sie",
    my: "mein",
    your: "dein",
    his: "sein",
    our: "unser",
    their: "ihr",
    good: "gut",
    bad: "schlecht",
    yes: "ja",
    no: "nein",
    please: "bitte",
    thank: "danke",
    sorry: "entschuldigung",
    hello: "hallo",
    bye: "tschüss",
    book: "Buch",
    dog: "Hund",
    cat: "Katze",
    house: "Haus",
    tree: "Baum",
    water: "Wasser",
    food: "Essen",
    time: "Zeit",
    day: "Tag",
    night: "Nacht",
    morning: "Morgen",
    evening: "Abend",
    today: "heute",
    tomorrow: "morgen",
    yesterday: "gestern",
    now: "jetzt",
    later: "später",
    here: "hier",
    there: "dort",
    where: "wo",
    why: "warum",
    how: "wie",
    what: "was",
    who: "wer",
    when: "wann",
    big: "groß",
    small: "klein",
    old: "alt",
    young: "jung",
    new: "neu",
    beautiful: "schön",
    ugly: "hässlich",
    easy: "leicht",
    difficult: "schwer",
    fast: "schnell",
    slow: "langsam",
    warm: "warm",
    cold: "kalt",
    light: "hell",
    dark: "dunkel",
    up: "auf",
    down: "ab",
    left: "links",
    right: "rechts",
    front: "vorn",
    back: "hinten",
    inside: "innen",
    outside: "außen",
    all: "alle",
    many: "viele",
    some: "einige",
    none: "keine",
    both: "beide",
  };

  const resolved = dictionary[lower];
  if (resolved !== undefined) return resolved;

  // Fallback: return the segment capitalized to simulate "we tried"
  return l1Segment.charAt(0).toUpperCase() + l1Segment.slice(1);
}

/**
 * Evaluates lexical match between transcript and target using token overlap.
 * Returns a 0.0-1.0 score plus matched/missing word lists.
 */
export function evaluateLexicalMatch(transcript: string, targetText: string): LexicalEvaluation {
  const transcriptTokens = new Set(
    transcript.toLowerCase().split(/\s+/).filter((w) => w.length > 0).map((w) => w.replace(/[^a-zäöüß]/g, ""))
  );
  const targetTokens = targetText.toLowerCase().split(/\s+/).filter((w) => w.length > 0);

  const matchedWords: string[] = [];
  const missingWords: string[] = [];

  for (const targetWord of targetTokens) {
    const cleaned = targetWord.replace(/[^a-zäöüß]/g, "");
    if (transcriptTokens.has(cleaned)) {
      matchedWords.push(targetWord);
    } else {
      missingWords.push(targetWord);
    }
  }

  const score = targetTokens.length > 0 ? matchedWords.length / targetTokens.length : 0;
  return { score, matched_words: matchedWords, missing_words: missingWords };
}

/**
 * Evaluates grammar by comparing transcript against target sentence.
 * Pure fallback: detects missing words and word-order mismatches.
 * Production would call LLM for structured error detection.
 */
export function evaluateGrammar(transcript: string, targetTurn: DialogueTurn): GrammarError[] {
  const errors: GrammarError[] = [];
  const transcriptTokens = transcript.split(/\s+/).filter((w) => w.length > 0);
  const targetTokens = targetTurn.text_de.split(/\s+/).filter((w) => w.length > 0);

  // Simple omission detection
  if (transcriptTokens.length < targetTokens.length) {
    errors.push({
      error_type: "OMISSION",
      incorrect_form: transcript,
      correct_form: targetTurn.text_de,
      concept_id: "",
      severity: "MODERATE",
    });
  }

  // Simple word-order check: compare token sequences
  const normalizedTranscript = transcriptTokens.map((t) => t.replace(/[^a-zäöüß]/g, "").toLowerCase());
  const normalizedTarget = targetTokens.map((t) => t.replace(/[^a-zäöüß]/g, "").toLowerCase());
  if (normalizedTranscript.length === normalizedTarget.length) {
    const mismatches = normalizedTranscript.filter((token, i) => token !== normalizedTarget[i]);
    if (mismatches.length > 0) {
      errors.push({
        error_type: "WORD_ORDER",
        incorrect_form: transcript,
        correct_form: targetTurn.text_de,
        concept_id: "",
        severity: "CRITICAL",
      });
    }
  }

  return errors;
}

/**
 * Pronunciation evaluation.
 * Pure fallback: returns a default score with no problem phonemes.
 * Production would call a pronunciation API.
 */
export function evaluatePronunciation(_audioInput: unknown, referenceText: string): PronunciationEvaluation {
  return {
    score: 0.9,
    problem_phonemes: [],
  };
}

/**
 * Full oral processing pipeline.
 * Orchestrates code-switch detection, lexical/grammar/pronunciation evaluation.
 */
export function processOralOutput(transcript: string, targetTurn: DialogueTurn): {
  lexical: LexicalEvaluation;
  grammar_errors: GrammarError[];
  pronunciation: PronunciationEvaluation;
  l1_insertions: string[];
  code_switches: CodeSwitchSegment[];
} {
  const l1Insertions = detectCodeSwitches(transcript);
  const codeSwitches: CodeSwitchSegment[] = l1Insertions.map((l1) => ({
    l1_segment: l1,
    german_equivalent: resolveCodeSwitch(l1, targetTurn.text_de),
    context_sentence: targetTurn.text_de,
  }));

  const normalizedTranscript = l1Insertions.reduce((t, l1) => t.replace(l1, codeSwitches.find((c) => c.l1_segment === l1)!.german_equivalent), transcript);

  const lexical = evaluateLexicalMatch(normalizedTranscript, targetTurn.text_de);
  const grammarErrors = evaluateGrammar(normalizedTranscript, targetTurn);
  const pronunciation = evaluatePronunciation(null, targetTurn.text_de);

  return {
    lexical,
    grammar_errors: grammarErrors,
    pronunciation,
    l1_insertions: l1Insertions,
    code_switches: codeSwitches,
  };
}

/**
 * Builds the oral performance record from processing results.
 */
export function buildOralPerformanceRecord(
  responseLatencyMs: number,
  processingResult: ReturnType<typeof processOralOutput>,
  completionMethod: "ORAL" | "STT" | "WORD_CARD" | "SKIPPED" = "ORAL"
): OralPerformanceRecord {
  return {
    response_latency_ms: responseLatencyMs,
    lexical_score: processingResult.lexical.score,
    grammar_errors: processingResult.grammar_errors,
    pronunciation_score: processingResult.pronunciation,
    l1_insertions: processingResult.l1_insertions,
    completion_method: completionMethod,
  };
}