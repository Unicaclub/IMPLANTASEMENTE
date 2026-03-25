// ============================================
// Evidence Types — Bloco 5
// ============================================

import type { ConfidenceStatus } from './registry';

export type EvidenceType =
  | 'code_excerpt'
  | 'document_excerpt'
  | 'observed_route'
  | 'screenshot_note'
  | 'api_trace'
  | 'manual_note';

export interface EvidenceResponse {
  id: string;
  projectId: string;
  runId: string;
  sourceId: string | null;
  evidenceType: EvidenceType;
  title: string;
  contentExcerpt: string;
  referencePath: string | null;
  referenceUrl: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  confidenceStatus: ConfidenceStatus;
  createdAt: string;
}

export interface CreateEvidencePayload {
  projectId: string;
  runId: string;
  evidenceType: EvidenceType;
  title: string;
  contentExcerpt: string;
  referencePath?: string;
  referenceUrl?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  sourceId?: string;
  confidenceStatus?: ConfidenceStatus;
}

export const EVIDENCE_TYPES: EvidenceType[] = [
  'code_excerpt',
  'document_excerpt',
  'observed_route',
  'screenshot_note',
  'api_trace',
  'manual_note',
];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  code_excerpt: 'Trecho de Código',
  document_excerpt: 'Trecho de Documento',
  observed_route: 'Rota Observada',
  screenshot_note: 'Nota Visual',
  api_trace: 'Trace de API',
  manual_note: 'Nota Manual',
};
