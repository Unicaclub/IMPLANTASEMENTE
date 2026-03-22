-- ============================================
-- COPALITE v1 - Migration 008
-- Indexes
-- ============================================

-- Identity and context
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);

-- Sources and docs
CREATE INDEX idx_sources_project_id ON sources(project_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_source_id ON documents(source_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_decisions_project_id ON decisions(project_id);

-- Agents and execution
CREATE INDEX idx_prompts_agent_id ON prompts(agent_id);
CREATE INDEX idx_runs_project_id ON runs(project_id);
CREATE INDEX idx_runs_source_id ON runs(source_id);
CREATE INDEX idx_runs_type_status ON runs(run_type, status);
CREATE INDEX idx_run_steps_run_id ON run_steps(run_id);
CREATE INDEX idx_agent_runs_run_id ON agent_runs(run_id);
CREATE INDEX idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX idx_agent_outputs_agent_run_id ON agent_outputs(agent_run_id);

-- Registries
CREATE INDEX idx_modules_registry_project_id ON modules_registry(project_id);
CREATE INDEX idx_route_registry_project_id ON route_registry(project_id);
CREATE INDEX idx_route_registry_module_id ON route_registry(module_id);
CREATE INDEX idx_api_registry_project_id ON api_registry(project_id);
CREATE INDEX idx_api_registry_module_id ON api_registry(module_id);
CREATE INDEX idx_schema_registry_project_id ON schema_registry(project_id);
CREATE INDEX idx_schema_fields_schema_id ON schema_fields(schema_registry_id);
CREATE INDEX idx_ui_registry_project_id ON ui_registry(project_id);
CREATE INDEX idx_ui_actions_ui_registry_id ON ui_actions(ui_registry_id);
CREATE INDEX idx_codebase_map_project_id ON codebase_map(project_id);

-- Evidence
CREATE INDEX idx_evidence_registry_project_run ON evidence_registry(project_id, run_id);
CREATE INDEX idx_evidence_registry_related_entity ON evidence_registry(related_entity_type, related_entity_id);
CREATE INDEX idx_evidence_registry_type ON evidence_registry(evidence_type);

-- Comparison and action
CREATE INDEX idx_comparisons_project_run ON comparisons(project_id, run_id);
CREATE INDEX idx_diffs_comparison_id ON diffs(comparison_id);
CREATE INDEX idx_backlog_items_project_id ON backlog_items(project_id);
CREATE INDEX idx_backlog_items_status_priority ON backlog_items(status, priority);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_backlog_item_id ON tasks(backlog_item_id);

-- Governance and tracking
CREATE INDEX idx_audits_project_id ON audits(project_id);
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_logs_project_run ON logs(project_id, run_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_notifications_workspace_id ON notifications(workspace_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_activity_history_workspace_id ON activity_history(workspace_id);
CREATE INDEX idx_activity_history_project_id ON activity_history(project_id);
CREATE INDEX idx_activity_history_created_at ON activity_history(created_at);
