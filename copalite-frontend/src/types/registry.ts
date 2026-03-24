// ============================================
// Registry Types — Bloco 5
// ============================================

export type LayerType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'infra'
  | 'docs'
  | 'cross_cutting';

export type ConfidenceStatus =
  | 'confirmed'
  | 'inferred'
  | 'divergent'
  | 'unvalidated'
  | 'outdated';

export type RouteType = 'frontend' | 'backend' | 'internal_action';

export type ArtifactType =
  | 'folder'
  | 'file'
  | 'module'
  | 'controller'
  | 'service'
  | 'entity'
  | 'component';

export type UiStateType = 'page' | 'modal' | 'table' | 'form' | 'dashboard' | 'detail_view';

// --- Module Registry ---

export interface ModuleRegistryResponse {
  id: string;
  projectId: string;
  runId: string | null;
  sourceId: string | null;
  name: string;
  slug: string;
  layerType: LayerType;
  description: string | null;
  status: string;
  confidenceStatus: ConfidenceStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Route Registry ---

export interface RouteRegistryResponse {
  id: string;
  projectId: string;
  runId: string | null;
  moduleId: string | null;
  sourceId: string | null;
  routeType: RouteType;
  path: string;
  method: string | null;
  screenName: string | null;
  description: string | null;
  status: string;
  confidenceStatus: ConfidenceStatus;
  createdAt: string;
  updatedAt: string;
}

// --- API Registry ---

export interface ApiRegistryResponse {
  id: string;
  projectId: string;
  runId: string | null;
  moduleId: string | null;
  routeId: string | null;
  sourceId: string | null;
  name: string;
  httpMethod: string;
  path: string;
  authRequired: boolean;
  requestSchemaJson: Record<string, unknown> | null;
  responseSchemaJson: Record<string, unknown> | null;
  description: string | null;
  status: string;
  confidenceStatus: ConfidenceStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Schema Registry ---

export interface SchemaFieldResponse {
  id: string;
  schemaRegistryId: string;
  fieldName: string;
  dataType: string;
  isNullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  defaultValue: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaRegistryResponse {
  id: string;
  projectId: string;
  runId: string | null;
  sourceId: string | null;
  entityName: string;
  tableName: string | null;
  description: string | null;
  status: string;
  confidenceStatus: ConfidenceStatus;
  fields?: SchemaFieldResponse[];
  createdAt: string;
  updatedAt: string;
}

// --- UI Registry ---

export interface UiActionResponse {
  id: string;
  uiRegistryId: string;
  actionName: string;
  actionType: string;
  targetRouteId: string | null;
  targetApiId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UiRegistryResponse {
  id: string;
  projectId: string;
  runId: string | null;
  sourceId: string | null;
  screenName: string;
  routePath: string | null;
  componentName: string | null;
  description: string | null;
  stateType: UiStateType | null;
  status: string;
  confidenceStatus: ConfidenceStatus;
  actions?: UiActionResponse[];
  createdAt: string;
  updatedAt: string;
}

// --- Codebase Map ---

export interface CodebaseMapResponse {
  id: string;
  projectId: string;
  runId: string | null;
  sourceId: string | null;
  artifactType: ArtifactType;
  artifactPath: string;
  artifactName: string;
  parentPath: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Labels & Colors ---

export const CONFIDENCE_STATUS_LABELS: Record<ConfidenceStatus, string> = {
  confirmed: 'Confirmado',
  inferred: 'Inferido',
  divergent: 'Divergente',
  unvalidated: 'Não validado',
  outdated: 'Desatualizado',
};

export const CONFIDENCE_STATUS_COLORS: Record<ConfidenceStatus, string> = {
  confirmed: 'badge-success',
  inferred: 'badge-info',
  divergent: 'badge-warning',
  unvalidated: 'badge-neutral',
  outdated: 'badge-danger',
};

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Banco de Dados',
  infra: 'Infraestrutura',
  docs: 'Documentação',
  cross_cutting: 'Transversal',
};

export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  internal_action: 'Ação Interna',
};

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  folder: 'Pasta',
  file: 'Arquivo',
  module: 'Módulo',
  controller: 'Controller',
  service: 'Service',
  entity: 'Entidade',
  component: 'Componente',
};

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400',
  POST: 'bg-sky-500/15 text-sky-400',
  PUT: 'bg-amber-500/15 text-amber-400',
  PATCH: 'bg-violet-500/15 text-violet-400',
  DELETE: 'bg-rose-500/15 text-rose-400',
};

export type RegistryType = 'modules' | 'routes' | 'apis' | 'schemas' | 'ui' | 'codebase';
