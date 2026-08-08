-- M07: Cognitive Load Monitor Schema

-- ============================================================
-- COGNITIVE LOAD LOGS
-- ============================================================
CREATE TABLE cognitive_load_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  turn_index INTEGER NOT NULL,
  load_index NUMERIC NOT NULL,
  load_level TEXT NOT NULL,
  latency_ratio NUMERIC NOT NULL,
  error_signal NUMERIC NOT NULL,
  replay_signal NUMERIC NOT NULL,
  skip_signal NUMERIC NOT NULL,
  codeswitching_signal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cognitive_load_logs_session_id ON cognitive_load_logs(session_id);
CREATE INDEX idx_cognitive_load_logs_turn_index ON cognitive_load_logs(turn_index);
CREATE INDEX idx_cognitive_load_logs_load_level ON cognitive_load_logs(load_level);
CREATE INDEX idx_cognitive_load_logs_created_at ON cognitive_load_logs(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_cognitive_load_logs_updated_at BEFORE UPDATE ON cognitive_load_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();