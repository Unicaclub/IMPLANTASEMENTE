-- ============================================
-- COPALITE v1 - Migration 001
-- Extensions and ENUM types
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Base status used across multiple tables
CREATE TYPE status_base AS ENUM (
  'draft',
  'active',
  'inactive',
  'archived'
);

CREATE TYPE workspace_member_role AS ENUM (
  'owner',
  'admin',
  'analyst',
  'reviewer',
  'operator'
);

CREATE TYPE source_type AS ENUM (
  'repository',
  'uploaded_document',
  'web_app',
  'api_spec',
  'database_schema',
  'manual_note'
);

CREATE TYPE auth_mode AS ENUM (
  'none',
  'manual',
  'session',
  'oauth',
  'token_ref'
);

CREATE TYPE run_type AS ENUM (
  'discovery',
  'comparison',
  'audit',
  'backlog_generation'
);

CREATE TYPE run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'blocked'
);

CREATE TYPE confidence_status AS ENUM (
  'confirmed',
  'inferred',
  'divergent',
  'unvalidated',
  'outdated'
);

CREATE TYPE agent_type AS ENUM (
  'orchestrator',
  'architect',
  'database_builder',
  'backend_builder',
  'frontend_builder',
  'validator',
  'doc_writer',
  'devops_agent',
  'qa_test_agent'
);

CREATE TYPE prompt_type AS ENUM (
  'observation',
  'mapping',
  'validation',
  'comparison',
  'reconstruction',
  'documentation'
);

CREATE TYPE output_type AS ENUM (
  'summary',
  'registry_entry',
  'architecture_note',
  'backlog_suggestion',
  'validation_result'
);

CREATE TYPE validation_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'needs_review'
);

CREATE TYPE layer_type AS ENUM (
  'frontend',
  'backend',
  'database',
  'infra',
  'docs',
  'cross_cutting'
);

CREATE TYPE route_type AS ENUM (
  'frontend',
  'backend',
  'internal_action'
);

CREATE TYPE ui_state_type AS ENUM (
  'page',
  'modal',
  'table',
  'form',
  'dashboard',
  'detail_view'
);

CREATE TYPE evidence_type AS ENUM (
  'code_excerpt',
  'document_excerpt',
  'observed_route',
  'screenshot_note',
  'api_trace',
  'manual_note'
);

CREATE TYPE comparison_type AS ENUM (
  'doc_vs_code',
  'ui_vs_api',
  'schema_vs_backend',
  'expected_vs_found'
);

CREATE TYPE comparison_result_status AS ENUM (
  'match',
  'partial_match',
  'divergence',
  'missing',
  'inconclusive'
);

CREATE TYPE severity_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE backlog_type AS ENUM (
  'bug',
  'gap',
  'improvement',
  'documentation',
  'refactor',
  'validation'
);

CREATE TYPE backlog_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE backlog_status AS ENUM (
  'open',
  'triaged',
  'planned',
  'in_progress',
  'blocked',
  'done',
  'dismissed'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'approved',
  'in_progress',
  'blocked',
  'done',
  'cancelled'
);

CREATE TYPE log_level AS ENUM (
  'debug',
  'info',
  'warn',
  'error'
);
