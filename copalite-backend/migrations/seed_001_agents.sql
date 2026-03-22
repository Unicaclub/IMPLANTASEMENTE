-- ============================================
-- COPALITE v1 - Seed: Official Agents
-- ============================================

INSERT INTO agents (name, slug, agent_type, description, execution_order, status) VALUES
  ('Orchestrator Agent', 'orchestrator', 'orchestrator', 'Coordinates execution flow between agents, manages run lifecycle and step sequencing.', 1, 'active'),
  ('Architect Agent', 'architect', 'architect', 'Analyzes system architecture, identifies modules, layers and dependencies.', 2, 'active'),
  ('Database Builder Agent', 'database-builder', 'database_builder', 'Maps database schemas, entities, relationships and data models.', 3, 'active'),
  ('Backend Builder Agent', 'backend-builder', 'backend_builder', 'Discovers API endpoints, services, business rules and backend patterns.', 4, 'active'),
  ('Frontend Builder Agent', 'frontend-builder', 'frontend_builder', 'Maps UI components, screens, routes and user interactions.', 5, 'active'),
  ('Validator Agent', 'validator', 'validator', 'Cross-references discoveries against sources, validates confidence levels.', 6, 'active'),
  ('Documentation Writer Agent', 'doc-writer', 'doc_writer', 'Generates structured documentation from discoveries and evidence.', 7, 'active'),
  ('DevOps Agent', 'devops-agent', 'devops_agent', 'Maps infrastructure, deployment configs, CI/CD pipelines and environments.', 8, 'active'),
  ('QA Test Agent', 'qa-test-agent', 'qa_test_agent', 'Identifies test coverage, test patterns and quality gaps.', 9, 'active');
