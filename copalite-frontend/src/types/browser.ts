// Browser Foundation Types — Sprint 1

export type TargetStatus = 'active' | 'inactive' | 'blocked';
export type SessionStatus = 'pending' | 'valid' | 'expired' | 'failed';
export type BrowserRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
export type EvidenceKind = 'screenshot' | 'dom' | 'request' | 'response' | 'console' | 'action';

export interface TargetResponse {
  id: string;
  projectId: string;
  name: string;
  baseUrl: string;
  environment: string;
  systemType: string;
  status: TargetStatus;
  authMode: string;
  notes: string | null;
  createdAt: string;
}

export interface TargetSessionResponse {
  id: string;
  targetId: string;
  profileName: string;
  status: SessionStatus;
  authMode: string;
  lastValidatedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface BrowserRunResponse {
  id: string;
  projectId: string;
  targetId: string;
  sessionId: string | null;
  module: string | null;
  journeyName: string | null;
  status: BrowserRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  stepsCount: number;
  evidencesCount: number;
  errorMessage: string | null;
  target?: TargetResponse;
  createdAt: string;
}

export interface BrowserEvidenceResponse {
  id: string;
  browserRunId: string;
  stepIndex: number;
  kind: EvidenceKind;
  route: string | null;
  action: string | null;
  artifactUrl: string | null;
  storageKey: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export const TARGET_STATUS_BADGE: Record<TargetStatus, string> = {
  active: 'badge-success',
  inactive: 'badge-neutral',
  blocked: 'badge-danger',
};

export const RUN_STATUS_BADGE: Record<BrowserRunStatus, string> = {
  pending: 'badge-neutral',
  running: 'badge-info',
  completed: 'badge-success',
  failed: 'badge-danger',
  blocked: 'badge-warning',
};

export const SESSION_STATUS_BADGE: Record<SessionStatus, string> = {
  pending: 'badge-neutral',
  valid: 'badge-success',
  expired: 'badge-warning',
  failed: 'badge-danger',
};

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  screenshot: 'Screenshot',
  dom: 'DOM/HTML',
  request: 'Request',
  response: 'Response',
  console: 'Console',
  action: 'Acao',
};

// Browser Problems

export type ProblemType = 'console_error' | 'request_failed' | 'response_4xx' | 'response_5xx' | 'auth_redirect';
export type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BrowserProblemResponse {
  id: string;
  browserRunId: string;
  type: ProblemType;
  severity: ProblemSeverity;
  route: string;
  summary: string;
  fingerprint: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProblemSummaryResponse {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

export interface DiffResponse {
  runIdA: string;
  runIdB: string;
  newProblems: BrowserProblemResponse[];
  resolvedProblems: BrowserProblemResponse[];
  persistentProblems: BrowserProblemResponse[];
  summary: { totalA: number; totalB: number; new: number; resolved: number; persistent: number };
}

export const PROBLEM_SEVERITY_BADGE: Record<ProblemSeverity, string> = {
  low: 'badge-neutral',
  medium: 'badge-warning',
  high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  critical: 'badge-danger',
};

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  console_error: 'Console Error',
  request_failed: 'Request Failed',
  response_4xx: 'HTTP 4xx',
  response_5xx: 'HTTP 5xx',
  auth_redirect: 'Auth Redirect',
};

export const SEVERITY_LABELS: Record<ProblemSeverity, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
};

// Browser Spec

export type PageAssessment = 'healthy' | 'warning' | 'degraded' | 'broken';
export type DiffAssessment = 'improved' | 'stable' | 'degraded';

export interface PageSpec {
  route: string;
  evidencesCount: number;
  problemsCount: number;
  problemTypes: string[];
  maxSeverity: ProblemSeverity | null;
  assessment: PageAssessment;
  notes: string[];
}

export interface BrowserSpecResponse {
  generatedAt: string;
  runSummary: {
    runId: string;
    targetId: string;
    targetName: string;
    journeyName: string | null;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    pagesVisited: number;
    evidencesCount: number;
    problemsCount: number;
    maxSeverity: ProblemSeverity | null;
    overallAssessment: string;
  };
  pageSummaries: PageSpec[];
  problemSummary: ProblemSummaryResponse;
  diffSummary: {
    runIdA: string;
    runIdB: string;
    newCount: number;
    resolvedCount: number;
    persistentCount: number;
    assessment: DiffAssessment;
    impactedRoutes: string[];
    notes: string[];
  } | null;
  truthBoundaries: {
    observedFacts: string[];
    inferredPoints: string[];
    unknowns: string[];
    doNotClaim: string[];
  };
}

export const PAGE_ASSESSMENT_BADGE: Record<PageAssessment, string> = {
  healthy: 'badge-success',
  warning: 'badge-warning',
  degraded: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  broken: 'badge-danger',
};

export const PAGE_ASSESSMENT_LABELS: Record<PageAssessment, string> = {
  healthy: 'Saudavel',
  warning: 'Atencao',
  degraded: 'Degradada',
  broken: 'Quebrada',
};

export const DIFF_ASSESSMENT_LABELS: Record<DiffAssessment, string> = {
  improved: 'Melhorou',
  stable: 'Estavel',
  degraded: 'Piorou',
};

export const DIFF_ASSESSMENT_COLORS: Record<DiffAssessment, string> = {
  improved: 'text-emerald-400',
  stable: 'text-coal-400',
  degraded: 'text-rose-400',
};

// Saved Spec (persisted)
export interface SavedSpecResponse {
  id: string;
  browserRunId: string;
  baseRunId: string | null;
  pagesVisited: number;
  problemsCount: number;
  maxSeverity: string | null;
  overallAssessment: string | null;
  version: number;
  specName: string | null;
  createdAt: string;
}
