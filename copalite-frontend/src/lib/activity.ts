import { api } from './api';
import type { ActivityHistoryResponse } from '@/types/activity';

function parseList(payload: unknown): ActivityHistoryResponse[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as Record<string, unknown>).data)) {
    return (payload as Record<string, unknown>).data as ActivityHistoryResponse[];
  }
  return [];
}

export async function listActivity(projectId?: string): Promise<ActivityHistoryResponse[]> {
  if (projectId) {
    return parseList(await api.get(`/activity-history?projectId=${projectId}`));
  }
  return parseList(await api.get('/activity-history'));
}
