export type CardArrangement = "PRESORTED_CLUSTERS" | "RANDOMIZED";
export type CompletionMethod = "SUCCESS" | "ASSISTED_COMPLETION" | "ABANDONED";
export type TaskType = "WORD_CARD" | "CLASSIFICATION";

export interface WordCardAttempt {
  attempt_index: number;
  arrangement: { word_de: string; grammatical_role: string; correct_position: number }[];
  correct_indices: number[];
  incorrect_indices: number[];
  feedback_hints: string[];
}

export interface WordCardTaskResult {
  task_type: TaskType;
  completed: boolean;
  attempts_used: number;
  completion_method: CompletionMethod;
  word_card_set: { word_de: string; grammatical_role: string; correct_position: number }[];
  attempts_log: WordCardAttempt[];
}

export interface ClassificationResult {
  word: string;
  assigned_category: string;
  correct_category: string;
  is_correct: boolean;
  feedback_message: string;
}

export interface ClassificationTaskResult {
  task_type: TaskType;
  results: ClassificationResult[];
  total_correct: number;
  total_words: number;
}

export interface KinestheticTaskLog {
  log_id: string;
  task_type: TaskType;
  turn_index: number;
  scenario_id: string;
  completion_method: CompletionMethod;
  attempts_used: number;
  correct_count: number;
  total_words: number;
  completed_at: string;
  created_at: string;
}