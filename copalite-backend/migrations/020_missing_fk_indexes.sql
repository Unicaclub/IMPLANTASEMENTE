-- Migration 020: Add missing indexes on foreign key columns
-- These FKs are used in JOINs and WHERE clauses but had no index

-- Runs & execution (high-frequency queries)
CREATE INDEX IF NOT EXISTS idx_runs_created_by ON runs(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_audits_run ON audits(run_id);
CREATE INDEX IF NOT EXISTS idx_reports_run ON reports(run_id);
CREATE INDEX IF NOT EXISTS idx_backlog_items_run ON backlog_items(run_id);
CREATE INDEX IF NOT EXISTS idx_logs_agent_run ON logs(agent_run_id);

-- Registries (populated by pipeline, queried by dashboard)
CREATE INDEX IF NOT EXISTS idx_modules_registry_run ON modules_registry(run_id);
CREATE INDEX IF NOT EXISTS idx_api_registry_run ON api_registry(run_id);
CREATE INDEX IF NOT EXISTS idx_schema_registry_run ON schema_registry(run_id);
CREATE INDEX IF NOT EXISTS idx_route_registry_run ON route_registry(run_id);
CREATE INDEX IF NOT EXISTS idx_ui_registry_run ON ui_registry(run_id);
CREATE INDEX IF NOT EXISTS idx_codebase_map_run ON codebase_map(run_id);

-- Browser specs (diff queries)
CREATE INDEX IF NOT EXISTS idx_browser_specs_base_run ON browser_specs(base_run_id);

-- Workspace ownership
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id);

-- Activity history (timeline queries)
CREATE INDEX IF NOT EXISTS idx_activity_history_user ON activity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_agent ON activity_history(agent_id);

-- Tasks assignment
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);
