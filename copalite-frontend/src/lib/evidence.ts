// ============================================
// Evidence API — Bloco 5
// ============================================

import { api } from './api';
import type { EvidenceResponse, CreateEvidencePayload, EvidenceType } from '@/types/evidence';
import type { ConfidenceStatus } from '@/types/registry';

function parseList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as Record<string, unknown>).data)) {
    return (payload as Record<string, unknown>).data as T[];
  }
  return [];
}

function qs(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
}

interface EvidenceFilters {
  evidenceType?: EvidenceType;
  confidenceStatus?: ConfidenceStatus;
  relatedEntityType?: string;
  runId?: string;
}

export async function listEvidence(projectId: string, filters?: EvidenceFilters): Promise<EvidenceResponse[]> {
  const q = qs({
    projectId,
    evidenceType: filters?.evidenceType,
    confidenceStatus: filters?.confidenceStatus,
    relatedEntityType: filters?.relatedEntityType,
    runId: filters?.runId,
  });
  return parseList<EvidenceResponse>(await api.get(`/evidence-registry?${q}`));
}

export async function getEvidence(id: string): Promise<EvidenceResponse> {
  return api.get<EvidenceResponse>(`/evidence-registry/${id}`);
}

export async function getEvidenceByEntity(
  projectId: string,
  entityType: string,
  entityId: string,
): Promise<EvidenceResponse[]> {
  const q = qs({ projectId, relatedEntityType: entityType, relatedEntityId: entityId });
  return parseList<EvidenceResponse>(await api.get(`/evidence-registry?${q}`));
}

export async function createEvidence(data: CreateEvidencePayload): Promise<EvidenceResponse> {
  return api.post<EvidenceResponse>('/evidence-registry', data);
}

export async function updateEvidenceConfidence(id: string, confidenceStatus: ConfidenceStatus): Promise<EvidenceResponse> {
  return api.patch<EvidenceResponse>(`/evidence-registry/${id}`, { confidenceStatus });
}
