'use client';

import { useCallback, useEffect, useState } from 'react';
import { listComparisons } from '@/lib/comparisons';
import type { ComparisonResponse, ComparisonType, ComparisonResult } from '@/types/comparison';

interface Filters {
  comparisonType?: ComparisonType;
  resultStatus?: ComparisonResult;
  runId?: string;
}

export function useComparisons(projectId: string | null, filters?: Filters) {
  const [comparisons, setComparisons] = useState<ComparisonResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!projectId) { setComparisons([]); return; }
    setLoading(true);
    setError(null);
    try {
      setComparisons(await listComparisons(projectId, filters));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar comparações');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters?.comparisonType, filters?.resultStatus, filters?.runId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { comparisons, loading, error, refetch: fetch };
}
