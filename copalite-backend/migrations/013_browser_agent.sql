-- Migration 013: Browser Foundation — Sprint 1
-- Tables: targets, target_sessions, browser_runs, browser_evidences

-- Enums
DO $$ BEGIN
  CREATE TYPE target_status AS ENUM ('active', 'inactive', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('pending', 'valid', 'expired', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE browser_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evidence_kind AS ENUM ('screenshot', 'dom', 'request', 'response', 'console', 'action');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Targets
CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  base_url TEXT NOT NULL,
  environment VARCHAR(80) DEFAULT 'staging',
  system_type VARCHAR(80) DEFAULT 'web_application',
  status target_status DEFAULT 'active',
  auth_mode VARCHAR(40) DEFAULT 'none',
  credentials_json JSONB DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Target Sessions
CREATE TABLE IF NOT EXISTS target_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  profile_name VARCHAR(180) DEFAULT 'default',
  status session_status DEFAULT 'pending',
  auth_mode VARCHAR(40) DEFAULT 'none',
  session_data_json JSONB DEFAULT NULL,
  last_validated_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Browser Runs
CREATE TABLE IF NOT EXISTS browser_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  session_id UUID REFERENCES target_sessions(id) ON DELETE SET NULL,
  module VARCHAR(180) DEFAULT NULL,
  journey_name VARCHAR(220) DEFAULT NULL,
  status browser_run_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NULL,
  finished_at TIMESTAMPTZ DEFAULT NULL,
  steps_count INT DEFAULT 0,
  evidences_count INT DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Browser Evidences
CREATE TABLE IF NOT EXISTS browser_evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  browser_run_id UUID NOT NULL REFERENCES browser_runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL DEFAULT 0,
  kind evidence_kind NOT NULL,
  route TEXT DEFAULT NULL,
  action VARCHAR(220) DEFAULT NULL,
  artifact_url TEXT DEFAULT NULL,
  storage_key TEXT DEFAULT NULL,
  metadata_json JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_targets_project ON targets(project_id);
CREATE INDEX IF NOT EXISTS idx_target_sessions_target ON target_sessions(target_id);
CREATE INDEX IF NOT EXISTS idx_browser_runs_project ON browser_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_browser_runs_target ON browser_runs(target_id);
CREATE INDEX IF NOT EXISTS idx_browser_runs_status ON browser_runs(status);
CREATE INDEX IF NOT EXISTS idx_browser_evidences_run ON browser_evidences(browser_run_id);
CREATE INDEX IF NOT EXISTS idx_browser_evidences_kind ON browser_evidences(kind);
