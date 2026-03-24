'use client';

import { useCallback, useEffect, useState } from 'react';
import { listActivity } from '@/lib/activity';
import type { ActivityHistoryResponse } from '@/types/activity';

export function useActivity(projectId?: string) {
  const [activities, setActivities] = useState<ActivityHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setActivities(await listActivity(projectId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar atividades');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { activities, loading, error, refetch: fetch };
}
