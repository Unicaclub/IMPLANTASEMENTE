'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Route, Loader2, AlertTriangle, RotateCw, Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils/time';

const STATUS_BADGE: Record<string, string> = {
  passed: 'badge-success', failed: 'badge-danger', partial: 'badge-warning', pending: 'badge-neutral', running: 'badge-info',
};

export default function JourneysPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [runs, setRuns] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      const [r, a, t] = await Promise.all([
        api.listJourneys(projectId),
        api.getAvailableJourneys(),
        api.listTargets(projectId),
      ]);
      setRuns(r); setAvailable(Array.isArray(a) ? a : []); setTargets(t);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Falha'); }
    finally { setLoading(false); }
  }

  async function handleExecute(slug: string) {
    if (targets.length === 0) { toast('error', 'Nenhum target cadastrado'); return; }
    setExecuting(slug);
    try {
      await api.executeJourney(slug, projectId, targets[0].id);
      toast('success', `Jornada ${slug} executada`);
      loadData();
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Erro'); }
    finally { setExecuting(null); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Jornadas" subtitle="Auditoria funcional de fluxos reais" />
        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-6 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-2" size={24} />
              <p className="text-rose-400 text-sm">{error}</p>
              <button onClick={loadData} className="btn-secondary mt-3 gap-2 text-xs"><RotateCw size={12} /> Tentar</button>
            </div>
          )}
          {!error && loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : (
            <>
              {/* Available journeys */}
              <div>
                <h3 className="text-sm font-semibold text-coal-200 mb-3">Jornadas Disponiveis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {available.map(j => (
                    <div key={j.slug} className="card p-4">
                      <h4 className="text-xs font-semibold text-coal-100">{j.name}</h4>
                      <p className="text-[10px] text-coal-500 mt-1">{j.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-coal-600">{j.steps} steps</span>
                        <button onClick={() => handleExecute(j.slug)} disabled={executing === j.slug || targets.length === 0}
                          className="btn-primary gap-1 text-[10px] px-2 py-1">
                          {executing === j.slug ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />} Executar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {targets.length === 0 && <p className="text-xs text-amber-400 mt-2">Cadastre um target primeiro para executar jornadas</p>}
              </div>

              {/* Past runs */}
              <div>
                <h3 className="text-sm font-semibold text-coal-200 mb-3">Execucoes ({runs.length})</h3>
                {runs.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Route className="mx-auto text-coal-600 mb-3" size={32} />
                    <p className="text-coal-400 text-sm">Nenhuma jornada executada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runs.map(r => (
                      <Link key={r.id} href={`/projects/${projectId}/journeys/${r.id}`} className="card p-4 block hover:border-coal-700 transition-all group">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs font-semibold text-coal-100">{r.name}</h4>
                              <span className={`text-[10px] ${STATUS_BADGE[r.status] || 'badge-neutral'}`}>{r.status}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-coal-500">
                              <span>{r.passedSteps}/{r.totalSteps} passed</span>
                              {r.failedSteps > 0 && <span className="text-rose-400">{r.failedSteps} failed</span>}
                              <span>{r.durationMs}ms</span>
                              <span>{formatRelativeTime(r.createdAt)}</span>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-coal-600 group-hover:text-emerald-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
