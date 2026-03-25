// ============================================
// System Health Types — Bloco 7
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type ComponentType = 'database' | 'cache' | 'queue' | 'llm' | 'storage' | 'api';

export interface SystemHealthResponse {
  id: string;
  componentName: string;
  componentType: string;
  status: string;
  detailsJson: Record<string, unknown> | null;
  checkedAt: string;
}

export interface LiveHealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  responseMs: number;
  database: { connected: boolean; latencyMs: number };
  memory: { rss: number; heapUsed: number; heapTotal: number };
  agents: { total: number; active: number };
  lastRun: { id: string; title: string; status: string; runType: string } | null;
}

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: 'text-emerald-400',
  degraded: 'text-amber-400',
  down: 'text-rose-400',
  unknown: 'text-coal-400',
};

export const HEALTH_STATUS_BG: Record<HealthStatus, string> = {
  healthy: 'bg-emerald-500/10 border-emerald-500/30',
  degraded: 'bg-amber-500/10 border-amber-500/30',
  down: 'bg-rose-500/10 border-rose-500/30',
  unknown: 'bg-coal-800/40 border-coal-800',
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: 'Saudável',
  degraded: 'Degradado',
  down: 'Fora do ar',
  unknown: 'Desconhecido',
};

export const HEALTH_DOT_COLORS: Record<HealthStatus, string> = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-rose-400',
  unknown: 'bg-coal-500',
};
