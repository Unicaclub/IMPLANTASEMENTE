-- ============================================
-- COPALITE v1 - Seed: Official Agents
-- ============================================

-- Uses the current enum values (after migration 011 renames)
INSERT INTO agents (name, slug, agent_type, description, execution_order, status) VALUES
  ('Orchestrator Agent', 'orchestrator', 'orchestrator', 'Coordinates execution flow between agents, manages run lifecycle and step sequencing.', 1, 'active'),
  ('Architect Agent', 'architect', 'architect', 'Analyzes system architecture, identifies modules, layers and dependencies.', 2, 'active'),
  ('Schema Mapper Agent', 'schema-mapper', 'schema_mapper', 'Analisa banco de dados: tabelas, campos, relacoes, tipos e gera schema registry.', 3, 'active'),
  ('API Analyzer Agent', 'api-analyzer', 'api_analyzer', 'Mapeia todos os endpoints: rotas, metodos, payloads, responses e gera api/route registry.', 4, 'active'),
  ('UI Inspector Agent', 'ui-inspector', 'ui_inspector', 'Mapeia telas, componentes, formularios, estados e gera ui registry.', 5, 'active'),
  ('Code Auditor Agent', 'code-auditor', 'code_auditor', 'Analisa qualidade: complexidade, duplicacao, debt, vulnerabilidades.', 6, 'active'),
  ('Evidence Collector Agent', 'evidence-collector', 'evidence_collector', 'Coleta evidencias tecnicas: configs, padroes, snippets relevantes.', 7, 'active'),
  ('Comparison Agent', 'comparator', 'comparator', 'Compara duas versoes de registries e identifica diferencas.', 8, 'active'),
  ('Report Generator Agent', 'report-generator', 'report_generator', 'Gera relatorios executivos com base nas descobertas dos outros agentes.', 9, 'active')
ON CONFLICT (slug) DO NOTHING;
