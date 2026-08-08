-- M05: Kinesthetic Interaction Engine (TPR Layer) Schema

-- ============================================================
-- KINESTHETIC TASK LOGS
-- ============================================================
CREATE TABLE kinesthetic_task_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL CHECK (task_type IN ('WORD_CARD', 'CLASSIFICATION')),
  turn_index INTEGER NOT NULL,
  scenario_id UUID NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
  completion_method TEXT NOT NULL CHECK (completion_method IN ('SUCCESS', 'ASSISTED_COMPLETION', 'ABANDONED')),
  attempts_used INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kinesthetic_task_logs_scenario_id ON kinesthetic_task_logs(scenario_id);
CREATE INDEX idx_kinesthetic_task_logs_task_type ON kinesthetic_task_logs(task_type);
CREATE INDEX idx_kinesthetic_task_logs_completion_method ON kinesthetic_task_logs(completion_method);
CREATE INDEX idx_kinesthetic_task_logs_completed_at ON kinesthetic_task_logs(completed_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_kinesthetic_task_logs_updated_at BEFORE UPDATE ON kinesthetic_task_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();