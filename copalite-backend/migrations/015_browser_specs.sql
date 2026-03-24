-- Migration 015: Browser Specs — persisted spec history

CREATE TABLE IF NOT EXISTS browser_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  browser_run_id UUID NOT NULL REFERENCES browser_runs(id) ON DELETE CASCADE,
  base_run_id UUID REFERENCES browser_runs(id) ON DELETE SET NULL,
  markdown_content TEXT NOT NULL,
  spec_json JSONB NOT NULL,
  pages_visited INT NOT NULL DEFAULT 0,
  problems_count INT NOT NULL DEFAULT 0,
  max_severity VARCHAR(20) DEFAULT NULL,
  overall_assessment TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_browser_specs_run ON browser_specs(browser_run_id);
CREATE INDEX IF NOT EXISTS idx_browser_specs_created ON browser_specs(created_at DESC);
