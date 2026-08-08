-- M01: User Cognitive Profile Engine Schema Extensions

-- Extend user_profiles with Module 01 fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS interest_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_contexts TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS native_language TEXT NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS code_switch_frequency DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS session_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_minutes INTEGER NOT NULL DEFAULT 0;

-- Session summaries table for structured session history
CREATE TABLE IF NOT EXISTS session_summaries (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_turns INTEGER NOT NULL DEFAULT 0,
  mean_response_latency DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  error_count INTEGER NOT NULL DEFAULT 0,
  code_switch_count INTEGER NOT NULL DEFAULT 0,
  new_items_introduced INTEGER NOT NULL DEFAULT 0,
  performance_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_user_id ON session_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_start_time ON session_summaries(start_time);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_session_summaries_updated_at ON session_summaries;
CREATE TRIGGER trg_session_summaries_updated_at BEFORE UPDATE ON session_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();