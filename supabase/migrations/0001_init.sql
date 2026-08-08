-- M02: Vocabulary & Grammar Mastery Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CEFR level enum
CREATE TYPE cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Word class enum
CREATE TYPE word_class AS ENUM (
  'NOUN', 'VERB', 'ADJECTIVE', 'ADVERB',
  'PREPOSITION', 'CONJUNCTION', 'ARTICLE', 'PRONOUN', 'PARTICLE'
);

-- ============================================================
-- VOCABULARY ITEMS
-- ============================================================
CREATE TABLE vocabulary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lemma_de TEXT NOT NULL,
  translations_l1 JSONB NOT NULL DEFAULT '[]'::jsonb,
  word_class word_class NOT NULL,
  morph_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  domain_tags TEXT[] NOT NULL DEFAULT '{}',
  cefr_level cefr_level NOT NULL,
  mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  last_reviewed TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,
  exposure_count INTEGER NOT NULL DEFAULT 0,
  correct_production_count INTEGER NOT NULL DEFAULT 0,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vocab_cefr ON vocabulary_items(cefr_level);
CREATE INDEX idx_vocab_mastery ON vocabulary_items(mastery_score);
CREATE INDEX idx_vocab_next_review ON vocabulary_items(next_review_due);
CREATE INDEX idx_vocab_word_class ON vocabulary_items(word_class);

-- ============================================================
-- GRAMMAR CONCEPTS
-- ============================================================
CREATE TABLE grammar_concepts (
  concept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_label TEXT NOT NULL,
  cefr_level cefr_level NOT NULL,
  prerequisite_concepts UUID[] NOT NULL DEFAULT '{}',
  mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  last_reviewed TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,
  analytic_breakdown TEXT NOT NULL DEFAULT '',
  synthetic_template TEXT NOT NULL DEFAULT '',
  example_sentences JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grammar_cefr ON grammar_concepts(cefr_level);
CREATE INDEX idx_grammar_mastery ON grammar_concepts(mastery_score);
CREATE INDEX idx_grammar_next_review ON grammar_concepts(next_review_due);

-- ============================================================
-- USER PROFILES (subset needed by M02 introduction gate)
-- ============================================================
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_month_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_month_phase BETWEEN 1 AND 6),
  cognitive_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSION STATES (subset needed by M02 introduction gate)
-- ============================================================
CREATE TABLE session_states (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  cognitive_load_index DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  new_items_introduced_this_session INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vocab_updated_at BEFORE UPDATE ON vocabulary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_grammar_updated_at BEFORE UPDATE ON grammar_concepts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profile_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_session_updated_at BEFORE UPDATE ON session_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();