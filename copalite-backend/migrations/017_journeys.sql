-- Migration 017: Journey Audit — jornadas reais com assertions

DO $$ BEGIN
  CREATE TYPE journey_status AS ENUM ('pending', 'running', 'passed', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE step_result_status AS ENUM ('passed', 'failed', 'partial', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS journey_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name VARCHAR(220) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  description TEXT DEFAULT NULL,
  status journey_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NULL,
  finished_at TIMESTAMPTZ DEFAULT NULL,
  duration_ms INT DEFAULT 0,
  total_steps INT DEFAULT 0,
  passed_steps INT DEFAULT 0,
  failed_steps INT DEFAULT 0,
  summary TEXT DEFAULT NULL,
  metadata_json JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_step_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  action VARCHAR(220) NOT NULL,
  route TEXT DEFAULT NULL,
  expected TEXT DEFAULT NULL,
  observed TEXT DEFAULT NULL,
  status step_result_status DEFAULT 'passed',
  error_message TEXT DEFAULT NULL,
  screenshot_path TEXT DEFAULT NULL,
  evidence_refs JSONB DEFAULT NULL,
  duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_runs_project ON journey_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_journey_runs_target ON journey_runs(target_id);
CREATE INDEX IF NOT EXISTS idx_journey_runs_status ON journey_runs(status);
CREATE INDEX IF NOT EXISTS idx_journey_step_results_run ON journey_step_results(journey_run_id);
