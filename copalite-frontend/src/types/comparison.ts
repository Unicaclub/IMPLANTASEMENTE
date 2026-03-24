// ============================================
// Comparison Types — Bloco 5
// ============================================

export type ComparisonType =
  | 'doc_vs_code'
  | 'ui_vs_api'
  | 'schema_vs_backend'
  | 'expected_vs_found';

export type ComparisonResult =
  | 'match'
  | 'partial_match'
  | 'divergence'
  | 'missing'
  | 'inconclusive';

export type DiffSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DiffResponse {
  id: string;
  comparisonId: string;
  diffType: string;
  title: string;
  description: string | null;
  severity: DiffSeverity;
  createdAt: string;
}

export interface ComparisonResponse {
  id: string;
  projectId: string;
  runId: string;
  comparisonType: ComparisonType;
  sourceAType: string;
  sourceARef: string;
  sourceBType: string;
  sourceBRef: string;
  resultStatus: ComparisonResult;
  summary: string | null;
  diffs?: DiffResponse[];
  createdAt: string;
}

export interface ComparisonSummary {
  total: number;
  byResult: Record<ComparisonResult, number>;
  diffsBySeverity: Record<DiffSeverity, number>;
}

export const COMPARISON_TYPE_LABELS: Record<ComparisonType, string> = {
  doc_vs_code: 'Doc vs Código',
  ui_vs_api: 'UI vs API',
  schema_vs_backend: 'Schema vs Backend',
  expected_vs_found: 'Esperado vs Encontrado',
};

export const COMPARISON_RESULT_LABELS: Record<ComparisonResult, string> = {
  match: 'Match',
  partial_match: 'Match Parcial',
  divergence: 'Divergência',
  missing: 'Ausente',
  inconclusive: 'Inconclusivo',
};

export const COMPARISON_RESULT_COLORS: Record<ComparisonResult, string> = {
  match: 'badge-success',
  partial_match: 'badge-info',
  divergence: 'badge-danger',
  missing: 'badge-warning',
  inconclusive: 'badge-neutral',
};

export const DIFF_SEVERITY_LABELS: Record<DiffSeverity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export const DIFF_SEVERITY_COLORS: Record<DiffSeverity, string> = {
  low: 'badge-neutral',
  medium: 'badge-warning',
  high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  critical: 'badge-danger',
};
