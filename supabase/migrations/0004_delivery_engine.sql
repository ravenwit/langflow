-- M04: Multisensory Delivery Engine Schema

-- ============================================================
-- TURN DELIVERIES
-- ============================================================
CREATE TABLE turn_deliveries (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turn_index INTEGER NOT NULL,
  scenario_id UUID NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
  replay_count INTEGER NOT NULL DEFAULT 0,
  comprehension_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  cognitive_load_escalation BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_turn_deliveries_scenario_id ON turn_deliveries(scenario_id);
CREATE INDEX idx_turn_deliveries_delivered_at ON turn_deliveries(delivered_at);
CREATE INDEX idx_turn_deliveries_cognitive_load_escalation ON turn_deliveries(cognitive_load_escalation) WHERE cognitive_load_escalation = TRUE;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_turn_deliveries_updated_at BEFORE UPDATE ON turn_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();