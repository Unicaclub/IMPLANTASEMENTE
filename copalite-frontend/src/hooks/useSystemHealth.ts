'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLiveHealth } from '@/lib/system-health';
import type { HealthStatus, LiveHealthResponse } from '@/types/system-health';

export function useSystemHealth(pollIntervalMs = 60_000) {
  const [health, setHealth] = useState<LiveHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getLiveHealth();
      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao verificar saúde do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch, pollIntervalMs]);

  const overallStatus: HealthStatus = health?.status ?? 'unknown';

  return { health, overallStatus, loading, error, refetch: fetch };
}
