-- ============================================
-- COPALITE v1 - Migration 004
-- Agents and Execution Engine
-- ============================================

-- 9. agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  agent_type agent_type NOT NULL,
  description TEXT,
  status status_base NOT NULL DEFAULT 'active',
  execution_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  prompt_type prompt_type NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content_markdown TEXT NOT NULL,
  status status_base NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, name, version)
);

-- 11. runs
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  run_type run_type NOT NULL,
  title VARCHAR(220) NOT NULL,
  goal TEXT NOT NULL,
  scope_text TEXT,
  status run_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. run_steps
CREATE TABLE run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(180) NOT NULL,
  step_type VARCHAR(80) NOT NULL,
  status run_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (run_id, step_order)
);

-- 13. agent_runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  status run_status NOT NULL DEFAULT 'pending',
  input_summary TEXT,
  output_summary TEXT,
  confidence_level confidence_status,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. agent_outputs
CREATE TABLE agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  output_type output_type NOT NULL,
  title VARCHAR(220) NOT NULL,
  content_markdown TEXT NOT NULL,
  structured_data_json JSONB,
  validation_status validation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
