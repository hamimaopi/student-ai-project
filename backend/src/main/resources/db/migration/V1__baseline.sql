-- Baseline migration. Phase 1 will add lesson, persona and session tables.
CREATE TABLE IF NOT EXISTS schema_marker (
  id SMALLINT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
