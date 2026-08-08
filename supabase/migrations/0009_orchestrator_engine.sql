-- M09: Session Orchestrator (Master Loop) Schema Extensions
-- NOTE: session_states and session_summaries already exist from migrations
-- 0001 (session_states) and 0002 (session_summaries). This migration extends
-- them with the additional fields required by the orchestrator.

-- ============================================================
-- SESSION STATES (extend existing table from 0001)
-- ============================================================
ALTER TABLE session_states
  ADD COLUMN IF NOT EXISTS scenario_id UUID,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_turn_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modality_chain_state TEXT NOT NULL DEFAULT 'AUDITORY_VISUAL',
  ADD COLUMN IF NOT EXISTS code_switch_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anxiety_events INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_turns INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_session_states_user_id ON session_states(user_id);
CREATE INDEX IF NOT EXISTS idx_session_states_scenario_id ON session_states(scenario_id);
CREATE INDEX IF NOT EXISTS idx_session_states_modality_chain_state ON session_states(modality_chain_state);
CREATE INDEX IF NOT EXISTS idx_session_states_created_at ON session_states(created_at);

-- ============================================================
-- SESSION SUMMARIES (extend existing table from 0002)
-- ============================================================
ALTER TABLE session_summaries
  ADD COLUMN IF NOT EXISTS summary_id UUID,
  ADD COLUMN IF NOT EXISTS mean_response_latency_ms NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_improvements INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_items_learned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill summary_id for existing rows (0002 used session_id as PK)
UPDATE session_summaries SET summary_id = session_id WHERE summary_id IS NULL;

-- Promote summary_id to primary key if the table was created by 0002 with session_id PK.
-- We cannot ALTER a PK easily; instead ensure the column is unique and indexed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_summaries_summary_id ON session_summaries(summary_id);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session_id ON session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_user_id ON session_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_completed_at ON session_summaries(completed_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trg_session_states_updated_at ON session_states;
CREATE TRIGGER trg_session_states_updated_at BEFORE UPDATE ON session_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_session_summaries_updated_at ON session_summaries;
CREATE TRIGGER trg_session_summaries_updated_at BEFORE UPDATE ON session_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();