-- Migration 016: Spec governance — versioning + naming + retention

ALTER TABLE browser_specs ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE browser_specs ADD COLUMN IF NOT EXISTS spec_name VARCHAR(255) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_browser_specs_run_version ON browser_specs(browser_run_id, version);
