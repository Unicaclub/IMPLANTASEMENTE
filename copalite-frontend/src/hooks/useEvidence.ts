'use client';

import { useCallback, useEffect, useState } from 'react';
import { listEvidence } from '@/lib/evidence';
import type { EvidenceResponse, EvidenceType } from '@/types/evidence';
import type { ConfidenceStatus } from '@/types/registry';

interface Filters {
  evidenceType?: EvidenceType;
  confidenceStatus?: ConfidenceStatus;
  relatedEntityType?: string;
  runId?: string;
}

export function useEvidence(projectId: string | null, filters?: Filters) {
  const [evidence, setEvidence] = useState<EvidenceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!projectId) { setEvidence([]); return; }
    setLoading(true);
    setError(null);
    try {
      setEvidence(await listEvidence(projectId, filters));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar evidências');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters?.evidenceType, filters?.confidenceStatus, filters?.relatedEntityType, filters?.runId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { evidence, loading, error, refetch: fetch };
}
