'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GitCompare, Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DiffView from '@/components/browser-problems/DiffView';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserRunResponse, DiffResponse } from '@/types/browser';

export default function BrowserRunDiffPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [runs, setRuns] = useState<BrowserRunResponse[]>([]);
  const [runIdA, setRunIdA] = useState('');
  const [runIdB, setRunIdB] = useState('');
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await api.listBrowserRuns(projectId);
        const completed = r.filter((run: BrowserRunResponse) => run.status === 'completed');
        setRuns(completed);
        if (completed.length >= 2) {
          setRunIdA(completed[1].id);
          setRunIdB(completed[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar runs');
      } finally { setLoadingRuns(false); }
    }
    load();
  }, [projectId]);

  async function loadDiff() {
    if (!runIdA || !runIdB || runIdA === runIdB) return;
    setLoadingDiff(true); setError(null);
    try {
      setDiff(await api.getBrowserProblemDiff(runIdA, runIdB));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar diff');
    } finally { setLoadingDiff(false); }
  }

  useEffect(() => {
    if (runIdA && runIdB && runIdA !== runIdB) loadDiff();
  }, [runIdA, runIdB]);

  function runLabel(r: BrowserRunResponse) {
    return `${r.journeyName || 'Run'} — ${formatRelativeTime(r.createdAt)}`;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Comparar Browser Runs" subtitle="Diff de problemas entre duas execucoes" />
        <div className="p-8 space-y-6">
          {loadingRuns ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : runs.length < 2 ? (
            <div className="card p-12 text-center">
              <GitCompare className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Precisa de pelo menos 2 runs completadas para comparar</p>
              <p className="text-xs text-coal-500 mt-1">{runs.length} run(s) completada(s)</p>
            </div>
          ) : (
            <>
              {/* Run selectors */}
              <div className="card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-coal-400 mb-1.5">Run A (anterior)</label>
                    <select className="input-field text-xs" value={runIdA} onChange={e => setRunIdA(e.target.value)}>
                      <option value="">Selecionar...</option>
                      {runs.map(r => <option key={r.id} value={r.id}>{runLabel(r)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-coal-400 mb-1.5">Run B (recente)</label>
                    <select className="input-field text-xs" value={runIdB} onChange={e => setRunIdB(e.target.value)}>
                      <option value="">Selecionar...</option>
                      {runs.map(r => <option key={r.id} value={r.id}>{runLabel(r)}</option>)}
                    </select>
                  </div>
                </div>
                {runIdA === runIdB && runIdA && (
                  <p className="text-xs text-amber-400 mt-2">Selecione runs diferentes para comparar</p>
                )}
              </div>

              {error && (
                <div className="card p-6 text-center border-rose-500/20">
                  <AlertTriangle className="mx-auto text-rose-400 mb-2" size={24} />
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              {loadingDiff && (
                <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
              )}

              {!loadingDiff && diff && <DiffView diff={diff} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
