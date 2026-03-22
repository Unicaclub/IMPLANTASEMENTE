-- ============================================
-- COPALITE v1.3 - Migration 011
-- Rename agent_type enum values from builder-oriented
-- to analysis/discovery-oriented names
-- Add system_prompt column to agents table
-- ============================================

-- 1. Add system_prompt column
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT NULL;

-- 2. Rename enum values (PostgreSQL 10+)
ALTER TYPE agent_type RENAME VALUE 'database_builder' TO 'schema_mapper';
ALTER TYPE agent_type RENAME VALUE 'backend_builder' TO 'api_analyzer';
ALTER TYPE agent_type RENAME VALUE 'frontend_builder' TO 'ui_inspector';
ALTER TYPE agent_type RENAME VALUE 'validator' TO 'code_auditor';
ALTER TYPE agent_type RENAME VALUE 'doc_writer' TO 'evidence_collector';
ALTER TYPE agent_type RENAME VALUE 'devops_agent' TO 'comparator';
ALTER TYPE agent_type RENAME VALUE 'qa_test_agent' TO 'report_generator';

-- 3. Update agent slugs and names to match new roles
UPDATE agents SET slug = 'schema-mapper',   name = 'Schema Mapper Agent',      description = 'Analisa banco de dados: tabelas, campos, relações, tipos e gera schema registry.'        WHERE agent_type = 'schema_mapper';
UPDATE agents SET slug = 'api-analyzer',    name = 'API Analyzer Agent',       description = 'Mapeia todos os endpoints: rotas, métodos, payloads, responses e gera api/route registry.' WHERE agent_type = 'api_analyzer';
UPDATE agents SET slug = 'ui-inspector',    name = 'UI Inspector Agent',       description = 'Mapeia telas, componentes, formulários, estados e gera ui registry.'                      WHERE agent_type = 'ui_inspector';
UPDATE agents SET slug = 'code-auditor',    name = 'Code Auditor Agent',       description = 'Analisa qualidade: complexidade, duplicação, debt, vulnerabilidades.'                     WHERE agent_type = 'code_auditor';
UPDATE agents SET slug = 'evidence-collector', name = 'Evidence Collector Agent', description = 'Coleta evidências técnicas: configs, padrões, snippets relevantes.'                    WHERE agent_type = 'evidence_collector';
UPDATE agents SET slug = 'comparator',      name = 'Comparison Agent',         description = 'Compara duas versões de registries e identifica diferenças.'                               WHERE agent_type = 'comparator';
UPDATE agents SET slug = 'report-generator', name = 'Report Generator Agent',  description = 'Gera relatórios executivos com base nas descobertas dos outros agentes.'                  WHERE agent_type = 'report_generator';
