-- M06: Oral Output & Speech Processing Engine Schema

-- ============================================================
-- ORAL PERFORMANCES
-- ============================================================
CREATE TABLE oral_performances (
  performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turn_id UUID,
  session_id UUID,
  response_latency_ms INTEGER NOT NULL DEFAULT 0,
  lexical_score NUMERIC NOT NULL DEFAULT 0,
  grammar_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  pronunciation_score JSONB NOT NULL DEFAULT '{"score": 0}'::jsonb,
  l1_insertions TEXT[] NOT NULL DEFAULT '{}',
  completion_method TEXT NOT NULL DEFAULT 'ORAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oral_performances_turn_id ON oral_performances(turn_id);
CREATE INDEX idx_oral_performances_session_id ON oral_performances(session_id);
CREATE INDEX idx_oral_performances_created_at ON oral_performances(created_at);
CREATE INDEX idx_oral_performances_completion_method ON oral_performances(completion_method);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_oral_performances_updated_at BEFORE UPDATE ON oral_performances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();