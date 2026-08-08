import { NextResponse } from "next/server";
import { DialogueTurn, ScaffoldingConfig } from "@/lib/scenario/types";
import { runWordCardTask, prepareCardArrangement, evaluateArrangement } from "@/lib/kinesthetic/wordCardTask";
import { runClassificationTask, shuffleTokens, evaluateClassification } from "@/lib/kinesthetic/classificationTask";

export interface KinestheticRequest {
  task_type: "WORD_CARD" | "CLASSIFICATION";
  turn?: DialogueTurn;
  scaffolding_config: ScaffoldingConfig;
  user_arrangement?: { word_de: string; correct_position: number }[];
  word_list?: string[];
  category_labels?: string[];
  correct_answer_map?: Record<string, string>;
  max_attempts?: number;
}

export interface KinestheticResponse {
  task_type: string;
  word_card?: {
    arrangement: string;
    word_card_set: { word_de: string; grammatical_role: string; correct_position: number }[];
    attempts_log: {
      attempt_index: number;
      arrangement: { word_de: string; grammatical_role: string; correct_position: number }[];
      correct_indices: number[];
      incorrect_indices: number[];
      feedback_hints: string[];
    }[];
    completed: boolean;
    completion_method: string;
    attempts_used: number;
  };
  classification?: {
    results: {
      word: string;
      assigned_category: string;
      correct_category: string;
      is_correct: boolean;
      feedback_message: string;
    }[];
    total_correct: number;
    total_words: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KinestheticRequest;

    const { task_type, scaffolding_config, max_attempts = 3 } = body;

    if (!task_type || !scaffolding_config) {
      return NextResponse.json({ error: "task_type and scaffolding_config are required" }, { status: 400 });
    }

    let response: KinestheticResponse = { task_type };

    if (task_type === "WORD_CARD") {
      if (!body.turn) {
        return NextResponse.json({ error: "turn is required for WORD_CARD task" }, { status: 400 });
      }

      const result = runWordCardTask(body.turn, scaffolding_config, max_attempts);
      response.word_card = {
        arrangement: result.word_card_set === result.word_card_set ? "PRESORTED_CLUSTERS" : "RANDOMIZED",
        word_card_set: result.word_card_set,
        attempts_log: result.attempts_log,
        completed: result.completed,
        completion_method: result.completion_method,
        attempts_used: result.attempts_used,
      };
    } else if (task_type === "CLASSIFICATION") {
      const { word_list = [], category_labels = [], correct_answer_map = {} } = body;

      if (word_list.length === 0 || category_labels.length === 0) {
        return NextResponse.json({ error: "word_list and category_labels are required for CLASSIFICATION task" }, { status: 400 });
      }

      const result = runClassificationTask(word_list, category_labels, correct_answer_map);
      response.classification = {
        results: result.results,
        total_correct: result.total_correct,
        total_words: result.total_words,
      };
    } else {
      return NextResponse.json({ error: `Unknown task_type: ${task_type}` }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kinesthetic task failed:", error);
    return NextResponse.json({ error: "Kinesthetic task failed" }, { status: 500 });
  }
}