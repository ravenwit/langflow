-- M03: Scenario Generation Engine Schema

-- ============================================================
-- SCENARIOS
-- ============================================================
CREATE TABLE scenarios (
  scenario_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  domain_tag TEXT NOT NULL,
  context_tag TEXT NOT NULL,
  difficulty_level cefr_level NOT NULL,
  target_grammar_concepts TEXT[] NOT NULL DEFAULT '{}',
  target_vocabulary TEXT[] NOT NULL DEFAULT '{}',
  scenario_premise TEXT NOT NULL DEFAULT '',
  scenario_premise_l1 TEXT NOT NULL DEFAULT '',
  dialogue_turns JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_concepts_embedded TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty_level);
CREATE INDEX idx_scenarios_domain ON scenarios(domain_tag);
CREATE INDEX idx_scenarios_generated_at ON scenarios(generated_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_scenarios_updated_at BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();