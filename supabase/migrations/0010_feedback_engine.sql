-- M10: Feedback & Assessment Engine Schema

-- ============================================================
-- FEEDBACK LOGS
-- ============================================================
CREATE TABLE feedback_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turn_id UUID,
  session_id UUID,
  primary_message TEXT NOT NULL DEFAULT '',
  grammar_correction TEXT,
  rule_reminder TEXT,
  pronunciation_note TEXT,
  codeswitching_note TEXT[] NOT NULL DEFAULT '{}',
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_logs_turn_id ON feedback_logs(turn_id);
CREATE INDEX idx_feedback_logs_session_id ON feedback_logs(session_id);
CREATE INDEX idx_feedback_logs_delivered_at ON feedback_logs(delivered_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_feedback_logs_updated_at BEFORE UPDATE ON feedback_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();