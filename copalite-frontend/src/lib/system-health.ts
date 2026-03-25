import { api } from './api';
import type { LiveHealthResponse, SystemHealthResponse } from '@/types/system-health';

export async function getLiveHealth(): Promise<LiveHealthResponse> {
  return api.get<LiveHealthResponse>('/system-health/live');
}

export async function listHealthChecks(): Promise<SystemHealthResponse[]> {
  const payload = await api.get<SystemHealthResponse[]>('/system-health');
  return Array.isArray(payload) ? payload : [];
}
