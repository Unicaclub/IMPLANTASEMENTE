-- ============================================
-- COPALITE v1 - Migration 005
-- Technical Registries
-- ============================================

-- 15. modules_registry
CREATE TABLE modules_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  layer_type layer_type NOT NULL,
  description TEXT,
  status status_base NOT NULL DEFAULT 'active',
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

-- 16. route_registry
CREATE TABLE route_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  module_id UUID REFERENCES modules_registry(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  route_type route_type NOT NULL,
  path TEXT NOT NULL,
  method VARCHAR(10),
  screen_name VARCHAR(180),
  description TEXT,
  status status_base NOT NULL DEFAULT 'active',
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. api_registry
CREATE TABLE api_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  module_id UUID REFERENCES modules_registry(id) ON DELETE SET NULL,
  route_id UUID REFERENCES route_registry(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  auth_required BOOLEAN NOT NULL DEFAULT false,
  request_schema_json JSONB,
  response_schema_json JSONB,
  description TEXT,
  status status_base NOT NULL DEFAULT 'active',
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. schema_registry
CREATE TABLE schema_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  entity_name VARCHAR(180) NOT NULL,
  table_name VARCHAR(180),
  description TEXT,
  status status_base NOT NULL DEFAULT 'active',
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. schema_fields
CREATE TABLE schema_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_registry_id UUID NOT NULL REFERENCES schema_registry(id) ON DELETE CASCADE,
  field_name VARCHAR(180) NOT NULL,
  data_type VARCHAR(80) NOT NULL,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_unique BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schema_registry_id, field_name)
);

-- 20. ui_registry
CREATE TABLE ui_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  screen_name VARCHAR(180) NOT NULL,
  route_path TEXT,
  component_name VARCHAR(180),
  description TEXT,
  state_type ui_state_type,
  status status_base NOT NULL DEFAULT 'active',
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. ui_actions
CREATE TABLE ui_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ui_registry_id UUID NOT NULL REFERENCES ui_registry(id) ON DELETE CASCADE,
  action_name VARCHAR(180) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  target_route_id UUID REFERENCES route_registry(id) ON DELETE SET NULL,
  target_api_id UUID REFERENCES api_registry(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. codebase_map
CREATE TABLE codebase_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  artifact_type VARCHAR(80) NOT NULL,
  artifact_path TEXT NOT NULL,
  artifact_name VARCHAR(220) NOT NULL,
  parent_path TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. evidence_registry
CREATE TABLE evidence_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  evidence_type evidence_type NOT NULL,
  title VARCHAR(220) NOT NULL,
  content_excerpt TEXT NOT NULL,
  reference_path TEXT,
  reference_url TEXT,
  related_entity_type VARCHAR(80) NOT NULL,
  related_entity_id UUID NOT NULL,
  confidence_status confidence_status NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
