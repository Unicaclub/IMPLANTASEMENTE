// ============================================
// Comparisons API — Bloco 5
// ============================================

import { api } from "./api";
import type {
  ComparisonResponse,
  ComparisonSummary,
  ComparisonType,
  ComparisonResult,
} from "@/types/comparison";

function parseList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as Record<string, unknown>).data)
  ) {
    return (payload as Record<string, unknown>).data as T[];
  }
  return [];
}

function qs(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
}

interface ComparisonFilters {
  comparisonType?: ComparisonType;
  resultStatus?: ComparisonResult;
  runId?: string;
}

export async function listComparisons(
  projectId: string,
  filters?: ComparisonFilters,
): Promise<ComparisonResponse[]> {
  const q = qs({
    projectId,
    comparisonType: filters?.comparisonType,
    resultStatus: filters?.resultStatus,
    runId: filters?.runId,
  });
  return parseList<ComparisonResponse>(await api.get(`/comparisons?${q}`));
}

export async function getComparison(id: string): Promise<ComparisonResponse> {
  return api.get<ComparisonResponse>(`/comparisons/${id}`);
}

export async function getComparisonSummary(
  projectId: string,
  runId: string,
): Promise<ComparisonSummary> {
  return api.get<ComparisonSummary>(
    `/comparisons/summary/${runId}?projectId=${projectId}`,
  );
}
