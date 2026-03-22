'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Activity, Database, Cpu, HardDrive, Clock, RefreshCw,
  CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Skeleton from '@/components/shared/Skeleton';
import { api } from '@/lib/api';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: { status: string; latencyMs: number };
  memory: { rss: number; heapUsed: number; heapTotal: number };
  responseMs: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

function HealthCard({ label, value, icon: Icon, status, detail }: {
  label: string;
  value: string;
  icon: React.ElementType;
  status: 'ok' | 'warn' | 'error';
  detail?: string;
}) {
  const colors = {
    ok: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-500' },
    warn: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-500' },
    error: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'text-rose-500' },
  }[status];

  return (
    <div className={`card p-5 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-coal-400 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${colors.text}`}>{value}</p>
          {detail && <p className="text-xs text-coal-500 mt-1">{detail}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors.bg}`}>
          <Icon size={22} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}

function MemoryBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color = pct > 85 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-coal-400">{label}</span>
        <span className="text-coal-300 font-mono text-xs">{used} MB / {total} MB ({pct}%)</span>
      </div>
      <div className="h-2 bg-coal-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getSystemHealth();
      setHealth(data);
      setError(null);
      setLastFetch(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const statusIcon = health?.status === 'healthy' ? CheckCircle2 : AlertTriangle;
  const statusColor = health?.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Header
          title="System Health"
          subtitle="Real-time platform diagnostics"
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`btn-secondary gap-2 text-xs ${autoRefresh ? 'border-emerald-500/30 text-emerald-400' : ''}`}
              >
                <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} style={autoRefresh ? { animationDuration: '3s' } : {}} />
                Auto {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button onClick={fetchHealth} className="btn-primary gap-2">
                <Activity size={16} />
                Refresh
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8">
          {error && (
            <div className="card p-6 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={fetchHealth} className="btn-secondary mt-4 gap-2">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton variant="card" count={4} />
            </div>
          ) : health && (
            <>
              {/* Status banner */}
              <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {health.status === 'healthy'
                    ? <CheckCircle2 size={20} className="text-emerald-400" />
                    : <AlertTriangle size={20} className="text-amber-400" />
                  }
                  <span className={`text-sm font-semibold ${statusColor}`}>
                    System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                  </span>
                </div>
                {lastFetch && (
                  <span className="text-xs text-coal-500">
                    Last check: {lastFetch.toLocaleTimeString()}
                    {autoRefresh && ' (auto-refresh 30s)'}
                  </span>
                )}
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HealthCard
                  label="Uptime"
                  value={formatUptime(health.uptime)}
                  icon={Clock}
                  status="ok"
                  detail={`${health.uptime.toLocaleString()}s total`}
                />
                <HealthCard
                  label="Database"
                  value={`${health.database.latencyMs}ms`}
                  icon={Database}
                  status={health.database.status === 'ok' ? (health.database.latencyMs > 100 ? 'warn' : 'ok') : 'error'}
                  detail={`Status: ${health.database.status}`}
                />
                <HealthCard
                  label="Memory (RSS)"
                  value={`${health.memory.rss} MB`}
                  icon={HardDrive}
                  status={health.memory.rss > 512 ? 'warn' : 'ok'}
                  detail={`Heap: ${health.memory.heapUsed}/${health.memory.heapTotal} MB`}
                />
                <HealthCard
                  label="Response Time"
                  value={`${health.responseMs}ms`}
                  icon={Cpu}
                  status={health.responseMs > 200 ? 'warn' : 'ok'}
                  detail="Health endpoint latency"
                />
              </div>

              {/* Memory detail */}
              <div className="card p-6 space-y-4">
                <h3 className="section-title">Memory Usage</h3>
                <MemoryBar label="Heap" used={health.memory.heapUsed} total={health.memory.heapTotal} />
                <MemoryBar label="RSS" used={health.memory.rss} total={Math.max(health.memory.rss, 512)} />
              </div>

              {/* Raw data */}
              <div className="card p-6">
                <h3 className="section-title mb-4">Raw Response</h3>
                <pre className="bg-coal-950 border border-coal-800 rounded-lg p-4 text-xs text-coal-300 font-mono overflow-x-auto">
                  {JSON.stringify(health, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
