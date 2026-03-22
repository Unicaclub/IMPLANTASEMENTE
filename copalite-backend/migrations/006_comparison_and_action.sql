-- ============================================
-- COPALITE v1 - Migration 006
-- Comparison and Action
-- ============================================

-- 24. comparisons
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  comparison_type comparison_type NOT NULL,
  source_a_type VARCHAR(80) NOT NULL,
  source_a_ref TEXT NOT NULL,
  source_b_type VARCHAR(80) NOT NULL,
  source_b_ref TEXT NOT NULL,
  result_status comparison_result_status NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. diffs
CREATE TABLE diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  diff_type VARCHAR(100) NOT NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  severity severity_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. backlog_items
CREATE TABLE backlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  source_type VARCHAR(80) NOT NULL,
  source_ref TEXT,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  backlog_type backlog_type NOT NULL,
  priority backlog_priority NOT NULL DEFAULT 'medium',
  status backlog_status NOT NULL DEFAULT 'open',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  approved_for_task BOOLEAN NOT NULL DEFAULT false,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  backlog_item_id UUID REFERENCES backlog_items(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  task_type VARCHAR(80) NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
