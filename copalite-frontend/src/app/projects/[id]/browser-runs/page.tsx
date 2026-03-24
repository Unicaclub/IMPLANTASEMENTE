'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, Loader2, AlertTriangle, RotateCw, ArrowRight } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import { RUN_STATUS_BADGE } from '@/types/browser';
import { formatRelativeTime } from '@/lib/utils/time';
import type { BrowserRunResponse } from '@/types/browser';

export default function BrowserRunsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [runs, setRuns] = useState<BrowserRunResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [projectId]);

  async function loadData() {
    setLoading(true); setError(null);
    try { setRuns(await api.listBrowserRuns(projectId)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Falha ao carregar browser runs'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={projectId} />
      <main className="flex-1 ml-[260px]">
        <Header title="Browser Runs" subtitle={`${runs.length} execucoes registradas`} />
        <div className="p-8 space-y-6">
          {error && (
            <div className="card p-8 text-center border-rose-500/20">
              <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
              <p className="text-rose-400 font-medium">{error}</p>
              <button onClick={loadData} className="btn-secondary mt-4 gap-2"><RotateCw size={14} /> Tentar novamente</button>
            </div>
          )}
          {!error && loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-coal-500" size={24} /></div>
          ) : !error && runs.length === 0 ? (
            <div className="card p-12 text-center">
              <Globe className="mx-auto text-coal-600 mb-3" size={40} />
              <p className="text-coal-400">Nenhuma browser run registrada</p>
              <p className="text-xs text-coal-500 mt-1">Crie um target e inicie uma run via API</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((r) => (
                <Link key={r.id} href={`/projects/${projectId}/browser-runs/${r.id}`} className="card p-5 animate-fade-in block hover:border-coal-700 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-coal-100">{r.journeyName || r.module || 'Browser Run'}</h3>
                        <span className={`text-[10px] ${RUN_STATUS_BADGE[r.status]}`}>{r.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {r.target && <span className="text-xs text-coal-400">{r.target.name}</span>}
                        <span className="text-[10px] text-coal-500">{r.stepsCount} steps</span>
                        <span className="text-[10px] text-coal-500">{r.evidencesCount} evidencias</span>
                        <span className="text-[10px] text-coal-600">{formatRelativeTime(r.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-coal-600 group-hover:text-emerald-400 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
