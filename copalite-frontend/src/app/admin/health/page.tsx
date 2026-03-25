'use client';

import { Loader2, RotateCw, AlertTriangle, Server, Database, Cpu, Clock } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import HealthStatusBanner from '@/components/system/HealthStatusBanner';
import MetricCard from '@/components/dashboard/MetricCard';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { formatRelativeTime } from '@/lib/utils/time';

export default function HealthPage() {
  const { health, overallStatus, loading, error, refetch } = useSystemHealth(30_000);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Header
          title="Saude do Sistema"
          subtitle="Monitoramento em tempo real"
          actions={
            <button onClick={refetch} className="btn-secondary gap-2">
              <RotateCw size={14} /> Verificar agora
            </button>
          }
        />

        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={refetch} className="btn-secondary mt-4 gap-2">
                <RotateCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-coal-500" size={24} />
            </div>
          ) : health && (
            <>
              <HealthStatusBanner status={overallStatus} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Banco de Dados"
                  value={health.database?.connected ? 'Online' : 'Offline'}
                  icon={Database}
                  color={health.database?.connected ? 'emerald' : 'rose'}
                  subtitle={health.database?.latencyMs ? `${health.database.latencyMs}ms latencia` : undefined}
                />
                <MetricCard
                  label="Memoria Heap"
                  value={health.memory ? `${health.memory.heapUsed}MB` : '—'}
                  icon={Cpu}
                  color="sky"
                  subtitle={health.memory ? `de ${health.memory.heapTotal}MB total` : undefined}
                />
                <MetricCard
                  label="Agentes"
                  value={health.agents?.active ?? 0}
                  icon={Server}
                  color="violet"
                  subtitle={`${health.agents?.total ?? 0} registrados`}
                />
                <MetricCard
                  label="Tempo de Resposta"
                  value={health.responseMs ? `${health.responseMs}ms` : '—'}
                  icon={Clock}
                  color="amber"
                  subtitle={health.uptime ? `Uptime: ${Math.floor(health.uptime / 3600)}h` : undefined}
                />
              </div>

              {health.lastRun && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-coal-200 mb-3">Ultima Run</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-coal-300">{health.lastRun.title}</span>
                    <span className="badge-neutral text-[10px]">{health.lastRun.runType}</span>
                    <span className="badge-neutral text-[10px]">{health.lastRun.status}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-coal-600 text-right">
                Verificado {health.timestamp ? formatRelativeTime(health.timestamp) : 'agora'} — polling a cada 30s
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
