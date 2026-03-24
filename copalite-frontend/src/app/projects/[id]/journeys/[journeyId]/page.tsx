'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, MinusCircle, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils/time';

const STATUS_BADGE: Record<string, string> = {
  passed: 'badge-success', failed: 'badge-danger', partial: 'badge-warning', skipped: 'badge-neutral',
};
const STEP_ICON: Record<string, typeof CheckCircle2> = {
  passed: CheckCircle2, failed: XCircle, partial: MinusCircle, skipped: MinusCircle,
};
const STEP_COLOR: Record<string, string> = {
  passed: 'text-emerald-400', failed: 'text-rose-400', partial: 'text-amber-400', skipped: 'text-coal-500',
};

export default function JourneyDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const journeyId = params?.journeyId as string;
  const [run, setRun] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [journeyId]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      const [r, s] = await Promise.all([api.getJourneyRun(journeyId), api.getJourneySteps(journeyId)]);
      setRun(r); setSteps(s);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Falha'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title={run?.name || 'Jornada'} subtitle={run?.summary || ''} />
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
          ) : run && (
            <>
              {/* Run info */}
              <div className="card p-5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <span className={`text-xs ${STATUS_BADGE[run.status]}`}>{run.status}</span>
                    <p className="text-[10px] text-coal-500 mt-1">Status</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{run.passedSteps}</p>
                    <p className="text-[10px] text-coal-500">Passed</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-rose-400">{run.failedSteps}</p>
                    <p className="text-[10px] text-coal-500">Failed</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-coal-200">{run.totalSteps}</p>
                    <p className="text-[10px] text-coal-500">Total</p>
                  </div>
                  <div>
                    <p className="text-xs text-coal-300">{run.durationMs}ms</p>
                    <p className="text-[10px] text-coal-500">Duracao</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-sm font-semibold text-coal-200 mb-3">Steps ({steps.length})</h3>
                <div className="space-y-2">
                  {steps.map(s => {
                    const Icon = STEP_ICON[s.status] || MinusCircle;
                    const color = STEP_COLOR[s.status] || 'text-coal-500';
                    return (
                      <div key={s.id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            <span className="text-[10px] text-coal-600 w-5 text-right">#{s.stepIndex}</span>
                            <Icon size={16} className={color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-coal-200">{s.action}</span>
                              <span className={`text-[10px] ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                              <span className="text-[10px] text-coal-600">{s.durationMs}ms</span>
                            </div>
                            {s.expected && <p className="text-[10px] text-coal-500">Esperado: {s.expected}</p>}
                            {s.observed && <p className="text-[10px] text-coal-400">Observado: {s.observed}</p>}
                            {s.errorMessage && (
                              <div className="mt-1 p-2 bg-rose-500/10 border border-rose-500/20 rounded">
                                <p className="text-[10px] text-rose-400 font-mono">{s.errorMessage}</p>
                              </div>
                            )}
                            {s.route && <p className="text-[9px] text-coal-600 font-mono mt-1 truncate">{s.route}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
