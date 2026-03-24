-- Migration 014: Browser Problems — persistent classified issues per run

DO $$ BEGIN
  CREATE TYPE problem_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE problem_type AS ENUM ('console_error', 'request_failed', 'response_4xx', 'response_5xx', 'auth_redirect');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS browser_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  browser_run_id UUID NOT NULL REFERENCES browser_runs(id) ON DELETE CASCADE,
  type problem_type NOT NULL,
  severity problem_severity NOT NULL,
  route TEXT NOT NULL,
  summary TEXT NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  metadata_json JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_browser_problems_run ON browser_problems(browser_run_id);
CREATE INDEX IF NOT EXISTS idx_browser_problems_severity ON browser_problems(severity);
CREATE INDEX IF NOT EXISTS idx_browser_problems_fingerprint ON browser_problems(fingerprint);
