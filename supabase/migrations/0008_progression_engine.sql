-- M08: Progression & Spaced Repetition Engine Schema

-- ============================================================
-- PROGRESSION LOGS
-- ============================================================
CREATE TABLE progression_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  current_month_phase INTEGER NOT NULL,
  mastery_percentage NUMERIC NOT NULL,
  sessions_in_phase INTEGER NOT NULL,
  ready_to_advance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_progression_logs_session_id ON progression_logs(session_id);
CREATE INDEX idx_progression_logs_user_id ON progression_logs(user_id);
CREATE INDEX idx_progression_logs_ready_to_advance ON progression_logs(ready_to_advance);
CREATE INDEX idx_progression_logs_created_at ON progression_logs(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_progression_logs_updated_at BEFORE UPDATE ON progression_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();