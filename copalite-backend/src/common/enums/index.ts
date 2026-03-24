// ============================================
// COPALITE - Shared Enums
// These mirror the PostgreSQL ENUMs exactly
// ============================================

export enum StatusBase {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum WorkspaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer',
  OPERATOR = 'operator',
}

export enum SourceType {
  REPOSITORY = 'repository',
  UPLOADED_DOCUMENT = 'uploaded_document',
  WEB_APP = 'web_app',
  API_SPEC = 'api_spec',
  DATABASE_SCHEMA = 'database_schema',
  MANUAL_NOTE = 'manual_note',
}

export enum AuthMode {
  NONE = 'none',
  MANUAL = 'manual',
  SESSION = 'session',
  OAUTH = 'oauth',
  TOKEN_REF = 'token_ref',
}

export enum RunType {
  DISCOVERY = 'discovery',
  COMPARISON = 'comparison',
  AUDIT = 'audit',
  BACKLOG_GENERATION = 'backlog_generation',
}

export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum ConfidenceStatus {
  CONFIRMED = 'confirmed',
  INFERRED = 'inferred',
  DIVERGENT = 'divergent',
  UNVALIDATED = 'unvalidated',
  OUTDATED = 'outdated',
}

export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  ARCHITECT = 'architect',
  SCHEMA_MAPPER = 'schema_mapper',
  API_ANALYZER = 'api_analyzer',
  UI_INSPECTOR = 'ui_inspector',
  CODE_AUDITOR = 'code_auditor',
  EVIDENCE_COLLECTOR = 'evidence_collector',
  COMPARATOR = 'comparator',
  REPORT_GENERATOR = 'report_generator',
}

export enum PromptType {
  OBSERVATION = 'observation',
  MAPPING = 'mapping',
  VALIDATION = 'validation',
  COMPARISON = 'comparison',
  RECONSTRUCTION = 'reconstruction',
  DOCUMENTATION = 'documentation',
}

export enum OutputType {
  SUMMARY = 'summary',
  REGISTRY_ENTRY = 'registry_entry',
  ARCHITECTURE_NOTE = 'architecture_note',
  BACKLOG_SUGGESTION = 'backlog_suggestion',
  VALIDATION_RESULT = 'validation_result',
}

export enum ValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

export enum LayerType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  INFRA = 'infra',
  DOCS = 'docs',
  CROSS_CUTTING = 'cross_cutting',
}

export enum RouteType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  INTERNAL_ACTION = 'internal_action',
}

export enum UiStateType {
  PAGE = 'page',
  MODAL = 'modal',
  TABLE = 'table',
  FORM = 'form',
  DASHBOARD = 'dashboard',
  DETAIL_VIEW = 'detail_view',
}

export enum EvidenceType {
  CODE_EXCERPT = 'code_excerpt',
  DOCUMENT_EXCERPT = 'document_excerpt',
  OBSERVED_ROUTE = 'observed_route',
  SCREENSHOT_NOTE = 'screenshot_note',
  API_TRACE = 'api_trace',
  MANUAL_NOTE = 'manual_note',
}

export enum ComparisonType {
  DOC_VS_CODE = 'doc_vs_code',
  UI_VS_API = 'ui_vs_api',
  SCHEMA_VS_BACKEND = 'schema_vs_backend',
  EXPECTED_VS_FOUND = 'expected_vs_found',
}

export enum ComparisonResultStatus {
  MATCH = 'match',
  PARTIAL_MATCH = 'partial_match',
  DIVERGENCE = 'divergence',
  MISSING = 'missing',
  INCONCLUSIVE = 'inconclusive',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BacklogType {
  BUG = 'bug',
  GAP = 'gap',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  REFACTOR = 'refactor',
  VALIDATION = 'validation',
}

export enum BacklogPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BacklogStatus {
  OPEN = 'open',
  TRIAGED = 'triaged',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
  DISMISSED = 'dismissed',
}

export enum TaskStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Controlled string types for fields not yet promoted to DB enums
export const PROJECT_TYPES = [
  'web_application',
  'mobile_application',
  'api_service',
  'monolith',
  'microservices',
  'legacy_system',
  'data_platform',
  'other',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const DOCUMENT_TYPES = [
  'architecture',
  'requirements',
  'api_spec',
  'user_guide',
  'runbook',
  'decision_record',
  'meeting_notes',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const TASK_TYPES = [
  'development',
  'investigation',
  'documentation',
  'validation',
  'refactor',
  'bugfix',
  'other',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const AUDIT_TYPES = [
  'completeness',
  'consistency',
  'security',
  'quality',
  'compliance',
  'other',
] as const;
export type AuditType = (typeof AUDIT_TYPES)[number];

// ============================================
// Browser Foundation — Sprint 1
// ============================================

export enum TargetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum SessionStatus {
  PENDING = 'pending',
  VALID = 'valid',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum BrowserRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export enum EvidenceKind {
  SCREENSHOT = 'screenshot',
  DOM = 'dom',
  REQUEST = 'request',
  RESPONSE = 'response',
  CONSOLE = 'console',
  ACTION = 'action',
}

export enum ProblemType {
  CONSOLE_ERROR = 'console_error',
  REQUEST_FAILED = 'request_failed',
  RESPONSE_4XX = 'response_4xx',
  RESPONSE_5XX = 'response_5xx',
  AUTH_REDIRECT = 'auth_redirect',
}

export enum ProblemSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const SYSTEM_TYPES = [
  'web_application',
  'api_service',
  'legacy_system',
  'mobile_web',
  'spa',
  'other',
] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number];

export enum JourneyStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export enum StepResultStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
  SKIPPED = 'skipped',
}
